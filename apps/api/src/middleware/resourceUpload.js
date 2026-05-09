import multer from 'multer';
import { BodyLimit } from '../constants/common.js';

export const resourceFileUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: BodyLimit },
});

export function resourceUploadErrorHandler(err, req, res, next) {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ error: 'El archivo supera el tamaño máximo (20 MB)' });
		}
		return res.status(400).json({ error: err.message });
	}
	return next(err);
}
