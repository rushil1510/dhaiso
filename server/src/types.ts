export type Suit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
export type Rank = '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface ICard {
    suit: Suit;
    rank: Rank;
    value: number; // Points value
    power: number; // Comparison power
}

export interface IPlayer {
    id: string;
    name: string;
    hand: ICard[];
    team: 'caller' | 'defense' | 'unknown';
    pointsWon: number;
    hasPassed?: boolean;
}

export interface GameState {
    players: IPlayer[];
    currentTurn: number;
    bid: number;
    callerId: string | null;
    trumpSuit: Suit | null;
    friendCards: ICard[];
    pot: { playerId: string, card: ICard }[];
    scores: Record<string, number>;
    phase: 'lobby' | 'bidding' | 'trump_selection' | 'playing' | 'ended';
}
