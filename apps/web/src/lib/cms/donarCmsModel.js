import { defineCmsPage } from '@/lib/cms/cmsCore.js';

export const DEFAULT_DONAR_META = {
	title: 'Donar | Preventivos CL',
	description:
		'Apoyá Preventivos CL con una donación voluntaria. Pago seguro con Mercado Pago.',
};

export const DEFAULT_DONAR_BLOQUES = {
	heroTitle: 'Gracias por pensar en apoyarnos',
	heroLeadBefore:
		'Preventivos CL es un esfuerzo para acercar prevención y recursos de calidad. Si este trabajo te sirve, podés colaborar con una donación ',
	heroLeadBold: 'libre y voluntaria',
	heroLeadAfter: '.',
	securityLead: 'Cuando uses el botón de abajo, el pago lo procesa ',
	securityHighlight: 'Mercado Pago',
	securityTrail: ' en su entorno seguro. Nosotros no almacenamos datos de tu tarjeta.',
	mpCtaHint:
		'Se abre Mercado Pago en una nueva pestaña para que completes el monto que quieras.',
	noMpTitle: 'Pronto habilitaremos el cobro online',
	noMpBody:
		'El enlace de Mercado Pago aún no está configurado en el sitio. Si querés coordinar una colaboración, escribinos.',
	noMpContactLabel: 'Ir a Contacto',
	trustLine1: 'Sin suscripción forzada',
	trustLine2: 'Monto a tu elección',
	signoffParagraph:
		'Cualquier aporte nos ayuda a mantener la biblioteca, las herramientas y el contenido actualizado.',
	signoffAttribution: '— El equipo de Preventivos CL',
	backLinkLabel: 'Volver al inicio',
};

export const DONAR_CMS_FIELD_GROUPS = [
	{
		title: 'SEO',
		fields: [
			{ key: '_meta_title', label: 'Título de pestaña', rows: 1, type: 'meta' },
			{ key: '_meta_description', label: 'Meta descripción', rows: 2, type: 'meta' },
		],
	},
	{
		title: 'Encabezado',
		fields: [
			{ key: 'backLinkLabel', label: 'Texto del enlace “volver”', rows: 1 },
			{ key: 'heroTitle', label: 'Título principal (H1)', rows: 2 },
			{ key: 'heroLeadBefore', label: 'Párrafo intro — antes del texto en negrita', rows: 2 },
			{ key: 'heroLeadBold', label: 'Párrafo intro — parte en negrita', rows: 1 },
			{ key: 'heroLeadAfter', label: 'Párrafo intro — después de la negrita (ej. punto)', rows: 1 },
		],
	},
	{
		title: 'Caja de seguridad (Mercado Pago)',
		fields: [
			{ key: 'securityLead', label: 'Texto antes del nombre “Mercado Pago”', rows: 2 },
			{ key: 'securityHighlight', label: 'Destacado (se muestra en negrita)', rows: 1 },
			{ key: 'securityTrail', label: 'Texto después del destacado', rows: 2 },
		],
	},
	{
		title: 'Botón de pago',
		fields: [{ key: 'mpCtaHint', label: 'Texto bajo el botón (cuando MP está configurado)', rows: 2 }],
	},
	{
		title: 'Sin Mercado Pago (fallback)',
		fields: [
			{ key: 'noMpTitle', label: 'Título del aviso', rows: 1 },
			{ key: 'noMpBody', label: 'Texto del aviso', rows: 3 },
			{ key: 'noMpContactLabel', label: 'Texto del botón a contacto', rows: 1 },
		],
	},
	{
		title: 'Pie de tarjeta',
		fields: [
			{ key: 'trustLine1', label: 'Línea de confianza 1', rows: 1 },
			{ key: 'trustLine2', label: 'Línea de confianza 2', rows: 1 },
		],
	},
	{
		title: 'Cierre de página',
		fields: [
			{ key: 'signoffParagraph', label: 'Párrafo final', rows: 3 },
			{ key: 'signoffAttribution', label: 'Firma / atribución', rows: 1 },
		],
	},
];

export const donarCmsPage = defineCmsPage({
	title: DEFAULT_DONAR_META.title,
	description: DEFAULT_DONAR_META.description,
	bloques: DEFAULT_DONAR_BLOQUES,
	fieldGroups: DONAR_CMS_FIELD_GROUPS,
});

export const mergeDonarCms = (a) => donarCmsPage.merge(a);
export const bloquesForSaveDonar = (m) => donarCmsPage.save(m);
