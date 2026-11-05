import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

/**
 * CleanLoop Cloudinary Storage Configuration
 * Manages signed authenticated image uploads and rollback destructions.
 */

let isConfigured = false;

/**
 * Ensures Cloudinary is configured with latest environment variables
 * @returns {boolean}
 */
export const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const valid = Boolean(
    cloudName &&
    apiKey &&
    apiSecret &&
    cloudName.trim() !== '' &&
    apiKey.trim() !== '' &&
    apiSecret.trim() !== ''
  );

  if (valid) {
    cloudinary.config({
      cloud_name: cloudName.trim(),
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
      secure: true
    });
    isConfigured = true;
  } else {
    isConfigured = false;
  }

  return valid;
};

// Initial check on load
isCloudinaryConfigured();

/**
 * Upload a memory buffer to Cloudinary using signed upload_stream
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - { folder, publicId, tags }
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(
        new Error(
          'Cloudinary service is not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env.'
        )
      );
    }

    const uploadOptions = {
      resource_type: 'image',
      folder: options.folder || 'cleanloop/complaints',
      public_id: options.publicId,
      overwrite: true,
      tags: options.tags || ['cleanloop', 'complaint'],
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve({
        url: result.secure_url,
        publicId: result.public_id
      });
    });

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

/**
 * Safely delete an uploaded image asset from Cloudinary
 * @param {string} publicId
 * @returns {Promise<any>}
 */
export const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.error(`[Cloudinary Cleanup Error] Failed to destroy asset ${publicId}:`, err.message);
    return null;
  }
};

/**
 * Safely delete multiple image assets from Cloudinary (used in rollback scenarios)
 * @param {string[]} publicIds
 * @returns {Promise<void>}
 */
export const deleteMultipleCloudinaryAssets = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0 || !isCloudinaryConfigured()) return;
  await Promise.allSettled(publicIds.map((id) => deleteCloudinaryAsset(id)));
};

export default {
  cloudinary,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteCloudinaryAsset,
  deleteMultipleCloudinaryAssets
};
