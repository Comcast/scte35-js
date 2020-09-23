/**
 * Converts a Uint8Array(16) to it's UUID string
 */
export const bytesToUUID = (bytes: Uint8Array): string => {
    if (bytes.length !== 16) {
        throw new Error(`scte35-js Uint8Array uuid bad size: ${bytes.length}`);
    }
    return [].map
        .call(bytes, (byte: number, index: number) => {
            // left pad the hex result to two chars
            const hex = (byte <= 0x0f ? "0" : "") + byte.toString(16);
            // splice in "-" at position 4, 6, 8, 10
            if (index >= 4 && index <= 10 && index % 2 === 0) {
                return "-" + hex;
            }
            return hex;
        })
        .join("");
};

export const THIRTY_TWO_BIT_MULTIPLIER = Math.pow(2, 32);

/**
 * shifts a single byte by 32 bits
 */
export const shiftThirtyTwoBits = (byte: number): number => {
    return byte * THIRTY_TWO_BIT_MULTIPLIER;
};
