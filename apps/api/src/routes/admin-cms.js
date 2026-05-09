import { pool } from '../db/pool.js';
import { verifyUserToken, requireAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { newId } from '../db/id.js';

function parseBloquesJson(raw) {
	if (raw == null || raw === '') return {};
	try {
		const o = JSON.parse(String(raw));
		return o !== null && typeof o === 'object' && !Array.isArray(o) ? o : {};
	} catch {
		return {};
	}
}

/** Slugs expuestos por API; debe coincidir con `CMS_PAGE_ORDER` en la web. */
export const CMS_ALLOWED_SLUGS = new Set([
	'inicio',
	'donar',
	'nosotros',
	'contacto',
	'biblioteca',
	'recurso',
	'categoria',
	'aprende',
	'login',
	'registro',
	'verificar_email',
	'recuperar_contrasena',
	'resetear_contrasena',
]);

const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export async function fetchPublicCmsPage(slug) {
	if (!SLUG_RE.test(slug) || !CMS_ALLOWED_SLUGS.has(slug)) {
		return null;
	}
	const [rows] = await pool.query('SELECT * FROM cms_paginas WHERE slug = ? LIMIT 1', [slug]);
	const rec = rows[0];
	if (!rec) {
		return {
			slug,
			meta_title: '',
			meta_description: '',
			bloques: {},
		};
	}
	return {
		slug,
		meta_title: rec.meta_title ?? '',
		meta_description: rec.meta_description ?? '',
		bloques: parseBloquesJson(rec.bloques_json),
	};
}

export async function listCmsPages(req, res) {
	try {
		const [rows] = await pool.query('SELECT * FROM cms_paginas ORDER BY slug');
		return res.json({
			pages: rows.map((r) => ({
				id: r.id,
				slug: r.slug,
				meta_title: r.meta_title ?? '',
				meta_description: r.meta_description ?? '',
				updated: r.updated_at,
			})),
		});
	} catch (err) {
		logger.error('admin cms list', err);
		return res.status(500).json({ error: 'No se pudieron listar las páginas' });
	}
}

export async function getCmsPageAdmin(req, res) {
	const { slug } = req.params;
	if (!SLUG_RE.test(slug) || !CMS_ALLOWED_SLUGS.has(slug)) {
		return res.status(404).json({ error: 'Página no encontrada' });
	}
	try {
		const [rows] = await pool.query('SELECT * FROM cms_paginas WHERE slug = ? LIMIT 1', [slug]);
		const rec = rows[0];
		if (!rec) {
			return res.json({
				slug,
				meta_title: '',
				meta_description: '',
				bloques: {},
				exists: false,
			});
		}
		return res.json({
			id: rec.id,
			slug: rec.slug,
			meta_title: rec.meta_title ?? '',
			meta_description: rec.meta_description ?? '',
			bloques: parseBloquesJson(rec.bloques_json),
			exists: true,
		});
	} catch (err) {
		logger.error('admin cms get', err);
		return res.status(500).json({ error: 'No se pudo cargar la página' });
	}
}

export async function putCmsPageAdmin(req, res) {
	const { slug } = req.params;
	if (!SLUG_RE.test(slug) || !CMS_ALLOWED_SLUGS.has(slug)) {
		return res.status(404).json({ error: 'Página no encontrada' });
	}

	const { meta_title, meta_description, bloques } = req.body || {};
	if (bloques !== undefined && (bloques === null || typeof bloques !== 'object' || Array.isArray(bloques))) {
		return res.status(400).json({ error: 'bloques debe ser un objeto JSON' });
	}

	let jsonStr = '{}';
	try {
		jsonStr = JSON.stringify(bloques !== undefined ? bloques : {});
	} catch {
		return res.status(400).json({ error: 'bloques no es serializable' });
	}
	if (jsonStr.length > 100000) {
		return res.status(400).json({ error: 'Contenido demasiado largo' });
	}

	const payloadTitle = meta_title !== undefined ? String(meta_title).slice(0, 200) : '';
	const payloadDesc = meta_description !== undefined ? String(meta_description).slice(0, 500) : '';

	try {
		const [existingRows] = await pool.query('SELECT * FROM cms_paginas WHERE slug = ? LIMIT 1', [slug]);
		const existing = existingRows[0];

		if (existing) {
			const mt =
				meta_title !== undefined ? String(meta_title).slice(0, 200) : existing.meta_title;
			const md =
				meta_description !== undefined ? String(meta_description).slice(0, 500) : existing.meta_description;
			await pool.query(
				`UPDATE cms_paginas SET bloques_json = ?, meta_title = ?, meta_description = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
				[jsonStr, mt, md, existing.id],
			);
			const [upd] = await pool.query('SELECT * FROM cms_paginas WHERE id = ?', [existing.id]);
			const updated = upd[0];
			logger.info('CMS page updated', { slug });
			return res.json({
				id: updated.id,
				slug: updated.slug,
				meta_title: updated.meta_title ?? '',
				meta_description: updated.meta_description ?? '',
				bloques: parseBloquesJson(updated.bloques_json),
			});
		}

		const id = newId();
		await pool.query(
			`INSERT INTO cms_paginas (id, slug, meta_title, meta_description, bloques_json) VALUES (?, ?, ?, ?, ?)`,
			[id, slug, payloadTitle, payloadDesc, jsonStr],
		);
		const [cr] = await pool.query('SELECT * FROM cms_paginas WHERE id = ?', [id]);
		const created = cr[0];
		logger.info('CMS page created', { slug });
		return res.json({
			id: created.id,
			slug: created.slug,
			meta_title: created.meta_title ?? '',
			meta_description: created.meta_description ?? '',
			bloques: parseBloquesJson(created.bloques_json),
		});
	} catch (err) {
		logger.error('admin cms put', err);
		return res.status(500).json({ error: 'No se pudo guardar la página' });
	}
}

export function registerAdminCmsRoutes(router) {
	router.get('/cms/pages', verifyUserToken, requireAdmin, listCmsPages);
	router.get('/cms/pages/:slug', verifyUserToken, requireAdmin, getCmsPageAdmin);
	router.put('/cms/pages/:slug', verifyUserToken, requireAdmin, putCmsPageAdmin);
}
