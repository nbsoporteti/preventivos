import express from 'express';
import { pool } from '../db/pool.js';
import { verifyUserToken } from '../middleware/auth.js';
import { newId } from '../db/id.js';

const router = express.Router();

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseOpciones(raw) {
	try {
		const v = JSON.parse(raw);
		return Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : null;
	} catch {
		return null;
	}
}

function mapItemPublic(row) {
	const opciones = parseOpciones(row.opciones_json) || [];
	return {
		id: row.id,
		enunciado: row.enunciado,
		tipo: row.tipo === 'true_false' ? 'true_false' : 'single',
		opciones,
		orden: row.orden ?? 0,
	};
}

function mapCategoriaFromJoin(row) {
	if (!row.categoria_id || !row.cat_nombre) return null;
	return {
		id: row.categoria_id,
		nombre: row.cat_nombre || '—',
	};
}

function mapActivityListRow(row, itemCount) {
	return {
		id: row.id,
		titulo: row.titulo,
		slug: row.slug,
		descripcion: row.descripcion || '',
		orden: row.orden ?? 0,
		item_count: itemCount,
		categoria: mapCategoriaFromJoin(row),
	};
}

router.get('/actividades', async (req, res) => {
	try {
		const [rows] = await pool.query(
			`SELECT a.*, c.nombre AS cat_nombre FROM lms_actividades a
			 LEFT JOIN categorias c ON c.id = a.categoria_id
			 WHERE a.activo = 1 ORDER BY a.orden, a.titulo`,
		);
		const [allItems] = await pool.query('SELECT id, actividad_id FROM lms_items');
		const countByAct = {};
		for (const it of allItems) {
			const aid = it.actividad_id;
			if (!aid) continue;
			countByAct[aid] = (countByAct[aid] || 0) + 1;
		}
		const actividades = rows.map((a) => mapActivityListRow(a, countByAct[a.id] || 0));
		return res.json({ actividades });
	} catch (err) {
		console.error('catalog lms actividades', err);
		return res.status(500).json({ error: 'No se pudieron cargar las actividades' });
	}
});

router.get('/actividades/:slug', async (req, res) => {
	const { slug } = req.params;
	if (!SLUG_RE.test(slug)) {
		return res.status(404).json({ error: 'Actividad no encontrada' });
	}
	try {
		const [acts] = await pool.query(
			`SELECT a.*, c.nombre AS cat_nombre FROM lms_actividades a
			 LEFT JOIN categorias c ON c.id = a.categoria_id
			 WHERE a.slug = ? AND a.activo = 1 LIMIT 1`,
			[slug],
		);
		const act = acts[0];
		if (!act) {
			return res.status(404).json({ error: 'Actividad no encontrada' });
		}
		const [items] = await pool.query(
			'SELECT * FROM lms_items WHERE actividad_id = ? ORDER BY orden, created_at',
			[act.id],
		);
		const preguntas = items.map(mapItemPublic);
		return res.json({
			actividad: {
				id: act.id,
				titulo: act.titulo,
				slug: act.slug,
				descripcion: act.descripcion || '',
				categoria: mapCategoriaFromJoin(act),
			},
			preguntas,
		});
	} catch (err) {
		console.error('catalog lms actividad', err);
		return res.status(500).json({ error: 'No se pudo cargar la actividad' });
	}
});

router.post('/actividades/:slug/intentos', verifyUserToken, async (req, res) => {
	const { slug } = req.params;
	if (!SLUG_RE.test(slug)) {
		return res.status(404).json({ error: 'Actividad no encontrada' });
	}
	const answers = req.body?.answers;
	if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
		return res.status(400).json({ error: 'Se requiere answers como objeto { [idPregunta]: índice }' });
	}

	const userId = req.userRecord?.id;
	if (!userId) {
		return res.status(401).json({ error: 'Usuario no válido' });
	}

	try {
		const [acts] = await pool.query(
			'SELECT * FROM lms_actividades WHERE slug = ? AND activo = 1 LIMIT 1',
			[slug],
		);
		const act = acts[0];
		if (!act) {
			return res.status(404).json({ error: 'Actividad no encontrada' });
		}

		const [items] = await pool.query(
			'SELECT * FROM lms_items WHERE actividad_id = ? ORDER BY orden, created_at',
			[act.id],
		);
		if (items.length === 0) {
			return res.status(400).json({ error: 'Esta actividad no tiene preguntas' });
		}

		let puntaje = 0;
		const detalle = [];
		const normalizedAnswers = {};

		for (const it of items) {
			const picked = answers[it.id];
			const idx = Number.isInteger(Number(picked)) ? Number(picked) : -1;
			normalizedAnswers[it.id] = idx;
			const correcto = idx === Number(it.indice_correcto);
			if (correcto) puntaje += 1;
			const opciones = parseOpciones(it.opciones_json) || [];
			const okIdx = Number(it.indice_correcto);
			detalle.push({
				item_id: it.id,
				enunciado: it.enunciado || '',
				seleccion: idx,
				texto_seleccion:
					idx >= 0 && idx < opciones.length ? opciones[idx] : '— Sin respuesta —',
				texto_correcto: opciones[okIdx] ?? '—',
				correcto,
				indice_correcto: okIdx,
				explicacion: it.explicacion || '',
			});
		}

		const maxPuntos = items.length;
		const intentoId = newId();
		await pool.query(
			`INSERT INTO lms_intentos (id, usuario_id, actividad_id, respuestas_json, puntaje, max_puntos)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[intentoId, userId, act.id, JSON.stringify(normalizedAnswers), puntaje, maxPuntos],
		);

		return res.json({
			intento_id: intentoId,
			puntaje,
			max_puntos: maxPuntos,
			porcentaje: maxPuntos ? Math.round((puntaje / maxPuntos) * 1000) / 10 : 0,
			detalle,
		});
	} catch (err) {
		console.error('catalog lms intento', err);
		return res.status(500).json({ error: 'No se pudo registrar el intento' });
	}
});

router.get('/mis-intentos', verifyUserToken, async (req, res) => {
	const userId = req.userRecord?.id;
	if (!userId) {
		return res.status(401).json({ error: 'Usuario no válido' });
	}
	try {
		const [rows] = await pool.query(
			`SELECT i.*, a.titulo AS act_titulo, a.slug AS act_slug FROM lms_intentos i
			 LEFT JOIN lms_actividades a ON a.id = i.actividad_id
			 WHERE i.usuario_id = ? ORDER BY i.created_at DESC`,
			[userId],
		);
		const items = rows.map((r) => ({
			id: r.id,
			actividad_id: r.actividad_id,
			titulo: r.act_titulo,
			slug: r.act_slug,
			puntaje: r.puntaje,
			max_puntos: r.max_puntos,
			created: r.created_at,
		}));
		return res.json({ intentos: items });
	} catch (err) {
		console.error('catalog lms mis-intentos', err);
		return res.status(500).json({ error: 'No se pudieron cargar los intentos' });
	}
});

export default router;
