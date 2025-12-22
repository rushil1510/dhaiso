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

    describe('hand management', () => {
        it('should be able to add cards to hand', () => {
            const card1 = new Card('H', 'A');
            const card2 = new Card('S', 'K');

            player.hand.push(card1, card2);

            expect(player.hand.length).toBe(2);
            expect(player.hand).toContain(card1);
            expect(player.hand).toContain(card2);
        });

        it('should be able to remove cards from hand', () => {
            const card1 = new Card('H', 'A');
            const card2 = new Card('S', 'K');
            player.hand = [card1, card2];

            const index = player.hand.indexOf(card1);
            player.hand.splice(index, 1);

            expect(player.hand.length).toBe(1);
            expect(player.hand).not.toContain(card1);
            expect(player.hand).toContain(card2);
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
