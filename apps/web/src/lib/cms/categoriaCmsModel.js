import { defineCmsPage } from '@/lib/cms/cmsCore.js';

const B = {
	crumbInicio: 'Inicio',
	crumbBiblioteca: 'Biblioteca',
	fallbackCategoryName: 'Categoría',
	descFallback: 'Explora los recursos de esta categoría.',
	searchPlaceholderTpl: 'Buscar en {{nombre}}…',
	btnBuscar: 'Buscar',
	labelOrdenar: 'Ordenar por',
	labelTipo: 'Tipo de archivo',
	countTpl: '{{n}} recurso{{plural}} en esta categoría',
	btnAnterior: 'Anterior',
	btnSiguiente: 'Siguiente',
	paginaDeTemplate: 'Página {{page}} de {{pages}}',
	errInvalid: 'Categoría no válida',
	errNotFound: 'Categoría no encontrada',
	errLoad: 'No se pudieron cargar los recursos',
	errTitle: 'No disponible',
	emptyTitleNoResults: 'No se encontraron resultados',
	emptyTitleVacía: 'Categoría vacía',
	emptyBodyError: 'Vuelve al inicio o prueba otra categoría.',
	emptyBodyNoQ: 'Aún no hay recursos publicados en esta categoría.',
	emptyBodyQ: 'No hay recursos que coincidan con «{{q}}».',
	btnLimpiar: 'Limpiar búsqueda',
	btnVerBiblioteca: 'Ver toda la biblioteca',
	metaDescFallback: 'Explora recursos de esta categoría.',
};

const FIELD_GROUPS = [
	{
		title: 'SEO (descripción por defecto si la categoría no tiene)',
		fields: [
			{ key: '_meta_title', label: '(La pestaña usa el nombre de la categoría)', rows: 1, type: 'meta' },
			{ key: '_meta_description', label: 'Meta descripción fallback', rows: 2, type: 'meta' },
			{ key: 'metaDescFallback', label: 'Texto si API no trae descripción', rows: 2 },
		],
	},
	{
		title: 'Migas y búsqueda',
		fields: [
			{ key: 'crumbInicio', rows: 1 },
			{ key: 'crumbBiblioteca', rows: 1 },
			{ key: 'fallbackCategoryName', label: 'Nombre temporal mientras carga', rows: 1 },
			{ key: 'descFallback', label: 'Descripción bajo título si no hay en API', rows: 2 },
			{ key: 'searchPlaceholderTpl', label: 'Placeholder ({{nombre}})', rows: 1 },
			{ key: 'btnBuscar', rows: 1 },
			{ key: 'labelOrdenar', rows: 1 },
			{ key: 'labelTipo', rows: 1 },
		],
	},
	{
		title: 'Listado y vacíos',
		fields: [
			{ key: 'countTpl', label: '{{n}} {{plural}} (s o vacío)', rows: 1 },
			{ key: 'btnAnterior', rows: 1 },
			{ key: 'btnSiguiente', rows: 1 },
			{ key: 'paginaDeTemplate', rows: 1 },
			{ key: 'errInvalid', rows: 1 },
			{ key: 'errNotFound', rows: 1 },
			{ key: 'errLoad', rows: 1 },
			{ key: 'errTitle', rows: 1 },
			{ key: 'emptyTitleNoResults', rows: 1 },
			{ key: 'emptyTitleVacía', rows: 1 },
			{ key: 'emptyBodyError', rows: 1 },
			{ key: 'emptyBodyNoQ', rows: 1 },
			{ key: 'emptyBodyQ', label: 'Con {{q}} en búsqueda', rows: 2 },
			{ key: 'btnLimpiar', rows: 1 },
			{ key: 'btnVerBiblioteca', rows: 1 },
		],
	},
];

export const categoriaCmsPage = defineCmsPage({
	title: 'Categoría | Preventivos CL',
	description: B.metaDescFallback,
	bloques: B,
	fieldGroups: FIELD_GROUPS,
});

export const mergeCategoriaCms = (a) => categoriaCmsPage.merge(a);
