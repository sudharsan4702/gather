/**
 * Client-Side Image Compression Utility
 * 
 * Silently and automatically optimizes large smartphone camera photos (10MB-25MB)
 * down to ~350KB-600KB before uploading to the server.
 * 
 * - Preserves crystal-clear Full HD display quality (max 1920px).
 * - Leaves GIFs animated (bypasses canvas).
 * - Bypasses files already under 600KB.
 * - Always falls back gracefully to the original file if any error occurs.
 */
export const compressImage = async (file, { maxDimension = 1920, quality = 0.85 } = {}) => {
  if (!file) return file;

  // Preserve animated GIFs as-is
  if (file.type === 'image/gif') {
    return file;
  }

  // If already under 600KB, skip client-side compression
  if (file.size <= 600 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // If dimensions are within bounds and file is not enormous, return
        if (width <= maxDimension && height <= maxDimension && file.size <= 1.2 * 1024 * 1024) {
          resolve(file);
          return;
        }

        // Scale down proportionally
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Construct safe filename
            const originalName = file.name || 'photo';
            const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const newName = `${baseName}.jpg`;

            const optimizedFile = new File([blob], newName, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            resolve(optimizedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    } catch (e) {
      console.warn('Image compression fallback to original:', e);
      resolve(file);
    }
  });
};

/**
 * Batch compress an array or FileList of images concurrently.
 */
export const compressImages = async (files, options) => {
  if (!files || files.length === 0) return [];
  const list = Array.from(files);
  return Promise.all(list.map(f => compressImage(f, options)));
};
