/**
 * The whole site in one sweep: every page, every link, every file.
 *
 * The other suites each know a handful of addresses. This one knows none. It
 * starts at the two home pages and at `sitemap.xml`, follows every link that
 * stays inside the site, and asks for every file the pages reference. What it
 * looks for is the kind of break that appears without anybody touching the
 * code: the owner hides a direction and its address stays in the sitemap, an
 * upload fails halfway and leaves a picture pointing at nothing, a new page is
 * built and never reaches the map.
 *
 * Criteria: Т-06 (the sitemap and the pages agree), Т-03 (every address inside
 * the site is https), П-08 (both language versions of every address exist),
 * Ш-05 (each page has its own preview picture and description, and the picture
 * is really there). Dead links and missing files are tagged Т-02: the
 * acceptance list has no line of its own for them, and "the site works in
 * every browser" is the nearest thing it says.
 *
 * It is plain `fetch` rather than a browser, because what a crawler and a
 * messenger see is exactly this — the HTML as it was built. Anything a script
 * draws afterwards is the other suites' business.
 */

export const id = "links";
export const title = "Весь сайт одним обходом: ссылки, файлы, карта (Т-06, Т-03, П-08, Ш-05)";

/** A name for the logs of whatever is asked, with nothing personal in it. */
const AGENT = "nazarov-net-link-check";

/** Enough for a site many times this size, and a stop if a loop appears. */
const PAGE_LIMIT = 500;
const POOL = 6;

/** The site's own addresses, which absolute links and og:image use. */
const OWN_HOSTS = ["nazarov.net", "www.nazarov.net"];

/**
 * A page that asks not to be indexed is left out of the checks that are about
 * being indexed.
 *
 * `/unsubscribe/` is the case: it is about one person's subscription, it
 * carries `noindex, nofollow`, and it has no canonical, no language pair and
 * no preview picture **on purpose**. Demanding them of it would be demanding
 * the opposite of what it says.
 */
const indexable = (record) => !record.noindex;

/** Not an address this can ask for. */
const OTHER_SCHEME = /^(?:mailto:|tel:|javascript:|data:|blob:|#)/i;

/** A path that names a file rather than a page. */
const FILE = /\.(?:webp|jpe?g|png|svg|gif|avif|ico|css|js|mjs|json|xml|txt|webmanifest|mp4|webm|woff2?)$/i;

function attributes(raw) {
  const out = {};
  for (const found of raw.matchAll(/([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g)) {
    out[found[1].toLowerCase()] = found[2];
  }
  return out;
}

/** Every `<name …>` of a page, as plain objects of lowercased attributes. */
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, "gi"))].map((found) =>
    attributes(found[1]),
  );
}

function metaContent(all, key, value) {
  return all.find((one) => one[key] === value)?.content ?? "";
}

/** The candidates of a srcset, without their widths. */
function fromSrcset(value) {
  return (value ?? "")
    .split(",")
    .map((one) => one.trim().split(/\s+/)[0])
    .filter(Boolean);
}

const shorten = (items, limit = 4) =>
  items.slice(0, limit).join("; ") + (items.length > limit ? ` … и ещё ${items.length - limit}` : "");

/**
 * One request, with one retry.
 *
 * A single failed connection says nothing on a live site: a dropped TLS
 * handshake looks exactly like a missing file to a report that trusts the
 * first answer.
 */
async function ask(address, method = "GET") {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(address, {
        method,
        redirect: "follow",
        headers: { "user-agent": AGENT, accept: "*/*" },
      });
      const type = response.headers.get("content-type") ?? "";
      const wanted = method === "GET" && /text\/html|xml/i.test(type);
      const body = wanted ? await response.text() : null;
      if (!wanted) await response.body?.cancel().catch(() => {});
      return { status: response.status, body };
    } catch (error) {
      if (attempt === 2) return { status: 0, body: null, why: String(error).split("\n")[0] };
    }
  }
}

/**
 * The address to ask for, or null when it belongs to somebody else.
 *
 * A link to the site's own host is rewritten onto whatever is being checked,
 * so a local export is checked against its own files rather than against the
 * live site: `og:image` is always written out in full, and it is the one
 * reference that would otherwise walk off to production.
 */
function inside(href, from, base) {
  if (!href || OTHER_SCHEME.test(href)) return null;
  let url;
  try {
    url = new URL(href, from);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;
  const host = new URL(base).host;
  if (url.host !== host && !OWN_HOSTS.includes(url.host)) return null;
  return `${base}${url.pathname}${url.search}`;
}

export async function run({ base, run: report, site }) {
  const pages = new Map(); // pathname → what the page says about itself
  const files = new Map(); // file address → the page that references it
  const insecure = []; // references to our own host written as http://

  const map = await ask(`${base}/sitemap.xml`);
  const sitemap = new Set(
    [...(map.body ?? "").matchAll(/<loc>([^<]+)<\/loc>/g)].flatMap((found) => {
      try {
        return [new URL(found[1]).pathname];
      } catch {
        return [];
      }
    }),
  );

  const seen = new Set();
  const queue = [];

  const enqueue = (address, from) => {
    const { pathname } = new URL(address);
    if (seen.has(pathname) || seen.size >= PAGE_LIMIT) return;
    seen.add(pathname);
    queue.push({ address: `${base}${pathname}`, from });
  };
  for (const path of ["/", "/ru/", ...sitemap]) enqueue(`${base}${path}`, "карта сайта");

  async function visit({ address, from }) {
    const pathname = new URL(address).pathname;
    const { status, body, why } = await ask(address);
    const record = { status, from, why, links: [] };
    pages.set(pathname, record);
    if (!body) return;

    const metas = tags(body, "meta");
    const links = tags(body, "link");
    record.title = (body.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "").trim();
    record.description = metaContent(metas, "name", "description");
    record.ogImage = metaContent(metas, "property", "og:image");
    record.ogDescription = metaContent(metas, "property", "og:description");
    record.noindex = /noindex/i.test(metaContent(metas, "name", "robots"));
    record.canonical = links.find((one) => one.rel === "canonical")?.href ?? "";
    record.alternates = links
      .filter((one) => one.rel === "alternate" && one.hreflang)
      .map((one) => ({ lang: one.hreflang.toLowerCase(), href: one.href }));

    /** Everything this page points at, pages and files together. */
    const referenced = [
      ...tags(body, "a").map((one) => one.href),
      ...record.alternates.map((one) => one.href),
      ...tags(body, "img").flatMap((one) => [one.src, ...fromSrcset(one.srcset)]),
      ...tags(body, "source").flatMap((one) => [one.src, ...fromSrcset(one.srcset)]),
      ...tags(body, "video").map((one) => one.poster),
      ...tags(body, "script").map((one) => one.src),
      ...links
        .filter((one) => /stylesheet|icon|preload|manifest/i.test(one.rel ?? ""))
        .map((one) => one.href),
      record.ogImage,
      metaContent(metas, "name", "twitter:image"),
    ].filter(Boolean);

    for (const href of referenced) {
      if (href.startsWith("http://") && OWN_HOSTS.some((host) => href.includes(host))) {
        insecure.push(`${pathname} → ${href}`);
      }
      const target = inside(href, address, base);
      if (!target) continue;
      const path = new URL(target).pathname;
      if (FILE.test(path)) {
        if (!files.has(target)) files.set(target, pathname);
        continue;
      }
      // The panel is an application behind a login and robots.txt forbids it;
      // the footer's link to it is a link, not a page to crawl.
      if (/^\/admin/.test(path) || path.startsWith("/api/")) continue;
      record.links.push(path);
      enqueue(target, pathname);
    }
  }

  await Promise.all(
    Array.from({ length: POOL }, async () => {
      while (queue.length > 0) await visit(queue.shift());
    }),
  );

  // Files are asked for with HEAD: the answer is a status, and a hundred
  // photographs are not worth downloading to learn it.
  const missing = [];
  const addresses = [...files.keys()];
  await Promise.all(
    Array.from({ length: POOL }, async () => {
      while (addresses.length > 0) {
        const address = addresses.shift();
        let { status } = await ask(address, "HEAD");
        // Not every server answers HEAD, and the ones that refuse say so with
        // 405 or 501 rather than with 404.
        if (status === 405 || status === 501) ({ status } = await ask(address, "GET"));
        if (status >= 400 || status === 0) {
          missing.push(`${files.get(address)} → ${new URL(address).pathname} (${status})`);
        }
      }
    }),
  );

  const broken = (record) => !record || record.status >= 400 || record.status === 0;
  const alive = (path) => !broken(pages.get(path));

  report.group("Обход всего сайта");
  const counted = `страниц ${pages.size}, файлов ${files.size}`;

  const deadLinked = [...pages]
    .filter(([, record]) => broken(record) && record.from !== "карта сайта")
    .map(([path, record]) => `${record.from} → ${path} (${record.status || record.why})`);
  report.check("Т-02", "ссылки ведут на существующие страницы", deadLinked.length === 0,
    deadLinked.length === 0 ? counted : shorten(deadLinked));

  report.check("Т-02", "все картинки и файлы на месте", missing.length === 0,
    missing.length === 0 ? `файлов ${files.size}` : shorten(missing));

  if (site && site.startsWith("https://")) {
    report.check("Т-03", "внутри сайта нет ссылок по http", insecure.length === 0, shorten(insecure));
  } else {
    report.skip("Т-03", "внутри сайта нет ссылок по http", "локальная сборка сама отдаётся по http");
  }

  const live = [...pages].filter(([, record]) => !broken(record) && record.title !== undefined);
  /** The pages that mean to be found: everything below is about search. */
  const indexed = live.filter(([, record]) => indexable(record));

  const noCanonical = indexed
    .filter(([path, record]) => {
      if (!record.canonical) return true;
      try {
        return new URL(record.canonical).pathname !== path;
      } catch {
        return true;
      }
    })
    .map(([path, record]) => `${path} → «${record.canonical || "нет"}»`);
  report.check("Т-06", "canonical каждой страницы указывает на неё саму", noCanonical.length === 0,
    noCanonical.length === 0 ? `проверено страниц ${indexed.length}` : shorten(noCanonical));

  const noPair = indexed
    .filter(([, record]) => {
      const en = record.alternates.find((one) => one.lang === "en")?.href;
      const ru = record.alternates.find((one) => one.lang === "ru")?.href;
      if (!en || !ru) return true;
      return [en, ru].some((href) => {
        const target = inside(href, base, base);
        return !target || !alive(new URL(target).pathname);
      });
    })
    .map(([path]) => path);
  report.check("П-08", "у каждой страницы есть пара на другом языке, и она открывается",
    noPair.length === 0, noPair.length === 0 ? `пар ${indexed.length}` : shorten(noPair));

  const noPreview = indexed
    .filter(([, record]) => !record.ogImage || !record.ogDescription)
    .map(([path]) => path);
  const images = new Set(indexed.map(([, record]) => record.ogImage));
  report.check("Ш-05", "у каждой страницы есть своя картинка и описание для превью",
    noPreview.length === 0,
    noPreview.length === 0
      ? `разных картинок ${images.size} на ${indexed.length} страниц`
      : shorten(noPreview));

  report.group("Карта сайта");
  if (sitemap.size === 0) {
    report.check("Т-06", "карта сайта читается", false, `статус ${map.status}`);
    return;
  }

  const deadInMap = [...sitemap]
    .filter((path) => !alive(path))
    .map((path) => `${path} (${pages.get(path)?.status ?? "не проверен"})`);
  report.check("Т-06", "каждый адрес из карты сайта открывается", deadInMap.length === 0,
    deadInMap.length === 0 ? `адресов ${sitemap.size}` : shorten(deadInMap, 8));

  const offMap = indexed.map(([path]) => path).filter((path) => !sitemap.has(path));
  report.check("Т-06", "каждая страница сайта есть в карте", offMap.length === 0,
    offMap.length === 0 ? `страниц ${indexed.length}` : shorten(offMap, 8));
}
