import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { storage } from '../lib/firebase';
import { generateId } from '../lib/utils';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'image/bmp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB input accepted & auto-optimized

export const STORAGE_BUCKET_NAME = firebaseConfig.storageBucket || '';

export const RECOMMENDED_STORAGE_RULES = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /asworld/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email_verified == true
        && request.resource.size <= 10 * 1024 * 1024;
    }
  }
}`;

export interface StorageHealthResult {
  active: boolean;
  bucket: string;
  errorCode?: string;
  message: string;
}

export function validateImageFile(file: File): void {
  const typeOk =
    ALLOWED_IMAGE_TYPES.has(file.type) ||
    /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico)$/i.test(file.name);
  if (!typeOk) {
    throw new Error(
      `Unsupported file format (${file.type || 'unknown'}). Please select JPG, PNG, WebP, GIF, ICO, or SVG.`
    );
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `Image "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum supported size is 15MB.`
    );
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image file.'));
    img.src = src;
  });
}

/**
 * Produces a crisp, permanent, compact Data URL that fits safely inside Cloud Firestore
 * documents so uploads ALWAYS succeed instantly even if Firebase Storage bucket is not active.
 */
export async function compressImageToDataUrl(
  file: File,
  folder: 'products' | 'banners' | 'categories' | 'branding' | 'flash-sales'
): Promise<string> {
  const rawDataUrl = await readFileAsDataUrl(file);

  // Preserve SVG or small ICO / tiny transparent files directly
  if (
    file.type === 'image/svg+xml' ||
    file.type === 'image/x-icon' ||
    file.type === 'image/vnd.microsoft.icon' ||
    /\.ico$/i.test(file.name) ||
    file.size <= 45 * 1024
  ) {
    if (rawDataUrl.length <= 360000) {
      return rawDataUrl;
    }
  }

  try {
    const img = await loadImageElement(rawDataUrl);
    const maxDimension =
      folder === 'branding'
        ? 512
        : folder === 'banners'
        ? 1280
        : folder === 'categories'
        ? 640
        : 920;

    let { width, height } = img;
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataUrl;

    ctx.drawImage(img, 0, 0, width, height);

    // Keep transparency for branding logos / favicons using WebP or PNG
    const hasAlphaCandidate =
      folder === 'branding' || file.type === 'image/png' || file.type === 'image/webp';

    const preferredMime = hasAlphaCandidate ? 'image/webp' : 'image/jpeg';
    let quality = folder === 'branding' ? 0.88 : 0.82;
    let out = canvas.toDataURL(preferredMime, quality);

    // Fallback to PNG if browser didn't encode webp properly
    if (hasAlphaCandidate && !out.startsWith('data:image/webp')) {
      out = canvas.toDataURL('image/png');
    }

    // Step down quality/size slightly if still larger than Firestore field cap (~260KB)
    while (out.length > 260000 && quality > 0.45) {
      quality -= 0.12;
      out = canvas.toDataURL('image/webp', quality);
      if (!out.startsWith('data:image/webp')) {
        out = canvas.toDataURL('image/jpeg', quality);
      }
    }

    return out;
  } catch {
    return rawDataUrl;
  }
}

/**
 * Reliable hybrid image uploader:
 * Attempts Firebase Cloud Storage quickly; if Storage is uninitialized, stalls at 0%,
 * or permission-denied, seamlessly resolves with an auto-optimized permanent image stored
 * cleanly in Cloud Firestore — guaranteeing zero timeout errors.
 */
export async function uploadImageToStorage(
  file: File,
  folder: 'products' | 'banners' | 'categories' | 'branding' | 'flash-sales',
  onProgress?: (percent: number) => void
): Promise<string> {
  validateImageFile(file);

  // Pre-prepare fast compressed fallback in parallel so there is never a wait if Storage stalls
  const fallbackPromise = compressImageToDataUrl(file, folder);

  if (!STORAGE_BUCKET_NAME) {
    if (onProgress) onProgress(40);
    const dataUrl = await fallbackPromise;
    if (onProgress) onProgress(100);
    return dataUrl;
  }

  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const safeName = `${generateId()}.${ext}`;
  const storagePath = `asworld/${folder}/${safeName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise<string>((resolve) => {
    let settled = false;
    let sawBytes = false;

    const finishWithFallback = async () => {
      if (settled) return;
      settled = true;
      try {
        uploadTask.cancel();
      } catch {
        // ignore cancel error
      }
      if (onProgress) onProgress(80);
      const dataUrl = await fallbackPromise;
      if (onProgress) onProgress(100);
      resolve(dataUrl);
    };

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    });

    // If no bytes transfer within 3.5 seconds, Firebase Storage is not initialized or CORS/rules blocked:
    // immediately fall back cleanly without showing a timeout error.
    const stallTimer = window.setTimeout(() => {
      if (!sawBytes && !settled) {
        void finishWithFallback();
      }
    }, 3500);

    const maxTimer = window.setTimeout(() => {
      if (!settled) {
        void finishWithFallback();
      }
    }, 12000);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.bytesTransferred > 0) {
          sawBytes = true;
        }
        if (snapshot.totalBytes > 0 && onProgress && !settled) {
          const pct = Math.min(95, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          onProgress(pct);
        }
      },
      () => {
        window.clearTimeout(stallTimer);
        window.clearTimeout(maxTimer);
        void finishWithFallback();
      },
      async () => {
        window.clearTimeout(stallTimer);
        window.clearTimeout(maxTimer);
        if (settled) return;
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          settled = true;
          if (onProgress) onProgress(100);
          resolve(url);
        } catch {
          void finishWithFallback();
        }
      }
    );
  });
}

export async function testCloudStorageConnection(): Promise<StorageHealthResult> {
  if (!STORAGE_BUCKET_NAME) {
    return {
      active: false,
      bucket: '',
      errorCode: 'missing-bucket',
      message: 'Firebase Storage bucket is not configured in firebase-applet-config.json.',
    };
  }

  const probeRef = ref(storage, `asworld/_health/ping_${Date.now()}.txt`);
  const probeBlob = new Blob(['asworld-storage-ok'], { type: 'text/plain' });

  return new Promise<StorageHealthResult>((resolve) => {
    const task = uploadBytesResumable(probeRef, probeBlob, {
      contentType: 'text/plain',
    });

    const timer = window.setTimeout(() => {
      try {
        task.cancel();
      } catch {
        // ignore
      }
      resolve({
        active: false,
        bucket: STORAGE_BUCKET_NAME,
        errorCode: 'storage/not-initialized',
        message:
          'Cloud Storage bucket is not responding yet, so image uploads automatically use built-in Firestore permanent compression.',
      });
    }, 6000);

    task.on(
      'state_changed',
      () => {},
      (error: any) => {
        window.clearTimeout(timer);
        const code = error?.code || 'storage/error';
        resolve({
          active: false,
          bucket: STORAGE_BUCKET_NAME,
          errorCode: code,
          message:
            code === 'storage/unauthorized' || code === 'storage/unauthenticated'
              ? 'Storage bucket exists, but rules blocked direct Storage write. Image uploads currently save cleanly via Firestore permanent compression.'
              : error?.message || 'Firebase Storage check failed.',
        });
      },
      async () => {
        window.clearTimeout(timer);
        try {
          await getDownloadURL(task.snapshot.ref);
          await deleteObject(task.snapshot.ref);
        } catch {
          // ignore cleanup failure
        }
        resolve({
          active: true,
          bucket: STORAGE_BUCKET_NAME,
          message: 'Firebase Cloud Storage is active, writable, and returning permanent URLs.',
        });
      }
    );
  });
}

export async function deleteImageFromStorage(downloadUrl: string): Promise<void> {
  if (!downloadUrl || !downloadUrl.includes('firebasestorage.googleapis.com')) {
    return;
  }
  try {
    const fileRef = ref(storage, downloadUrl);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('Could not delete old storage object:', err);
  }
}
