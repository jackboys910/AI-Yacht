/**
 * The Cloudflare Worker behind nazarov.net.
 *
 * The site is built ahead of time and served as files from Cloudflare's edge,
 * so publishing a trip in the panel changes the database and nothing else:
 * the pages a visitor gets were printed by the last build. А-08 and А-09 ask
 * for the panel to start that build itself, without the owner ever opening
 * GitHub.
 *
 * Starting a build means asking GitHub to run the deploy workflow, and that
 * request has to be signed with a token. A token in the browser is a token
 * anyone can read out of the developer tools, so it lives here instead, in the
 * Worker's secrets, and the browser only ever talks to this endpoint.
 *
 * Everything except `/api/*` is served straight from the edge and never
 * reaches this code — `run_worker_first` in wrangler.jsonc draws that line.
 */

export interface Env {
  /** Fine-grained GitHub token, Actions: read and write. A secret. */
  GITHUB_TOKEN?: string;
  /** `owner/repo`, e.g. `jackboys910/AI-Yacht`. */
  GITHUB_REPO?: string;
  /** The workflow file to run. */
  GITHUB_WORKFLOW?: string;
  /** The branch it is run from. */
  GITHUB_REF?: string;
  /** Firebase project whose owners may press the button. */
  FIREBASE_PROJECT_ID?: string;
  /** Two publications in a row must not start two builds (seconds). */
  REBUILD_MIN_INTERVAL?: string;
}

const DEFAULTS = {
  workflow: "deploy.yml",
  ref: "main",
  projectId: "nazarov-net",
  minInterval: 90,
};

const GITHUB_HEADERS = {
  accept: "application/vnd.github+json",
  "x-github-api-version": "2022-11-28",
  // GitHub refuses requests without one.
  "user-agent": "nazarov-net-rebuild",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

/**
 * The uid inside a Firebase ID token, read without checking the signature.
 *
 * That is safe because nothing is believed on the strength of this value: it
 * only builds the address of the document the next request asks Firestore for,
 * and Firestore checks the token itself. A token with a uid someone else wrote
 * into it is refused there, by the same rule that guards the admin panel.
 */
function uidOf(idToken: string): string | null {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    const text = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const uid = JSON.parse(text).user_id ?? JSON.parse(text).sub;
    return typeof uid === "string" && uid.length > 0 ? uid : null;
  } catch {
    return null;
  }
}

/**
 * Is the caller the owner?
 *
 * The question is put to Firestore under the caller's own token, so the answer
 * comes from `firestore.rules` — the same `/owners/{uid}` entry the panel
 * itself is gated on, rather than a second copy of the rule living here.
 */
async function isOwner(idToken: string, projectId: string): Promise<boolean> {
  const uid = uidOf(idToken);
  if (!uid) return false;

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/owners/${uid}`,
    { headers: { authorization: `Bearer ${idToken}` } },
  );
  return response.ok;
}

interface RunState {
  running: boolean;
  startedAt?: string;
  finishedAt?: string;
  /** "success", "failure", … — absent while a run is still going. */
  conclusion?: string;
}

async function latestRuns(env: Env): Promise<RunState> {
  const workflow = env.GITHUB_WORKFLOW || DEFAULTS.workflow;
  const response = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${workflow}/runs?per_page=5`,
    { headers: { ...GITHUB_HEADERS, authorization: `Bearer ${env.GITHUB_TOKEN}` } },
  );
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${await response.text()}`);

  const body = (await response.json()) as {
    workflow_runs?: {
      status: string;
      conclusion: string | null;
      created_at: string;
      updated_at: string;
    }[];
  };
  const runs = body.workflow_runs ?? [];

  const active = runs.find((run) => run.status !== "completed");
  if (active) return { running: true, startedAt: active.created_at };

  const last = runs[0];
  return last
    ? {
        running: false,
        startedAt: last.created_at,
        finishedAt: last.updated_at,
        conclusion: last.conclusion ?? undefined,
      }
    : { running: false };
}

async function startRun(env: Env): Promise<void> {
  const workflow = env.GITHUB_WORKFLOW || DEFAULTS.workflow;
  const response = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        ...GITHUB_HEADERS,
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ref: env.GITHUB_REF || DEFAULTS.ref,
        inputs: { environment: "production" },
      }),
    },
  );
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${await response.text()}`);
}

async function rebuild(request: Request, env: Env): Promise<Response> {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return json({ error: "not-configured" }, 503);
  }

  const header = request.headers.get("authorization") ?? "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken || !(await isOwner(idToken, env.FIREBASE_PROJECT_ID || DEFAULTS.projectId))) {
    return json({ error: "unauthorized" }, 401);
  }

  const state = await latestRuns(env);
  if (request.method === "GET") return json(state);

  // A build already under way covers whatever was just saved, and one that
  // started a moment ago is still reading the database the panel has just
  // written to. Either way a second build would only queue behind the first.
  if (state.running) return json({ started: false, reason: "already-running", ...state });

  const minInterval = Number(env.REBUILD_MIN_INTERVAL ?? DEFAULTS.minInterval);
  const since = state.startedAt ? (Date.now() - Date.parse(state.startedAt)) / 1000 : Infinity;
  if (since < minInterval) {
    return json({ started: false, reason: "too-soon", retryAfter: Math.ceil(minInterval - since), ...state });
  }

  await startRun(env);
  return json({ started: true, running: true, startedAt: new Date().toISOString() });
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/rebuild" || pathname === "/api/rebuild/") {
      if (request.method !== "GET" && request.method !== "POST") {
        return json({ error: "method-not-allowed" }, 405);
      }
      try {
        return await rebuild(request, env);
      } catch (error) {
        return json({ error: "github-failed", detail: String(error) }, 502);
      }
    }

    return json({ error: "not-found" }, 404);
  },
};

export default worker;
