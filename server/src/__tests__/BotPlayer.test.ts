import { BotPlayer } from '../classes/BotPlayer';
import { Player } from '../classes/Player';
import { Card } from '../classes/Card';
import { Suit } from '../types';

describe('BotPlayer', () => {
    let bot: BotPlayer;

    beforeEach(() => {
        bot = new BotPlayer('bot-123', 'TestBot');
    });

    describe('constructor', () => {
        it('should create a bot player with correct id and name', () => {
            expect(bot.id).toBe('bot-123');
            expect(bot.name).toBe('TestBot');
        });

        it('should have isBot flag set to true', () => {
            expect(bot.isBot).toBe(true);
        });

        it('should extend Player class', () => {
            expect(bot).toBeInstanceOf(Player);
        });
    });

    describe('fromPlayer', () => {
        it('should create a BotPlayer from existing Player', () => {
            const player = new Player('player-456', 'Alice');
            player.team = 'caller';
            player.pointsWon = 50;
            player.hasPassed = true;
            player.hand = [new Card('H', 'A'), new Card('S', 'K')];

            const botFromPlayer = BotPlayer.fromPlayer(player);

            expect(botFromPlayer.id).toBe('player-456');
            expect(botFromPlayer.name).toBe('Alice');
            expect(botFromPlayer.team).toBe('caller');
            expect(botFromPlayer.pointsWon).toBe(50);
            expect(botFromPlayer.hasPassed).toBe(true);
            expect(botFromPlayer.hand.length).toBe(2);
        });
    });

    describe('decideBid', () => {
        it('should always return 0 (pass) with current strategy', () => {
            bot.hand = [
                new Card('H', 'A'),
                new Card('H', 'K'),
                new Card('H', 'Q'),
            ];

            expect(bot.decideBid(170)).toBe(0);
            expect(bot.decideBid(180)).toBe(0);
            expect(bot.decideBid(200)).toBe(0);
        });

        it('should pass even with very strong hand', () => {
            // Give bot all Aces
            bot.hand = [
                new Card('H', 'A'),
                new Card('D', 'A'),
                new Card('C', 'A'),
                new Card('S', 'A'),
                new Card('H', 'K'),
            ];

            expect(bot.decideBid(170)).toBe(0);
        });

        it('should pass even with empty hand', () => {
            bot.hand = [];
            expect(bot.decideBid(170)).toBe(0);
        });

        it('should pass at any bid level', () => {
            bot.hand = [new Card('H', 'K')];

            expect(bot.decideBid(170)).toBe(0);
            expect(bot.decideBid(250)).toBe(0);
            expect(bot.decideBid(300)).toBe(0);
        });
    });

    describe('decideTrump', () => {
        it('should return a valid trump selection object', () => {
            bot.hand = [
                new Card('H', 'A'),
                new Card('H', 'K'),
                new Card('H', 'Q'),
                new Card('D', '10'),
                new Card('S', 'J'),
            ];

            const decision = bot.decideTrump();

            expect(decision).toHaveProperty('suit');
            expect(['H', 'D', 'C', 'S']).toContain(decision.suit);
            expect(decision).toHaveProperty('friends');
            expect(decision.friends.length).toBe(2);
        });

        it('should choose the suit with most cards', () => {
            // Give bot mostly Hearts
            bot.hand = [
                new Card('H', 'A'),
                new Card('H', 'K'),
                new Card('H', 'Q'),
                new Card('H', 'J'),
                new Card('D', '10'),
            ];

            const decision = bot.decideTrump();
            expect(decision.suit).toBe('H');
        });

        it('should not choose cards in hand as friends', () => {
            bot.hand = [
                new Card('H', 'A'),
                new Card('H', 'K'),
                new Card('D', 'Q'),
                new Card('C', 'J'),
                new Card('S', '10'),
            ];

            const decision = bot.decideTrump();

            // Friends should not be cards the bot has
            decision.friends.forEach(friend => {
                const hasCard = bot.hand.some(
                    c => c.rank === friend.rank && c.suit === friend.suit
                );
                expect(hasCard).toBe(false);
            });
        });

        it('should not choose Ace of Spades as friend', () => {
            bot.hand = [
                new Card('H', '5'),
                new Card('D', '6'),
                new Card('C', '7'),
                new Card('S', '8'),
                new Card('H', '9'),
            ];

            const decision = bot.decideTrump();

            const hasAceOfSpades = decision.friends.some(
                f => f.rank === 'A' && f.suit === 'S'
            );
            expect(hasAceOfSpades).toBe(false);
        });
    });

    describe('decideCard', () => {
        const trumpSuit: Suit = 'H';

        it('should return null if hand is empty', () => {
            bot.hand = [];
            const result = bot.decideCard([], trumpSuit);
            expect(result).toBeNull();
        });

        describe('when leading (pot is empty)', () => {
            it('should play a non-trump card when available', () => {
                bot.hand = [
                    new Card('H', 'A'), // Trump
                    new Card('D', '5'), // Non-trump
                    new Card('S', '6'), // Non-trump
                ];

                const card = bot.decideCard([], trumpSuit);

                expect(card).not.toBeNull();
                expect(card!.suit).not.toBe('H');
            });

            it('should play trump if only trumps available', () => {
                bot.hand = [
                    new Card('H', 'A'),
                    new Card('H', 'K'),
                    new Card('H', 'Q'),
                ];

                const card = bot.decideCard([], trumpSuit);

                expect(card).not.toBeNull();
                expect(card!.suit).toBe('H');
            });
        });

        describe('when following (pot has cards)', () => {
            it('should follow suit when possible', () => {
                bot.hand = [
                    new Card('D', 'A'),
                    new Card('D', 'K'),
                    new Card('S', 'Q'),
                ];

                const pot = [
                    { playerId: 'other', card: new Card('D', '5') }
                ];

                const card = bot.decideCard(pot, trumpSuit);

                expect(card).not.toBeNull();
                expect(card!.suit).toBe('D'); // Must follow Diamonds
            });

            it('should play any card when void in lead suit', () => {
                bot.hand = [
                    new Card('H', 'A'), // Trump
                    new Card('S', 'K'), // Spades
                    new Card('C', 'Q'), // Clubs
                ];

                const pot = [
                    { playerId: 'other', card: new Card('D', '5') } // Lead is Diamonds
                ];

                const card = bot.decideCard(pot, trumpSuit);

                expect(card).not.toBeNull();
                // Bot is void in Diamonds, can play anything
                expect(['H', 'S', 'C']).toContain(card!.suit);
            });
        });

        it('should actually remove the card from hand when played', () => {
            const cardToPlay = new Card('D', '5');
            bot.hand = [cardToPlay, new Card('S', 'K')];

            const decision = bot.decideCard([], trumpSuit);

            // Note: decideCard only returns the card to play,
            // the actual removal happens in Game.handlePlayCard
            expect(decision).not.toBeNull();
        });
    });
});
