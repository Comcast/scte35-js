/**
 * Converts a Uint8Array(16) to it's UUID string
 */
export declare const bytesToUUID: (bytes: Uint8Array) => string;
export declare const THIRTY_TWO_BIT_MULTIPLIER: number;
/**
 * shifts a single byte by 32 bits
 */
export declare const shiftThirtyTwoBits: (byte: number) => number;
