export function internalRutaPlaceholder(filename) {
	const safe = (filename || 'archivo').replace(/[^\w.\-\sáéíóúñü]+/gi, '_').slice(0, 120);
	return `upload://${safe}`;
}

const EXT_TIPO = {
	pdf: 'PDF',
	docx: 'DOCX',
	xlsx: 'XLSX',
	xls: 'XLSX',
	ppt: 'PPT',
	pptx: 'PPT',
};

export function guessTipoFromFilename(name) {
	const ext = (name || '').split('.').pop()?.toLowerCase();
	return EXT_TIPO[ext] || 'PDF';
}

export function pesoMbFromBuffer(buf) {
	const n = buf.length / (1024 * 1024);
	return Math.round(n * 100) / 100;
}

export function assertHttpImportUrl(urlStr) {
	let u;
	try {
		u = new URL(urlStr);
	} catch {
		throw new Error('URL inválida');
	}
	if (u.protocol !== 'http:' && u.protocol !== 'https:') {
		throw new Error('Solo se permiten enlaces http o https');
	}
	return u.toString();
}

export async function fetchRemoteFile(urlStr, maxBytes) {
	const url = assertHttpImportUrl(urlStr);
	const res = await fetch(url, {
		method: 'GET',
		redirect: 'follow',
		headers: { 'User-Agent': 'PreventivosCL-AdminImport/1.0' },
	});
	if (!res.ok) {
		throw new Error(`No se pudo descargar (${res.status})`);
	}
	const cl = res.headers.get('content-length');
	if (cl && Number(cl) > maxBytes) {
		throw new Error('El archivo remoto supera el tamaño máximo');
	}
	const buf = Buffer.from(await res.arrayBuffer());
	if (buf.length > maxBytes) {
		throw new Error('El archivo remoto supera el tamaño máximo');
	}
	let filename = 'descarga';
	const cd = res.headers.get('content-disposition');
	const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd || '');
	if (m?.[1]) {
		try {
			filename = decodeURIComponent(m[1].trim());
		} catch {
			filename = m[1].trim();
		}
	} else {
		try {
			const pathLast = new URL(url).pathname.split('/').filter(Boolean).pop();
			if (pathLast) filename = pathLast.split('?')[0];
		} catch {
			// keep default
		}
	}
	return { buffer: buf, filename: filename || 'archivo.bin' };
}
