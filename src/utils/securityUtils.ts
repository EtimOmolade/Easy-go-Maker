/**
 * Security utility functions for hashing sensitive data
 */

/**
 * Hash a string using SHA-256
 * Used for hashing device fingerprints and trust tokens before storage
 */
export async function hashString(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash device fingerprint for secure storage/comparison
 */
export async function hashDeviceFingerprint(fingerprint: string): Promise<string> {
  return hashString(fingerprint);
}

/**
 * Hash trust token for secure storage
 */
export async function hashTrustToken(token: string): Promise<string> {
  return hashString(token);
}
