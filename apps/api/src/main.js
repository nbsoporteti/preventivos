import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import createRoutes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';
import { dbReady } from './db/pool.js';

const app = express();

/** Número de proxies delante de la API (p. ej. 1 con nginx). `true` rompe express-rate-limit v8 (ERR_ERL_PERMISSIVE_TRUST_PROXY). */
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS);
app.set(
	'trust proxy',
	Number.isFinite(trustProxyHops) && trustProxyHops > 0 ? trustProxyHops : false,
);

process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception:', error);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
	logger.info('Interrupted');
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received');

	await new Promise(resolve => setTimeout(resolve, 3000));

	logger.info('Exiting');
	process.exit();
});

app.use(helmet());

/** `Access-Control-Allow-Origin: *` no es válido con `credentials: true`; el navegador bloquea la respuesta → "Failed to fetch". */
function corsMiddleware() {
	const raw = (process.env.CORS_ORIGIN || '').trim();
	return cors({
		origin(origin, callback) {
			if (!raw || raw === '*') {
				callback(null, true);
				return;
			}
			const allowed = raw.split(',').map((s) => s.trim()).filter(Boolean);
			if (!origin || allowed.includes(origin)) {
				callback(null, true);
				return;
			}
			callback(null, false);
		},
		credentials: true,
	});
}

app.use(corsMiddleware());
app.use(morgan('combined'));
app.use(globalRateLimit);
app.use(express.json({
	limit: BodyLimit,
}));
app.use(express.urlencoded({ 
	extended: true,
	limit: BodyLimit,
}));

/**
 * Une todas las URLs API en un solo árbol de rutas.
 * Los proxies / gateways a veces envían la ruta ya sin prefijo (`/admin/...`) y otras con
 * `/hcgi/api/...` o `/api/...`. Sin esto, solo coincide uno de los montajes y el resto devuelve 404.
 */
function stripKnownApiPathPrefixes(req, _res, next) {
	const full = req.originalUrl || req.url || '';
	const qIdx = full.indexOf('?');
	const query = qIdx >= 0 ? full.slice(qIdx) : '';
	let pathOnly = qIdx >= 0 ? full.slice(0, qIdx) : full;

	let prev = null;
	for (let i = 0; i < 10 && pathOnly !== prev; i++) {
		prev = pathOnly;
		if (pathOnly === '/hcgi/api' || pathOnly.startsWith('/hcgi/api/')) {
			pathOnly = pathOnly.slice('/hcgi/api'.length) || '/';
			continue;
		}
		if (pathOnly === '/api' || pathOnly.startsWith('/api/')) {
			pathOnly = pathOnly.slice('/api'.length) || '/';
			continue;
		}
	}

	// Proxies que envían la ruta sin "/" inicial no matchean el árbol de Express.
	if (pathOnly && pathOnly !== '/' && !pathOnly.startsWith('/')) {
		pathOnly = `/${pathOnly}`;
	}
	if (!pathOnly) {
		pathOnly = '/';
	}

	req.url = pathOnly + query;
	// Invalidar caché de parseurl por si algo parseó req.url antes de reescribirlo.
	delete req._parsedUrl;
	next();
}

app.use(stripKnownApiPathPrefixes);
app.use(createRoutes());

app.use(errorMiddleware);

app.use((req, res) => {
	const debug = process.env.API_404_DEBUG === '1' || process.env.NODE_ENV !== 'production';
	res.status(404).json({
		error: 'Route not found',
		...(debug && {
			method: req.method,
			path: req.path,
			originalUrl: req.originalUrl,
		}),
	});
});

const port = process.env.PORT || 3001;

try {
	await dbReady();
} catch (err) {
	const code = err?.code || '';
	logger.error('No se pudo conectar a MySQL:', err.message || err);
	if (code === 'ECONNREFUSED') {
		logger.error(
			'MySQL no responde en el host/puerto de DATABASE_URL (suele ser 127.0.0.1:3306). Inicia el servicio MySQL/MariaDB (XAMPP, Laragon, Docker, etc.) o corrige DATABASE_URL.',
		);
	} else if (code === 'ER_ACCESS_DENIED_ERROR' || code === 'ECONNACCESS') {
		logger.error('Usuario o contraseña MySQL incorrectos en DATABASE_URL / MYSQL_*.');
	} else if (code === 'ER_BAD_DB_ERROR') {
		logger.error('La base de datos no existe. Créala y ejecuta apps/api/sql/schema.sql.');
	}
	process.exit(1);
}

app.listen(port, () => {
	logger.info(`🚀 API Server running on http://localhost:${port}`);
});

export default app;
