/* global process, console, URL */
/**
 * Carga roles demo y un usuario admin (opcional) en MySQL.
 * Requiere: DATABASE_URL o MYSQL_* y esquema ya aplicado (sql/schema.sql).
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

function getConfig() {
	const rawUrl = (process.env.DATABASE_URL || '').trim();
	if (rawUrl) {
		const u = new URL(rawUrl);
		const db = u.pathname.replace(/^\//, '').split('/')[0];
		return {
			host: u.hostname,
			port: u.port ? Number(u.port) : 3306,
			user: decodeURIComponent(u.username),
			password: decodeURIComponent(u.password || ''),
			database: db,
		};
	}
	return {
		host: process.env.MYSQL_HOST || '127.0.0.1',
		port: Number(process.env.MYSQL_PORT || 3306),
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASSWORD ?? '',
		database: process.env.MYSQL_DATABASE,
	};
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
function newId() {
	let s = '';
	for (let i = 0; i < 15; i++) {
		s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
	}
	return s;
}

const conn = await mysql.createConnection(getConfig());

for (const [nombre, lim] of [
	['Admin', 9999],
	['Usuario', 10],
]) {
	const [r] = await conn.query('SELECT id FROM roles WHERE nombre = ? LIMIT 1', [nombre]);
	if (!r.length) {
		await conn.query('INSERT INTO roles (id, nombre, limite_descargas_diarias) VALUES (?, ?, ?)', [
			newId(),
			nombre,
			lim,
		]);
		console.log('Rol creado:', nombre);
	}
}

const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@preventivos.cl').toLowerCase().trim();
const adminPass = process.env.SEED_ADMIN_PASSWORD || 'Admin1234!';
const adminNombre = process.env.SEED_ADMIN_NOMBRE || 'Admin';

const [existing] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail]);
if (existing.length) {
	console.log('Usuario admin ya existe:', adminEmail);
} else {
	const id = newId();
	const hash = await bcrypt.hash(adminPass, 10);
	await conn.query(
		`INSERT INTO users (id, email, password_hash, nombre, rol, email_verificado, activo)
		 VALUES (?, ?, ?, ?, 'admin', 1, 1)`,
		[id, adminEmail, hash, adminNombre],
	);
	console.log('Admin creado:', adminEmail);
	console.log('Contraseña inicial (cámbiala en producción):', adminPass);
}

await conn.end();
