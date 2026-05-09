/** Formato esperado por ResourceCard (ítems de GET /catalog/...). */
export function mapCatalogRecursoToCard(r, extra = {}) {
  const size =
    r.peso_archivo != null && r.peso_archivo !== ''
      ? Number(r.peso_archivo).toLocaleString('es-CL', { maximumFractionDigits: 2 })
      : '—';
  return {
    id: r.id,
    title: r.titulo,
    description: r.descripcion || '',
    fileType: r.tipo_archivo || 'PDF',
    category: r.categoria_nombre || '—',
    categoryId: r.categoria_id || null,
    uploadDate: r.created,
    updatedAt: r.updated || r.created,
    fileSize: size,
    downloadCount: r.download_count ?? 0,
    ...extra,
  };
}
