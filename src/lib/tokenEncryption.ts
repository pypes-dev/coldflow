import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * AES-256-GCM encryption for OAuth tokens
 *
 * Uses a 32-byte encryption key from environment variables
 * and generates a random 12-byte IV for each encryption operation
 * to ensure the same token encrypts differently each time.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get the encryption key from environment variables
 * @throws Error if GMAIL_ENCRYPTION_KEY is not configured
 */
function getEncryptionKey(): Buffer {
  const key = process.env.GMAIL_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'GMAIL_ENCRYPTION_KEY is not configured. Generate one with: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }

  try {
    const keyBuffer = Buffer.from(key, 'base64');

    if (keyBuffer.length !== 32) {
      throw new Error('GMAIL_ENCRYPTION_KEY must be 32 bytes (256 bits) when decoded from base64');
    }

    return keyBuffer;
  } catch (error) {
    throw new Error('GMAIL_ENCRYPTION_KEY is invalid. It must be a valid base64-encoded 32-byte key');
  }
}

/**
 * Encrypt a token using AES-256-GCM
 *
 * @param plainToken - The token to encrypt
 * @returns Base64-encoded string containing IV + auth tag + ciphertext
 */
export function encryptToken(plainToken: string): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainToken, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine IV + auth tag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64')
    ]);

    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Token encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a token using AES-256-GCM
 *
 * @param encryptedToken - Base64-encoded encrypted token
 * @returns Decrypted plain token string
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedToken, 'base64');

    // Extract IV, auth tag, and ciphertext
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Token decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate that the encryption key is properly configured
 * @returns true if valid, throws error if invalid
 */
export function validateEncryptionKey(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch (error) {
    throw error;
  }
}
