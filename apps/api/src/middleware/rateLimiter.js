import rateLimit from 'express-rate-limit';
import { NodeEnv } from '../constants/common.js';

const isDev = process.env.NODE_ENV !== NodeEnv.Production;

/**
 * Login: en desarrollo el límite es alto para no bloquearte al probar;
 * en producción se puede sobreescribir con LOGIN_RATE_LIMIT_MAX.
 */
const loginMax = isDev
	? Number(process.env.LOGIN_RATE_LIMIT_MAX) || 200
	: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 30;

/**
 * Registro: idem con SIGNUP_RATE_LIMIT_MAX.
 */
const signupMax = isDev
	? Number(process.env.SIGNUP_RATE_LIMIT_MAX) || 100
	: Number(process.env.SIGNUP_RATE_LIMIT_MAX) || 15;

export const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: loginMax,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Demasiados intentos de inicio de sesión. Prueba más tarde.' },
	validate: { trustProxy: false },
	skip: () => process.env.DISABLE_RATE_LIMIT === 'true',
});

export const signupLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: signupMax,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Demasiados intentos de registro. Prueba más tarde.' },
	validate: { trustProxy: false },
	skip: () => process.env.DISABLE_RATE_LIMIT === 'true',
});
