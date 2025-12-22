/**
 * Generates a random room code for game lobbies.
 * Uses uppercase alphanumeric characters, excluding ambiguous ones (0/O, 1/I/L).
 */

// Characters that are unambiguous when displayed (no 0/O, 1/I/L confusion)
const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a random room code of specified length.
 * Default length is 6 characters for good balance of uniqueness and usability.
 * 
 * @param length - Length of the code to generate (default: 6)
 * @returns A random alphanumeric room code
 */
export function generateRoomCode(length: number = 6): string {
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * SAFE_CHARS.length);
        code += SAFE_CHARS[randomIndex];
    }
    return code;
}

/**
 * Validate that a room code contains only valid characters.
 * 
 * @param code - The room code to validate
 * @returns true if the code is valid, false otherwise
 */
export function isValidRoomCode(code: string): boolean {
    if (!code || code.length < 4 || code.length > 8) {
        return false;
    }

    // Check that all characters are in the safe set
    return code.split('').every(char => SAFE_CHARS.includes(char));
}
