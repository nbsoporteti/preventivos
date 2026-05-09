import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { pool } from '../db/pool.js';
import { verifyUserToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { countDownloadsToday, getDailyDownloadLimit } from '../utils/downloadQuota.js';
import { invalidateDownloadCountsCache } from '../utils/downloadCountsCache.js';
import { uploadsRoot } from '../utils/resourceStorage.js';
import { newId } from '../db/id.js';

const router = express.Router();

function resolveFilename(stored) {
	if (stored == null) return null;
	if (Array.isArray(stored)) return stored[0] || null;
	return typeof stored === 'string' ? stored : null;
}

router.get('/:resourceId', verifyUserToken, async (req, res) => {
	const { resourceId } = req.params;
	const userId = req.userRecord.id;
	const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

	const [rows] = await pool.query('SELECT * FROM recursos WHERE id = ? LIMIT 1', [resourceId]);
	const recurso = rows[0];
	if (!recurso) {
		return res.status(404).json({ error: 'Recurso no encontrado' });
	}

	if (recurso.activo === 0 || recurso.activo === false) {
		return res.status(404).json({ error: 'Recurso no encontrado' });
	}

	const dailyLimit = await getDailyDownloadLimit(req.userRecord);
	if (Number.isFinite(dailyLimit)) {
		const used = await countDownloadsToday(userId);
		if (used >= dailyLimit) {
			return res.status(429).json({
				error: `Has alcanzado el límite diario de descargas (${dailyLimit}). Prueba mañana o contacta al administrador.`,
				limite: dailyLimit,
				usado: used,
			});
		}
	}

	let buf;
	let contentType = 'application/octet-stream';

	try {
		if (recurso.archivo_path) {
			const full = path.join(uploadsRoot(), recurso.archivo_path);
			buf = await fs.readFile(full);
			const fn = resolveFilename(recurso.archivo_url) || '';
			if (fn.toLowerCase().endsWith('.pdf')) contentType = 'application/pdf';
		} else if (recurso.ruta_archivo && String(recurso.ruta_archivo).startsWith('http')) {
			const upstream = await fetch(recurso.ruta_archivo, { redirect: 'follow' });
			if (!upstream.ok) {
				logger.warn(`Download upstream ${upstream.status} for resource ${resourceId}`);
				return res.status(502).json({ error: 'No se pudo obtener el archivo' });
			}
			contentType = upstream.headers.get('content-type') || contentType;
			buf = Buffer.from(await upstream.arrayBuffer());
		} else {
			return res.status(404).json({ error: 'El recurso no tiene archivo asociado' });
		}
	} catch (err) {
		logger.error(`Download read failed: ${err.message}`);
		return res.status(502).json({ error: 'No se pudo obtener el archivo' });
	}

	try {
		const dlId = newId();
		await pool.query(
			'INSERT INTO descargas_historial (id, usuario_id, recurso_id, ip_usuario) VALUES (?, ?, ?, ?)',
			[dlId, userId, resourceId, ipAddress],
		);
		invalidateDownloadCountsCache();
	} catch (err) {
		logger.warn(`descargas_historial create failed (download still streamed): ${err.message}`);
	}

	const fileToken = resolveFilename(recurso.archivo_url);
	const safeName = (recurso.titulo || 'recurso').replace(/[^\w\s\-áéíóúÅÄÖÑñü.]+/gi, '_').slice(0, 120);
	const extGuess = fileToken && fileToken.includes('.') ? '' : recurso.tipo_archivo === 'PDF' ? '.pdf' : '';

	res.setHeader('Content-Type', contentType);
	res.setHeader('Content-Disposition', `attachment; filename="${safeName}${extGuess}"`);
	res.send(buf);
});

export default router;
