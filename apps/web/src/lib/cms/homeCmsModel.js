import { defineCmsPage } from '@/lib/cms/cmsCore.js';

const B = {
	heroEyebrow: 'Prevención de riesgos en Chile',
	heroTitle: 'Biblioteca de Recursos de Prevención',
	heroLead:
		'Explorá por tema o buscá el documento que necesitás — matrices IPER, normativa, charlas y formatos listos para el trabajo seguro.',
	heroBulletLine:
		'Matrices IPER · Normativa y DS · Charlas de seguridad · Inspecciones y checklists',
	heroBtnExplorar: 'Explorar por tema',
	heroBtnBuscar: 'Buscar un documento',
	heroCatalogLink: 'Ver todo el catálogo en una sola lista',
	asideBold: '¿Te sirve esta biblioteca?',
	asideRest:
		'Podés apoyarnos con una donación voluntaria; con el enlace de Mercado Pago configurado, el pago es seguro en su sitio.',
	buscarHeading: 'Buscar en la biblioteca',
	loadErrorHint: '— Comprueba que la API esté en marcha.',
	highlightsLoadingLabel: 'Cargando destacados…',
	destTitle: 'Destacados',
	destSubtitle: 'Lo más descargado y lo más reciente en un solo lugar.',
	tabPopular: 'Más descargados',
	tabRecent: 'Novedades',
	favTitle: 'Tus favoritos',
	favLinkBiblioteca: 'Abrir biblioteca',
	filtrosBtnLabel: 'Filtros de categorías',
	filtrosCountTemplate: 'Mostrando {{current}} de {{total}} categorías',
	exploreTitle: 'Explorá por categoría',
	exploreSubtitle:
		'Ordenadas por cantidad de recursos. Usá el panel izquierdo para acotar la lista.',
	exploreCountLead: 'Mostrando ',
	exploreCountMid: ' de {{total}} categorías',
	exploreCountTemplate: '{{current}} de {{total}} categorías',
	emptyCatTitle: 'No se encontraron categorías',
	emptyCatBody:
		'Intenta ajustar tus términos de búsqueda o eliminar algunos filtros para ver más resultados.',
	emptyCatBtn: 'Limpiar filtros',
	searchResultsTitle: 'Recursos que coinciden',
	searchResultsForQ: 'Resultados para «{{q}}»',
	searchResultsTotalPart: ' ({{total}} en total)',
	searchResultsFooter: 'Para paginar y filtrar más, abrí la biblioteca.',
	searchNoResultsMsg:
		'No hay recursos que coincidan. Prueba otras palabras o explorá una categoría arriba.',
	searchContinueBiblioteca: 'Continuar en la biblioteca',
	searchRefineSearch: 'Refinar búsqueda',
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
		title: 'Hero',
		fields: [
			{ key: 'heroEyebrow', label: 'Antetítulo (línea superior pequeña)', rows: 1 },
			{ key: 'heroTitle', label: 'Título principal', rows: 2 },
			{ key: 'heroLead', label: 'Subtítulo / lead', rows: 3 },
			{ key: 'heroBulletLine', label: 'Línea con puntos medios (bajos el lead)', rows: 2 },
			{ key: 'heroBtnExplorar', label: 'Botón: explorar por tema', rows: 1 },
			{ key: 'heroBtnBuscar', label: 'Botón: buscar documento', rows: 1 },
			{ key: 'heroCatalogLink', label: 'Enlace: ver todo el catálogo', rows: 1 },
		],
	},
	{
		title: 'Franja de donación',
		fields: [
			{ key: 'asideBold', label: 'Texto en negrita del párrafo', rows: 1 },
			{ key: 'asideRest', label: 'Resto del párrafo', rows: 2 },
		],
	},
	{
		title: 'Buscar y destacados',
		fields: [
			{ key: 'buscarHeading', label: 'Encabezado sección buscar', rows: 1 },
			{ key: 'loadErrorHint', label: 'Sufijo del mensaje de error de carga', rows: 1 },
			{ key: 'highlightsLoadingLabel', label: 'Texto mientras cargan destacados', rows: 1 },
			{ key: 'destTitle', label: 'Título destacados', rows: 1 },
			{ key: 'destSubtitle', label: 'Subtítulo destacados', rows: 2 },
			{ key: 'tabPopular', label: 'Pestaña: más descargados', rows: 1 },
			{ key: 'tabRecent', label: 'Pestaña: novedades', rows: 1 },
		],
	},
	{
		title: 'Favoritos y filtros',
		fields: [
			{ key: 'favTitle', label: 'Título favoritos', rows: 1 },
			{ key: 'favLinkBiblioteca', label: 'Botón enlace a biblioteca', rows: 1 },
			{ key: 'filtrosBtnLabel', label: 'Botón móvil de filtros', rows: 1 },
			{
				key: 'filtrosCountTemplate',
				label: 'Conteo categorías (placeholders {{current}} {{total}})',
				rows: 1,
			},
		],
	},
	{
		title: 'Explorar categorías',
		fields: [
			{ key: 'exploreTitle', label: 'Encabezado', rows: 1 },
			{ key: 'exploreSubtitle', label: 'Subtítulo', rows: 2 },
			{ key: 'exploreCountLead', label: 'Escritorio: texto antes del número en negrita', rows: 1 },
			{ key: 'exploreCountMid', label: 'Escritorio: después del número ({{total}})', rows: 1 },
			{
				key: 'exploreCountTemplate',
				label: 'Móvil / plantilla alternativa ({{current}} {{total}})',
				rows: 1,
			},
			{ key: 'emptyCatTitle', label: 'Sin resultados: título', rows: 1 },
			{ key: 'emptyCatBody', label: 'Sin resultados: texto', rows: 2 },
			{ key: 'emptyCatBtn', label: 'Sin resultados: botón', rows: 1 },
		],
	},
	{
		title: 'Bloque de resultados de búsqueda (home)',
		fields: [
			{ key: 'searchResultsTitle', label: 'Encabezado', rows: 1 },
			{ key: 'searchResultsForQ', label: 'Línea “Resultados para…” ({{q}})', rows: 1 },
			{ key: 'searchResultsTotalPart', label: 'Parte opcional totales ({{total}})', rows: 1 },
			{ key: 'searchResultsFooter', label: 'Frase final debajo de la línea', rows: 2 },
			{ key: 'searchNoResultsMsg', label: 'Sin coincidencias en grilla', rows: 2 },
			{ key: 'searchContinueBiblioteca', label: 'Botón continuar en biblioteca', rows: 1 },
			{ key: 'searchRefineSearch', label: 'Botón refinar búsqueda', rows: 1 },
		],
	},
];

export const homeCmsPage = defineCmsPage({
	title: 'Biblioteca de Recursos de Prevención | Preventivos CL',
	description:
		'Explora nuestras categorías de recursos de prevención de riesgos, matrices IPER, normativas y charlas de seguridad.',
	bloques: B,
	fieldGroups: FIELD_GROUPS,
});

export const mergeHomeCms = (a) => homeCmsPage.merge(a);
