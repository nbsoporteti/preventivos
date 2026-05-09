const API_BASE = String(import.meta.env.VITE_API_BASE_URL || '/hcgi/api')
	.trim()
	.replace(/\/$/, '');

function joinApiUrl(path) {
	const p = path.startsWith('/') ? path : `/${path}`;
	if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
		return `${API_BASE.replace(/\/$/, '')}${p}`;
	}
	return `${API_BASE}${p}`;
}

function parseFilenameFromContentDisposition(header) {
	if (!header) return null;
	const utf = /filename\*=UTF-8''([^;]+)/i.exec(header);
	if (utf?.[1]) {
		try {
			return decodeURIComponent(utf[1].trim());
		} catch {
			return utf[1].trim();
		}
	}
	const plain = /filename="([^"]+)"/i.exec(header);
	if (plain?.[1]) return plain[1].trim();
	const plain2 = /filename=([^;\s]+)/i.exec(header);
	if (plain2?.[1]) return plain2[1].replace(/^["']|["']$/g, '').trim();
	return null;
}

const apiServerClient = {
	fetch: async (url, options = {}) => {
		return await window.fetch(joinApiUrl(url), options);
	},

	/** Descarga autenticada vía GET /downloads/:resourceId (blob en memoria). */
	downloadResourceBlob: async (resourceId, token) => {
		const res = await window.fetch(joinApiUrl(`/downloads/${encodeURIComponent(resourceId)}`), {
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		});
		const filename =
			parseFilenameFromContentDisposition(res.headers.get('Content-Disposition'))
			|| `recurso-${resourceId}`;
		const blob = res.ok ? await res.blob() : null;
		return { ok: res.ok, status: res.status, blob, filename, error: res.ok ? null : await res.json().catch(() => ({})) };
	},
};

export default apiServerClient;

export { apiServerClient };
