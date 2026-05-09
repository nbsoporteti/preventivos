function dateIso(v) {
	if (!v) return undefined;
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Fila `users` de MySQL → forma esperada por el frontend.
 */
export function formatPublicUser(row) {
	if (!row) return null;
	const nombre = row.nombre ?? '';
	return {
		id: row.id,
		nombre,
		name: nombre,
		email: row.email,
		rol: row.rol,
		role: row.rol,
		email_verificado: Boolean(row.email_verificado),
		email_verified: Boolean(row.email_verificado),
		activo: row.activo == null ? true : Boolean(row.activo),
		active: row.activo == null ? true : Boolean(row.activo),
		created: dateIso(row.created_at),
	};
}
