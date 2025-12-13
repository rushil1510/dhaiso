import { ICard, Rank, Suit } from '../types';

export class Card implements ICard {
    suit: Suit;
    rank: Rank;
    value: number;
    power: number;

    constructor(suit: Suit, rank: Rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = this.calculateValue(suit, rank);
        this.power = this.calculatePower(rank);
    }

    private calculateValue(suit: Suit, rank: Rank): number {
        if (suit === 'S' && rank === 'Q') return 60;
        if (rank === 'J') return 5;
        if (rank === 'Q') return 10;
        if (rank === 'K') return 15;
        if (rank === 'A') return 20;
        return 0;
    }

    private calculatePower(rank: Rank): number {
        const ranks: Rank[] = ['5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        return ranks.indexOf(rank);
    }

    toString(): string {
        return `${this.rank}${this.suit}`;
    }
}
