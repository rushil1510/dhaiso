import { IPlayer, ICard } from '../types';
import { Card } from './Card';

export class Player implements IPlayer {
    id: string;
    name: string;
    hand: Card[] = [];
    team: 'caller' | 'defense' | 'unknown' = 'unknown';
    pointsWon: number = 0;
    hasPassed: boolean = false;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    addCards(cards: Card[]) {
        this.hand.push(...cards);
        this.sortHand();
    }

    removeCard(card: Card) {
        const index = this.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
        if (index !== -1) {
            this.hand.splice(index, 1);
        }
    }

    hasSuit(suit: string): boolean {
        return this.hand.some(c => c.suit === suit);
    }

    sortHand() {
        // Sort by suit then rank (power)
        this.hand.sort((a, b) => {
            if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
            return a.power - b.power;
        });
    }

    hasFaceCard(): boolean {
        // J, Q, K, A are considered "Power Cards" or "Face Cards" for the purpose of the reshuffle rule as per plan
        return this.hand.some(c => ['J', 'Q', 'K', 'A'].includes(c.rank));
    }
}
