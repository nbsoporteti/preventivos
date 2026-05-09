import { pool } from '../db/pool.js';

const ROL_TO_ROLE_NAME = { admin: 'Admin', usuario: 'Usuario' };

export async function getDailyDownloadLimit(userRecord) {
	const pbRol = userRecord.rol || userRecord.role;
	if (pbRol === 'admin') return Number.POSITIVE_INFINITY;
	const roleName = ROL_TO_ROLE_NAME[pbRol] || 'Usuario';
	try {
		const [rows] = await pool.query(
			'SELECT limite_descargas_diarias FROM roles WHERE nombre = ? LIMIT 1',
			[roleName],
		);
		const n = rows[0] ? Number(rows[0].limite_descargas_diarias) : 10;
		return Number.isFinite(n) && n >= 0 ? n : 10;
	} catch {
		return 10;
	}
}

function utcDayBounds(now = new Date()) {
	const start = new Date(now);
	start.setUTCHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setUTCDate(end.getUTCDate() + 1);
	return { start, end };
}

export async function countDownloadsToday(userId) {
	const { start, end } = utcDayBounds();
	const [[{ cnt }]] = await pool.query(
		`SELECT COUNT(*) AS cnt FROM descargas_historial
		 WHERE usuario_id = ? AND fecha_descarga >= ? AND fecha_descarga < ?`,
		[userId, start, end],
	);
	return Number(cnt) || 0;
}
