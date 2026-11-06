/**
 * Cloudflare Turnstile, the half that lives in the page.
 *
 * The site key is public by design — it travels to every visitor and names
 * the widget rather than granting anything. The secret half, which is what
 * actually decides whether a token is real, is a Worker secret and never
 * appears in this repository.
 */
export const turnstileSiteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAF2CxPlP_RK6WRkZ";

export const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      language?: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Loads the widget script once per page, however many forms ask for it.
 *
 * The promise is kept rather than the boolean, so two forms mounting in the
 * same tick both wait on the one request instead of racing to add two script
 * tags.
 */
let loading: Promise<TurnstileApi> | null = null;

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;

  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile loaded without an API"));
    };
    script.onerror = () => {
      // Let a later attempt try again: the usual cause is a blocker or a
      // flaky network, and both can be gone by the time someone retries.
      loading = null;
      reject(new Error("Turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });

  return loading;
}
