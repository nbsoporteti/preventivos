import { pool } from '../db/pool.js';
import { verifyUserTokenString } from './jwtAuth.js';

/**
 * Valida JWT y carga la fila actual de `users`.
 * @returns {Promise<{ record: object }>}
 */
export async function loadUserRecordFromJwt(token) {
	const decoded = verifyUserTokenString(token);
	const id = decoded.sub;
	const [rows] = await pool.query(
		'SELECT id, email, password_hash, nombre, rol, email_verificado, activo, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
		[id],
	);
	const row = rows[0];
	if (!row) {
		throw new Error('Usuario no encontrado');
	}
	return { record: row };
}
