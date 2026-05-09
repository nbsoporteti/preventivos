import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';
import { newId } from '../db/id.js';
import { generateOTP, storeOTP, verifyOTP } from '../utils/otpUtils.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordRecoveryEmail } from '../services/emailService.js';
import { verifyUserToken } from '../middleware/auth.js';
import { loginLimiter, signupLimiter } from '../middleware/rateLimiter.js';
import { formatPublicUser } from '../utils/userDto.js';
import { signUserToken } from '../utils/jwtAuth.js';
import logger from '../utils/logger.js';

const router = express.Router();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

const recoveryTokens = new Map();

router.post('/register', signupLimiter, async (req, res) => {
	const nombre = (req.body.nombre ?? req.body.name ?? '').trim();
	const { email, password, passwordConfirm } = req.body;

	if (!nombre || !email || !password || !passwordConfirm) {
		return res.status(400).json({ error: 'Todos los campos son obligatorios' });
	}

	if (password !== passwordConfirm) {
		return res.status(400).json({ error: 'Las contraseñas no coinciden' });
	}

	if (password.length < 8) {
		return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
	}

	const normalizedEmail = email.toLowerCase().trim();

	const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
	if (existing.length) {
		return res.status(400).json({ error: 'El correo ya está registrado' });
	}

	const id = newId();
	const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
	try {
		await pool.query(
			`INSERT INTO users (id, email, password_hash, nombre, rol, email_verificado, activo)
			 VALUES (?, ?, ?, ?, 'usuario', 0, 1)`,
			[id, normalizedEmail, password_hash, nombre],
		);
	} catch (err) {
		logger.warn(`Register failed for ${normalizedEmail}: ${err.message}`);
		return res.status(400).json({ error: 'No se pudo crear la cuenta' });
	}

	const otpCode = generateOTP();
	storeOTP(normalizedEmail, otpCode);
	await sendVerificationEmail(normalizedEmail, otpCode);

	logger.info(`User registered: ${normalizedEmail}`);
	res.status(201).json({
		success: true,
		message: 'Registro exitoso. Revisa tu correo para el código de verificación.',
		userId: id,
	});
});

router.post('/verify-email', async (req, res) => {
	const { email, otpCode } = req.body;

	if (!email || !otpCode) {
		return res.status(400).json({ error: 'Correo y código OTP son obligatorios' });
	}

	const normalizedEmail = email.toLowerCase().trim();

	if (!verifyOTP(normalizedEmail, otpCode)) {
		return res.status(400).json({ error: 'Código OTP inválido o expirado' });
	}

	const [r] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
	if (!r.length) {
		return res.status(400).json({ error: 'Usuario no encontrado' });
	}

	await pool.query('UPDATE users SET email_verificado = 1, updated_at = CURRENT_TIMESTAMP(3) WHERE email = ?', [
		normalizedEmail,
	]);

	const [urows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
	const nombre = urows[0]?.nombre ?? '';
	await sendWelcomeEmail(normalizedEmail, nombre);

	logger.info(`Email verified: ${normalizedEmail}`);
	res.json({
		success: true,
		message: 'Correo verificado correctamente',
	});
});

router.post('/resend-otp', async (req, res) => {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ error: 'El correo es obligatorio' });
	}

	const normalizedEmail = email.toLowerCase().trim();

	const [r] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
	if (!r.length) {
		return res.status(400).json({ error: 'Usuario no encontrado' });
	}

	const otpCode = generateOTP();
	storeOTP(normalizedEmail, otpCode);
	await sendVerificationEmail(normalizedEmail, otpCode);

	logger.info(`OTP resent to: ${normalizedEmail}`);
	res.json({
		success: true,
		message: 'Nuevo código enviado a tu correo',
	});
});

router.post('/login', loginLimiter, async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
	}

	const normalizedEmail = email.toLowerCase().trim();
	const trimmedPassword = password.trim();

	logger.debug(`Login attempt for email: ${normalizedEmail}`);

	const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
	const user = rows[0];

	if (!user) {
		logger.warn(`Login failed: User not found for email: ${normalizedEmail}`);
		return res.status(401).json({ error: 'Correo o contraseña inválidos' });
	}

	if (user.activo === 0 || user.activo === false) {
		logger.warn(`Login blocked: inactive user ${normalizedEmail}`);
		return res.status(403).json({ error: 'Cuenta deshabilitada. Contacta al administrador.' });
	}

	const ok = await bcrypt.compare(trimmedPassword, user.password_hash);
	if (!ok) {
		logger.warn(`Login failed for ${normalizedEmail}: bad password`);
		return res.status(401).json({ error: 'Correo o contraseña inválidos' });
	}

	const token = signUserToken({ id: user.id, email: user.email, rol: user.rol });
	logger.info(`User logged in successfully: ${normalizedEmail}`);
	res.json({
		success: true,
		message: 'Sesión iniciada',
		token,
		user: formatPublicUser(user),
	});
});

router.post('/logout', verifyUserToken, async (req, res) => {
	logger.info(`User logged out: ${req.userRecord?.email}`);
	res.json({
		success: true,
		message: 'Sesión cerrada',
	});
});

router.post('/forgot-password', async (req, res) => {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ error: 'El correo es obligatorio' });
	}

	const normalizedEmail = email.toLowerCase().trim();

	const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
	const user = rows[0];
	if (!user) {
		return res.json({
			success: true,
			message: 'Si el correo existe, se envió un enlace de recuperación',
		});
	}

	const recoveryToken = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	recoveryTokens.set(recoveryToken, {
		email: user.email,
		expiresAt: Date.now() + 60 * 60 * 1000,
	});

	await sendPasswordRecoveryEmail(normalizedEmail, recoveryToken);

	logger.info(`Password recovery email sent to: ${normalizedEmail}`);
	res.json({
		success: true,
		message: 'Si el correo existe, se envió un enlace de recuperación',
	});
});

router.post('/reset-password', async (req, res) => {
	const { token, password, passwordConfirm } = req.body;

	if (!token || !password || !passwordConfirm) {
		return res.status(400).json({ error: 'Token y contraseñas son obligatorios' });
	}

	if (password !== passwordConfirm) {
		return res.status(400).json({ error: 'Las contraseñas no coinciden' });
	}

	if (password.length < 8) {
		return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
	}

	const tokenData = recoveryTokens.get(token);
	if (!tokenData || Date.now() > tokenData.expiresAt) {
		return res.status(400).json({ error: 'Token inválido o expirado' });
	}

	const normalizedEmail = tokenData.email.toLowerCase().trim();

	const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
	const [r] = await pool.query('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE email = ?', [
		password_hash,
		normalizedEmail,
	]);

	recoveryTokens.delete(token);

	if (r.affectedRows === 0) {
		return res.status(400).json({ error: 'Usuario no encontrado' });
	}

	logger.info(`Password reset for: ${normalizedEmail}`);
	res.json({
		success: true,
		message: 'Contraseña actualizada',
	});
});

router.get('/me', verifyUserToken, async (req, res) => {
	res.json({ user: req.userRecord });
});

router.post('/change-password', verifyUserToken, async (req, res) => {
	const { currentPassword, newPassword, newPasswordConfirm } = req.body;

	if (!currentPassword || !newPassword || !newPasswordConfirm) {
		return res.status(400).json({ error: 'Todos los campos son obligatorios' });
	}

	if (newPassword !== newPasswordConfirm) {
		return res.status(400).json({ error: 'Las nuevas contraseñas no coinciden' });
	}

	if (newPassword.length < 8) {
		return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
	}

	const row = req.userRow;
	const ok = await bcrypt.compare(currentPassword.trim(), row.password_hash);
	if (!ok) {
		return res.status(400).json({ error: 'La contraseña actual no es correcta' });
	}

	const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
	await pool.query('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [
		password_hash,
		row.id,
	]);

	logger.info(`Password changed for: ${row.email}`);
	res.json({
		success: true,
		message: 'Contraseña actualizada correctamente',
	});
});

export default router;
