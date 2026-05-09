/**
 * Reemplazo simple {{clave}} en textos del CMS.
 * @param {string} template
 * @param {Record<string, string | number>} vars
 */
export function fillTemplate(template, vars) {
	if (template == null) return '';
	let s = String(template);
	for (const [k, v] of Object.entries(vars || {})) {
		s = s.split(`{{${k}}}`).join(v != null ? String(v) : '');
	}
	return s;
}

/**
 * @param {{ title: string, description: string, bloques: Record<string, string>, fieldGroups: Array<{title: string, fields: Array}> }} config
 */
export function defineCmsPage(config) {
	const defaultMeta = { title: config.title, description: config.description };
	const defaultBloques = { ...config.bloques };
	const fieldGroups = config.fieldGroups;

	return {
		defaultMeta,
		defaultBloques,
		fieldGroups,
		merge(apiResponse) {
			const meta_title =
				String(apiResponse?.meta_title ?? '').trim() || defaultMeta.title;
			const meta_description =
				String(apiResponse?.meta_description ?? '').trim() || defaultMeta.description;
			const incoming =
				apiResponse?.bloques &&
				typeof apiResponse.bloques === 'object' &&
				!Array.isArray(apiResponse.bloques)
					? apiResponse.bloques
					: {};
			return {
				meta_title,
				meta_description,
				bloques: { ...defaultBloques, ...incoming },
			};
		},
		save(merged) {
			const out = { ...defaultBloques };
			for (const key of Object.keys(defaultBloques)) {
				const v = merged.bloques[key];
				out[key] = v !== undefined && v !== null ? String(v) : out[key];
			}
			return out;
		},
	};
}
