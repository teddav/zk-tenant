export function uint8ArrayToStringArray(uint8Array: Uint8Array) {
  const stringArray = Array.from(uint8Array, (byte) => byte.toString());
  return stringArray;
}

export function parseField(fieldId: string, fieldValue: string, fieldLength: number, separator?: string) {
  const encoder = new TextEncoder();
  const fieldData = encoder.encode(fieldValue);
  const paddedData = new Uint8Array(fieldLength);
  paddedData.set(fieldData);

  let length = fieldData.length;
  if (separator) {
    const encoder = new TextEncoder();
    const sep = encoder.encode(separator);
    paddedData.set(sep, fieldData.length);
    length += 1;
  }

  return {
    id: fieldId,
    data: {
      len: length,
      storage: uint8ArrayToStringArray(paddedData),
    },
  };
}

export function parseSignature(signature: string) {
  const sig = base32ToUint8Array(signature);

  const N = BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551");
  let s = BigInt(
    "0x" +
      Array.from(sig.slice(32, 64))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
  );

  if (s > N / BigInt(2)) {
    s = ((-s % N) + N) % N;

    const sHex = s.toString(16);
    const sHexPadded = sHex.length % 2 === 0 ? sHex : "0" + sHex;
    const sArray = new Uint8Array(sHexPadded.length / 2);
    for (let i = 0; i < sArray.length; i++) {
      sArray[i] = parseInt(sHexPadded.substr(i * 2, 2), 16);
    }
    sig.set(sArray, 32);
  }

  return uint8ArrayToStringArray(sig);
}

// Base32 alphabet used in 2D-DOC
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Convert a base32 string to Uint8Array
 * @param {string} base32 - Base32 encoded string
 * @returns {Uint8Array} - Decoded bytes
 */
export function base32ToUint8Array(base32: string): Uint8Array {
  // Remove any padding characters
  base32 = base32.replace(/=+$/, "");

  // Convert to uppercase and remove any non-base32 characters
  base32 = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");

  const length = base32.length;
  const buffer = new Uint8Array(Math.floor((length * 5) / 8));
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < length; i++) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(base32[i]);
    bits += 5;

    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return buffer;
}
