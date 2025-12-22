import { generateRoomCode, isValidRoomCode } from '../services/CodeGenerator';

describe('CodeGenerator', () => {
    describe('generateRoomCode', () => {
        it('should generate a code of default length (6 characters)', () => {
            const code = generateRoomCode();
            expect(code.length).toBe(6);
        });

        it('should generate a code of specified length', () => {
            const code4 = generateRoomCode(4);
            const code8 = generateRoomCode(8);

            expect(code4.length).toBe(4);
            expect(code8.length).toBe(8);
        });

        it('should generate uppercase alphanumeric codes', () => {
            const code = generateRoomCode();
            expect(code).toMatch(/^[A-Z0-9]+$/);
        });

        it('should not contain ambiguous characters (0, O, 1, I, L)', () => {
            // Generate many codes to increase chance of catching issues
            for (let i = 0; i < 100; i++) {
                const code = generateRoomCode();
                expect(code).not.toMatch(/[0OIL1]/);
            }
        });

        it('should generate unique codes (probabilistic)', () => {
            const codes = new Set<string>();
            for (let i = 0; i < 100; i++) {
                codes.add(generateRoomCode());
            }
            // Should have high uniqueness (at least 95 unique out of 100)
            expect(codes.size).toBeGreaterThan(95);
        });
    });

    describe('isValidRoomCode', () => {
        it('should return true for valid codes', () => {
            expect(isValidRoomCode('ABCD23')).toBe(true);  // No ambiguous chars
            expect(isValidRoomCode('GHKM56')).toBe(true);
            expect(isValidRoomCode('PQRS78')).toBe(true);
        });

        it('should return false for codes that are too short', () => {
            expect(isValidRoomCode('AB')).toBe(false);
            expect(isValidRoomCode('ABC')).toBe(false);
        });

        it('should return false for codes that are too long', () => {
            expect(isValidRoomCode('ABCDEFGHI')).toBe(false);
        });

        it('should return false for empty or null codes', () => {
            expect(isValidRoomCode('')).toBe(false);
            expect(isValidRoomCode(null as any)).toBe(false);
            expect(isValidRoomCode(undefined as any)).toBe(false);
        });

        it('should return false for codes with lowercase letters', () => {
            expect(isValidRoomCode('abc123')).toBe(false);
            expect(isValidRoomCode('AbC123')).toBe(false);
        });

        it('should return false for codes with ambiguous characters', () => {
            expect(isValidRoomCode('ABC0EF')).toBe(false); // Contains 0
            expect(isValidRoomCode('ABCOEF')).toBe(false); // Contains O
            expect(isValidRoomCode('ABC1EF')).toBe(false); // Contains 1
            expect(isValidRoomCode('ABCIEF')).toBe(false); // Contains I
            expect(isValidRoomCode('ABCLEF')).toBe(false); // Contains L
        });

        it('should return false for codes with special characters', () => {
            expect(isValidRoomCode('ABC-12')).toBe(false);
            expect(isValidRoomCode('ABC_12')).toBe(false);
            expect(isValidRoomCode('ABC 12')).toBe(false);
        });

        it('should validate codes between 4-8 characters', () => {
            expect(isValidRoomCode('ABCD')).toBe(true);     // 4 chars
            expect(isValidRoomCode('ABCDE')).toBe(true);    // 5 chars
            expect(isValidRoomCode('ABCDEF')).toBe(true);   // 6 chars
            expect(isValidRoomCode('ABCDEFG')).toBe(true);  // 7 chars
            expect(isValidRoomCode('ABCDEFGH')).toBe(true); // 8 chars
        });
    });
});
