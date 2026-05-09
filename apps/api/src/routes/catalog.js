import express from 'express';
import { pool } from '../db/pool.js';
import { getDownloadCountByResourceIdMap } from '../utils/downloadCountsCache.js';
import { fetchPublicCmsPage } from './admin-cms.js';

const router = express.Router();

function isPocketBaseId(value) {
	return typeof value === 'string' && /^[a-z0-9]{15}$/.test(value);
}

function toIso(v) {
	if (!v) return null;
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const SEARCH_MAX = 50;
const QUERY_MIN = 2;
const QUERY_MAX = 120;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;

const SORT_SQL = {
	'-created': 'r.created_at DESC',
	created: 'r.created_at ASC',
	'-updated': 'r.updated_at DESC',
	updated: 'r.updated_at ASC',
	titulo: 'r.titulo ASC',
	'-titulo': 'r.titulo DESC',
};

function likeParam(raw) {
	return `%${String(raw).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
}

function isActiveRecursoRow(r) {
	return r.activo === null || r.activo === undefined || r.activo === 1 || r.activo === true;
}

function mapPublicRecurso(r, downloadCount = null) {
	const base = {
		id: r.id,
		titulo: r.titulo,
		descripcion: r.descripcion || '',
		tipo_archivo: r.tipo_archivo || 'PDF',
		peso_archivo: r.peso_archivo ?? null,
		created: toIso(r.created_at),
		updated: toIso(r.updated_at),
		categoria_id: r.categoria_id,
		categoria_nombre: r.categoria_nombre || '—',
	};
	if (downloadCount != null) base.download_count = downloadCount;
	return base;
}

function activeFilter(alias = 'r') {
	return `(${alias}.activo IS NULL OR ${alias}.activo = 1)`;
}

router.get('/search', async (req, res) => {
	const raw = String(req.query.q ?? '').trim();
	if (raw.length < QUERY_MIN) {
		return res.json({
			query: raw,
			recursos: [],
			pagination: { page: 1, perPage: SEARCH_MAX, totalItems: 0, totalPages: 0 },
		});
	}
	if (raw.length > QUERY_MAX) {
		return res.status(400).json({ error: 'La búsqueda es demasiado larga' });
	}

	const pageNum = Math.max(1, parseInt(req.query.page ?? DEFAULT_PAGE, 10));
	const perPage = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit ?? SEARCH_MAX, 10)));
	const li = likeParam(raw);
	const binds = [li, li];
	let where = `${activeFilter('r')} AND (r.titulo LIKE ? ESCAPE '\\\\' OR r.descripcion LIKE ? ESCAPE '\\\\')`;
	const tipo = String(req.query.tipo ?? '').trim().toUpperCase();
	if (tipo && ['PDF', 'DOCX', 'XLSX', 'PPT'].includes(tipo)) {
		where += ' AND r.tipo_archivo = ?';
		binds.push(tipo);
	}
	const categoriaId = String(req.query.categoria_id ?? '').trim();
	if (categoriaId && isPocketBaseId(categoriaId)) {
		where += ' AND r.categoria_id = ?';
		binds.push(categoriaId);
	}

	try {
		const [[{ totalItems }]] = await pool.query(
			`SELECT COUNT(*) AS totalItems FROM recursos r WHERE ${where}`,
			binds,
		);
		const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
		const offset = (pageNum - 1) * perPage;
		const [items] = await pool.query(
			`SELECT r.*, c.nombre AS categoria_nombre FROM recursos r
			 LEFT JOIN categorias c ON c.id = r.categoria_id
			 WHERE ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
			[...binds, perPage, offset],
		);
		const countMap = await getDownloadCountByResourceIdMap();
		const recursos = items.filter(isActiveRecursoRow).map((r) => mapPublicRecurso(r, countMap[r.id] ?? 0));
		return res.json({
			query: raw,
			recursos,
			pagination: {
				page: pageNum,
				perPage,
				totalItems,
				totalPages,
			},
		});
	} catch (err) {
		console.error('catalog search', err);
		return res.status(500).json({ error: 'No se pudo completar la búsqueda' });
	}
});

router.get('/highlights', async (req, res) => {
	const limit = Math.min(12, Math.max(1, parseInt(req.query.limit ?? '10', 10)));

	try {
		const [countMap, recentQuery] = await Promise.all([
			getDownloadCountByResourceIdMap(),
			pool.query(
				`SELECT r.*, c.nombre AS categoria_nombre FROM recursos r
				 LEFT JOIN categorias c ON c.id = r.categoria_id
				 WHERE ${activeFilter('r')} ORDER BY r.updated_at DESC LIMIT ?`,
				[limit],
			),
		]);
		const recentList = recentQuery[0];
		const sortedIds = Object.entries(countMap)
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit)
			.map(([id]) => id);

		const popularRows = [];
		for (const id of sortedIds) {
			const [pr] = await pool.query(
				`SELECT r.*, c.nombre AS categoria_nombre FROM recursos r
				 LEFT JOIN categorias c ON c.id = r.categoria_id WHERE r.id = ? AND ${activeFilter('r')} LIMIT 1`,
				[id],
			);
			if (pr[0]) popularRows.push(pr[0]);
		}

		const popular = popularRows.filter(isActiveRecursoRow).map((r) => mapPublicRecurso(r, countMap[r.id] ?? 0));
		const recent = recentList.filter(isActiveRecursoRow).map((r) => mapPublicRecurso(r, countMap[r.id] ?? 0));

		return res.json({ popular, recent });
	} catch (err) {
		console.error('catalog highlights', err);
		return res.status(500).json({ error: 'No se pudieron cargar los destacados' });
	}
});

router.get('/recursos', async (req, res) => {
	const pageNum = Math.max(1, parseInt(req.query.page ?? DEFAULT_PAGE, 10));
	const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit ?? DEFAULT_LIMIT, 10)));
	const sortKey = String(req.query.sort ?? '-updated');
	const orderSql = SORT_SQL[sortKey] || 'r.updated_at DESC';

	const binds = [];
	let where = activeFilter('r');
	const categoriaId = String(req.query.categoria_id ?? '').trim();
	if (categoriaId && isPocketBaseId(categoriaId)) {
		where += ' AND r.categoria_id = ?';
		binds.push(categoriaId);
	}
	const tipo = String(req.query.tipo ?? '').trim().toUpperCase();
	if (tipo && ['PDF', 'DOCX', 'XLSX', 'PPT'].includes(tipo)) {
		where += ' AND r.tipo_archivo = ?';
		binds.push(tipo);
	}

	const rawQ = String(req.query.q ?? '').trim();
	if (rawQ.length >= QUERY_MIN && rawQ.length <= QUERY_MAX) {
		const li = likeParam(rawQ);
		where += ' AND (r.titulo LIKE ? ESCAPE \'\\\\\' OR r.descripcion LIKE ? ESCAPE \'\\\\\')';
		binds.push(li, li);
	}

	try {
		const [[{ totalItems }]] = await pool.query(`SELECT COUNT(*) AS totalItems FROM recursos r WHERE ${where}`, binds);
		const totalPages = Math.max(1, Math.ceil(totalItems / limitNum));
		const offset = (pageNum - 1) * limitNum;
		const [items] = await pool.query(
			`SELECT r.*, c.nombre AS categoria_nombre FROM recursos r
			 LEFT JOIN categorias c ON c.id = r.categoria_id
			 WHERE ${where} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
			[...binds, limitNum, offset],
		);
		const countMap = await getDownloadCountByResourceIdMap();
		const recursos = items.filter(isActiveRecursoRow).map((r) => mapPublicRecurso(r, countMap[r.id] ?? 0));
		return res.json({
			recursos,
			pagination: {
				page: pageNum,
				perPage: limitNum,
				totalItems,
				totalPages,
			},
		});
	} catch (err) {
		console.error('catalog recursos list', err);
		return res.status(500).json({ error: 'No se pudieron cargar los recursos' });
	}
});

router.get('/recursos/:id', async (req, res) => {
	const { id } = req.params;
	if (!isPocketBaseId(id)) {
		return res.status(404).json({ error: 'Recurso no encontrado' });
	}

	try {
		const [rows] = await pool.query(
			`SELECT r.*, c.nombre AS categoria_nombre FROM recursos r
			 LEFT JOIN categorias c ON c.id = r.categoria_id WHERE r.id = ? LIMIT 1`,
			[id],
		);
		const r = rows[0];
		if (!r || !isActiveRecursoRow(r)) {
			return res.status(404).json({ error: 'Recurso no encontrado' });
		}

		const [countMap, [linkRows]] = await Promise.all([
			getDownloadCountByResourceIdMap(),
			pool.query(
				`SELECT e.nombre FROM recursos_etiquetas re
				 JOIN etiquetas e ON e.id = re.etiqueta_id WHERE re.recurso_id = ?`,
				[id],
			),
		]);

		const etiquetas = linkRows.map((x) => x.nombre).filter(Boolean);
		const recurso = {
			...mapPublicRecurso(r, countMap[r.id] ?? 0),
			etiquetas,
		};
		return res.json({ recurso });
	} catch {
		return res.status(404).json({ error: 'Recurso no encontrado' });
	}
});

router.get('/categories', async (req, res) => {
	try {
		const [categories] = await pool.query('SELECT * FROM categorias ORDER BY nombre');
		const [counts2] = await pool.query(
			`SELECT categoria_id, COUNT(*) AS n FROM recursos WHERE (activo IS NULL OR activo = 1) GROUP BY categoria_id`,
		);
		const countByCat = Object.fromEntries(counts2.map((x) => [x.categoria_id, Number(x.n)]));
		const payload = categories.map((c) => ({
			id: c.id,
			nombre: c.nombre,
			descripcion: c.descripcion || '',
			icono: c.icono || null,
			recursos_count: countByCat[c.id] || 0,
		}));
		return res.json({ categories: payload });
	} catch (err) {
		return res.status(500).json({ error: 'No se pudieron cargar las categorías' });
	}
});

router.get('/categories/:id/recursos', async (req, res) => {
	const { id } = req.params;
	if (!isPocketBaseId(id)) {
		return res.status(404).json({ error: 'Categoría no encontrada' });
	}

	const [cats] = await pool.query('SELECT * FROM categorias WHERE id = ? LIMIT 1', [id]);
	const category = cats[0];
	if (!category) {
		return res.status(404).json({ error: 'Categoría no encontrada' });
	}

	const pageNum = Math.max(1, parseInt(req.query.page ?? DEFAULT_PAGE, 10));
	const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit ?? DEFAULT_LIMIT, 10)));
	const sortKey = String(req.query.sort ?? '-created');
	const orderSql = SORT_SQL[sortKey] || 'r.created_at DESC';

	const binds = [id];
	let where = `r.categoria_id = ? AND ${activeFilter('r')}`;
	const typo = String(req.query.tipo ?? '').trim().toUpperCase();
	if (typo && ['PDF', 'DOCX', 'XLSX', 'PPT'].includes(typo)) {
		where += ' AND r.tipo_archivo = ?';
		binds.push(typo);
	}
	const rawQ = String(req.query.q ?? '').trim();
	if (rawQ.length >= QUERY_MIN && rawQ.length <= QUERY_MAX) {
		const li = likeParam(rawQ);
		where += ' AND (r.titulo LIKE ? ESCAPE \'\\\\\' OR r.descripcion LIKE ? ESCAPE \'\\\\\')';
		binds.push(li, li);
	}

	try {
		const [[{ totalItems }]] = await pool.query(`SELECT COUNT(*) AS totalItems FROM recursos r WHERE ${where}`, binds);
		const totalPages = Math.max(1, Math.ceil(totalItems / limitNum));
		const offset = (pageNum - 1) * limitNum;
		const [list] = await pool.query(
			`SELECT r.*, c.nombre AS categoria_nombre FROM recursos r
			 LEFT JOIN categorias c ON c.id = r.categoria_id
			 WHERE ${where} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
			[...binds, limitNum, offset],
		);
		const countMap = await getDownloadCountByResourceIdMap();
		const recursos = list.filter(isActiveRecursoRow).map((r) => mapPublicRecurso(r, countMap[r.id] ?? 0));
		return res.json({
			category: {
				id: category.id,
				nombre: category.nombre,
				descripcion: category.descripcion || '',
				icono: category.icono || null,
			},
			recursos,
			pagination: {
				page: pageNum,
				perPage: limitNum,
				totalItems,
				totalPages,
			},
		});
	} catch (err) {
		console.error('catalog category recursos', err);
		return res.status(500).json({ error: 'No se pudieron cargar los recursos' });
	}
});

router.get('/categories/:id', async (req, res) => {
	const { id } = req.params;
	if (!isPocketBaseId(id)) {
		return res.status(404).json({ error: 'Categoría no encontrada' });
	}
	try {
		const [cats] = await pool.query('SELECT * FROM categorias WHERE id = ? LIMIT 1', [id]);
		const cat = cats[0];
		if (!cat) {
			return res.status(404).json({ error: 'Categoría no encontrada' });
		}
		const [recs] = await pool.query(
			'SELECT id, activo FROM recursos WHERE categoria_id = ?',
			[id],
		);
		const recursos_count = recs.filter((r) => isActiveRecursoRow(r)).length;
		return res.json({
			category: {
				id: cat.id,
				nombre: cat.nombre,
				descripcion: cat.descripcion || '',
				icono: cat.icono || null,
				recursos_count,
			},
		});
	} catch {
		return res.status(404).json({ error: 'Categoría no encontrada' });
	}
});

router.get('/cms/pages/:slug', async (req, res) => {
	const { slug } = req.params;
	const data = await fetchPublicCmsPage(String(slug || '').trim());
	if (!data) {
		return res.status(404).json({ error: 'Página no encontrada' });
	}
	return res.json(data);
});

export default router;
