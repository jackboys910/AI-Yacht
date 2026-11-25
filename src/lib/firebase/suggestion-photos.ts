import { compressImage } from "@/lib/images/compress";
import { firebaseApp } from "./app";

/**
 * Putting a reference photograph from the public idea form into Storage.
 *
 * ТЗ v4 §3.2 asked for links and said why: a bucket open to strangers is
 * other people's files on the owner's bill. The client overruled it on
 * 24.11.2026, and the reason is better than the rule was — people were
 * describing an idea with nothing to look at, because the photograph that
 * shows what they mean is in their phone's camera roll and nowhere else.
 *
 * What is left of the old caution lives in three places. `storage.rules`
 * allows `create` here and nothing else, so a file cannot be replaced,
 * deleted or found by anyone who did not just upload it. The browser
 * compresses first, so what lands is a few hundred kilobytes rather than a
 * twelve-megapixel original. And the form caps how many go up at once.
 *
 * This is deliberately not `uploadImage`: that one is the admin panel's, it
 * writes two sizes for a trip gallery and returns a `StoredImage` with its
 * storage path, because a trip's photographs get deleted and duplicated. An
 * idea's references are read once by one person and then forgotten, so a URL
 * is the whole of what is worth keeping.
 */

/** As many as the form takes. More than this is a gallery, not a reference. */
export const MAX_PHOTOS = 5;

/** What `storage.rules` refuses, checked here so the refusal is readable. */
export const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

function monthFolder(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Uploads one picture and answers with the address it can be read at. */
export async function uploadSuggestionPhoto(file: File): Promise<string> {
  const { full, extension, contentType } = await compressImage(file);

  // Imported here rather than at the top of the file: Storage is around
  // twenty kilobytes of JavaScript that every visitor to the page would
  // otherwise download, and almost nobody attaches a photograph.
  const { getDownloadURL, getStorage, ref, uploadBytes } = await import("firebase/storage");

  const path = `suggestions/${monthFolder()}/${crypto.randomUUID()}.${extension}`;
  const stored = await uploadBytes(ref(getStorage(firebaseApp()), path), full.blob, {
    contentType,
    cacheControl: "public, max-age=31536000, immutable",
  });

  return getDownloadURL(stored.ref);
}
