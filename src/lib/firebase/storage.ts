import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";
import { compressImage } from "@/lib/images/compress";
import type { Localized, StoredImage } from "@/lib/content/types";
import { firebaseApp } from "./app";

/**
 * Putting a photo into Cloud Storage (§7.2: upload from a computer or a phone).
 *
 * Two files go up per photo. `url` is the large one the trip page shows, and
 * `thumbUrl` is a 640px copy for cards and phones — sending a 1920px image to
 * fill a 320px card is most of what makes a page slow on a phone.
 *
 * `storagePath` records where the large file lives. A download URL carries a
 * token and cannot be turned back into a path, so without this field nothing
 * could ever be deleted or copied — which item 1.7 needs when it duplicates a
 * trip, since a copy pointing at the original's files would lose its pictures
 * the moment the original was removed.
 */

export type UploadStage = "compressing" | "uploading" | "done";

function storage(): FirebaseStorage {
  return getStorage(firebaseApp());
}

/** `images/2026-10/ab12…` — grouped by month so the bucket stays browsable. */
function newBasePath(): string {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `images/${month}/${crypto.randomUUID()}`;
}

export async function uploadImage(
  file: File,
  alt: Localized<string> = { en: "", ru: "" },
  onStage?: (stage: UploadStage) => void,
): Promise<StoredImage> {
  onStage?.("compressing");
  const { full, thumb, extension, contentType } = await compressImage(file);

  onStage?.("uploading");
  const base = newBasePath();
  const fullPath = `${base}-full.${extension}`;
  const thumbPath = `${base}-thumb.${extension}`;
  const metadata = { contentType, cacheControl: "public, max-age=31536000, immutable" };

  const [fullRef, thumbRef] = await Promise.all([
    uploadBytes(ref(storage(), fullPath), full.blob, metadata),
    uploadBytes(ref(storage(), thumbPath), thumb.blob, metadata),
  ]);

  const [url, thumbUrl] = await Promise.all([
    getDownloadURL(fullRef.ref),
    getDownloadURL(thumbRef.ref),
  ]);

  onStage?.("done");

  return {
    url,
    thumbUrl,
    width: full.width,
    height: full.height,
    storagePath: fullPath,
    alt,
  };
}

/**
 * Why duplicating a trip shares its pictures instead of copying the files.
 *
 * Copying would mean reading the bytes back out of Storage in the browser, and
 * Cloud Storage serves download URLs without an `Access-Control-Allow-Origin`
 * header, so `fetch` is blocked. The policy that would allow it can only be set
 * on the bucket with gcloud or gsutil — a tool to install and a step to
 * remember, for the sake of one operation.
 *
 * Sharing is safe here because of two properties this code maintains:
 *
 *  - stored files are immutable. A path carries a random id, nothing is ever
 *    written over, and an edit uploads a new file rather than replacing one.
 *  - nothing in the application deletes a stored file. Removing a photo from a
 *    form drops the reference only, which is deliberate: otherwise cancelling
 *    an edit would take a picture away from an already-published trip.
 *
 * So two trips pointing at one file is the same arrangement the /assets/
 * photography is already in. When a cleanup sweep is added it has to count
 * references regardless, for exactly that reason.
 */

/**
 * Whether this picture is one we uploaded.
 *
 * An empty `storagePath` marks a file that merely has an address — the
 * photography already under /assets/, which item 1.11 reuses when it brings the
 * AI Yacht trip across. Those must never be deleted from here.
 */
export function isUploaded(image: StoredImage): boolean {
  return image.storagePath.length > 0;
}
