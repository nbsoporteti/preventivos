import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../db/pool.js';
import { newId } from '../db/id.js';
import { internalRutaPlaceholder, guessTipoFromFilename, pesoMbFromBuffer } from './resourceFilePb.js';

export function uploadsRoot() {
	return path.resolve(process.env.UPLOAD_DIR || './data/uploads');
}

function safeFilename(name) {
	const base = path.basename(name || 'archivo').replace(/[^\w.\-\sáéíóúñü]+/gi, '_').slice(0, 120);
	return base || 'archivo.bin';
}

export async function saveFileForResource(resourceId, buffer, originalName) {
	const dir = path.join(uploadsRoot(), resourceId);
	await fs.mkdir(dir, { recursive: true });
	const fname = safeFilename(originalName);
	const full = path.join(dir, fname);
	await fs.writeFile(full, buffer);
	const rel = `${resourceId}/${fname}`;
	return { relativePath: rel, storedName: fname };
}

export async function deleteResourceFiles(resourceId) {
	const dir = path.join(uploadsRoot(), resourceId);
	await fs.rm(dir, { recursive: true, force: true });
}

/**
 * Crea recurso con archivo en disco.
 */
export async function createResourceWithFile({
	titulo,
	descripcion,
	categoria_id,
	buffer,
	filename,
	tipo_archivo,
	activo,
	referencia_interna,
}) {
	const id = newId();
	const { relativePath, storedName } = await saveFileForResource(id, buffer, filename);
	const tipo = tipo_archivo || guessTipoFromFilename(filename);
	const peso = pesoMbFromBuffer(buffer);
	await pool.query(
		`INSERT INTO recursos (id, titulo, descripcion, categoria_id, tipo_archivo, peso_archivo, activo, ruta_archivo, archivo_url, archivo_path, referencia_interna)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			titulo,
			descripcion || '',
			categoria_id,
			tipo,
			peso,
			activo ? 1 : 0,
			internalRutaPlaceholder(filename),
			storedName,
			relativePath,
			referencia_interna || null,
		],
	);
	const [rows] = await pool.query('SELECT * FROM recursos WHERE id = ?', [id]);
	return rows[0];
}

export async function updateResourceFile(resourceId, buffer, filename, tipo_archivo) {
	const { relativePath, storedName } = await saveFileForResource(resourceId, buffer, filename);
	const tipo = tipo_archivo || guessTipoFromFilename(filename);
	const peso = pesoMbFromBuffer(buffer);
	await pool.query(
		`UPDATE recursos SET ruta_archivo = ?, archivo_url = ?, archivo_path = ?, tipo_archivo = ?, peso_archivo = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
		[internalRutaPlaceholder(filename), storedName, relativePath, tipo, peso, resourceId],
	);
	const [rows] = await pool.query('SELECT * FROM recursos WHERE id = ?', [resourceId]);
	return rows[0];
}

