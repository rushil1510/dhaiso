import { Deck } from '../classes/Deck';
import { Card } from '../classes/Card';
import { Rank } from '../types';

describe('Deck', () => {
    let deck: Deck;

    beforeEach(() => {
        deck = new Deck();
    });

    describe('constructor', () => {
        it('should create a deck with 40 cards (10 ranks × 4 suits)', () => {
            expect(deck.cards.length).toBe(40);
        });

        it('should have 10 cards of each suit', () => {
            const suitCounts = { H: 0, D: 0, C: 0, S: 0 };
            deck.cards.forEach(card => {
                suitCounts[card.suit]++;
            });

            expect(suitCounts.H).toBe(10);
            expect(suitCounts.D).toBe(10);
            expect(suitCounts.C).toBe(10);
            expect(suitCounts.S).toBe(10);
        });

        it('should have 4 cards of each rank', () => {
            const ranks: Rank[] = ['5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            ranks.forEach(rank => {
                const count = deck.cards.filter(card => card.rank === rank).length;
                expect(count).toBe(4);
            });
        });

        it('should have no duplicate cards', () => {
            const cardStrings = deck.cards.map(c => `${c.suit}${c.rank}`);
            const uniqueCards = new Set(cardStrings);
            expect(uniqueCards.size).toBe(40);
        });
    });

    describe('shuffle', () => {
        it('should still have 40 cards after shuffling', () => {
            deck.shuffle();
            expect(deck.cards.length).toBe(40);
        });

        it('should change the order of cards (probabilistic)', () => {
            const originalOrder = deck.cards.map(c => `${c.suit}${c.rank}`).join(',');
            deck.shuffle();
            const newOrder = deck.cards.map(c => `${c.suit}${c.rank}`).join(',');

            // Very unlikely to be the same after shuffle
            expect(newOrder).not.toBe(originalOrder);
        });
    });

    describe('deal', () => {
        it('should deal the specified number of cards', () => {
            const hand = deck.deal(10);
            expect(hand.length).toBe(10);
        });

        it('should remove dealt cards from the deck', () => {
            const initialCount = deck.cards.length;
            deck.deal(10);
            expect(deck.cards.length).toBe(initialCount - 10);
        });

        it('should return Card objects', () => {
            const hand = deck.deal(5);
            hand.forEach(card => {
                expect(card).toBeInstanceOf(Card);
            });
        });

        it('should deal different cards each time', () => {
            const hand1 = deck.deal(5);
            const hand2 = deck.deal(5);

            const hand1Strings = hand1.map(c => `${c.suit}${c.rank}`);
            const hand2Strings = hand2.map(c => `${c.suit}${c.rank}`);

            // No overlap between hands
            hand1Strings.forEach(cardStr => {
                expect(hand2Strings).not.toContain(cardStr);
            });
        });

        it('should deal all 40 cards across multiple deals (5 players × 8 cards)', () => {
            const allCards: Card[] = [];
            allCards.push(...deck.deal(8));
            allCards.push(...deck.deal(8));
            allCards.push(...deck.deal(8));
            allCards.push(...deck.deal(8));
            allCards.push(...deck.deal(8));

            expect(allCards.length).toBe(40);
            expect(deck.cards.length).toBe(0);
        });
    });

    describe('remaining', () => {
        it('should return correct remaining count', () => {
            expect(deck.remaining).toBe(40);
            deck.deal(10);
            expect(deck.remaining).toBe(30);
        });
    });

    describe('reset', () => {
        it('should restore deck to 40 cards after dealing', () => {
            deck.deal(20);
            expect(deck.cards.length).toBe(20);

            deck.reset();
            expect(deck.cards.length).toBe(40);
        });
    });
});
