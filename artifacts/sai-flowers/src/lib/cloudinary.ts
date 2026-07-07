/**
 * Cloudinary public configuration (safe to expose in frontend).
 * Sensitive keys (API_KEY, API_SECRET) live only in the backend (api-server).
 */
export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

if (!CLOUD_NAME) {
  console.warn('[cloudinary] VITE_CLOUDINARY_CLOUD_NAME is not set. Uploads will fail.');
}
if (!UPLOAD_PRESET) {
  console.warn('[cloudinary] VITE_CLOUDINARY_UPLOAD_PRESET is not set. Uploads will fail.');
}

/**
 * Upload a single file directly to Cloudinary from the browser.
 * Uses an unsigned upload preset — no API secret needed on the client.
 *
 * @param file       The File object selected by the user
 * @param onProgress Called with progress 0-100 during upload
 * @returns          { publicId, secureUrl }
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ publicId: string; secureUrl: string }> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in Replit Secrets.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'gallery');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({ publicId: data.public_id, secureUrl: data.secure_url });
      } else {
        let errMsg = `Cloudinary upload failed (HTTP ${xhr.status})`;
        try {
          const err = JSON.parse(xhr.responseText);
          errMsg = err.error?.message ?? errMsg;
        } catch { /* ignore */ }
        console.error('[cloudinary] Upload error response:', xhr.responseText);
        reject(new Error(errMsg));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during Cloudinary upload. Check your connection.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted.'));
    });

    xhr.send(formData);
  });
}
