import { Card } from './Card';
import { Suit, Rank } from '../types';

export class Deck {
    cards: Card[] = [];

    constructor() {
        this.reset();
    }

    reset() {
        this.cards = [];
        const suits: Suit[] = ['H', 'D', 'C', 'S'];
        const ranks: Rank[] = ['5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        for (const suit of suits) {
            for (const rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(count: number): Card[] {
        return this.cards.splice(0, count);
    }

    get remaining(): number {
        return this.cards.length;
    }
}
