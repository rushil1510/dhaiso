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

    startGame() {
        if (this.players.length !== 5) return;
        this.deck.reset();
        this.deck.shuffle();

        // Deal 5 cards to each
        this.players.forEach(p => {
            p.hand = [];
            p.addCards(this.deck.deal(5));
        });

        // Check for "No Face Card" rule
        const needsReshuffle = this.players.some(p => !p.hasFaceCard());
        if (needsReshuffle) {
            // Reshuffle logic
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
                // Everyone passed? Reset or force dealer?
                // For now, restart game
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

        this.gameState.trumpSuit = suit;
        // Validate friends (cannot be Ace of Spades)
        // Friends are just card definitions, we find who has them later or when played.
        // actually, we need to store them to check later.
        this.gameState.friendCards = friends.map(f => new Card(f.suit as Suit, f.rank as any));

        // Deal remaining cards
        this.dealRemainingCards();

        this.gameState.phase = 'playing';
        this.currentTurnIndex = this.players.findIndex(p => p.id === this.gameState.callerId); // Caller starts
        this.broadcastState();
    }

    private dealRemainingCards() {
        // Deal 3 more to each
        this.players.forEach(p => {
            p.addCards(this.deck.deal(3));
        });
    }

    private advanceTurn() {
        this.gameState.currentTurn = this.currentTurnIndex;
        this.broadcastState();
    }

    handlePlayCard(playerId: string, card: Card) {
        if (this.gameState.phase !== 'playing') return;
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== this.currentTurnIndex) return;

        const player = this.players[playerIndex];

        // Validate Move
        if (!this.isValidMove(player, card)) {
            // Emit error to player?
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
        if (this.gameState.pot.length === 0) return true; // Lead card

        const leadCard = this.gameState.pot[0].card;
        const leadSuit = leadCard.suit;

        if (card.suit === leadSuit) return true; // Following suit

        if (player.hasSuit(leadSuit)) return false; // Must follow suit if possible

        return true; // Can play anything if void in lead suit
    }

    private resolveTrick() {
        // Determine winner
        const leadSuit = this.gameState.pot[0].card.suit;
        let winnerId = this.gameState.pot[0].playerId;
        let bestCard = this.gameState.pot[0].card;

        for (let i = 1; i < this.gameState.pot.length; i++) {
            const { playerId, card } = this.gameState.pot[i];

            if (card.suit === this.gameState.trumpSuit && bestCard.suit !== this.gameState.trumpSuit) {
                // Trump trumps non-trump
                bestCard = card;
                winnerId = playerId;
            } else if (card.suit === bestCard.suit && card.power > bestCard.power) {
                // Higher card of same suit (trump or lead)
                bestCard = card;
                winnerId = playerId;
            }
        }

        // Award points
        const points = this.gameState.pot.reduce((sum, item) => sum + item.card.value, 0);
        const winner = this.players.find(p => p.id === winnerId);
        if (winner) {
            winner.pointsWon += points;

            // Check for Friends
            // If winner played a friend card, they are on the caller's team?
            // Actually, team is determined by who holds the friend cards.
            // We should check hands at start of game or reveal as they play.
            // Let's check if any played card was a friend card and mark that player as 'caller' team (if not already).
            // Wait, the rule is "People in possesion of these 'friends' form a team".
            // So we should have marked them when cards were dealt? No, we don't know who has them until dealt.
            // After dealing remaining cards, we can scan hands to assign teams.
            // Or we can do it lazily. Let's do it after dealing remaining cards.
        }

        // Clear pot
        this.gameState.pot = [];

        // Winner leads next
        this.currentTurnIndex = this.players.findIndex(p => p.id === winnerId);
        this.gameState.currentTurn = this.currentTurnIndex;

        // Check if game over (all cards played)
        if (this.players[0].hand.length === 0) {
            this.endGame();
        } else {
            // Delay slightly so players can see the trick result?
            // For now, immediate. Frontend can handle delay.
            this.broadcastState();
        }
    }

    private endGame() {
        this.gameState.phase = 'ended';
        // Calculate scores
        // Caller team vs Defense
        // ...
        this.broadcastState();
    }

    private broadcastState() {
        // Send sanitized state to each player (hide others' hands)
        this.players.forEach(p => {
            const state = {
                ...this.gameState,
                players: this.players.map(pl => ({
                    ...pl,
                    hand: pl.id === p.id ? pl.hand : pl.hand.map(() => null) // Hide other hands
                }))
            };
            this.io.to(p.id).emit('GAME_UPDATE', state);
        });
    }
}
