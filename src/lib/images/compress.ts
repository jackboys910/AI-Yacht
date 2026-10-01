/**
 * Shrinking a photo in the browser, before it ever reaches storage.
 *
 * The site is a static export with `images.unoptimized`, so nothing resizes a
 * picture on its way to a visitor — whatever is uploaded is what a phone on a
 * mobile connection downloads. §11 asks for fast pages, so the work happens
 * here instead: a 12-megapixel photo straight off a camera becomes a few
 * hundred kilobytes before it is stored.
 *
 * Two sizes are produced. The large one is what the trip page shows; the small
 * one is for cards and phones, where sending a 1920px-wide image to fill a
 * 320px-wide card is most of a page's weight.
 */

export interface RenderedImage {
  blob: Blob;
  width: number;
  height: number;
}

export interface CompressedImage {
  full: RenderedImage;
  thumb: RenderedImage;
  /** File extension matching the chosen format. */
  extension: "webp" | "jpg";
  contentType: string;
}

const FULL_MAX_WIDTH = 1920;
const THUMB_MAX_WIDTH = 640;
const QUALITY = 0.82;

export class UnsupportedImageError extends Error {}

/**
 * Decodes a file, straightens it, and renders both sizes.
 *
 * `createImageBitmap` is used rather than an `<img>` because it applies the
 * EXIF orientation flag. Without that, a photo taken with the phone held
 * sideways — which is most of them — arrives rotated ninety degrees, and the
 * owner has no way to fix it from the admin panel.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await decode(file);

  try {
    const { type, extension } = pickFormat();

    const full = await render(bitmap, FULL_MAX_WIDTH, type);
    const thumb = await render(bitmap, THUMB_MAX_WIDTH, type);

    return { full, thumb, extension, contentType: type };
  } finally {
    bitmap.close();
  }
}

async function decode(file: File): Promise<ImageBitmap> {
  if (!file.type.startsWith("image/")) {
    throw new UnsupportedImageError("Это не картинка. Нужен файл JPEG, PNG или WebP.");
  }

  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (cause) {
    // HEIC is the realistic case: an iPhone converts to JPEG when a photo is
    // picked through the file dialog, but a HEIC copied off the phone by hand
    // cannot be decoded by Chrome or Firefox at all.
    throw new UnsupportedImageError(
      /heic|heif/i.test(file.type) || /\.heic$/i.test(file.name)
        ? "Формат HEIC браузер открыть не может. Пересохраните фото в JPEG — на iPhone это происходит само, если выбирать фото через «Фотогалерею»."
        : "Не удалось открыть эту картинку. Попробуйте JPEG или PNG.",
      { cause },
    );
  }
}

/** WebP where it is supported, which is everywhere current, JPEG otherwise. */
function pickFormat(): { type: string; extension: "webp" | "jpg" } {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const supportsWebp = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  return supportsWebp
    ? { type: "image/webp", extension: "webp" }
    : { type: "image/jpeg", extension: "jpg" };
}

async function render(
  bitmap: ImageBitmap,
  maxWidth: number,
  type: string,
): Promise<RenderedImage> {
  // Never upscale: enlarging a small photo adds bytes and no detail.
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new UnsupportedImageError("Браузер не смог обработать картинку.");
  context.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, QUALITY),
  );
  if (!blob) throw new UnsupportedImageError("Не удалось сжать картинку.");

  return { blob, width, height };
}

/** "2.4 МБ" — shown next to a photo so oversized originals are obvious. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}
