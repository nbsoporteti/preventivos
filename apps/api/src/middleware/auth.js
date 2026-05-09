import 'dotenv/config';
import logger from '../utils/logger.js';
import { loadUserRecordFromJwt } from '../utils/userSession.js';
import { formatPublicUser } from '../utils/userDto.js';

/**
 * Verifica Bearer JWT y carga el usuario desde MySQL.
 * Asigna req.userToken, req.userRow (fila DB), req.userRecord (público).
 */
export function verifyUserToken(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Missing or invalid authorization header' });
	}

	const token = authHeader.slice(7).trim();

	loadUserRecordFromJwt(token)
		.then(({ record }) => {
			const inactive = record.activo === 0 || record.activo === false;
			if (inactive) {
				return res.status(403).json({ error: 'Cuenta deshabilitada' });
			}
			req.userToken = token;
			req.userRow = record;
			req.userRecord = formatPublicUser(record);
			next();
		})
		.catch((err) => {
			logger.warn(`User token verification failed: ${err.message}`);
			return res.status(401).json({ error: 'Invalid or expired token' });
		});
}

export function requireAdmin(req, res, next) {
	if (!req.userRecord) {
		return res.status(401).json({ error: 'Authentication required' });
	}
	if (req.userRecord.rol !== 'admin') {
		return res.status(403).json({ error: 'Admin access required' });
	}
	next();
}
