"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Converts a Uint8Array(16) to it's UUID string
 */
exports.bytesToUUID = (bytes) => {
    if (bytes.length !== 16) {
        throw new Error(`scte35-js Uint8Array uuid bad size: ${bytes.length}`);
    }
    return [].map.call(bytes, (byte, index) => {
        // left pad the hex result to two chars
        const hex = (byte <= 0x0F ? "0" : "") + byte.toString(16);
        // splice in "-" at position 4, 6, 8, 10
        if (index >= 4 && index <= 10 && index % 2 === 0) {
            return "-" + hex;
        }
        return hex;
    }).join("");
};
exports.THIRTY_TWO_BIT_MULTIPLIER = Math.pow(2, 32);
/**
 * shifts a single byte by 32 bits
 */
exports.shiftThirtyTwoBits = (byte) => {
    return byte * exports.THIRTY_TWO_BIT_MULTIPLIER;
};
//# sourceMappingURL=util.js.map