/**
 * Everything the Worker is given, in one place.
 *
 * Plain values live in `wrangler.jsonc` and are replaced on every deploy;
 * secrets are set once with `wrangler secret put` or in the dashboard and
 * survive deploys untouched. Which is which is marked below, because getting
 * it the wrong way round either puts a key in the repository or loses it on
 * the next publish.
 */
export interface Env {
  /* ---- /api/rebuild (А-08, А-09) ---- */

  /** Fine-grained GitHub token, Actions: read and write. **Secret.** */
  GITHUB_TOKEN?: string;
  /** `owner/repo`, e.g. `jackboys910/AI-Yacht`. */
  GITHUB_REPO?: string;
  /** The workflow file to run. */
  GITHUB_WORKFLOW?: string;
  /** The branch it is run from. */
  GITHUB_REF?: string;
  /** Two publications in a row must not start two builds (seconds). */
  REBUILD_MIN_INTERVAL?: string;

  /* ---- Firebase ---- */

  /** Firebase project whose owners may press the rebuild button. */
  FIREBASE_PROJECT_ID?: string;
  /**
   * The whole service-account JSON, as Firebase hands it over. **Secret.**
   *
   * It is what lets the Worker write a collection that `firestore.rules`
   * keeps shut to browsers. Without it `/api/suggestion` answers 503 rather
   * than pretending to work.
   */
  FIREBASE_SERVICE_ACCOUNT?: string;

  /* ---- Turnstile ---- */

  /** The server half of the pair. **Secret.** Without it nothing is checked. */
  TURNSTILE_SECRET?: string;

  /* ---- EmailJS ---- */

  EMAILJS_SERVICE_ID?: string;
  EMAILJS_TEMPLATE_ID?: string;
  /** Visible in the browser anyway; a plain value. */
  EMAILJS_PUBLIC_KEY?: string;
  /** Required for a server-side send. **Secret.** */
  EMAILJS_PRIVATE_KEY?: string;
  /** Where the owner's copy of a form goes. */
  CONTACT_EMAIL?: string;
}
