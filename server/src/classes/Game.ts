import { Server, Socket } from 'socket.io';
import { Deck } from './Deck';
import { Player } from './Player';
import { GameState, Suit, ICard } from '../types';
import { Card } from './Card';

export class Game {
    io: Server;
    players: Player[] = [];
    deck: Deck;
    gameState: GameState;

    // Game State Variables
    currentTurnIndex: number = 0;
    bid: number = 0;
    callerId: string | null = null;
    trumpSuit: Suit | null = null;
    friendCards: Card[] = [];
    pot: { playerId: string, card: Card }[] = [];

    constructor(io: Server) {
        this.io = io;
        this.deck = new Deck();
        this.gameState = this.getInitialState();
    }

    getInitialState(): GameState {
        return {
            players: [],
            currentTurn: 0,
            bid: 170,
            callerId: null,
            trumpSuit: null,
            friendCards: [],
            pot: [],
            scores: {},
            phase: 'lobby'
        };
    }

    addPlayer(id: string, name: string) {
        if (this.players.length >= 5) return false;
        const player = new Player(id, name);
        this.players.push(player);
        this.broadcastState();
        return true;
    }

    removePlayer(id: string) {
        this.players = this.players.filter(p => p.id !== id);
        this.broadcastState();
    }

    private resetGameState() {
        // Reset all player state
        this.players.forEach(p => {
            p.hand = [];
            p.hasPassed = false;
            p.pointsWon = 0;
            p.team = 'unknown';
        });

        // Reset game state
        this.gameState = {
            ...this.getInitialState(),
            players: this.gameState.players // Keep player list
        };
        this.currentTurnIndex = 0;
    }

    startGame() {
        if (this.players.length !== 5) return;

        this.resetGameState();
        this.deck.reset();
        this.deck.shuffle();

        // Deal 5 cards to each
        this.players.forEach(p => {
            p.addCards(this.deck.deal(5));
        });

        // Check for "No Face Card" rule on initial deal
        const needsReshuffle = this.players.some(p => !p.hasFaceCard());
        if (needsReshuffle) {
            // Reshuffle logic - recursive call will reset state
            this.startGame();
            return;
        }

        this.gameState.phase = 'bidding';
        this.currentTurnIndex = 0; // Start with first player
        this.broadcastState();
    }

    handleBid(playerId: string, amount: number) {
        if (this.gameState.phase !== 'bidding') return;
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== this.currentTurnIndex) return;

        if (amount === 0) {
            this.players[playerIndex].hasPassed = true;
            // Check if everyone else passed
            const activeBidders = this.players.filter(p => !p.hasPassed);
            if (activeBidders.length === 1 && this.gameState.bid > 0) {
                // Winner found
                this.gameState.callerId = activeBidders[0].id;
                this.gameState.phase = 'trump_selection';
                this.broadcastState();
                return;
            }
            if (activeBidders.length === 0) {
                // Everyone passed? Restart game
                this.startGame();
                return;
            }
        } else {
            if (amount <= this.gameState.bid) return; // Must raise
            this.gameState.bid = amount;
            this.gameState.callerId = playerId;
        }

        // Move to next active player
        let nextIndex = (this.currentTurnIndex + 1) % 5;
        while (this.players[nextIndex].hasPassed) {
            nextIndex = (nextIndex + 1) % 5;
        }
        this.currentTurnIndex = nextIndex;
        this.gameState.currentTurn = this.currentTurnIndex;
        this.broadcastState();
    }

    handleSelectTrumpAndFriends(playerId: string, suit: Suit, friends: { rank: string, suit: Suit }[]) {
        if (this.gameState.phase !== 'trump_selection') return;
        if (playerId !== this.gameState.callerId) return;

        // Validate: Ace of Spades cannot be a friend card
        const isAceOfSpades = (card: { rank: string, suit: Suit }) =>
            card.rank === 'A' && card.suit === 'S';

        if (friends.some(isAceOfSpades)) {
            this.io.to(playerId).emit('ERROR', 'Ace of Spades cannot be selected as a friend card');
            return;
        }

        this.gameState.trumpSuit = suit;
        this.gameState.friendCards = friends.map(f => new Card(f.suit as Suit, f.rank as any));

        // Deal remaining cards
        const dealSuccess = this.dealRemainingCards();
        if (!dealSuccess) {
            // Game was restarted due to no face cards
            return;
        }

        // Assign teams based on who holds friend cards
        this.assignTeams();

        this.gameState.phase = 'playing';
        this.currentTurnIndex = this.players.findIndex(p => p.id === this.gameState.callerId); // Caller starts
        this.gameState.currentTurn = this.currentTurnIndex;
        this.broadcastState();
    }

    private dealRemainingCards(): boolean {
        // Deal 3 more to each (total 8 cards per player)
        this.players.forEach(p => {
            p.addCards(this.deck.deal(3));
        });

        // Check for "No Face Card" rule after full deal
        const needsReshuffle = this.players.some(p => !p.hasFaceCard());
        if (needsReshuffle) {
            // Notify players and restart
            this.io.emit('GAME_MESSAGE', 'A player has no face cards. Reshuffling...');
            setTimeout(() => this.startGame(), 2000);
            return false;
        }
        return true;
    }

    private assignTeams() {
        // Reset all teams to defense first
        this.players.forEach(p => p.team = 'defense');

        // Caller is on caller team
        const caller = this.players.find(p => p.id === this.gameState.callerId);
        if (caller) {
            caller.team = 'caller';
        }

        // Find players holding friend cards - they are on caller's team
        for (const friendCard of this.gameState.friendCards) {
            for (const player of this.players) {
                const hasCard = player.hand.some(c =>
                    c.suit === friendCard.suit && c.rank === friendCard.rank
                );
                if (hasCard) {
                    player.team = 'caller';
                }
            }
        }
    }

    private advanceTurn() {
        this.gameState.currentTurn = this.currentTurnIndex;
        this.broadcastState();
    }

    handlePlayCard(playerId: string, cardData: { suit: Suit, rank: string }) {
        if (this.gameState.phase !== 'playing') return;
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== this.currentTurnIndex) return;

        const player = this.players[playerIndex];

        // Convert incoming card object to proper Card instance for comparison
        const card = new Card(cardData.suit, cardData.rank as any);

        // Validate Move
        if (!this.isValidMove(player, card)) {
            this.io.to(playerId).emit('ERROR', 'Invalid move: you must follow suit if possible');
            return;
        }

        // Remove card from hand
        player.removeCard(card);

        // Add to pot
        this.gameState.pot.push({ playerId, card });

        // Check if trick is complete
        if (this.gameState.pot.length === 5) {
            this.resolveTrick();
        } else {
            this.currentTurnIndex = (this.currentTurnIndex + 1) % 5;
            this.advanceTurn();
        }
    }

    private isValidMove(player: Player, card: Card): boolean {
        // First, check if player actually has this card
        const hasCard = player.hand.some(c => c.suit === card.suit && c.rank === card.rank);
        if (!hasCard) return false;

        if (this.gameState.pot.length === 0) return true; // Lead card - any card is valid

        const leadCard = this.gameState.pot[0].card;
        const leadSuit = leadCard.suit;

        if (card.suit === leadSuit) return true; // Following suit is always valid

        if (player.hasSuit(leadSuit)) return false; // Must follow suit if possible

        return true; // Can play anything (including trump) if void in lead suit
    }

    private resolveTrick() {
        // Determine winner
        const leadSuit = this.gameState.pot[0].card.suit;
        let winnerId = this.gameState.pot[0].playerId;
        let bestCard = this.gameState.pot[0].card;

        for (let i = 1; i < this.gameState.pot.length; i++) {
            const { playerId, card } = this.gameState.pot[i];

            if (card.suit === this.gameState.trumpSuit && bestCard.suit !== this.gameState.trumpSuit) {
                // Trump beats non-trump
                bestCard = card;
                winnerId = playerId;
            } else if (card.suit === this.gameState.trumpSuit && bestCard.suit === this.gameState.trumpSuit) {
                // Both are trump - higher power wins
                if (card.power > bestCard.power) {
                    bestCard = card;
                    winnerId = playerId;
                }
            } else if (card.suit === leadSuit && bestCard.suit === leadSuit) {
                // Both following lead suit - higher power wins (only if best isn't trump)
                if (bestCard.suit !== this.gameState.trumpSuit && card.power > bestCard.power) {
                    bestCard = card;
                    winnerId = playerId;
                }
            }
            // If card is neither trump nor lead suit, it can't win
        }

        // Award points
        const points = this.gameState.pot.reduce((sum, item) => sum + item.card.value, 0);
        const winner = this.players.find(p => p.id === winnerId);
        if (winner) {
            winner.pointsWon += points;
        }

        // Broadcast state with full pot so players can see all cards
        this.broadcastState();

        // Wait 5 seconds before clearing pot to let players see the completed trick
        setTimeout(() => {
            // Clear pot
            this.gameState.pot = [];

            // Winner leads next
            this.currentTurnIndex = this.players.findIndex(p => p.id === winnerId);
            this.gameState.currentTurn = this.currentTurnIndex;

            // Check if game over (all cards played - 8 tricks = 0 cards remaining)
            if (this.players[0].hand.length === 0) {
                this.endGame();
            } else {
                this.broadcastState();
            }
        }, 5000); // 5 second delay
    }

    private endGame() {
        this.gameState.phase = 'ended';

        // Calculate team scores
        let callerTeamPoints = 0;
        let defenseTeamPoints = 0;

        for (const player of this.players) {
            if (player.team === 'caller') {
                callerTeamPoints += player.pointsWon;
            } else {
                defenseTeamPoints += player.pointsWon;
            }
        }

        // Determine winner - caller team must meet or exceed their bid
        const callerWins = callerTeamPoints >= this.gameState.bid;

        // Store results in gameState
        this.gameState.scores = {
            callerTeam: callerTeamPoints,
            defenseTeam: defenseTeamPoints,
            bid: this.gameState.bid,
            callerWins: callerWins
        };

        this.broadcastState();
    }

    private broadcastState() {
        // Send sanitized state to each player (hide others' hands)
        // Update gameState.players to match actual players array to fix counter issues
        const playersData = this.players.map(pl => ({
            id: pl.id,
            name: pl.name,
            hand: pl.hand,
            team: pl.team,
            pointsWon: pl.pointsWon,
            hasPassed: pl.hasPassed
        }));

        this.players.forEach(p => {
            const state = {
                ...this.gameState,
                players: playersData.map(pl => ({
                    ...pl,
                    hand: pl.id === p.id ? pl.hand : pl.hand.map(() => null) // Hide other hands
                }))
            };
            this.io.to(p.id).emit('GAME_UPDATE', state);
        });
    }
}
