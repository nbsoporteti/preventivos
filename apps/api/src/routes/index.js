import { Router } from 'express';
import healthCheck from './health-check.js';
import authRouter from './auth.js';
import usersRouter from './users.js';
import adminRouter from './admin.js';
import secureDownloadRouter from './secure-download.js';
import catalogRouter from './catalog.js';
import lmsRouter from './lms.js';

export default function createRoutes() {
	const router = Router();
	router.get('/health', healthCheck);
	router.use('/catalog/lms', lmsRouter);
	router.use('/catalog', catalogRouter);
	router.use('/downloads', secureDownloadRouter);
	router.use('/auth', authRouter);
	router.use('/users', usersRouter);
	router.use('/admin', adminRouter);
	return router;
}
