import jwt from 'jsonwebtoken';

const DEFAULT_EXP = '7d';

function secret() {
	const s = process.env.JWT_SECRET;
	if (!s && process.env.NODE_ENV === 'production') {
		throw new Error('JWT_SECRET es obligatorio en producción');
	}
	return s || 'dev-only-change-me';
}

export function signUserToken(payload) {
	return jwt.sign(
		{ sub: payload.id, email: payload.email, rol: payload.rol },
		secret(),
		{ expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXP },
	);
}

/**
 * @returns {{ sub: string, email: string, rol: string, iat: number, exp: number }}
 */
export function verifyUserTokenString(token) {
	return jwt.verify(token, secret());
}
