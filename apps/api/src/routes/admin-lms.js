import express from 'express';
import { pool } from '../db/pool.js';
import { newId } from '../db/id.js';
import { verifyUserToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isPocketBaseId(value) {
	return typeof value === 'string' && /^[a-z0-9]{15}$/.test(value);
}

function resolveCategoriaIdFromBody(body) {
	if (body.categoria_id === undefined || body.categoria_id === null || body.categoria_id === '') {
		return null;
	}
	const s = String(body.categoria_id).trim();
	if (!s) return null;
	if (!isPocketBaseId(s)) return false;
	return s;
}

function parseOpcionesJson(body) {
	const raw = body.opciones_json ?? body.opciones;
	if (typeof raw === 'string') {
		try {
			const v = JSON.parse(raw);
			return Array.isArray(v) && v.length >= 2 && v.every((x) => typeof x === 'string')
				? v
				: null;
		} catch {
			return null;
		}
	}
	if (Array.isArray(raw)) {
		return raw.length >= 2 && raw.every((x) => typeof x === 'string') ? raw : null;
	}
	return null;
}

router.get('/actividades', verifyUserToken, requireAdmin, async (req, res) => {
	try {
		const [rows] = await pool.query(
			`SELECT a.*, c.nombre AS categoria_nombre FROM lms_actividades a
			 LEFT JOIN categorias c ON c.id = a.categoria_id
			 ORDER BY a.orden, a.titulo`,
		);
		const [allItems] = await pool.query('SELECT id, actividad_id FROM lms_items');
		const countByAct = {};
		for (const it of allItems) {
			if (!it.actividad_id) continue;
			countByAct[it.actividad_id] = (countByAct[it.actividad_id] || 0) + 1;
		}
		return res.json({
			items: rows.map((a) => ({
				id: a.id,
				titulo: a.titulo,
				slug: a.slug,
				descripcion: a.descripcion || '',
				orden: a.orden ?? 0,
				activo: a.activo !== 0 && a.activo !== false,
				item_count: countByAct[a.id] || 0,
				updated: a.updated_at,
				categoria_id: a.categoria_id || null,
				categoria_nombre: a.categoria_nombre || null,
			})),
		});
	} catch (err) {
		console.error('admin lms actividades list', err);
		return res.status(500).json({ error: 'No se pudieron cargar las actividades' });
	}
});

router.post('/actividades', verifyUserToken, requireAdmin, async (req, res) => {
	const titulo = String(req.body?.titulo ?? '').trim();
	const slug = String(req.body?.slug ?? '').trim().toLowerCase();
	const descripcion = String(req.body?.descripcion ?? '').trim();
	const orden = Number.parseInt(req.body?.orden ?? '0', 10) || 0;
	const activo = req.body?.activo !== false;

	if (!titulo || !slug || !SLUG_RE.test(slug)) {
		return res
			.status(400)
			.json({ error: 'Título y slug son obligatorios (slug: minúsculas y guiones)' });
	}

	const categoriaResolved = resolveCategoriaIdFromBody(req.body);
	if (categoriaResolved === false) {
		return res.status(400).json({ error: 'Categoría inválida' });
	}

	const id = newId();
	try {
		await pool.query(
			`INSERT INTO lms_actividades (id, titulo, slug, descripcion, orden, activo, categoria_id)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				id,
				titulo,
				slug,
				descripcion || '',
				orden,
				activo ? 1 : 0,
				categoriaResolved,
			],
		);
		const [rows] = await pool.query('SELECT * FROM lms_actividades WHERE id = ?', [id]);
		const created = rows[0];
		return res.json({
			item: {
				id: created.id,
				titulo: created.titulo,
				slug: created.slug,
				descripcion: created.descripcion || '',
				orden: created.orden ?? 0,
				activo: created.activo !== 0,
				categoria_id: created.categoria_id || null,
			},
		});
	} catch (err) {
		console.error('admin lms actividad create', err);
		const msg = String(err.message || '');
		if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
			return res.status(409).json({ error: 'El slug ya existe' });
		}
		return res.status(500).json({ error: 'No se pudo crear la actividad' });
	}
});

router.put('/actividades/:id', verifyUserToken, requireAdmin, async (req, res) => {
	const { id } = req.params;
	const titulo = String(req.body?.titulo ?? '').trim();
	const slug = String(req.body?.slug ?? '').trim().toLowerCase();
	const descripcion = String(req.body?.descripcion ?? '').trim();
	const orden = Number.parseInt(req.body?.orden ?? '0', 10) || 0;
	const activo = req.body?.activo !== false;

	if (!titulo || !slug || !SLUG_RE.test(slug)) {
		return res.status(400).json({ error: 'Título y slug inválidos' });
	}

	const categoriaResolved = resolveCategoriaIdFromBody(req.body);
	if (categoriaResolved === false) {
		return res.status(400).json({ error: 'Categoría inválida' });
	}

	try {
		await pool.query(
			`UPDATE lms_actividades SET titulo = ?, slug = ?, descripcion = ?, orden = ?, activo = ?, categoria_id = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
			[titulo, slug, descripcion || '', orden, activo ? 1 : 0, categoriaResolved, id],
		);
		const [rows] = await pool.query('SELECT * FROM lms_actividades WHERE id = ?', [id]);
		const updated = rows[0];
		if (!updated) {
			return res.status(404).json({ error: 'No encontrada' });
		}
		return res.json({
			item: {
				id: updated.id,
				titulo: updated.titulo,
				slug: updated.slug,
				descripcion: updated.descripcion || '',
				orden: updated.orden ?? 0,
				activo: updated.activo !== 0,
				categoria_id: updated.categoria_id || null,
			},
		});
	} catch (err) {
		console.error('admin lms actividad update', err);
		return res.status(500).json({ error: 'No se pudo actualizar la actividad' });
	}
});

router.delete('/actividades/:id', verifyUserToken, requireAdmin, async (req, res) => {
	try {
		await pool.query('DELETE FROM lms_actividades WHERE id = ?', [req.params.id]);
		return res.json({ ok: true });
	} catch (err) {
		console.error('admin lms actividad delete', err);
		return res.status(500).json({ error: 'No se pudo eliminar la actividad' });
	}
});

router.get('/actividades/:id/items', verifyUserToken, requireAdmin, async (req, res) => {
	const actId = req.params.id;
	try {
		const [items] = await pool.query(
			'SELECT * FROM lms_items WHERE actividad_id = ? ORDER BY orden, created_at',
			[actId],
		);
		return res.json({
			items: items.map((it) => ({
				id: it.id,
				actividad_id: it.actividad_id,
				enunciado: it.enunciado,
				tipo: it.tipo,
				opciones_json: it.opciones_json,
				indice_correcto: Number(it.indice_correcto),
				explicacion: it.explicacion || '',
				orden: it.orden ?? 0,
			})),
		});
	} catch (err) {
		console.error('admin lms items list', err);
		return res.status(500).json({ error: 'No se pudieron cargar las preguntas' });
	}
});

router.post('/items', verifyUserToken, requireAdmin, async (req, res) => {
	const actividad_id = String(req.body?.actividad_id ?? '').trim();
	const enunciado = String(req.body?.enunciado ?? '').trim();
	const tipo = String(req.body?.tipo ?? 'single').trim();
	const opciones = parseOpcionesJson(req.body);
	const indice_correcto = Number.parseInt(req.body?.indice_correcto ?? '-1', 10);
	const explicacion = String(req.body?.explicacion ?? '').trim();
	const orden = Number.parseInt(req.body?.orden ?? '0', 10) || 0;

	if (!actividad_id || !enunciado) {
		return res.status(400).json({ error: 'actividad_id y enunciado son obligatorios' });
	}
	if (tipo !== 'single' && tipo !== 'true_false') {
		return res.status(400).json({ error: 'tipo debe ser single o true_false' });
	}
	if (!opciones) {
		return res.status(400).json({ error: 'opciones_json debe ser un JSON array de al menos 2 strings' });
	}
	if (tipo === 'true_false' && opciones.length !== 2) {
		return res.status(400).json({ error: 'true_false requiere exactamente 2 opciones' });
	}
	if (indice_correcto < 0 || indice_correcto >= opciones.length) {
		return res.status(400).json({ error: 'indice_correcto fuera de rango' });
	}

	const id = newId();
	try {
		await pool.query(
			`INSERT INTO lms_items (id, actividad_id, enunciado, tipo, opciones_json, indice_correcto, explicacion, orden)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				id,
				actividad_id,
				enunciado,
				tipo,
				JSON.stringify(opciones),
				indice_correcto,
				explicacion || '',
				orden,
			],
		);
		const [rows] = await pool.query('SELECT * FROM lms_items WHERE id = ?', [id]);
		const created = rows[0];
		return res.json({
			item: {
				id: created.id,
				actividad_id: created.actividad_id,
				enunciado: created.enunciado,
				tipo: created.tipo,
				opciones_json: created.opciones_json,
				indice_correcto: Number(created.indice_correcto),
				explicacion: created.explicacion || '',
				orden: created.orden ?? 0,
			},
		});
	} catch (err) {
		console.error('admin lms item create', err);
		return res.status(500).json({ error: 'No se pudo crear la pregunta' });
	}
});

router.put('/items/:id', verifyUserToken, requireAdmin, async (req, res) => {
	const enunciado = String(req.body?.enunciado ?? '').trim();
	const tipo = String(req.body?.tipo ?? 'single').trim();
	const opciones = parseOpcionesJson(req.body);
	const indice_correcto = Number.parseInt(req.body?.indice_correcto ?? '-1', 10);
	const explicacion = String(req.body?.explicacion ?? '').trim();
	const orden = Number.parseInt(req.body?.orden ?? '0', 10) || 0;

	if (!enunciado) {
		return res.status(400).json({ error: 'enunciado es obligatorio' });
	}
	if (tipo !== 'single' && tipo !== 'true_false') {
		return res.status(400).json({ error: 'tipo debe ser single o true_false' });
	}
	if (!opciones) {
		return res.status(400).json({ error: 'opciones_json inválido' });
	}
	if (tipo === 'true_false' && opciones.length !== 2) {
		return res.status(400).json({ error: 'true_false requiere exactamente 2 opciones' });
	}
	if (indice_correcto < 0 || indice_correcto >= opciones.length) {
		return res.status(400).json({ error: 'indice_correcto fuera de rango' });
	}

	try {
		await pool.query(
			`UPDATE lms_items SET enunciado = ?, tipo = ?, opciones_json = ?, indice_correcto = ?, explicacion = ?, orden = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
			[
				enunciado,
				tipo,
				JSON.stringify(opciones),
				indice_correcto,
				explicacion || '',
				orden,
				req.params.id,
			],
		);
		const [rows] = await pool.query('SELECT * FROM lms_items WHERE id = ?', [req.params.id]);
		const updated = rows[0];
		return res.json({
			item: {
				id: updated.id,
				actividad_id: updated.actividad_id,
				enunciado: updated.enunciado,
				tipo: updated.tipo,
				opciones_json: updated.opciones_json,
				indice_correcto: Number(updated.indice_correcto),
				explicacion: updated.explicacion || '',
				orden: updated.orden ?? 0,
			},
		});
	} catch (err) {
		console.error('admin lms item update', err);
		return res.status(500).json({ error: 'No se pudo actualizar la pregunta' });
	}
});

router.get('/banco/items', verifyUserToken, requireAdmin, async (req, res) => {
	try {
		const [rows] = await pool.query('SELECT * FROM lms_banco_items ORDER BY orden, created_at');
		return res.json({
			items: rows.map((it) => ({
				id: it.id,
				enunciado: it.enunciado,
				tipo: it.tipo,
				opciones_json: it.opciones_json,
				indice_correcto: Number(it.indice_correcto),
				explicacion: it.explicacion || '',
				orden: it.orden ?? 0,
			})),
		});
	} catch (err) {
		console.error('admin lms banco list', err);
		return res.status(500).json({ error: 'No se pudo cargar el banco' });
	}
});

router.post('/banco/items', verifyUserToken, requireAdmin, async (req, res) => {
	const enunciado = String(req.body?.enunciado ?? '').trim();
	const tipo = String(req.body?.tipo ?? 'single').trim();
	const opciones = parseOpcionesJson(req.body);
	const indice_correcto = Number.parseInt(req.body?.indice_correcto ?? '-1', 10);
	const explicacion = String(req.body?.explicacion ?? '').trim();
	const orden = Number.parseInt(req.body?.orden ?? '0', 10) || 0;

	if (!enunciado) {
		return res.status(400).json({ error: 'enunciado es obligatorio' });
	}
	if (tipo !== 'single' && tipo !== 'true_false') {
		return res.status(400).json({ error: 'tipo debe ser single o true_false' });
	}
	if (!opciones) {
		return res.status(400).json({ error: 'opciones_json debe ser un JSON array de al menos 2 strings' });
	}
	if (tipo === 'true_false' && opciones.length !== 2) {
		return res.status(400).json({ error: 'true_false requiere exactamente 2 opciones' });
	}
	if (indice_correcto < 0 || indice_correcto >= opciones.length) {
		return res.status(400).json({ error: 'indice_correcto fuera de rango' });
	}

	const id = newId();
	try {
		await pool.query(
			`INSERT INTO lms_banco_items (id, enunciado, tipo, opciones_json, indice_correcto, explicacion, orden)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[id, enunciado, tipo, JSON.stringify(opciones), indice_correcto, explicacion || '', orden],
		);
		const [rows] = await pool.query('SELECT * FROM lms_banco_items WHERE id = ?', [id]);
		const created = rows[0];
		return res.json({
			item: {
				id: created.id,
				enunciado: created.enunciado,
				tipo: created.tipo,
				opciones_json: created.opciones_json,
				indice_correcto: Number(created.indice_correcto),
				explicacion: created.explicacion || '',
				orden: created.orden ?? 0,
			},
		});
	} catch (err) {
		console.error('admin lms banco create', err);
		return res.status(500).json({ error: 'No se pudo crear la pregunta en el banco' });
	}
});

router.put('/banco/items/:id', verifyUserToken, requireAdmin, async (req, res) => {
	const enunciado = String(req.body?.enunciado ?? '').trim();
	const tipo = String(req.body?.tipo ?? 'single').trim();
	const opciones = parseOpcionesJson(req.body);
	const indice_correcto = Number.parseInt(req.body?.indice_correcto ?? '-1', 10);
	const explicacion = String(req.body?.explicacion ?? '').trim();
	const orden = Number.parseInt(req.body?.orden ?? '0', 10) || 0;

	if (!enunciado) {
		return res.status(400).json({ error: 'enunciado es obligatorio' });
	}
	if (tipo !== 'single' && tipo !== 'true_false') {
		return res.status(400).json({ error: 'tipo debe ser single o true_false' });
	}
	if (!opciones) {
		return res.status(400).json({ error: 'opciones_json inválido' });
	}
	if (tipo === 'true_false' && opciones.length !== 2) {
		return res.status(400).json({ error: 'true_false requiere exactamente 2 opciones' });
	}
	if (indice_correcto < 0 || indice_correcto >= opciones.length) {
		return res.status(400).json({ error: 'indice_correcto fuera de rango' });
	}

	try {
		await pool.query(
			`UPDATE lms_banco_items SET enunciado = ?, tipo = ?, opciones_json = ?, indice_correcto = ?, explicacion = ?, orden = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
			[
				enunciado,
				tipo,
				JSON.stringify(opciones),
				indice_correcto,
				explicacion || '',
				orden,
				req.params.id,
			],
		);
		const [rows] = await pool.query('SELECT * FROM lms_banco_items WHERE id = ?', [req.params.id]);
		const updated = rows[0];
		return res.json({
			item: {
				id: updated.id,
				enunciado: updated.enunciado,
				tipo: updated.tipo,
				opciones_json: updated.opciones_json,
				indice_correcto: Number(updated.indice_correcto),
				explicacion: updated.explicacion || '',
				orden: updated.orden ?? 0,
			},
		});
	} catch (err) {
		console.error('admin lms banco update', err);
		return res.status(500).json({ error: 'No se pudo actualizar la pregunta del banco' });
	}
});

router.delete('/banco/items/:id', verifyUserToken, requireAdmin, async (req, res) => {
	try {
		await pool.query('DELETE FROM lms_banco_items WHERE id = ?', [req.params.id]);
		return res.json({ ok: true });
	} catch (err) {
		console.error('admin lms banco delete', err);
		return res.status(500).json({ error: 'No se pudo eliminar del banco' });
	}
});

router.post('/actividades/:actividadId/import-banco', verifyUserToken, requireAdmin, async (req, res) => {
	const actividadId = req.params.actividadId;
	if (!isPocketBaseId(actividadId)) {
		return res.status(400).json({ error: 'Actividad inválida' });
	}
	const ids = req.body?.ids;
	if (!Array.isArray(ids) || ids.length === 0) {
		return res.status(400).json({ error: 'Enviá ids: array de preguntas del banco' });
	}
	const cleanIds = [...new Set(ids.map((x) => String(x).trim()).filter(isPocketBaseId))];
	if (cleanIds.length === 0) {
		return res.status(400).json({ error: 'Ningún id válido' });
	}

	try {
		const [existing] = await pool.query('SELECT orden FROM lms_items WHERE actividad_id = ?', [actividadId]);
		let nextOrden = existing.reduce((m, r) => Math.max(m, Number(r.orden ?? 0)), -1) + 1;
		if (nextOrden < 0) nextOrden = 0;

		const items = [];
		for (const bid of cleanIds) {
			const [brows] = await pool.query('SELECT * FROM lms_banco_items WHERE id = ? LIMIT 1', [bid]);
			const banco = brows[0];
			if (!banco) continue;
			const nid = newId();
			await pool.query(
				`INSERT INTO lms_items (id, actividad_id, enunciado, tipo, opciones_json, indice_correcto, explicacion, orden)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					nid,
					actividadId,
					banco.enunciado,
					banco.tipo,
					banco.opciones_json,
					banco.indice_correcto,
					banco.explicacion || '',
					nextOrden,
				],
			);
			const [ir] = await pool.query('SELECT * FROM lms_items WHERE id = ?', [nid]);
			const created = ir[0];
			items.push({
				id: created.id,
				actividad_id: created.actividad_id,
				enunciado: created.enunciado,
				tipo: created.tipo,
				opciones_json: created.opciones_json,
				indice_correcto: Number(created.indice_correcto),
				explicacion: created.explicacion || '',
				orden: created.orden ?? 0,
			});
			nextOrden += 1;
		}

		if (items.length === 0) {
			return res.status(400).json({ error: 'No se encontraron preguntas del banco para esos ids' });
		}
		return res.json({ imported: items.length, items });
	} catch (err) {
		console.error('admin lms import banco', err);
		return res.status(500).json({ error: 'No se pudieron importar las preguntas' });
	}
});

router.delete('/items/:id', verifyUserToken, requireAdmin, async (req, res) => {
	try {
		await pool.query('DELETE FROM lms_items WHERE id = ?', [req.params.id]);
		return res.json({ ok: true });
	} catch (err) {
		console.error('admin lms item delete', err);
		return res.status(500).json({ error: 'No se pudo eliminar la pregunta' });
	}
});

export default router;
