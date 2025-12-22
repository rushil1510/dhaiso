import { Player } from '../classes/Player';
import { Card } from '../classes/Card';

describe('Player', () => {
    let player: Player;

    beforeEach(() => {
        player = new Player('player-123', 'Alice');
    });

    describe('constructor', () => {
        it('should create a player with correct id and name', () => {
            expect(player.id).toBe('player-123');
            expect(player.name).toBe('Alice');
        });

        it('should initialize with empty hand', () => {
            expect(player.hand).toEqual([]);
            expect(player.hand.length).toBe(0);
        });

        it('should initialize with unknown team', () => {
            expect(player.team).toBe('unknown');
        });

        it('should initialize with zero points', () => {
            expect(player.pointsWon).toBe(0);
        });

        it('should initialize with hasPassed as false', () => {
            expect(player.hasPassed).toBe(false);
        });
    });

    describe('addCards', () => {
        it('should add cards to the hand', () => {
            const cards = [
                new Card('H', 'A'),
                new Card('S', 'K'),
                new Card('D', 'Q')
            ];

            player.addCards(cards);

            expect(player.hand.length).toBe(3);
        });

        it('should sort cards after adding', () => {
            const cards = [
                new Card('S', 'A'),  // Spades, high power
                new Card('H', '5'),  // Hearts, low power  
                new Card('D', 'K'),  // Diamonds, high power
                new Card('H', 'A'),  // Hearts, high power
            ];

            player.addCards(cards);

            // Cards should be sorted by suit then by power
            // Clubs < Diamonds < Hearts < Spades (alphabetical)
            expect(player.hand[0].suit).toBe('D');
            expect(player.hand[1].suit).toBe('H');
            expect(player.hand[2].suit).toBe('H');
            expect(player.hand[3].suit).toBe('S');
        });

        it('should maintain suit grouping', () => {
            player.addCards([
                new Card('H', 'A'),
                new Card('H', 'K'),
                new Card('H', 'Q'),
            ]);

            expect(player.hand.every(c => c.suit === 'H')).toBe(true);
        });
    });

    describe('removeCard', () => {
        beforeEach(() => {
            player.addCards([
                new Card('H', 'A'),
                new Card('S', 'K'),
                new Card('D', 'Q')
            ]);
        });

        it('should remove the specified card', () => {
            const cardToRemove = new Card('S', 'K');
            player.removeCard(cardToRemove);

            expect(player.hand.length).toBe(2);
            expect(player.hand.some(c => c.suit === 'S' && c.rank === 'K')).toBe(false);
        });

        it('should keep other cards', () => {
            const cardToRemove = new Card('S', 'K');
            player.removeCard(cardToRemove);

            expect(player.hand.some(c => c.suit === 'H' && c.rank === 'A')).toBe(true);
            expect(player.hand.some(c => c.suit === 'D' && c.rank === 'Q')).toBe(true);
        });

        it('should do nothing if card is not in hand', () => {
            const nonExistentCard = new Card('C', '5');
            player.removeCard(nonExistentCard);

            expect(player.hand.length).toBe(3);
        });
    });

    describe('hasSuit', () => {
        beforeEach(() => {
            player.addCards([
                new Card('H', 'A'),
                new Card('H', 'K'),
                new Card('S', 'Q')
            ]);
        });

        it('should return true if player has the suit', () => {
            expect(player.hasSuit('H')).toBe(true);
            expect(player.hasSuit('S')).toBe(true);
        });

        it('should return false if player does not have the suit', () => {
            expect(player.hasSuit('D')).toBe(false);
            expect(player.hasSuit('C')).toBe(false);
        });
    });

    describe('sortHand', () => {
        it('should sort by suit first', () => {
            player.hand = [
                new Card('S', '5'),
                new Card('C', '5'),
                new Card('H', '5'),
                new Card('D', '5'),
            ];

            player.sortHand();

            // Alphabetical: C, D, H, S
            expect(player.hand[0].suit).toBe('C');
            expect(player.hand[1].suit).toBe('D');
            expect(player.hand[2].suit).toBe('H');
            expect(player.hand[3].suit).toBe('S');
        });

        it('should sort by power within same suit', () => {
            player.hand = [
                new Card('H', 'A'), // power 9
                new Card('H', '5'), // power 0
                new Card('H', '10'), // power 5
                new Card('H', 'K'), // power 8
            ];

            player.sortHand();

            // Within same suit, sort by power (ascending)
            expect(player.hand[0].rank).toBe('5');
            expect(player.hand[1].rank).toBe('10');
            expect(player.hand[2].rank).toBe('K');
            expect(player.hand[3].rank).toBe('A');
        });
    });

    describe('hasFaceCard', () => {
        it('should return true if player has a Jack', () => {
            player.hand = [new Card('H', 'J'), new Card('D', '5')];
            expect(player.hasFaceCard()).toBe(true);
        });

        it('should return true if player has a Queen', () => {
            player.hand = [new Card('H', 'Q'), new Card('D', '5')];
            expect(player.hasFaceCard()).toBe(true);
        });

        it('should return true if player has a King', () => {
            player.hand = [new Card('H', 'K'), new Card('D', '5')];
            expect(player.hasFaceCard()).toBe(true);
        });

        it('should return true if player has an Ace', () => {
            player.hand = [new Card('H', 'A'), new Card('D', '5')];
            expect(player.hasFaceCard()).toBe(true);
        });

        it('should return false if player has no face cards', () => {
            player.hand = [
                new Card('H', '5'),
                new Card('D', '6'),
                new Card('C', '7'),
                new Card('S', '8'),
                new Card('H', '9'),
            ];
            expect(player.hasFaceCard()).toBe(false);
        });

        it('should return false for empty hand', () => {
            player.hand = [];
            expect(player.hasFaceCard()).toBe(false);
        });
    });

    describe('team assignment', () => {
        it('should allow setting team to caller', () => {
            player.team = 'caller';
            expect(player.team).toBe('caller');
        });

        it('should allow setting team to defense', () => {
            player.team = 'defense';
            expect(player.team).toBe('defense');
        });
    });

    describe('points tracking', () => {
        it('should accumulate points correctly', () => {
            player.pointsWon = 10;
            player.pointsWon += 15;
            expect(player.pointsWon).toBe(25);
        });
    });

    describe('bidding state', () => {
        it('should track hasPassed correctly', () => {
            expect(player.hasPassed).toBe(false);
            player.hasPassed = true;
            expect(player.hasPassed).toBe(true);
        });
    });
});
