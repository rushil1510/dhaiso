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
     * Current strategy: Always pass (conservative)
     * 
     * @param currentBid - The current highest bid
     * @returns 0 to pass, or a higher bid amount
     */
    decideBid(currentBid: number): number {
        // Simple strategy: always pass
        // Future: Could analyze hand strength and bid accordingly
        this.logger.debug('Deciding bid', {
            currentBid,
            handStrength: this.calculateHandStrength(),
            decision: 'PASS'
        });
        return 0; // Pass
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
     *   - Following: Play lowest valid card
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
                // Play lowest card of lead suit
                cardToPlay = suitCards.reduce((min, c) => c.power < min.power ? c : min);
                reasoning = `Following ${leadSuit} with lowest card`;
            } else {
                // Can't follow suit - play lowest value card (minimize point loss)
                cardToPlay = this.hand.reduce((min, c) => c.value < min.value ? c : min);
                reasoning = `Void in ${leadSuit}, discarding lowest value`;
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
        let score = 0;

        for (const card of this.hand) {
            // Add points for high cards
            score += card.value;
            // Add bonus for aces and kings
            if (card.rank === 'A') score += 10;
            if (card.rank === 'K') score += 5;
        }

        // Normalize to 0-100 range (rough estimate)
        return Math.min(100, score);
    }
}
