import { describe, it, expect, beforeAll } from 'vitest';
import { encryptToken, decryptToken, validateEncryptionKey } from '../tokenEncryption';

describe('Token Encryption', () => {
  beforeAll(() => {
    // Set a test encryption key
    process.env.GMAIL_ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
  });

  it('should encrypt and decrypt a token successfully', () => {
    const originalToken = 'test-oauth-token-12345';

    const encrypted = encryptToken(originalToken);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(originalToken);
  });

  it('should produce different ciphertext for same input (random IV)', () => {
    const originalToken = 'test-token';

    const encrypted1 = encryptToken(originalToken);
    const encrypted2 = encryptToken(originalToken);

    // Different ciphertexts due to random IV
    expect(encrypted1).not.toBe(encrypted2);

    // But both decrypt to same value
    expect(decryptToken(encrypted1)).toBe(originalToken);
    expect(decryptToken(encrypted2)).toBe(originalToken);
  });

  it('should handle various token lengths', () => {
    const shortToken = 'abc';
    const mediumToken = 'a'.repeat(100);
    const longToken = 'a'.repeat(1000);

    expect(decryptToken(encryptToken(shortToken))).toBe(shortToken);
    expect(decryptToken(encryptToken(mediumToken))).toBe(mediumToken);
    expect(decryptToken(encryptToken(longToken))).toBe(longToken);
  });

  it('should throw error when encryption key is not configured', () => {
    const originalKey = process.env.GMAIL_ENCRYPTION_KEY;
    delete process.env.GMAIL_ENCRYPTION_KEY;

    expect(() => encryptToken('test')).toThrow('GMAIL_ENCRYPTION_KEY is not configured');

    process.env.GMAIL_ENCRYPTION_KEY = originalKey;
  });

  it('should throw error when decrypting corrupted data', () => {
    const encrypted = encryptToken('test-token');

    // Corrupt the encrypted data
    const corrupted = encrypted.slice(0, -5) + 'XXXXX';

    expect(() => decryptToken(corrupted)).toThrow('Token decryption failed');
  });

  it('should validate encryption key correctly', () => {
    expect(validateEncryptionKey()).toBe(true);
  });

  it('should handle special characters in tokens', () => {
    const specialToken = 'token-with-special-chars!@#$%^&*(){}[]|\\:";\'<>?,./~`';

    const encrypted = encryptToken(specialToken);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(specialToken);
  });
});
