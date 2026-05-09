import crypto from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** IDs de 15 caracteres (misma forma que PocketBase) para no romper el front. */
export function newId() {
	let s = '';
	for (let i = 0; i < 15; i++) {
		s += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
	}
	return s;
}
