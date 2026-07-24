import { Player } from './Player';
import { Card } from './Card';
import { Suit, ICard } from '../types';
import { Logger } from '../services/Logger';

/**
 * BotPlayer extends Player with AI decision-making capabilities.
 * Used when a player disconnects and the game needs to continue.
 */
export class BotPlayer extends Player {
    public readonly isBot: boolean = true;
    private logger: Logger;

    constructor(id: string, name: string) {
        super(id, name);
        this.logger = new Logger({ service: 'BotPlayer', botName: name });
    }

    /**
     * Create a BotPlayer from an existing Player (for takeover scenarios)
     */
    static fromPlayer(player: Player): BotPlayer {
        const bot = new BotPlayer(player.id, player.name);
        bot.hand = player.hand;
        bot.team = player.team;
        bot.pointsWon = player.pointsWon;
        bot.hasPassed = player.hasPassed;
        return bot;
    }

    /**
     * Decide what to bid during bidding phase.
     * Strategy: Make measured five-point raises based on hand strength.
     * 
     * @param currentBid - The current highest bid
     * @returns 0 to pass, or a higher bid amount
     */
    decideBid(currentBid: number): number {
        const handStrength = this.calculateHandStrength();
        const maximumBid = 180 + Math.min(25, Math.floor(handStrength / 8) * 5);
        const bidAmount = currentBid < maximumBid ? currentBid + 5 : 0;

        this.logger.debug('Deciding bid', {
            currentBid,
            handStrength,
            maximumBid,
            decision: bidAmount === 0 ? 'PASS' : 'BID',
            bidAmount
        });

        return bidAmount;
    }

    /**
     * Decide trump suit and friend cards during trump selection.
     * Strategy: Pick suit with most cards, choose high-value friends not in hand
     * 
     * @returns Trump suit and 2 friend cards
     */
    decideTrump(): { suit: Suit; friends: { rank: string; suit: Suit }[] } {
        // Count cards per suit
        const suitCounts: Record<Suit, number> = { 'H': 0, 'D': 0, 'C': 0, 'S': 0 };
        this.hand.forEach(card => {
            suitCounts[card.suit]++;
        });

        // Find suit with most cards
        let bestSuit: Suit = 'S';
        let maxCount = 0;
        for (const suit of ['H', 'D', 'C', 'S'] as Suit[]) {
            if (suitCounts[suit] > maxCount) {
                maxCount = suitCounts[suit];
                bestSuit = suit;
            }
        }

        // Pick 2 friend cards: high-value cards NOT in our hand
        // Priority: K, Q, A, J, 10 (skip A♠ which is not allowed)
        const ranks = ['K', 'Q', 'A', 'J', '10'] as const;
        const suits: Suit[] = ['H', 'D', 'C', 'S'];
        const friends: { rank: string; suit: Suit }[] = [];

        outer:
        for (const rank of ranks) {
            for (const suit of suits) {
                // Skip Ace of Spades (not allowed as friend)
                if (rank === 'A' && suit === 'S') continue;

                // Skip cards we already have (want to find allies)
                const hasCard = this.hand.some(c => c.rank === rank && c.suit === suit);
                if (!hasCard) {
                    friends.push({ rank, suit });
                    if (friends.length >= 2) break outer;
                }
            }
        }

        // Fallback: if we couldn't find 2 friends, use defaults
        while (friends.length < 2) {
            friends.push({ rank: 'K', suit: 'H' });
        }

        this.logger.debug('Decided trump', {
            trump: bestSuit,
            suitCounts,
            friends: friends.map(f => `${f.rank}${f.suit}`),
            reasoning: `Chose ${bestSuit} with ${maxCount} cards in hand`
        });

        return { suit: bestSuit, friends };
    }

    /**
     * Decide which card to play during playing phase.
     * Strategy: 
     *   - Leading: Play lowest power non-trump card
     *   - Following: Play the lowest card that can win, otherwise conserve strength
     * 
     * @param pot - Current cards in the pot
     * @param trumpSuit - The trump suit for this game
     * @returns The card to play
     */
    decideCard(pot: { playerId: string; card: ICard }[], trumpSuit: Suit): Card | null {
        if (this.hand.length === 0) {
            this.logger.warn('No cards to play', { handSize: 0 });
            return null;
        }

        let cardToPlay: Card;
        let reasoning: string;

        if (pot.length === 0) {
            // Leading: play lowest power non-trump card
            const nonTrumpCards = this.hand.filter(c => c.suit !== trumpSuit);

            if (nonTrumpCards.length > 0) {
                cardToPlay = nonTrumpCards.reduce((min, c) => c.power < min.power ? c : min);
                reasoning = 'Leading with lowest power non-trump';
            } else {
                cardToPlay = this.hand.reduce((min, c) => c.power < min.power ? c : min);
                reasoning = 'Leading with lowest trump (no non-trump cards)';
            }
        } else {
            // Following: must follow suit if possible
            const leadSuit = pot[0].card.suit;
            const suitCards = this.hand.filter(c => c.suit === leadSuit);

            if (suitCards.length > 0) {
                const currentWinner = this.getWinningCard(pot, trumpSuit);
                const winningCards = suitCards.filter(card => this.beats(card, currentWinner, leadSuit, trumpSuit));

                cardToPlay = this.lowestCard(winningCards.length > 0 ? winningCards : suitCards);
                reasoning = winningCards.length > 0
                    ? `Following ${leadSuit} with lowest winning card`
                    : `Following ${leadSuit} with lowest card`;
            } else {
                const currentWinner = this.getWinningCard(pot, trumpSuit);
                const trumpCards = this.hand.filter(card => card.suit === trumpSuit);
                const winningTrumps = trumpCards.filter(card => this.beats(card, currentWinner, leadSuit, trumpSuit));

                if (winningTrumps.length > 0) {
                    cardToPlay = this.lowestCard(winningTrumps);
                    reasoning = `Void in ${leadSuit}, cutting with lowest winning trump`;
                } else {
                    cardToPlay = this.lowestCard(this.hand);
                    reasoning = `Void in ${leadSuit}, discarding lowest card`;
                }
            }
        }

        this.logger.debug('Decided card', {
            card: `${cardToPlay.rank}${cardToPlay.suit}`,
            reasoning,
            potSize: pot.length,
            handSize: this.hand.length
        });

        return cardToPlay;
    }

    /**
     * Calculate a rough "strength" score for the hand.
     * Useful for future bidding decisions.
     * 
     * @returns A score from 0-100 indicating hand strength
     */
    private calculateHandStrength(): number {
        const rankStrength: Record<string, number> = {
            '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 1,
            'J': 3, 'Q': 5, 'K': 7, 'A': 9
        };
        const suitCounts: Record<Suit, number> = { H: 0, D: 0, C: 0, S: 0 };
        let score = 0;

        for (const card of this.hand) {
            score += rankStrength[card.rank];
            suitCounts[card.suit]++;
        }

        const longestSuit = Math.max(...Object.values(suitCounts));
        return score + Math.max(0, longestSuit - 1) * 2;
    }

    private lowestCard(cards: Card[]): Card {
        return cards.reduce((lowest, card) => card.power < lowest.power ? card : lowest);
    }

    private getWinningCard(pot: { playerId: string; card: ICard }[], trumpSuit: Suit): ICard {
        const leadSuit = pot[0].card.suit;

        return pot.slice(1).reduce((winner, entry) =>
            this.beats(entry.card, winner, leadSuit, trumpSuit) ? entry.card : winner,
        pot[0].card);
    }

    private beats(candidate: ICard, currentWinner: ICard, leadSuit: Suit, trumpSuit: Suit): boolean {
        if (candidate.suit === trumpSuit) {
            return currentWinner.suit !== trumpSuit || candidate.power > currentWinner.power;
        }

        return currentWinner.suit !== trumpSuit &&
            candidate.suit === leadSuit &&
            (currentWinner.suit !== leadSuit || candidate.power > currentWinner.power);
    }
}
