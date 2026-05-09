import express from 'express';
import { pool } from '../db/pool.js';
import { newId } from '../db/id.js';
import { verifyUserToken, requireAdmin } from '../middleware/auth.js';
import { formatPublicUser } from '../utils/userDto.js';
import logger from '../utils/logger.js';
import { BodyLimit } from '../constants/common.js';
import { resourceFileUpload, resourceUploadErrorHandler } from '../middleware/resourceUpload.js';
import {
	assertHttpImportUrl,
	fetchRemoteFile,
	guessTipoFromFilename,
	internalRutaPlaceholder,
	pesoMbFromBuffer,
} from '../utils/resourceFilePb.js';
import {
	createResourceWithFile,
	updateResourceFile,
	deleteResourceFiles,
} from '../utils/resourceStorage.js';
import { getDownloadCountByResourceIdMap, invalidateDownloadCountsCache } from '../utils/downloadCountsCache.js';
import { ALLOWED_CATEGORY_ICONS } from '../constants/categoryIconWhitelist.js';
import adminLmsRouter from './admin-lms.js';
import { registerAdminCmsRoutes } from './admin-cms.js';

const router = express.Router();
router.use('/lms', adminLmsRouter);

const RESOURCE_SORT_SQL = {
	'-created': 'r.created_at DESC',
	created: 'r.created_at ASC',
	'-updated': 'r.updated_at DESC',
	updated: 'r.updated_at ASC',
	titulo: 'r.titulo ASC',
	'-titulo': 'r.titulo DESC',
};

function normalizeCategoryIconInput(value) {
	if (value === undefined || value === null || value === '') return '';
	const s = String(value).trim();
	if (!s) return '';
	if (!ALLOWED_CATEGORY_ICONS.has(s)) return null;
	return s;
}

function escapeLike(q) {
	return `%${String(q).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
}

router.get('/stats', verifyUserToken, requireAdmin, async (req, res) => {
	const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
	const [[{ totalDownloads }]] = await pool.query('SELECT COUNT(*) AS totalDownloads FROM descargas_historial');
	const resourceCounts = await getDownloadCountByResourceIdMap();
	const topResourcesRaw = Object.entries(resourceCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([resourceId, downloadCount]) => ({ resourceId, downloadCount }));

	const topResources = await Promise.all(
		topResourcesRaw.map(async ({ resourceId, downloadCount }) => {
			const [rec] = await pool.query('SELECT titulo FROM recursos WHERE id = ? LIMIT 1', [resourceId]);
			return {
				resourceId,
				downloadCount,
				titulo: rec[0]?.titulo ?? null,
			};
		}),
	);

	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const [[{ activeUsersCount }]] = await pool.query(
		'SELECT COUNT(*) AS activeUsersCount FROM users WHERE updated_at >= ?',
		[sevenDaysAgo],
	);
	const [[{ totalResources }]] = await pool.query('SELECT COUNT(*) AS totalResources FROM recursos');

	logger.info('Admin stats retrieved');
	res.json({
		totalUsers,
		totalDownloads,
		topResources,
		activeUsersCount,
		totalResources,
	});
});

router.get('/users', verifyUserToken, requireAdmin, async (req, res) => {
	const { page = 1, limit = 10, search = '' } = req.query;
	const pageNum = Math.max(1, parseInt(page, 10));
	const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
	const offset = (pageNum - 1) * limitNum;

	const binds = [];
	let where = '1=1';
	if (search && String(search).trim()) {
		const li = escapeLike(String(search).trim());
		where += ' AND (nombre LIKE ? ESCAPE \'\\\\\' OR email LIKE ? ESCAPE \'\\\\\')';
		binds.push(li, li);
	}

	const [[{ totalItems }]] = await pool.query(`SELECT COUNT(*) AS totalItems FROM users WHERE ${where}`, binds);
	const totalPages = Math.max(1, Math.ceil(totalItems / limitNum));
	const [items] = await pool.query(
		`SELECT * FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		[...binds, limitNum, offset],
	);

	res.json({
		items: items.map((u) => formatPublicUser(u)),
		pagination: {
			page: pageNum,
			perPage: limitNum,
			totalItems,
			totalPages,
		},
	});
});

router.put('/users/:id', verifyUserToken, requireAdmin, async (req, res) => {
	const { id } = req.params;
	const rol = req.body.rol ?? req.body.role;
	const activo = req.body.activo !== undefined ? req.body.activo : req.body.active;

	if (rol === undefined && activo === undefined) {
		return res.status(400).json({ error: 'Indica rol y/o activo' });
	}

	const validRoles = ['usuario', 'admin'];
	if (rol !== undefined && !validRoles.includes(rol)) {
		return res.status(400).json({ error: 'Rol inválido' });
	}

	const fields = [];
	const vals = [];
	if (rol !== undefined) {
		fields.push('rol = ?');
		vals.push(rol);
	}
	if (activo !== undefined) {
		fields.push('activo = ?');
		vals.push(activo ? 1 : 0);
	}
	fields.push('updated_at = CURRENT_TIMESTAMP(3)');

	try {
		await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...vals, id]);
	} catch (err) {
		logger.warn(`Admin user update failed: ${err.message}`);
		return res.status(400).json({ error: err.message || 'No se pudo actualizar el usuario' });
	}

	const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
	logger.info(`Admin updated user ${id}: rol=${rol}, activo=${activo}`);
	res.json({
		success: true,
		message: 'Usuario actualizado',
		user: formatPublicUser(rows[0]),
	});
});

router.delete('/users/:id', verifyUserToken, requireAdmin, async (req, res) => {
	const { id } = req.params;

	if (req.userRecord.id === id) {
		return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
	}

	try {
		const [r] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
		if (r.affectedRows === 0) {
			return res.status(400).json({ error: 'Usuario no encontrado' });
		}
	} catch (err) {
		logger.warn(`Admin user delete failed: ${err.message}`);
		return res.status(400).json({ error: err.message || 'No se pudo eliminar el usuario' });
	}

	logger.info(`Admin deleted user ${id}`);
	res.json({
		success: true,
		message: 'Usuario eliminado',
	});
});

router.get('/meta/categories', verifyUserToken, requireAdmin, async (req, res) => {
	try {
		const [list] = await pool.query('SELECT * FROM categorias ORDER BY nombre');
		res.json({
			items: list.map((c) => ({
				id: c.id,
				nombre: c.nombre,
				descripcion: c.descripcion || '',
				icono: c.icono || '',
				created: c.created_at,
				updated: c.updated_at,
			})),
		});
	} catch (err) {
		logger.warn(`Admin list categories failed: ${err.message}`);
		res.status(500).json({ error: 'No se pudieron cargar las categorías' });
	}
});

router.post('/meta/categories', verifyUserToken, requireAdmin, async (req, res) => {
	const nombre = String(req.body.nombre || '').trim();
	if (!nombre) {
		return res.status(400).json({ error: 'nombre es obligatorio' });
	}
	const descripcion = String(req.body.descripcion ?? '').trim();
	const iconNorm = normalizeCategoryIconInput(req.body.icono);
	if (iconNorm === null) {
		return res.status(400).json({ error: 'icono no reconocido; elige uno de la lista' });
	}
	try {
		const id = newId();
		await pool.query(
			'INSERT INTO categorias (id, nombre, descripcion, icono) VALUES (?, ?, ?, ?)',
			[id, nombre, descripcion, iconNorm || ''],
		);
		const [rows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
		const c = rows[0];
		res.status(201).json({
			item: {
				id: c.id,
				nombre: c.nombre,
				descripcion: c.descripcion || '',
				icono: c.icono || '',
				created: c.created_at,
				updated: c.updated_at,
			},
		});
	} catch (err) {
		logger.warn(`Admin create category failed: ${err.message}`);
		res.status(400).json({ error: err.message || 'No se pudo crear la categoría' });
	}
});

router.put('/meta/categories/:id', verifyUserToken, requireAdmin, async (req, res) => {
	const { id } = req.params;
	const nombre = req.body.nombre !== undefined ? String(req.body.nombre).trim() : undefined;
	const descripcion = req.body.descripcion !== undefined ? String(req.body.descripcion ?? '').trim() : undefined;
	const iconNorm =
		req.body.icono !== undefined ? normalizeCategoryIconInput(req.body.icono) : undefined;
	if (iconNorm === null) {
		return res.status(400).json({ error: 'icono no reconocido; elige uno de la lista' });
	}
	if (nombre !== undefined && !nombre) {
		return res.status(400).json({ error: 'nombre no puede estar vacío' });
	}
	const fields = [];
	const vals = [];
	if (nombre !== undefined) {
		fields.push('nombre = ?');
		vals.push(nombre);
	}
	if (descripcion !== undefined) {
		fields.push('descripcion = ?');
		vals.push(descripcion);
	}
	if (iconNorm !== undefined) {
		fields.push('icono = ?');
		vals.push(iconNorm || '');
	}
	fields.push('updated_at = CURRENT_TIMESTAMP(3)');
	try {
		await pool.query(`UPDATE categorias SET ${fields.join(', ')} WHERE id = ?`, [...vals, id]);
		const [rows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
		const c = rows[0];
		if (!c) {
			return res.status(400).json({ error: 'Categoría no encontrada' });
		}
		res.json({
			item: {
				id: c.id,
				nombre: c.nombre,
				descripcion: c.descripcion || '',
				icono: c.icono || '',
				created: c.created_at,
				updated: c.updated_at,
			},
		});
	} catch (err) {
		logger.warn(`Admin update category failed: ${err.message}`);
		res.status(400).json({ error: err.message || 'No se pudo actualizar la categoría' });
	}
});

router.delete('/meta/categories/:id', verifyUserToken, requireAdmin, async (req, res) => {
	const { id } = req.params;
	try {
		const [[{ n }]] = await pool.query(
			'SELECT COUNT(*) AS n FROM recursos WHERE categoria_id = ? LIMIT 1',
			[id],
		);
		if (Number(n) > 0) {
			return res.status(400).json({
				error: 'No se puede eliminar: hay recursos asignados a esta categoría. Reasígnalos primero.',
			});
		}
		await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
		invalidateDownloadCountsCache();
		res.json({ success: true, message: 'Categoría eliminada' });
	} catch (err) {
		logger.warn(`Admin delete category failed: ${err.message}`);
		res.status(400).json({ error: err.message || 'No se pudo eliminar la categoría' });
	}
});

router.get('/resources', verifyUserToken, requireAdmin, async (req, res) => {
	const { page = 1, limit = 10, search = '', categoria_id: categoriaId, activo, sort: sortParam } = req.query;
	const pageNum = Math.max(1, parseInt(page, 10));
	const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
	const offset = (pageNum - 1) * limitNum;

	const binds = [];
	let where = '1=1';
	if (search && String(search).trim()) {
		const li = escapeLike(String(search).trim());
		where += ' AND (r.titulo LIKE ? ESCAPE \'\\\\\' OR r.descripcion LIKE ? ESCAPE \'\\\\\')';
		binds.push(li, li);
	}
	if (categoriaId && String(categoriaId).trim()) {
		where += ' AND r.categoria_id = ?';
		binds.push(String(categoriaId).trim());
	}
	const activoStr = activo !== undefined && activo !== null ? String(activo).toLowerCase() : '';
	if (activoStr === 'true' || activoStr === '1') {
		where += ' AND (r.activo IS NULL OR r.activo = 1)';
	} else if (activoStr === 'false' || activoStr === '0') {
		where += ' AND r.activo = 0';
	}

	const sortKey = String(sortParam || '');
	const orderSql = RESOURCE_SORT_SQL[sortKey] || 'r.created_at DESC';

	const [[{ totalItems }]] = await pool.query(
		`SELECT COUNT(*) AS totalItems FROM recursos r WHERE ${where}`,
		binds,
	);
	const totalPages = Math.max(1, Math.ceil(totalItems / limitNum));
	const [resources] = await pool.query(
		`SELECT r.*, c.nombre AS categoria_nombre FROM recursos r
		 LEFT JOIN categorias c ON c.id = r.categoria_id
		 WHERE ${where} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
		[...binds, limitNum, offset],
	);
	const downloadCountByResource = await getDownloadCountByResourceIdMap();

	res.json({
		items: resources.map((r) => ({
			id: r.id,
			titulo: r.titulo,
			descripcion: r.descripcion,
			categoria_id: r.categoria_id,
			categoria: r.categoria_nombre,
			referencia_interna: r.referencia_interna ?? '',
			ruta_archivo: r.ruta_archivo,
			tipo_archivo: r.tipo_archivo,
			activo: r.activo === null || r.activo === 1,
			archivo_url: r.archivo_url,
			created: r.created_at,
			updated: r.updated_at,
			downloadCount: downloadCountByResource[r.id] ?? 0,
		})),
		pagination: {
			page: pageNum,
			perPage: limitNum,
			totalItems,
			totalPages,
		},
	});
});

router.post(
	'/resources/upload',
	verifyUserToken,
	requireAdmin,
	resourceFileUpload.single('file'),
	resourceUploadErrorHandler,
	async (req, res) => {
		if (!req.file?.buffer) {
			return res.status(400).json({ error: 'Selecciona un archivo' });
		}

		const titulo = String(req.body.titulo || '').trim();
		const categoria_id = String(req.body.categoria_id || '').trim();
		const descripcion = String(req.body.descripcion ?? '').trim();
		let tipo_archivo = String(req.body.tipo_archivo || '').trim();
		const activo = req.body.activo !== 'false' && req.body.activo !== false;
		const referencia_interna = String(req.body.referencia_interna ?? '').trim().slice(0, 2000);

		if (!titulo || !categoria_id) {
			return res.status(400).json({ error: 'titulo y categoria_id son obligatorios' });
		}

		const filename = req.file.originalname || 'archivo';
		if (!tipo_archivo) tipo_archivo = guessTipoFromFilename(filename);

		try {
			const created = await createResourceWithFile({
				titulo,
				descripcion,
				categoria_id,
				buffer: req.file.buffer,
				filename,
				tipo_archivo,
				activo,
				referencia_interna,
			});
			logger.info(`Admin uploaded resource file: ${created.id}`);
			return res.status(201).json({
				success: true,
				message: 'Recurso creado con archivo',
				resource: {
					id: created.id,
					titulo: created.titulo,
					descripcion: created.descripcion,
					categoria_id: created.categoria_id,
					ruta_archivo: created.ruta_archivo,
					tipo_archivo: created.tipo_archivo,
				},
			});
		} catch (err) {
			logger.warn(`Admin resource upload failed: ${err.message}`);
			return res.status(400).json({ error: err.message || 'No se pudo subir el recurso' });
		}
	},
);

router.post('/resources/import-url', verifyUserToken, requireAdmin, async (req, res) => {
	const titulo = String(req.body.titulo || '').trim();
	const categoria_id = String(req.body.categoria_id || '').trim();
	const descripcion = String(req.body.descripcion ?? '').trim();
	const sourceUrl = String(req.body.sourceUrl || req.body.url || '').trim();
	let tipo_archivo = String(req.body.tipo_archivo || '').trim();
	const activo = req.body.activo !== false && req.body.activo !== 'false';
	const referencia_interna = String(req.body.referencia_interna ?? '').trim().slice(0, 2000);

	if (!titulo || !categoria_id || !sourceUrl) {
		return res.status(400).json({ error: 'titulo, categoria_id y sourceUrl son obligatorios' });
	}

	try {
		assertHttpImportUrl(sourceUrl);
	} catch (e) {
		return res.status(400).json({ error: e.message });
	}

	try {
		const { buffer, filename } = await fetchRemoteFile(sourceUrl, BodyLimit);
		if (!tipo_archivo) tipo_archivo = guessTipoFromFilename(filename);

		const created = await createResourceWithFile({
			titulo,
			descripcion,
			categoria_id,
			buffer,
			filename,
			tipo_archivo,
			activo,
			referencia_interna,
		});
		logger.info(`Admin imported resource from url: ${created.id}`);
		return res.status(201).json({
			success: true,
			message: 'Recurso importado correctamente',
			resource: {
				id: created.id,
				titulo: created.titulo,
				descripcion: created.descripcion,
				categoria_id: created.categoria_id,
				ruta_archivo: created.ruta_archivo,
				tipo_archivo: created.tipo_archivo,
			},
		});
	} catch (err) {
		logger.warn(`Admin resource import failed: ${err.message}`);
		return res.status(400).json({ error: err.message || 'No se pudo importar el enlace' });
	}
});

router.put(
	'/resources/:id/file',
	verifyUserToken,
	requireAdmin,
	resourceFileUpload.single('file'),
	resourceUploadErrorHandler,
	async (req, res) => {
		const { id } = req.params;
		if (!req.file?.buffer) {
			return res.status(400).json({ error: 'Selecciona un archivo' });
		}

		const filename = req.file.originalname || 'archivo';
		let tipo_archivo = String(req.body.tipo_archivo || '').trim();
		if (!tipo_archivo) tipo_archivo = guessTipoFromFilename(filename);

		try {
			const updated = await updateResourceFile(id, req.file.buffer, filename, tipo_archivo);
			logger.info(`Admin replaced resource file: ${id}`);
			return res.json({
				success: true,
				message: 'Archivo actualizado',
				resource: {
					id: updated.id,
					titulo: updated.titulo,
					ruta_archivo: updated.ruta_archivo,
					tipo_archivo: updated.tipo_archivo,
					archivo_url: updated.archivo_url,
				},
			});
		} catch (err) {
			logger.warn(`Admin resource file replace failed: ${err.message}`);
			return res.status(400).json({ error: err.message || 'No se pudo actualizar el archivo' });
		}
	},
);

router.put('/resources/:id/import-url', verifyUserToken, requireAdmin, async (req, res) => {
	const { id } = req.params;
	const sourceUrl = String(req.body.sourceUrl || req.body.url || '').trim();
	let tipo_archivo = String(req.body.tipo_archivo || '').trim();

	if (!sourceUrl) {
		return res.status(400).json({ error: 'sourceUrl es obligatorio' });
	}

	try {
		assertHttpImportUrl(sourceUrl);
	} catch (e) {
		return res.status(400).json({ error: e.message });
	}

	try {
		const { buffer, filename } = await fetchRemoteFile(sourceUrl, BodyLimit);
		if (!tipo_archivo) tipo_archivo = guessTipoFromFilename(filename);

		const updated = await updateResourceFile(id, buffer, filename, tipo_archivo);
		logger.info(`Admin imported file onto resource: ${id}`);
		return res.json({
			success: true,
			message: 'Archivo importado correctamente',
			resource: {
				id: updated.id,
				titulo: updated.titulo,
				ruta_archivo: updated.ruta_archivo,
				tipo_archivo: updated.tipo_archivo,
				archivo_url: updated.archivo_url,
			},
		});
	} catch (err) {
		logger.warn(`Admin resource import onto record failed: ${err.message}`);
		return res.status(400).json({ error: err.message || 'No se pudo importar el archivo' });
	}
});

router.post('/resources', verifyUserToken, requireAdmin, async (req, res) => {
	const titulo = req.body.titulo ?? req.body.name;
	const descripcion = req.body.descripcion ?? req.body.description ?? '';
	const categoria_id = req.body.categoria_id ?? req.body.category;
	const ruta_archivo = req.body.ruta_archivo ?? req.body.file_url;
	const tipo_archivo = req.body.tipo_archivo || 'PDF';

	if (!titulo || !categoria_id || !ruta_archivo) {
		return res.status(400).json({ error: 'titulo, categoria_id y ruta_archivo son obligatorios' });
	}

	const activoCreate = req.body.activo !== undefined ? Boolean(req.body.activo) : true;
	const referencia_interna = String(req.body.referencia_interna ?? '').trim().slice(0, 2000);

	const id = newId();
	try {
		await pool.query(
			`INSERT INTO recursos (id, titulo, descripcion, categoria_id, ruta_archivo, tipo_archivo, activo, referencia_interna)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				id,
				titulo,
				descripcion,
				categoria_id,
				ruta_archivo,
				tipo_archivo,
				activoCreate ? 1 : 0,
				referencia_interna || null,
			],
		);
	} catch (err) {
		logger.warn(`Admin resource create failed: ${err.message}`);
		return res.status(400).json({ error: err.message || 'No se pudo crear el recurso' });
	}

	const [rows] = await pool.query('SELECT * FROM recursos WHERE id = ?', [id]);
	const resource = rows[0];
	logger.info(`Admin created resource: ${resource.id}`);
	res.status(201).json({
		success: true,
		message: 'Recurso creado',
		resource: {
			id: resource.id,
			titulo: resource.titulo,
			descripcion: resource.descripcion,
			categoria_id: resource.categoria_id,
			ruta_archivo: resource.ruta_archivo,
			tipo_archivo: resource.tipo_archivo,
		},
	});
});

router.put('/resources/:id', verifyUserToken, requireAdmin, async (req, res) => {
	const { id } = req.params;
	const titulo = req.body.titulo ?? req.body.name;
	const descripcion = req.body.descripcion;
	const categoria_id = req.body.categoria_id ?? req.body.category;
	const ruta_archivo = req.body.ruta_archivo ?? req.body.file_url;
	const tipo_archivo = req.body.tipo_archivo;
	const activo = req.body.activo;

	if (
		titulo === undefined
		&& descripcion === undefined
		&& categoria_id === undefined
		&& ruta_archivo === undefined
		&& tipo_archivo === undefined
		&& activo === undefined
		&& req.body.referencia_interna === undefined
	) {
		return res.status(400).json({ error: 'Indica al menos un campo' });
	}

	const fields = [];
	const vals = [];
	if (titulo !== undefined) {
		fields.push('titulo = ?');
		vals.push(titulo);
	}
	if (descripcion !== undefined) {
		fields.push('descripcion = ?');
		vals.push(descripcion);
	}
	if (categoria_id !== undefined) {
		fields.push('categoria_id = ?');
		vals.push(categoria_id);
	}
	if (ruta_archivo !== undefined) {
		fields.push('ruta_archivo = ?');
		vals.push(ruta_archivo);
	}
	if (tipo_archivo !== undefined) {
		fields.push('tipo_archivo = ?');
		vals.push(tipo_archivo);
	}
	if (activo !== undefined) {
		fields.push('activo = ?');
		vals.push(activo ? 1 : 0);
	}
	if (req.body.referencia_interna !== undefined) {
		fields.push('referencia_interna = ?');
		vals.push(String(req.body.referencia_interna ?? '').trim().slice(0, 2000));
	}
	fields.push('updated_at = CURRENT_TIMESTAMP(3)');

	try {
		await pool.query(`UPDATE recursos SET ${fields.join(', ')} WHERE id = ?`, [...vals, id]);
	} catch (err) {
		logger.warn(`Admin resource update failed: ${err.message}`);
		return res.status(400).json({ error: err.message || 'No se pudo actualizar el recurso' });
	}

	const [rows] = await pool.query('SELECT * FROM recursos WHERE id = ?', [id]);
	const updatedResource = rows[0];
	logger.info(`Admin updated resource: ${id}`);
	res.json({
		success: true,
		message: 'Recurso actualizado',
		resource: {
			id: updatedResource.id,
			titulo: updatedResource.titulo,
			descripcion: updatedResource.descripcion,
			categoria_id: updatedResource.categoria_id,
			referencia_interna: updatedResource.referencia_interna ?? '',
			ruta_archivo: updatedResource.ruta_archivo,
			tipo_archivo: updatedResource.tipo_archivo,
			activo: updatedResource.activo === null || updatedResource.activo === 1,
		},
	});
});

router.delete('/resources/:id', verifyUserToken, requireAdmin, async (req, res) => {
	const { id } = req.params;

	try {
		await pool.query('DELETE FROM recursos WHERE id = ?', [id]);
	} catch (err) {
		logger.warn(`Admin resource delete failed: ${err.message}`);
		return res.status(400).json({ error: err.message || 'No se pudo eliminar el recurso' });
	}

	await deleteResourceFiles(id).catch(() => {});
	invalidateDownloadCountsCache();
	logger.info(`Admin deleted resource: ${id}`);
	res.json({
		success: true,
		message: 'Recurso eliminado',
	});
});

registerAdminCmsRoutes(router);

export default router;
