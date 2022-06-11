/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */

function assert(
    cond: boolean,
    message = "Assertion failed!",
): asserts cond {
    if (!cond) {
        throw new Error(message);
    }
}

function assertNonNullish<T>(
    value: T,
    message = "Assertion failed!",
): NonNullable<T> {
    if (value === undefined || value === null) {
        throw new Error(message);
    }
    return value as NonNullable<T>;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const LOOKUP = new Uint8Array(256);
for (let i = 0; i < CHARS.length; i += 1) {
    const char = CHARS[i];
    assert(char !== undefined);
    LOOKUP[char.charCodeAt(0)] = i;
}

const encodeFirst = (byte: number): number => byte >> 2;
const encodeSecond
    = (byte1: number, byte2: number): number => (byte1 & 3) << 4 | byte2 >> 4;
const encodeThird
    = (byte1: number, byte2: number): number => (byte1 & 15) << 2 | byte2 >> 6;
const encodeFourth = (byte: number): number => byte & 63;

export function encode(data: ArrayBuffer | Uint8Array): string {
    const base64Chars: Array<string> = [];
    const bytes = new Uint8Array(data);
    for (let i = 0; i < bytes.length; i += 3) {
        const [a = 0, b = 0, c = 0] = bytes.subarray(i, i + 3);
        base64Chars.push(
            assertNonNullish(CHARS[encodeFirst(a)]),
            assertNonNullish(CHARS[encodeSecond(a, b)]),
            assertNonNullish(CHARS[encodeThird(b, c)]),
            assertNonNullish(CHARS[encodeFourth(c)]),
        );
    }

    if (bytes.length % 3 === 2) {
        base64Chars.splice(-1);
        base64Chars.push("=");
    } else if (bytes.length % 3 === 1) {
        base64Chars.splice(-2);
        base64Chars.push("==");
    }

    return base64Chars.join("");
}

const paddingLength = (string: string): number => {
    if (string.endsWith("==")) {
        return 2;
    } else if (string.endsWith("=")) {
        return 1;
    }
    return 0;
};

export function decode(base64: string): Uint8Array {
    if (base64.length % 4 !== 0) {
        throw new Error("Malformed base64");
    }
    const bufferLength = base64.length * 3 / 4 - paddingLength(base64);
    const bytes = new Uint8Array(bufferLength);

    let currentByte = 0;
    for (let i = 0; i < base64.length; i += 4) {
        const encoded1 = LOOKUP[base64.charCodeAt(i)] ?? 0;
        const encoded2 = LOOKUP[base64.charCodeAt(i + 1)] ?? 0;
        const encoded3 = LOOKUP[base64.charCodeAt(i + 2)] ?? 0;
        const encoded4 = LOOKUP[base64.charCodeAt(i + 3)] ?? 0;

        bytes[currentByte++] = encoded1 << 2 | encoded2 >> 4;
        bytes[currentByte++] = (encoded2 & 15) << 4 | encoded3 >> 2;
        bytes[currentByte++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }

    return bytes;
}

export async function toDataURL(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    return `data:${ blob.type };base64,${ encode(buffer) }`;
}

const Base64 = {
    [Symbol.toStringTag]: "Base64",
    toDataURL,
    encode,
    decode,
};

export default Base64;
