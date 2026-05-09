import { homeCmsPage } from '@/lib/cms/homeCmsModel.js';
import { donarCmsPage } from '@/lib/cms/donarCmsModel.js';
import { nosotrosCmsPage } from '@/lib/cms/nosotrosCmsModel.js';
import { contactoCmsPage } from '@/lib/cms/contactoCmsModel.js';
import { bibliotecaCmsPage } from '@/lib/cms/bibliotecaCmsModel.js';
import { recursoCmsPage } from '@/lib/cms/recursoCmsModel.js';
import { categoriaCmsPage } from '@/lib/cms/categoriaCmsModel.js';
import { aprendeCmsPage } from '@/lib/cms/aprendeCmsModel.js';
import {
	loginCmsPage,
	registroCmsPage,
	verificarEmailCmsPage,
	recuperarContrasenaCmsPage,
	resetearContrasenaCmsPage,
} from '@/lib/cms/authCmsModels.js';

function pack(label, previewPath, page) {
	return {
		label,
		previewPath,
		merge: page.merge,
		save: page.save,
		fieldGroups: page.fieldGroups,
	};
}

/** Orden en el selector del admin */
export const CMS_PAGE_ORDER = [
	'inicio',
	'biblioteca',
	'nosotros',
	'contacto',
	'donar',
	'recurso',
	'categoria',
	'aprende',
	'login',
	'registro',
	'verificar_email',
	'recuperar_contrasena',
	'resetear_contrasena',
];

export const CMS_PAGE_REGISTRY = {
	inicio: pack('Inicio (/)', '/', homeCmsPage),
	biblioteca: pack('Biblioteca (/biblioteca)', '/biblioteca', bibliotecaCmsPage),
	nosotros: pack('Nosotros (/nosotros)', '/nosotros', nosotrosCmsPage),
	contacto: pack('Contacto (/contacto)', '/contacto', contactoCmsPage),
	donar: pack('Donar (/donar)', '/donar', donarCmsPage),
	recurso: pack('Detalle recurso (plantilla)', '/biblioteca', recursoCmsPage),
	categoria: pack('Listado categoría (plantilla)', '/biblioteca', categoriaCmsPage),
	aprende: pack('Aprende (dashboard)', '/dashboard/aprende', aprendeCmsPage),
	login: pack('Login (/login)', '/login', loginCmsPage),
	registro: pack('Registro (/registro)', '/registro', registroCmsPage),
	verificar_email: pack('Verificar email', '/verificar-email', verificarEmailCmsPage),
	recuperar_contrasena: pack('Recuperar contraseña', '/recuperar-contrasena', recuperarContrasenaCmsPage),
	resetear_contrasena: pack('Nueva contraseña (plantilla)', '/login', resetearContrasenaCmsPage),
};

export function cmsPreviewPath(slug) {
	return CMS_PAGE_REGISTRY[slug]?.previewPath || '/';
}
