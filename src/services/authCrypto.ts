/**
 * Cryptographic utility service for client-side authentication.
 * Uses Web Crypto API (PBKDF2-HMAC-SHA256, 100,000 iterations)
 * for secure client-side password hashing and token generation.
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH_BITS = 256;

// Helper to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert hex string to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generate cryptographically secure random hex string (salt or token)
 */
export function generateSecureRandomHex(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

/**
 * Hash a password with PBKDF2-HMAC-SHA256
 */
export async function hashPassword(
  password: string,
  existingSalt?: string
): Promise<{ hash: string; salt: string }> {
  const saltHex = existingSalt || generateSecureRandomHex(16);
  const saltBytes = hexToBuffer(saltHex);

  const enc = new TextEncoder();
  const passwordKey = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_LENGTH_BITS
  );

  const hash = bufferToHex(derivedBits);
  return { hash, salt: saltHex };
}

/**
 * Verify a password against an existing hash and salt in constant-time
 */
export async function verifyPassword(
  passwordAttempt: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  try {
    const { hash } = await hashPassword(passwordAttempt, storedSalt);
    // Constant-time string comparison
    if (hash.length !== storedHash.length) return false;
    let match = 0;
    for (let i = 0; i < hash.length; i++) {
      match |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return match === 0;
  } catch {
    return false;
  }
}

/**
 * Validates email format strictly
 */
export function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email.trim().toLowerCase());
}

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  feedback: string[];
  isValid: boolean;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
}

/**
 * Password strength and complexity auditor
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters required');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Include uppercase letters (A-Z)');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Include lowercase letters (a-z)');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Include numbers (0-9)');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Include special symbols (!@#$%^&*)');

  // Map score (0-5) to 0-4 scale
  const normalizedScore = Math.min(4, Math.max(0, score - 1));
  const labels: PasswordStrengthResult['label'][] = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

  return {
    score: normalizedScore,
    feedback,
    isValid: password.length >= 8 && score >= 3,
    label: labels[normalizedScore],
    color: colors[normalizedScore],
  };
}
