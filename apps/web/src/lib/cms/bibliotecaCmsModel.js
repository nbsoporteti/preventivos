import { defineCmsPage } from '@/lib/cms/cmsCore.js';

const B = {
	crumbInicio: 'Inicio',
	crumbBiblioteca: 'Biblioteca',
	heroTitle: 'Biblioteca de recursos',
	heroLead: 'Filtra por categoría, tipo de archivo o busca por palabra en título y descripción.',
	donateLine:
		'Este catálogo es gratuito; si querés ayudarnos a mantenerlo, podés usar el botón de donación (Mercado Pago cuando esté configurado).',
	labelBuscar: 'Buscar',
	placeholderBuscar: 'Mínimo 2 caracteres…',
	btnBuscar: 'Buscar',
	labelCategoria: 'Categoría',
	labelTipo: 'Tipo de archivo',
	labelOrden: 'Orden',
	recursosEncontradosTemplate: '{{n}} recurso{{plural}} encontrados',
	emptyListMsg: 'No hay recursos con estos filtros. Probá ampliar la búsqueda o cambiar categoría.',
	btnAnterior: 'Anterior',
	btnSiguiente: 'Siguiente',
	paginaDeTemplate: 'Página {{page}} de {{pages}}',
};

const FIELD_GROUPS = [
	{
		title: 'SEO',
		fields: [
			{ key: '_meta_title', label: 'Título de pestaña', rows: 1, type: 'meta' },
			{ key: '_meta_description', label: 'Meta descripción', rows: 2, type: 'meta' },
		],
	},
	{
		title: 'Cabecera',
		fields: [
			{ key: 'crumbInicio', label: 'Miga: inicio', rows: 1 },
			{ key: 'crumbBiblioteca', label: 'Miga: biblioteca', rows: 1 },
			{ key: 'heroTitle', label: 'Título H1', rows: 2 },
			{ key: 'heroLead', label: 'Subtítulo', rows: 2 },
			{ key: 'donateLine', label: 'Franja gris — texto', rows: 3 },
		],
	},
	{
		title: 'Listado',
		fields: [
			{ key: 'labelBuscar', label: 'Etiqueta campo buscar', rows: 1 },
			{ key: 'placeholderBuscar', label: 'Placeholder buscar', rows: 1 },
			{ key: 'btnBuscar', label: 'Botón buscar', rows: 1 },
			{ key: 'labelCategoria', rows: 1 },
			{ key: 'labelTipo', rows: 1 },
			{ key: 'labelOrden', rows: 1 },
			{
				key: 'recursosEncontradosTemplate',
				label: 'Conteo ({{n}} y {{plural}} = s o vacío)',
				rows: 1,
			},
			{ key: 'emptyListMsg', label: 'Lista vacía', rows: 2 },
			{ key: 'btnAnterior', rows: 1 },
			{ key: 'btnSiguiente', rows: 1 },
			{ key: 'paginaDeTemplate', label: 'Paginación ({{page}} {{pages}})', rows: 1 },
		],
	},
];

export const bibliotecaCmsPage = defineCmsPage({
	title: 'Biblioteca de recursos | Preventivos CL',
	description:
		'Explora y descarga matrices IPER, normativas, charlas y documentos de prevención de riesgos.',
	bloques: B,
	fieldGroups: FIELD_GROUPS,
});

export const mergeBibliotecaCms = (a) => bibliotecaCmsPage.merge(a);
