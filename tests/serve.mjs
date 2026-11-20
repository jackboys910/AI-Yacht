/**
 * The exported site, served the way Cloudflare serves it.
 *
 * Two details matter for the checks and are easy to get wrong:
 *
 *  - a directory answers with its `index.html`, because every route in this
 *    site ends in a slash (`trailingSlash: true`);
 *  - a missing address answers with `out/404.html` **and the 404 status**,
 *    which is what `not_found_handling: "404-page"` does in production. A
 *    server that returns 200 for a missing page would let a broken 404 pass.
 *
 * It is deliberately not a dependency: one file of Node's own http server is
 * less to keep working than a package, and the tests need nothing else.
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/**
 * Starts the server and resolves once it is listening.
 *
 * @param {{ root?: string, port?: number }} options
 * @returns {Promise<{ url: string, port: number, close: () => Promise<void> }>}
 */
export async function serveExport({ root = "out", port = 0 } = {}) {
  const base = resolve(root);

  const server = createServer(async (request, response) => {
    const address = decodeURIComponent((request.url ?? "/").split("?")[0]);
    let file = resolve(join(base, normalize(address)));

    // Nothing above the export is readable, whatever the address contains.
    if (file !== base && !file.startsWith(base + (process.platform === "win32" ? "\\" : "/"))) {
      response.writeHead(403).end("outside the export");
      return;
    }

    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    } catch {
      if (!extname(file)) file += ".html";
    }

    try {
      const body = await readFile(file);
      response.writeHead(200, {
        "content-type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
        "cache-control": "no-store",
      });
      response.end(body);
    } catch {
      try {
        const page = await readFile(join(base, "404.html"));
        response.writeHead(404, { "content-type": TYPES[".html"] });
        response.end(page);
      } catch {
        response.writeHead(404, { "content-type": "text/plain" }).end("not found");
      }
    }
  });

  await new Promise((done, fail) => {
    server.once("error", fail);
    server.listen(port, "127.0.0.1", done);
  });

  const actual = server.address().port;
  return {
    url: `http://127.0.0.1:${actual}`,
    port: actual,
    close: () =>
      new Promise((done) => {
        server.closeAllConnections?.();
        server.close(() => done());
      }),
  };
}

// Also runnable on its own, for looking at a build by hand.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  const { url } = await serveExport({ port: Number(process.env.PORT || 4173) });
  console.log(`the export is at ${url}`);
}
