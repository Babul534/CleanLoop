/**
 * CleanLoop File Validation Utilities
 * Validates file sizes, allowed extensions, declared MIME types,
 * and byte-level magic number signatures to prevent MIME-spoofing.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Detect image type directly from buffer magic numbers
 * @param {Buffer} buffer
 * @returns {'jpeg' | 'png' | 'webp' | null}
 */
export const detectImageSignature = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // WEBP: "RIFF" .... "WEBP"
  // Offset 0-3: 52 49 46 46 (RIFF)
  // Offset 8-11: 57 45 42 50 (WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp';
  }

  return null;
};

/**
 * Validate a single image file (extension, MIME, signature, and size)
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename from client
 * @param {string} mimeType - Declared client MIME type
 * @returns {{ isValid: boolean, error?: string, detectedType?: string }}
 */
export const validateImageBuffer = (buffer, originalName, mimeType) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { isValid: false, error: 'Empty or invalid file buffer provided' };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File "${originalName || 'image'}" exceeds maximum allowed size of 5 MB`
    };
  }

  const name = (originalName || '').toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!hasValidExt) {
    return {
      isValid: false,
      error: `File "${originalName}" has an invalid extension. Only JPG, JPEG, PNG, and WEBP formats are accepted.`
    };
  }

  const normalizedMime = (mimeType || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return {
      isValid: false,
      error: `Declared MIME type "${mimeType}" is not allowed. Only image/jpeg, image/png, and image/webp are accepted.`
    };
  }

  const signature = detectImageSignature(buffer);
  if (!signature) {
    return {
      isValid: false,
      error: `File signature mismatch for "${originalName}". The file content is not a genuine JPEG, PNG, or WEBP image.`
    };
  }

  // Cross-verify detected signature with MIME
  if (signature === 'jpeg' && !normalizedMime.includes('jpeg') && !normalizedMime.includes('jpg')) {
    return { isValid: false, error: `File content is JPEG but MIME is "${mimeType}"` };
  }
  if (signature === 'png' && !normalizedMime.includes('png')) {
    return { isValid: false, error: `File content is PNG but MIME is "${mimeType}"` };
  }
  if (signature === 'webp' && !normalizedMime.includes('webp')) {
    return { isValid: false, error: `File content is WEBP but MIME is "${mimeType}"` };
  }

  return { isValid: true, detectedType: signature };
};

export default {
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  detectImageSignature,
  validateImageBuffer
};

