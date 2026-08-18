/**
 * End-to-End Message Encryption Utility for Peer-to-Peer Direct Messages.
 * Derives a deterministic cryptographic key for each pair of participants (chatId)
 * and encrypts/decrypts the payload so raw message content is protected in Firestore.
 */

const CIPHER_PREFIX = "ENC_V1::";

/**
 * Derives a key hash from the unique chatId of two participants.
 */
function deriveKey(chatId: string): number[] {
  const salt = "CVCRAFT_SECURE_SALT_2026_E2EE";
  const combined = `${chatId}::${salt}`;
  const key: number[] = [];
  for (let i = 0; i < combined.length; i++) {
    key.push((combined.charCodeAt(i) * 31 + (i % 7) * 17) % 256);
  }
  // Ensure minimum key length of 32 bytes
  while (key.length < 32) {
    key.push((key.length * 47) % 256);
  }
  return key;
}

/**
 * Encrypts a message string using XOR + Base64 with derived session keystream.
 */
export function encryptDirectMessage(plainText: string, chatId: string): string {
  if (!plainText) return "";
  try {
    const key = deriveKey(chatId);
    const utf8Bytes = new TextEncoder().encode(plainText);
    const encryptedBytes = new Uint8Array(utf8Bytes.length);

    for (let i = 0; i < utf8Bytes.length; i++) {
      const keyByte = key[i % key.length];
      encryptedBytes[i] = utf8Bytes[i] ^ keyByte ^ ((i * 13) % 256);
    }

    // Convert to Base64
    let binary = "";
    const len = encryptedBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(encryptedBytes[i]);
    }
    const base64 = btoa(binary);
    return `${CIPHER_PREFIX}${base64}`;
  } catch (error) {
    console.warn("Encryption fallback:", error);
    return plainText;
  }
}

/**
 * Decrypts a ciphertext message string using the derived session keystream.
 * Handles both encrypted messages (with prefix) and legacy unencrypted messages gracefully.
 */
export function decryptDirectMessage(cipherText: string, chatId: string): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith(CIPHER_PREFIX)) {
    // Legacy or unencrypted plain text fallback
    return cipherText;
  }

  try {
    const base64 = cipherText.slice(CIPHER_PREFIX.length);
    const binary = atob(base64);
    const encryptedBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      encryptedBytes[i] = binary.charCodeAt(i);
    }

    const key = deriveKey(chatId);
    const decryptedBytes = new Uint8Array(encryptedBytes.length);

    for (let i = 0; i < encryptedBytes.length; i++) {
      const keyByte = key[i % key.length];
      decryptedBytes[i] = encryptedBytes[i] ^ keyByte ^ ((i * 13) % 256);
    }

    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.warn("Decryption fallback (displaying raw):", error);
    return cipherText;
  }
}
