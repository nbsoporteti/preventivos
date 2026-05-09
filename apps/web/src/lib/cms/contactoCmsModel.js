import { defineCmsPage } from '@/lib/cms/cmsCore.js';

const B = {
	heroTitle: 'Ponte en contacto',
	heroSubtitle: 'Estamos aquí para ayudarte con tus consultas sobre prevención de riesgos',
	infoTitle: 'Información de contacto',
	infoLead:
		'Nuestro equipo está disponible para responder tus consultas y brindarte el apoyo que necesitas.',
	addrTitle: 'Dirección',
	addrLines: 'Av. Providencia 1234, Oficina 567\nSantiago, Chile',
	phoneTitle: 'Teléfono',
	phoneLine: '+56 2 2345 6789',
	emailTitle: 'Email',
	emailLine: 'contacto@preventivoscl.com',
	donateTitle: 'Donaciones',
	donateBody:
		'Colaborá con una donación voluntaria. Si el sitio tiene configurado un link de Mercado Pago, el botón abre el pago seguro; si no, te contamos cómo seguir desde aquí mismo.',
	hoursTitle: 'Horario de atención',
	hoursLines: 'Lunes a Viernes: 9:00 - 18:00\nSábado: 9:00 - 13:00',
	socialTitle: 'Síguenos en redes sociales',
	formTitle: 'Envíanos un mensaje',
	labelName: 'Nombre completo',
	placeholderName: 'Tu nombre',
	labelEmail: 'Email',
	placeholderEmail: 'tu@email.com',
	labelSubject: 'Asunto',
	placeholderSubject: '¿En qué podemos ayudarte?',
	labelMessage: 'Mensaje',
	placeholderMessage: 'Escribe tu mensaje aquí...',
	submitBtn: 'Enviar mensaje',
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
			{ key: 'heroTitle', label: 'Título', rows: 2 },
			{ key: 'heroSubtitle', label: 'Subtítulo', rows: 2 },
		],
	},
	{
		title: 'Bloque información',
		fields: [
			{ key: 'infoTitle', label: 'Encabezado', rows: 1 },
			{ key: 'infoLead', label: 'Párrafo intro', rows: 3 },
			{ key: 'addrTitle', label: 'Tarjeta dirección — título', rows: 1 },
			{ key: 'addrLines', label: 'Tarjeta dirección — líneas (usa Enter)', rows: 2 },
			{ key: 'phoneTitle', label: 'Tarjeta teléfono — título', rows: 1 },
			{ key: 'phoneLine', label: 'Tarjeta teléfono — número', rows: 1 },
			{ key: 'emailTitle', label: 'Tarjeta email — título', rows: 1 },
			{ key: 'emailLine', label: 'Tarjeta email — dirección', rows: 1 },
			{ key: 'donateTitle', label: 'Tarjeta donaciones — título', rows: 1 },
			{ key: 'donateBody', label: 'Tarjeta donaciones — texto', rows: 3 },
			{ key: 'hoursTitle', label: 'Tarjeta horario — título', rows: 1 },
			{ key: 'hoursLines', label: 'Tarjeta horario — líneas', rows: 2 },
			{ key: 'socialTitle', label: 'Encabezado redes', rows: 1 },
		],
	},
	{
		title: 'Formulario',
		fields: [
			{ key: 'formTitle', label: 'Título del formulario', rows: 1 },
			{ key: 'labelName', rows: 1 },
			{ key: 'placeholderName', rows: 1 },
			{ key: 'labelEmail', rows: 1 },
			{ key: 'placeholderEmail', rows: 1 },
			{ key: 'labelSubject', rows: 1 },
			{ key: 'placeholderSubject', rows: 1 },
			{ key: 'labelMessage', rows: 1 },
			{ key: 'placeholderMessage', rows: 2 },
			{ key: 'submitBtn', label: 'Botón enviar', rows: 1 },
		],
	},
];

export const contactoCmsPage = defineCmsPage({
	title: 'Contacto | Preventivos CL',
	description:
		'Ponte en contacto con Preventivos CL. Estamos aquí para ayudarte con tus consultas sobre prevención de riesgos',
	bloques: B,
	fieldGroups: FIELD_GROUPS,
});

export const mergeContactoCms = (a) => contactoCmsPage.merge(a);
