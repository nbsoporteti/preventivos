/**
 * Agrega descargas por recurso_id con caché en memoria.
 */

import { pool } from '../db/pool.js';

const DEFAULT_TTL_MS = 120_000;

function ttlMs() {
	const n = Number(process.env.DOWNLOAD_COUNTS_CACHE_TTL_MS);
	return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TTL_MS;
}

/** @type {{ map: Record<string, number> | null, expiresAt: number }} */
let cache = { map: null, expiresAt: 0 };

/** @type {Promise<Record<string, number>> | null} */
let inflight = null;

export function invalidateDownloadCountsCache() {
	cache.map = null;
	cache.expiresAt = 0;
}

/**
 * @returns {Promise<Record<string, number>>}
 */
export async function getDownloadCountByResourceIdMap() {
	const now = Date.now();
	if (cache.map && now < cache.expiresAt) {
		return cache.map;
	}
	if (inflight) {
		return inflight;
	}

	inflight = (async () => {
		try {
			const [rows] = await pool.query(
				'SELECT recurso_id, COUNT(*) AS c FROM descargas_historial GROUP BY recurso_id',
			);
			const map = {};
			for (const d of rows) {
				if (d.recurso_id) map[d.recurso_id] = Number(d.c);
			}
			cache.map = map;
			cache.expiresAt = Date.now() + ttlMs();
			return map;
		} finally {
			inflight = null;
		}
	})();

	return inflight;
}
