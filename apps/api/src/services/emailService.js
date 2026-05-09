import 'dotenv/config';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

function smtpConfigured() {
	const user = process.env.SMTP_USER || '';
	const pass = process.env.SMTP_PASS || '';
	if (!process.env.SMTP_HOST || !user || !pass) return false;
	if (user.includes('your-email') || user.includes('example')) return false;
	return true;
}

function getTransport() {
	if (!smtpConfigured()) return null;
	return nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT) || 587,
		secure: process.env.SMTP_SECURE === 'true',
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});
}

function fromAddress() {
	const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@localhost';
	const name = process.env.SMTP_FROM_NAME || 'Preventivos CL';
	return `"${name}" <${email}>`;
}

function webAppOrigin() {
	if (process.env.WEB_APP_URL) {
		return process.env.WEB_APP_URL.replace(/\/$/, '');
	}
	const domain = process.env.WEBSITE_DOMAIN || 'localhost:3000';
	const protocol = domain.includes('localhost') ? 'http' : 'https';
	return `${protocol}://${domain}`;
}

/**
 * Código de verificación (registro / reenvío).
 */
export async function sendVerificationEmail(email, otpCode) {
	const transport = getTransport();
	if (!transport) {
		logger.warn(
			`[email] SMTP no configurado. Código de verificación para ${email}: ${otpCode}`,
		);
		return { success: true, skipped: true };
	}

	await transport.sendMail({
		from: fromAddress(),
		to: email,
		subject: 'Verifica tu correo - Preventivos CL',
		html: `<h2>Bienvenido a Preventivos CL</h2>
<p>Tu código de verificación es:</p>
<h1 style="color:#007bff;font-size:32px;letter-spacing:5px;">${otpCode}</h1>
<p>Este código expira en 10 minutos.</p>
<p>Si no solicitaste esta cuenta, ignora este mensaje.</p>`,
		text: `Tu código de verificación Preventivos CL: ${otpCode} (válido 10 minutos)`,
	});

	logger.info(`Verification email sent to ${email}`);
	return { success: true };
}

export async function sendWelcomeEmail(email, name) {
	const transport = getTransport();
	if (!transport) {
		logger.info(`[email] SMTP omitido. Bienvenida a ${email}`);
		return { success: true, skipped: true };
	}

	const who = name || 'usuario';
	await transport.sendMail({
		from: fromAddress(),
		to: email,
		subject: 'Correo verificado - Preventivos CL',
		html: `<p>Hola ${who},</p><p>Tu correo ya está verificado. Ya puedes iniciar sesión.</p>`,
		text: `Hola ${who}. Tu correo ya está verificado.`,
	});

	return { success: true };
}

export async function sendPasswordRecoveryEmail(email, resetToken) {
	const transport = getTransport();
	const link = `${webAppOrigin()}/resetear-contrasena/${encodeURIComponent(resetToken)}`;

	if (!transport) {
		logger.warn(
			`[email] SMTP no configurado. Enlace recuperación para ${email}: ${link}`,
		);
		return { success: true, skipped: true };
	}

	await transport.sendMail({
		from: fromAddress(),
		to: email,
		subject: 'Recuperar contraseña - Preventivos CL',
		html: `<p>Haz clic para restablecer tu contraseña:</p><p><a href="${link}">${link}</a></p>`,
		text: `Restablecer contraseña: ${link}`,
	});

	return { success: true };
}

export async function sendDownloadConfirmationEmail(email, resourceName) {
	const transport = getTransport();
	if (!transport) {
		logger.info(`[email] SMTP omitido. Descarga confirmada para ${email}`);
		return { success: true, skipped: true };
	}

	await transport.sendMail({
		from: fromAddress(),
		to: email,
		subject: 'Descarga registrada - Preventivos CL',
		html: `<p>Se registró tu descarga de: <strong>${resourceName}</strong>.</p>`,
		text: `Descarga registrada: ${resourceName}`,
	});

	return { success: true };
}
