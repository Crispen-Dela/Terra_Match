import { unsplashUrl, LAND_PHOTO_IDS } from "../constants/stockImages.js";

const DEFAULT_FALLBACK_IMAGE = unsplashUrl(LAND_PHOTO_IDS.greenCoveredLand);

/**
 * Checks if a URL is valid and permanent (i.e. not a temporary in-memory blob URL).
 */
export function isPermanentImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("blob:")) return false;
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("/")
  );
}

/**
 * Safely sanitizes an image URL, providing a fallback if the URL is missing or is an ephemeral blob URL.
 */
export function sanitizeImageUrl(url, fallback = DEFAULT_FALLBACK_IMAGE) {
  if (isPermanentImageUrl(url)) return url.trim();
  return fallback;
}

/**
 * Compresses an image File client-side to a lightweight, permanent base64 Data URL.
 * Keeps file payload small (~80KB–180KB) while preserving high visual quality.
 */
export function compressAndEncodeImage(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error("Invalid file provided for image compression"));
    }

    if (typeof window === "undefined" || !window.FileReader) {
      return resolve(DEFAULT_FALLBACK_IMAGE);
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target.result;
      if (!src || typeof src !== "string") {
        return resolve(DEFAULT_FALLBACK_IMAGE);
      }

      if (file.type === "image/svg+xml" || file.type === "image/gif") {
        return resolve(src);
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            if (width / maxWidth > height / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return resolve(src);
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(src);
        }
      };

      img.onerror = () => {
        resolve(src);
      };

      img.src = src;
    };

    reader.onerror = (err) => {
      reject(err || new Error("Failed to read image file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Processes a FileList or array of image Files into persistent photo records.
 */
export async function processImageFiles(fileList, { maxImages = 8, existingCount = 0 } = {}) {
  const incoming = Array.from(fileList || []).filter(
    (f) => f && f.type && f.type.startsWith("image/")
  );
  const availableSlots = Math.max(0, maxImages - existingCount);
  const accepted = incoming.slice(0, availableSlots);

  const processed = await Promise.all(
    accepted.map(async (file) => {
      try {
        const dataUrl = await compressAndEncodeImage(file);
        return {
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          name: file.name,
          url: dataUrl,
        };
      } catch (err) {
        console.warn("Image compression warning for", file.name, err);
        return null;
      }
    })
  );

  return processed.filter(Boolean);
}
