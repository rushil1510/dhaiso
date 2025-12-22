import { Card } from '../classes/Card';
import { Suit } from '../types';

describe('Card', () => {
    describe('constructor', () => {
        it('should create a card with correct suit and rank', () => {
            const card = new Card('H', 'A');
            expect(card.suit).toBe('H');
            expect(card.rank).toBe('A');
        });

        it('should calculate correct value for point cards', () => {
            const ace = new Card('S', 'A');
            const king = new Card('H', 'K');
            const queen = new Card('D', 'Q');
            const queenSpades = new Card('S', 'Q'); // Special case
            const jack = new Card('C', 'J');
            const ten = new Card('S', '10');

            expect(ace.value).toBe(20);
            expect(king.value).toBe(15);
            expect(queen.value).toBe(10);
            expect(queenSpades.value).toBe(60); // Q♠ is special
            expect(jack.value).toBe(5);
            expect(ten.value).toBe(0); // 10 has no points
        });

        it('should calculate zero value for non-point cards', () => {
            const nine = new Card('H', '9');
            const eight = new Card('D', '8');
            const five = new Card('C', '5');

            expect(nine.value).toBe(0);
            expect(eight.value).toBe(0);
            expect(five.value).toBe(0);
        });

        it('should assign correct power rankings', () => {
            const ace = new Card('S', 'A');
            const king = new Card('S', 'K');
            const queen = new Card('S', 'Q');
            const jack = new Card('S', 'J');
            const ten = new Card('S', '10');
            const nine = new Card('S', '9');

            // Ace should be highest power
            expect(ace.power).toBeGreaterThan(king.power);
            expect(king.power).toBeGreaterThan(queen.power);
            expect(queen.power).toBeGreaterThan(jack.power);
            expect(ten.power).toBeGreaterThan(nine.power);
        });
    });

    describe('all suits', () => {
        const suits: Suit[] = ['H', 'D', 'C', 'S'];

        it('should accept all valid suits', () => {
            suits.forEach(suit => {
                const card = new Card(suit, 'A');
                expect(card.suit).toBe(suit);
            });
        });
    });

    describe('all ranks', () => {
        it('should accept all valid ranks', () => {
            const ranks: ('5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A')[] =
                ['5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            ranks.forEach(rank => {
                const card = new Card('H', rank);
                expect(card.rank).toBe(rank);
            });
        });
    });
});
