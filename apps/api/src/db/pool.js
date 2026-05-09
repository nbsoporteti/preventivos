import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

function mysqlConfigFromEnv() {
	const rawUrl = (process.env.DATABASE_URL || '').trim();
	if (rawUrl) {
		try {
			const u = new URL(rawUrl);
			if (!/^mysql2?:$/i.test(u.protocol)) {
				throw new Error('DATABASE_URL debe ser mysql://');
			}
			const db = u.pathname.replace(/^\//, '').split('/')[0];
			return {
				host: u.hostname,
				port: u.port ? Number(u.port) : 3306,
				user: decodeURIComponent(u.username),
				password: decodeURIComponent(u.password || ''),
				database: db,
			};
		} catch (e) {
			logger.error('DATABASE_URL inválida:', e.message);
			throw e;
		}
	}
	const host = process.env.MYSQL_HOST || '127.0.0.1';
	const port = Number(process.env.MYSQL_PORT || 3306);
	const user = process.env.MYSQL_USER;
	const password = process.env.MYSQL_PASSWORD ?? '';
	const database = process.env.MYSQL_DATABASE;
	if (!user || !database) {
		throw new Error('Define DATABASE_URL o MYSQL_USER + MYSQL_DATABASE');
	}
	return { host, port, user, password, database };
}

const cfg = mysqlConfigFromEnv();

export const pool = mysql.createPool({
	...cfg,
	waitForConnections: true,
	connectionLimit: Number(process.env.MYSQL_POOL_LIMIT || 10),
	enableKeepAlive: true,
});

export async function dbReady() {
	const c = await pool.getConnection();
	try {
		await c.query('SELECT 1');
	} finally {
		c.release();
	}
}
