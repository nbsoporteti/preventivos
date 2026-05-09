import logger from './logger.js';

// In-memory OTP storage: Map<email, { code, expiresAt }>
const otpStore = new Map();

/**
 * Generate a 6-digit OTP code
 * @returns {string} 6-digit OTP code
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP code for an email
 * @param {string} email - User email
 * @param {string} code - OTP code
 * @param {number} expiresInMinutes - Expiration time in minutes (default: 10)
 */
export function storeOTP(email, code, expiresInMinutes = 10) {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  otpStore.set(email, { code, expiresAt });
  logger.debug(`OTP stored for ${email}, expires in ${expiresInMinutes} minutes`);
}

/**
 * Verify OTP code for an email
 * @param {string} email - User email
 * @param {string} code - OTP code to verify
 * @returns {boolean} True if OTP is valid and not expired
 */
export function verifyOTP(email, code) {
  const otpData = otpStore.get(email);

  if (!otpData) {
    logger.warn(`No OTP found for ${email}`);
    return false;
  }

  if (Date.now() > otpData.expiresAt) {
    otpStore.delete(email);
    logger.warn(`OTP expired for ${email}`);
    return false;
  }

  if (otpData.code !== code) {
    logger.warn(`Invalid OTP code for ${email}`);
    return false;
  }

  // OTP verified, delete it
  otpStore.delete(email);
  logger.debug(`OTP verified and deleted for ${email}`);
  return true;
}

/**
 * Delete OTP for an email (cleanup)
 * @param {string} email - User email
 */
export function deleteOTP(email) {
  otpStore.delete(email);
}
