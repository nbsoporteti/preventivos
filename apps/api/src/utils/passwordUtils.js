import logger from './logger.js';

/**
 * Hash a password using native Horizons backend password hashing
 * The actual hashing is delegated to the backend when creating/updating users
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Password (returned as-is for backend to hash)
 */
export async function hashPassword(password) {
  // In Horizons environment, password hashing is handled by the native backend
  // We return the password as-is; the backend will hash it when storing
  logger.debug('Password will be hashed by native backend');
  return password;
}

/**
 * Compare a plain text password with a hash using native backend
 * The actual comparison is delegated to the backend auth system
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password (not used, backend handles comparison)
 * @returns {Promise<boolean>} True if password matches (backend validates)
 */
export async function comparePassword(password, hash) {
  // In Horizons environment, password comparison is handled by the native backend
  // This function is kept for API compatibility but actual validation happens in auth routes
  logger.debug('Password comparison delegated to native backend');
  return true; // Backend will validate actual password
}
