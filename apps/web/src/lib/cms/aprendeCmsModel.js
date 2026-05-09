import { defineCmsPage } from '@/lib/cms/cmsCore.js';

const B = {
	heroTitle: 'Aprende',
	heroSubtitle: 'Cuestionarios agrupados por categoría. Tu puntaje queda registrado en tu cuenta.',
	errGeneric: 'No se pudieron cargar las actividades',
	emptyMsg: 'Aún no hay actividades publicadas.',
	btnComenzar: 'Comenzar',
};

const FIELD_GROUPS = [
	{
		title: 'Contenido (dashboard / aprende)',
		fields: [
			{ key: '_meta_title', label: 'Título de pestaña', rows: 1, type: 'meta' },
			{ key: '_meta_description', label: 'Meta descripción', rows: 2, type: 'meta' },
			{ key: 'heroTitle', rows: 1 },
			{ key: 'heroSubtitle', rows: 2 },
			{ key: 'errGeneric', label: 'Error al cargar listado', rows: 1 },
			{ key: 'emptyMsg', rows: 2 },
			{ key: 'btnComenzar', rows: 1 },
		],
	},
];

export const aprendeCmsPage = defineCmsPage({
	title: 'Aprende | Mi Dashboard',
	description: 'Actividades y cuestionarios de prevención.',
	bloques: B,
	fieldGroups: FIELD_GROUPS,
});

export const mergeAprendeCms = (a) => aprendeCmsPage.merge(a);
