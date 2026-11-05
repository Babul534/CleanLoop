import multer from 'multer';
import { validateImageBuffer } from '../utils/fileValidation.js';

// Multer memory storage configuration (avoids storing files on disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 5 // Maximum 5 files
  }
}).array('images', 5);

/**
 * Complaint Images Upload Middleware
 * Handles multipart memory streaming, enforces image count, size limits,
 * and executes byte-level file signature inspection before passing to controller.
 */
export const handleComplaintImages = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'One or more images exceed the 5 MB file size limit.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'You can attach a maximum of 5 images per complaint.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Image upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    }

    // Enforce presence of at least one image
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one photograph of the waste is required.'
      });
    }

    if (req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'You cannot upload more than 5 photographs.'
      });
    }

    // Inspect byte-level signatures of all uploaded files
    for (const file of req.files) {
      const validation = validateImageBuffer(file.buffer, file.originalname, file.mimetype);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }
    }

    next();
  });
};

const evidenceUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  }
}).any();

/**
 * Completion Evidence Images Upload Middleware
 * Enforces 1-5 image files, size limits, byte-level signature validation
 */
export const handleEvidenceImages = (req, res, next) => {
  evidenceUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'One or more evidence images exceed the 5 MB file size limit.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'You can attach a maximum of 5 evidence photographs.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Image upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one photo evidence of completed remediation is required.'
      });
    }

    if (req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'You cannot upload more than 5 evidence photographs.'
      });
    }

    for (const file of req.files) {
      const validation = validateImageBuffer(file.buffer, file.originalname, file.mimetype);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }
    }

    next();
  });
};

/**
 * Optional Images Upload Middleware
 * Permits 0 to 5 images (e.g. for before-work photos)
 */
export const handleOptionalImages = (req, res, next) => {
  evidenceUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'One or more images exceed the 5 MB file size limit.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'You cannot attach more than 5 photographs.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Image upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    }

    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'You cannot upload more than 5 photographs.'
        });
      }

      for (const file of req.files) {
        const validation = validateImageBuffer(file.buffer, file.originalname, file.mimetype);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: validation.error
          });
        }
      }
    }

    next();
  });
};

export default {
  handleComplaintImages,
  handleEvidenceImages,
  handleOptionalImages
};

