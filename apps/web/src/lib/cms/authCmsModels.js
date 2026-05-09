import { defineCmsPage } from '@/lib/cms/cmsCore.js';

const G_META = () => [
	{
		title: 'SEO',
		fields: [
			{ key: '_meta_title', label: 'Título pestaña', rows: 1, type: 'meta' },
			{ key: '_meta_description', label: 'Meta descripción', rows: 2, type: 'meta' },
		],
	},
];

export const loginCmsPage = defineCmsPage({
	title: 'Iniciar Sesión | Preventivos CL',
	description: 'Ingresa a tu cuenta de Preventivos CL para acceder a recursos de prevención.',
	bloques: {
		cardTitle: 'Bienvenido',
		cardDesc: 'Ingresa tus credenciales para acceder a tu cuenta',
		labelEmail: 'Correo Electrónico',
		placeholderEmail: 'nombre@ejemplo.com',
		labelPassword: 'Contraseña',
		linkForgot: '¿Olvidaste tu contraseña?',
		btnLoading: 'Iniciando sesión...',
		btnSubmit: 'Iniciar Sesión',
		footerPrefix: '¿No tienes una cuenta?',
		footerLink: 'Regístrate ahora',
	},
	fieldGroups: [
		...G_META(),
		{
			title: 'Tarjeta',
			fields: [
				{ key: 'cardTitle', rows: 1 },
				{ key: 'cardDesc', rows: 2 },
				{ key: 'labelEmail', rows: 1 },
				{ key: 'placeholderEmail', rows: 1 },
				{ key: 'labelPassword', rows: 1 },
				{ key: 'linkForgot', rows: 1 },
				{ key: 'btnLoading', rows: 1 },
				{ key: 'btnSubmit', rows: 1 },
				{ key: 'footerPrefix', rows: 1 },
				{ key: 'footerLink', rows: 1 },
			],
		},
	],
});

export const registroCmsPage = defineCmsPage({
	title: 'Registro | Preventivos CL',
	description: 'Crea tu cuenta en Preventivos CL para acceder a herramientas exclusivas.',
	bloques: {
		cardTitle: 'Crea tu Cuenta',
		cardDesc: 'Únete a nuestra comunidad de profesionales en prevención',
		labelName: 'Nombre Completo',
		placeholderName: 'Juan Pérez',
		labelEmail: 'Correo Electrónico',
		placeholderEmail: 'nombre@ejemplo.com',
		labelPassword: 'Contraseña',
		labelConfirm: 'Confirmar Contraseña',
		reqTitle: 'Requisitos de la contraseña:',
		reqLen: 'Mínimo 8 caracteres',
		reqUpper: 'Una mayúscula',
		reqLower: 'Una minúscula',
		reqNum: 'Un número',
		reqSym: 'Un símbolo (ej. @, #, $)',
		btnLoading: 'Registrando...',
		btnSubmit: 'Crear Cuenta',
		footerPrefix: '¿Ya tienes una cuenta?',
		footerLink: 'Inicia sesión',
	},
	fieldGroups: [
		...G_META(),
		{
			title: 'Registro',
			fields: [
				{ key: 'cardTitle', rows: 1 },
				{ key: 'cardDesc', rows: 2 },
				{ key: 'labelName', rows: 1 },
				{ key: 'placeholderName', rows: 1 },
				{ key: 'labelEmail', rows: 1 },
				{ key: 'placeholderEmail', rows: 1 },
				{ key: 'labelPassword', rows: 1 },
				{ key: 'labelConfirm', rows: 1 },
				{ key: 'reqTitle', rows: 1 },
				{ key: 'reqLen', rows: 1 },
				{ key: 'reqUpper', rows: 1 },
				{ key: 'reqLower', rows: 1 },
				{ key: 'reqNum', rows: 1 },
				{ key: 'reqSym', rows: 1 },
				{ key: 'btnLoading', rows: 1 },
				{ key: 'btnSubmit', rows: 1 },
				{ key: 'footerPrefix', rows: 1 },
				{ key: 'footerLink', rows: 1 },
			],
		},
	],
});

export const verificarEmailCmsPage = defineCmsPage({
	title: 'Verificar Email | Preventivos CL',
	description: 'Verificación de correo electrónico.',
	bloques: {
		cardTitle: 'Verifica tu Correo',
		cardDescBefore: 'Hemos enviado un código de 6 dígitos a',
		cardDescAfter: '',
		btnLoading: 'Verificando...',
		btnSubmit: 'Confirmar Código',
		resendWait: 'Reenviar código en {{s}}s',
		resendReady: 'Reenviar código',
	},
	fieldGroups: [
		...G_META(),
		{
			title: 'Verificación',
			fields: [
				{ key: 'cardTitle', rows: 1 },
				{ key: 'cardDescBefore', label: 'Antes del correo', rows: 2 },
				{ key: 'cardDescAfter', label: 'Después del correo (opcional)', rows: 1 },
				{ key: 'btnLoading', rows: 1 },
				{ key: 'btnSubmit', rows: 1 },
				{ key: 'resendWait', label: 'Reenviar ({{s}})', rows: 1 },
				{ key: 'resendReady', rows: 1 },
			],
		},
	],
});

export const recuperarContrasenaCmsPage = defineCmsPage({
	title: 'Recuperar Contraseña | Preventivos CL',
	description: 'Recuperación de acceso a tu cuenta.',
	bloques: {
		cardTitle: 'Recuperar Contraseña',
		cardDescForm: 'Ingresa tu correo para recibir las instrucciones',
		cardDescSent: 'Revisa tu bandeja de entrada',
		sentBody:
			'Hemos enviado un enlace de recuperación a tu correo electrónico. Por favor revisa tu carpeta de spam si no lo encuentras.',
		labelEmail: 'Correo Electrónico',
		placeholderEmail: 'nombre@ejemplo.com',
		btnLoading: 'Enviando...',
		btnSubmit: 'Enviar Enlace',
		backLogin: 'Volver a Iniciar Sesión',
	},
	fieldGroups: [
		...G_META(),
		{
			title: 'Recuperar',
			fields: [
				{ key: 'cardTitle', rows: 1 },
				{ key: 'cardDescForm', rows: 2 },
				{ key: 'cardDescSent', rows: 1 },
				{ key: 'sentBody', rows: 3 },
				{ key: 'labelEmail', rows: 1 },
				{ key: 'placeholderEmail', rows: 1 },
				{ key: 'btnLoading', rows: 1 },
				{ key: 'btnSubmit', rows: 1 },
				{ key: 'backLogin', rows: 1 },
			],
		},
	],
});

export const resetearContrasenaCmsPage = defineCmsPage({
	title: 'Establecer Nueva Contraseña | Preventivos CL',
	description: 'Define una nueva contraseña para tu cuenta.',
	bloques: {
		cardTitle: 'Nueva Contraseña',
		cardDesc: 'Ingresa una contraseña segura que no hayas usado antes',
		labelPassword: 'Nueva Contraseña',
		labelConfirm: 'Confirmar Nueva Contraseña',
		reqLen: 'Mínimo 8 caracteres',
		reqUpper: 'Una mayúscula',
		reqLower: 'Una minúscula',
		reqNum: 'Un número',
		reqSym: 'Un símbolo especial',
		btnLoading: 'Guardando...',
		btnSubmit: 'Restablecer Contraseña',
	},
	fieldGroups: [
		...G_META(),
		{
			title: 'Reset',
			fields: [
				{ key: 'cardTitle', rows: 1 },
				{ key: 'cardDesc', rows: 2 },
				{ key: 'labelPassword', rows: 1 },
				{ key: 'labelConfirm', rows: 1 },
				{ key: 'reqLen', rows: 1 },
				{ key: 'reqUpper', rows: 1 },
				{ key: 'reqLower', rows: 1 },
				{ key: 'reqNum', rows: 1 },
				{ key: 'reqSym', rows: 1 },
				{ key: 'btnLoading', rows: 1 },
				{ key: 'btnSubmit', rows: 1 },
			],
		},
	],
});

export const mergeLoginCms = (a) => loginCmsPage.merge(a);
export const mergeRegistroCms = (a) => registroCmsPage.merge(a);
export const mergeVerificarEmailCms = (a) => verificarEmailCmsPage.merge(a);
export const mergeRecuperarContrasenaCms = (a) => recuperarContrasenaCmsPage.merge(a);
export const mergeResetearContrasenaCms = (a) => resetearContrasenaCmsPage.merge(a);
