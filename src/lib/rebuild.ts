import { idToken } from "./firebase/auth";

/**
 * Asking the site to rebuild itself (А-08, А-09).
 *
 * The pages a visitor gets were printed by the last build, so a change saved
 * in the panel is invisible until another one runs. The Worker at
 * `/api/rebuild` is what starts it; everything secret about that lives there,
 * and this module is only the browser's side of the conversation.
 *
 * Two things are deliberately not decided here. Whether a build may start is
 * the Worker's business — it refuses one that would duplicate a build already
 * under way. And whether the endpoint exists at all is a property of where the
 * panel is running: during development there is no Worker, and the panel
 * simply says nothing about deployments rather than showing a broken
 * indicator.
 */

const ENDPOINT = "/api/rebuild";

export type RebuildState =
  /** No Worker here — the panel is running from `next dev`. */
  | { kind: "absent" }
  /** The Worker is there but has no GitHub token, so nothing can be built. */
  | { kind: "unconfigured" }
  | { kind: "running"; startedAt?: string }
  | { kind: "idle"; finishedAt?: string; conclusion?: string };

interface Payload {
  running?: boolean;
  startedAt?: string;
  finishedAt?: string;
  conclusion?: string;
  error?: string;
  started?: boolean;
  reason?: string;
  retryAfter?: number;
}

async function call(method: "GET" | "POST"): Promise<Payload | null> {
  const token = await idToken();
  if (!token) return null;

  const response = await fetch(ENDPOINT, {
    method,
    headers: { authorization: `Bearer ${token}` },
  });

  // `next dev` answers an unknown path with its own HTML 404; anything that is
  // not JSON means there is no Worker on the other end.
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }
  return (await response.json()) as Payload;
}

function toState(payload: Payload | null): RebuildState {
  if (!payload) return { kind: "absent" };
  if (payload.error === "not-configured") return { kind: "unconfigured" };
  if (payload.error) return { kind: "absent" };
  if (payload.running) return { kind: "running", startedAt: payload.startedAt };
  return {
    kind: "idle",
    finishedAt: payload.finishedAt,
    conclusion: payload.conclusion,
  };
}

/** What the deploy workflow is doing, as far as the panel can tell. */
export async function readRebuild(): Promise<RebuildState> {
  try {
    return toState(await call("GET"));
  } catch {
    return { kind: "absent" };
  }
}

/**
 * Ask for a build. A refusal is not a failure: the Worker says no when one is
 * already running or has just finished, and in both cases what was saved is
 * covered by a build that is going to happen anyway.
 */
export async function startRebuild(): Promise<RebuildState> {
  try {
    const payload = await call("POST");
    notify();
    return toState(payload);
  } catch {
    return { kind: "absent" };
  }
}

/**
 * Changes that reach visitors.
 *
 * A trip nobody can see yet is saved without disturbing the site — the owner
 * filling one in over several sittings (§7.1) should not start a build with
 * every save. Everything else does: a published trip, one that has just
 * stopped being published, and the interests and people that published pages
 * are built out of.
 */
export function rebuildAfterTrip(before: string | null, after: string): boolean {
  return before === "published" || after === "published";
}

/** Fired after a write that the site should pick up. Never awaited by the UI. */
export function rebuildSoon(): void {
  void startRebuild();
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Lets the indicator in the frame notice a build a form has just asked for. */
export function onRebuildRequested(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) listener();
}
