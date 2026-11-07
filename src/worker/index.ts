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
 *
 * ТЗ v4 adds two more endpoints for the same reason as the first.
 * `/api/suggestion` holds a Turnstile secret, a Firebase service account and
 * an EmailJS private key, none of which may travel to a browser;
 * `/api/organizer-invite` needs that same private key, because a send from
 * the page can only ever address the owner's own mailbox.
 */

import { organizerInvite } from "./organizer";
import { bearerOf, isOwner } from "./owner";
import { suggestion } from "./suggestion";
import type { Env } from "./env";


const DEFAULTS = {
  workflow: "deploy.yml",
  ref: "main",
  projectId: "nazarov-net",
  minInterval: 90,
};

export type { Env };

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

  const idToken = bearerOf(request);
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

    if (pathname === "/api/suggestion" || pathname === "/api/suggestion/") {
      if (request.method !== "POST") {
        return json({ error: "method-not-allowed" }, 405);
      }
      try {
        return await suggestion(request, env);
      } catch (error) {
        // The detail is logged, not returned: it can carry a Firestore path
        // or a Google error, and a form on a public page is the wrong place
        // to print either.
        console.log(`suggestion failed: ${String(error)}`);
        return json({ error: "server" }, 502);
      }
    }

    if (pathname === "/api/organizer-invite" || pathname === "/api/organizer-invite/") {
      if (request.method !== "POST") {
        return json({ error: "method-not-allowed" }, 405);
      }
      try {
        return await organizerInvite(request, env);
      } catch (error) {
        // Only the owner can reach this, so the detail is safe to return and
        // useful: "the letter did not go" with no reason is a dead end.
        console.log(`organizer invite failed: ${String(error)}`);
        return json({ error: "send-failed", detail: String(error) }, 502);
      }
    }

    return json({ error: "not-found" }, 404);
  },
};

export default worker;
