import multer from 'multer';
import path from 'path';
import { config } from '../config/env.js';

// Use memory storage for clean extraction and instant vector processing
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedExt = config.upload.allowedExtensions.includes(ext);
  const isAllowedMime = config.upload.allowedMimeTypes.includes(file.mimetype);

  if (isAllowedExt || isAllowedMime) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${ext || file.mimetype}". Only PDF and DOCX files are supported.`
      ),
      false
    );
  }
}

export const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter
});
