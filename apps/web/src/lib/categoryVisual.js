/** Colores de badge por nombre (compatibilidad) + paleta estable por id de categoría */

const LEGACY_BY_NAME = {
  Seguridad: 'bg-blue-100 text-blue-800',
  Normativas: 'bg-purple-100 text-purple-800',
  'Charlas de 5 Minutos': 'bg-green-100 text-green-800',
  'Matrices IPER': 'bg-teal-100 text-teal-800',
  'Formatos de Inspección': 'bg-cyan-100 text-cyan-800',
  Procedimientos: 'bg-indigo-100 text-indigo-800',
  Documentos: 'bg-slate-100 text-slate-800',
  Plantillas: 'bg-amber-100 text-amber-800',
  Guías: 'bg-emerald-100 text-emerald-800',
};

const PALETTE = [
  'bg-sky-100 text-sky-900',
  'bg-violet-100 text-violet-900',
  'bg-amber-100 text-amber-900',
  'bg-cyan-100 text-cyan-900',
  'bg-teal-100 text-teal-900',
  'bg-indigo-100 text-indigo-900',
  'bg-blue-100 text-blue-900',
  'bg-slate-100 text-slate-800',
];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * @param {string} categoryName
 * @param {string | null | undefined} categoryId
 */
export function getCategoryBadgeClass(categoryName, categoryId) {
  if (categoryName && LEGACY_BY_NAME[categoryName]) {
    return LEGACY_BY_NAME[categoryName];
  }
  const key = categoryId || categoryName || '—';
  return PALETTE[hashString(String(key)) % PALETTE.length];
}

/** Acentos para CategoryCard (borde, icono, badge) — estable por id/nombre */
const CARD_ACCENTS = [
  {
    stripe: 'border-l-[5px] border-l-sky-500',
    iconWrap: 'bg-sky-500/[0.11] text-sky-800 ring-1 ring-sky-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
    badge: 'border border-sky-200/70 bg-sky-50/90 text-sky-950 tabular-nums',
    footerTint: 'bg-gradient-to-r from-sky-500/[0.06] to-transparent',
  },
  {
    stripe: 'border-l-[5px] border-l-violet-500',
    iconWrap: 'bg-violet-500/[0.11] text-violet-800 ring-1 ring-violet-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
    badge: 'border border-violet-200/70 bg-violet-50/90 text-violet-950 tabular-nums',
    footerTint: 'bg-gradient-to-r from-violet-500/[0.06] to-transparent',
  },
  {
    stripe: 'border-l-[5px] border-l-amber-500',
    iconWrap: 'bg-amber-500/[0.11] text-amber-900 ring-1 ring-amber-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
    badge: 'border border-amber-200/70 bg-amber-50/90 text-amber-950 tabular-nums',
    footerTint: 'bg-gradient-to-r from-amber-500/[0.06] to-transparent',
  },
  {
    stripe: 'border-l-[5px] border-l-emerald-500',
    iconWrap: 'bg-emerald-500/[0.11] text-emerald-900 ring-1 ring-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
    badge: 'border border-emerald-200/70 bg-emerald-50/90 text-emerald-950 tabular-nums',
    footerTint: 'bg-gradient-to-r from-emerald-500/[0.06] to-transparent',
  },
  {
    stripe: 'border-l-[5px] border-l-cyan-500',
    iconWrap: 'bg-cyan-500/[0.11] text-cyan-900 ring-1 ring-cyan-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
    badge: 'border border-cyan-200/70 bg-cyan-50/90 text-cyan-950 tabular-nums',
    footerTint: 'bg-gradient-to-r from-cyan-500/[0.06] to-transparent',
  },
  {
    stripe: 'border-l-[5px] border-l-teal-500',
    iconWrap: 'bg-teal-500/[0.11] text-teal-900 ring-1 ring-teal-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
    badge: 'border border-teal-200/70 bg-teal-50/90 text-teal-950 tabular-nums',
    footerTint: 'bg-gradient-to-r from-teal-500/[0.06] to-transparent',
  },
  {
    stripe: 'border-l-[5px] border-l-indigo-500',
    iconWrap: 'bg-indigo-500/[0.11] text-indigo-900 ring-1 ring-indigo-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
    badge: 'border border-indigo-200/70 bg-indigo-50/90 text-indigo-950 tabular-nums',
    footerTint: 'bg-gradient-to-r from-indigo-500/[0.06] to-transparent',
  },
  {
    stripe: 'border-l-[5px] border-l-blue-600',
    iconWrap: 'bg-blue-600/[0.11] text-blue-900 ring-1 ring-blue-600/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
    badge: 'border border-blue-200/70 bg-blue-50/90 text-blue-950 tabular-nums',
    footerTint: 'bg-gradient-to-r from-blue-600/[0.06] to-transparent',
  },
];

export function getCategoryCardAccent(categoryId, categoryName) {
  const key = String(categoryId || categoryName || '');
  return CARD_ACCENTS[hashString(key) % CARD_ACCENTS.length];
}
