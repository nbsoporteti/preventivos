import { defineCmsPage } from '@/lib/cms/cmsCore.js';

const B = {
	crumbInicio: 'Inicio',
	crumbBiblioteca: 'Biblioteca',
	loadingTitle: '…',
	descCardTitle: 'Descripción',
	sinDescripcion: 'Sin descripción.',
	publicadoLabel: 'Publicado',
	actualizadoLabel: 'Actualizado',
	descargasWord: 'descargas',
	favGuardar: 'Guardar en favoritos',
	favEn: 'En favoritos',
	btnDescargar: 'Descargar archivo',
	donateLeadBold: '¿Te ahorramos tiempo?',
	donateLeadRest:
		'Podés reconocer el aporte con una donación opcional (Mercado Pago si está configurado).',
	cargando: 'Cargando…',
	errInvalidLink: 'Enlace no válido',
	errNotFound: 'Recurso no encontrado o no publicado',
	errLoad: 'No se pudo cargar el recurso',
	errCardBtn: 'Ir a la biblioteca',
};

const FIELD_GROUPS = [
	{
		title: 'SEO (plantilla; el título real usa el nombre del recurso)',
		fields: [
			{
				key: '_meta_title',
				label: 'No usado en detalle (Helmet usa el recurso). Dejar o ignorar.',
				rows: 1,
				type: 'meta',
			},
			{
				key: '_meta_description',
				label: 'No usado igual que arriba',
				rows: 1,
				type: 'meta',
			},
		],
	},
	{
		title: 'Migas',
		fields: [
			{ key: 'crumbInicio', rows: 1 },
			{ key: 'crumbBiblioteca', rows: 1 },
		],
	},
	{
		title: 'Contenido',
		fields: [
			{ key: 'loadingTitle', label: 'Título mientras carga', rows: 1 },
			{ key: 'descCardTitle', label: 'Título tarjeta descripción', rows: 1 },
			{ key: 'sinDescripcion', rows: 1 },
			{ key: 'publicadoLabel', rows: 1 },
			{ key: 'actualizadoLabel', rows: 1 },
			{ key: 'descargasWord', label: 'Palabra tras número de descargas', rows: 1 },
			{ key: 'favGuardar', rows: 1 },
			{ key: 'favEn', rows: 1 },
			{ key: 'btnDescargar', rows: 1 },
		],
	},
	{
		title: 'Donación al pie',
		fields: [
			{ key: 'donateLeadBold', rows: 1 },
			{ key: 'donateLeadRest', rows: 2 },
		],
	},
	{
		title: 'Errores',
		fields: [
			{ key: 'cargando', rows: 1 },
			{ key: 'errInvalidLink', rows: 1 },
			{ key: 'errNotFound', rows: 1 },
			{ key: 'errLoad', rows: 1 },
			{ key: 'errCardBtn', rows: 1 },
		],
	},
];

export const recursoCmsPage = defineCmsPage({
	title: 'Recurso | Preventivos CL',
	description: 'Detalle de recurso de la biblioteca.',
	bloques: B,
	fieldGroups: FIELD_GROUPS,
});

export const mergeRecursoCms = (a) => recursoCmsPage.merge(a);
