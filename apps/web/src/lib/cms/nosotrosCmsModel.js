import { defineCmsPage } from '@/lib/cms/cmsCore.js';

export const DEFAULT_NOSOTROS_META = {
	title: 'Sobre Nosotros | Preventivos CL',
	description:
		'Conoce más sobre Preventivos CL, nuestra misión, valores y equipo dedicado a la prevención de riesgos laborales',
};

export const DEFAULT_NOSOTROS_BLOQUES = {
	heroTitle: 'Sobre Nosotros',
	heroSubtitle: 'Comprometidos con la seguridad y prevención de riesgos laborales',
	quienesTitle: 'Quiénes somos',
	quienesP1:
		'Preventivos CL es una plataforma especializada en recursos de prevención de riesgos laborales, diseñada para apoyar a empresas y profesionales en la gestión de la seguridad ocupacional.',
	quienesP2:
		'Desde nuestra fundación, hemos trabajado incansablemente para democratizar el acceso a herramientas de calidad que permitan crear ambientes de trabajo más seguros y saludables.',
	quienesP3:
		'Nuestro equipo está conformado por expertos en prevención de riesgos, ingenieros en seguridad y profesionales comprometidos con la excelencia en cada recurso que compartimos.',
	quienesImageAlt: 'Equipo de trabajo colaborando en seguridad laboral',
	misionTitle: 'Nuestra misión',
	misionBody:
		'Proporcionar recursos de prevención de riesgos accesibles, actualizados y de alta calidad que permitan a las organizaciones proteger a sus equipos, cumplir con normativas vigentes y fomentar una cultura de seguridad sostenible.',
	valoresTitle: 'Nuestros valores',
	valor1Title: 'Seguridad',
	valor1Desc: 'Priorizamos la protección y bienestar de cada trabajador',
	valor2Title: 'Innovación',
	valor2Desc: 'Desarrollamos soluciones modernas para la prevención de riesgos',
	valor3Title: 'Confianza',
	valor3Desc: 'Construimos relaciones basadas en transparencia y compromiso',
	valor4Title: 'Accesibilidad',
	valor4Desc: 'Facilitamos el acceso a recursos de calidad para todos',
	donateTitle: 'Sostené nuestra misión',
	donateBody:
		'Mantener esta plataforma requiere tiempo y recursos. Podés colaborar con una donación; si está configurado Mercado Pago, el botón abre el pago seguro.',
	equipoTitle: 'Nuestro equipo',
	impactoTitle: 'Nuestro impacto',
};

export const NOSOTROS_CMS_FIELD_GROUPS = [
	{
		title: 'SEO',
		fields: [
			{ key: '_meta_title', label: 'Título de pestaña', rows: 1, type: 'meta' },
			{ key: '_meta_description', label: 'Meta descripción', rows: 2, type: 'meta' },
		],
	},
	{
		title: 'Hero (franja superior)',
		fields: [
			{ key: 'heroTitle', label: 'Título', rows: 2 },
			{ key: 'heroSubtitle', label: 'Subtítulo', rows: 2 },
		],
	},
	{
		title: 'Quiénes somos',
		fields: [
			{ key: 'quienesTitle', label: 'Encabezado de sección', rows: 1 },
			{ key: 'quienesP1', label: 'Primer párrafo', rows: 3 },
			{ key: 'quienesP2', label: 'Segundo párrafo', rows: 3 },
			{ key: 'quienesP3', label: 'Tercer párrafo', rows: 3 },
			{ key: 'quienesImageAlt', label: 'Texto alternativo de la imagen', rows: 2 },
		],
	},
	{
		title: 'Misión',
		fields: [
			{ key: 'misionTitle', label: 'Encabezado', rows: 1 },
			{ key: 'misionBody', label: 'Texto', rows: 4 },
		],
	},
	{
		title: 'Valores (orden fijo: Seguridad → Innovación → Confianza → Accesibilidad)',
		fields: [
			{ key: 'valoresTitle', label: 'Encabezado de la grilla', rows: 1 },
			{ key: 'valor1Title', label: 'Valor 1 — título', rows: 1 },
			{ key: 'valor1Desc', label: 'Valor 1 — descripción', rows: 2 },
			{ key: 'valor2Title', label: 'Valor 2 — título', rows: 1 },
			{ key: 'valor2Desc', label: 'Valor 2 — descripción', rows: 2 },
			{ key: 'valor3Title', label: 'Valor 3 — título', rows: 1 },
			{ key: 'valor3Desc', label: 'Valor 3 — descripción', rows: 2 },
			{ key: 'valor4Title', label: 'Valor 4 — título', rows: 1 },
			{ key: 'valor4Desc', label: 'Valor 4 — descripción', rows: 2 },
		],
	},
	{
		title: 'Bloque de donación',
		fields: [
			{ key: 'donateTitle', label: 'Título', rows: 2 },
			{ key: 'donateBody', label: 'Texto', rows: 4 },
		],
	},
	{
		title: 'Otras secciones',
		fields: [
			{ key: 'equipoTitle', label: 'Título — Nuestro equipo (las tarjetas siguen en código demo)', rows: 1 },
			{ key: 'impactoTitle', label: 'Título — Nuestro impacto (cifras en código demo)', rows: 1 },
		],
	},
];

export const nosotrosCmsPage = defineCmsPage({
	title: DEFAULT_NOSOTROS_META.title,
	description: DEFAULT_NOSOTROS_META.description,
	bloques: DEFAULT_NOSOTROS_BLOQUES,
	fieldGroups: NOSOTROS_CMS_FIELD_GROUPS,
});

export const mergeNosotrosCms = (a) => nosotrosCmsPage.merge(a);
export const bloquesForSaveNosotros = (m) => nosotrosCmsPage.save(m);
