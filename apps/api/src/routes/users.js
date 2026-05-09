import express from 'express';
import { pool } from '../db/pool.js';
import { verifyUserToken } from '../middleware/auth.js';
import { formatPublicUser } from '../utils/userDto.js';
import logger from '../utils/logger.js';
import { invalidateDownloadCountsCache } from '../utils/downloadCountsCache.js';
import { newId } from '../db/id.js';

const router = express.Router();

async function buildUserStatsPayload(userId) {
	const [downloads] = await pool.query(
		`SELECT d.*, r.titulo AS recurso_titulo, r.categoria_id
		 FROM descargas_historial d
		 LEFT JOIN recursos r ON r.id = d.recurso_id
		 WHERE d.usuario_id = ? ORDER BY d.fecha_descarga DESC`,
		[userId],
	);

	const [categorias] = await pool.query('SELECT id, nombre FROM categorias');
	const catNameById = Object.fromEntries(categorias.map((c) => [c.id, c.nombre]));

	const totalDownloads = downloads.length;
	const catCounts = {};
	let lastDownloadAt = null;
	let lastResourceTitle = null;

	for (const row of downloads) {
		const cid = row.categoria_id;
		const label = cid ? catNameById[cid] || 'Sin categoría' : 'Sin categoría';
		catCounts[label] = (catCounts[label] || 0) + 1;

		const ts = row.fecha_descarga || row.created_at;
		if (ts) {
			const t = new Date(ts);
			const prev = lastDownloadAt ? new Date(lastDownloadAt) : null;
			if (!prev || t > prev) {
				lastDownloadAt = ts instanceof Date ? ts.toISOString() : String(ts);
				lastResourceTitle = row.recurso_titulo || null;
			}
		}
	}

	let favoriteCategory = null;
	let favoriteCategoryPct = null;
	const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
	if (sorted.length > 0 && totalDownloads > 0) {
		favoriteCategory = sorted[0][0];
		favoriteCategoryPct = Math.round((sorted[0][1] / totalDownloads) * 100);
	}

	return {
		totalDownloads,
		favoriteCategory,
		favoriteCategoryPct,
		lastDownloadAt,
		lastResourceTitle,
	};
}

router.get('/me/stats', verifyUserToken, async (req, res) => {
	try {
		const payload = await buildUserStatsPayload(req.userRecord.id);
		res.json(payload);
	} catch (err) {
		logger.warn(`user stats failed: ${err.message}`);
		return res.status(500).json({ error: 'No se pudieron cargar las estadísticas' });
	}
});

router.get('/:id/downloads', verifyUserToken, async (req, res) => {
	const { id } = req.params;
	const { page = 1, limit = 50 } = req.query;

	if (req.userRecord.id !== id) {
		return res.status(403).json({ error: 'Solo puedes ver tu propio historial' });
	}

	const pageNum = Math.max(1, parseInt(page, 10));
	const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
	const offset = (pageNum - 1) * limitNum;

	try {
		const [[{ totalItems }]] = await pool.query(
			'SELECT COUNT(*) AS totalItems FROM descargas_historial WHERE usuario_id = ?',
			[id],
		);
		const totalPages = Math.max(1, Math.ceil(totalItems / limitNum));
		const [items] = await pool.query(
			`SELECT d.id, d.fecha_descarga, d.created_at, d.recurso_id, r.titulo, r.tipo_archivo
			 FROM descargas_historial d
			 LEFT JOIN recursos r ON r.id = d.recurso_id
			 WHERE d.usuario_id = ? ORDER BY d.fecha_descarga DESC LIMIT ? OFFSET ?`,
			[id, limitNum, offset],
		);

		res.json({
			items: items.map((row) => ({
				id: row.id,
				fecha_descarga: row.fecha_descarga,
				created: row.fecha_descarga || row.created_at,
				recurso_id: row.recurso_id,
				recurso: row.titulo
					? {
							id: row.recurso_id,
							titulo: row.titulo,
							tipo_archivo: row.tipo_archivo,
						}
					: null,
			})),
			pagination: {
				page: pageNum,
				perPage: limitNum,
				totalItems,
				totalPages,
			},
		});
	} catch (err) {
		logger.warn(`download history list failed: ${err.message}`);
		return res.status(500).json({ error: 'No se pudo cargar el historial' });
	}
});

router.get('/:id/stats', verifyUserToken, async (req, res) => {
	const { id } = req.params;

	if (req.userRecord.id !== id) {
		return res.status(403).json({ error: 'Solo puedes ver tus propias estadísticas' });
	}

	try {
		const payload = await buildUserStatsPayload(id);
		res.json(payload);
	} catch (err) {
		logger.warn(`user stats failed: ${err.message}`);
		return res.status(500).json({ error: 'No se pudieron cargar las estadísticas' });
	}
});

router.post('/downloads', verifyUserToken, async (req, res) => {
	const { resourceId } = req.body;

	if (!resourceId) {
		return res.status(400).json({ error: 'resourceId es obligatorio' });
	}

	const userId = req.userRecord.id;
	const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

	const [recRows] = await pool.query('SELECT id, activo FROM recursos WHERE id = ? LIMIT 1', [resourceId]);
	const resource = recRows[0];
	if (!resource || resource.activo === 0) {
		return res.status(404).json({ error: 'Recurso no encontrado' });
	}

	const dlId = newId();
	await pool.query(
		'INSERT INTO descargas_historial (id, usuario_id, recurso_id, ip_usuario) VALUES (?, ?, ?, ?)',
		[dlId, userId, resourceId, ipAddress],
	);

	invalidateDownloadCountsCache();
	logger.info(`Download registered: user=${userId}, resource=${resourceId}`);
	res.status(201).json({
		success: true,
		message: 'Descarga registrada',
		downloadId: dlId,
	});
});

router.get('/:id', verifyUserToken, async (req, res) => {
	const { id } = req.params;

	if (req.userRecord.id !== id) {
		return res.status(403).json({ error: 'Solo puedes ver tu propio perfil' });
	}

	const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
	const user = rows[0];
	if (!user) {
		return res.status(404).json({ error: 'Usuario no encontrado' });
	}

	res.json(formatPublicUser(user));
});

router.put('/:id', verifyUserToken, async (req, res) => {
	const { id } = req.params;
	const nombre = (req.body.nombre ?? req.body.name ?? '').trim();
	const { email } = req.body;

	if (req.userRecord.id !== id) {
		return res.status(403).json({ error: 'Solo puedes actualizar tu propio perfil' });
	}

	if (!nombre && !email) {
		return res.status(400).json({ error: 'Indica al menos nombre o correo' });
	}

	if (email) {
		const normalized = email.toLowerCase().trim();
		const [ex] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1', [normalized, id]);
		if (ex.length) {
			return res.status(400).json({ error: 'El correo ya está en uso' });
		}
	}

	const fields = [];
	const vals = [];
	if (nombre) {
		fields.push('nombre = ?');
		vals.push(nombre);
	}
	if (email) {
		fields.push('email = ?');
		vals.push(email.toLowerCase().trim());
	}
	fields.push('updated_at = CURRENT_TIMESTAMP(3)');
	await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...vals, id]);

	const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
	logger.info(`User profile updated: ${id}`);
	res.json({
		success: true,
		message: 'Perfil actualizado',
		user: formatPublicUser(rows[0]),
	});
});

export default router;
