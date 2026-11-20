#!/usr/bin/env node
/**
 * The whole set of checks (5.4).
 *
 *   npm run build && npm test                 # the export, in Chromium
 *   npm test -- --browser all                 # Chromium, Firefox, WebKit, Edge (Т-02)
 *   npm test -- --site https://nazarov.net    # the live site
 *   npm test -- --suite public,share
 *   YACHT_LOGIN=… YACHT_PASSWORD=… npm test -- --suite admin
 *
 * Without `--site` it serves `out/` itself, so the checks run on exactly what
 * the deploy would upload. With `--site` the same files run against the real
 * thing; suites that would write into the production database say so and skip
 * instead of writing.
 *
 * The exit code is the number of checks that did not pass, so CI or a shell
 * can act on it.
 */

import { existsSync } from "node:fs";
import { BROWSERS, createRun, loadPlaywright, openBrowser, summarise } from "./harness.mjs";
import { serveExport } from "./serve.mjs";

const ALL = ["public", "trip", "forms", "platform", "admin"];

function parse(argv) {
  const args = { browsers: ["chromium"], suites: null, site: null, headed: false };
  for (let i = 0; i < argv.length; i += 1) {
    const one = argv[i];
    const value = () => argv[(i += 1)];
    if (one === "--browser" || one === "-b") {
      const asked = value();
      args.browsers = asked === "all" ? [...BROWSERS] : asked.split(",").map((x) => x.trim());
    } else if (one === "--suite" || one === "-s") {
      args.suites = value().split(",").map((x) => x.trim());
    } else if (one === "--site") {
      args.site = value().replace(/\/$/, "");
    } else if (one === "--headed") {
      args.headed = true;
    } else if (one === "--help" || one === "-h") {
      console.log(
        "node tests/run.mjs [--site URL] [--browser chromium,firefox,webkit,msedge|all]\n" +
          `                   [--suite ${ALL.join(",")}] [--headed]`,
      );
      process.exit(0);
    } else {
      console.error(`не понял аргумент: ${one}`);
      process.exit(2);
    }
  }
  return args;
}

const args = parse(process.argv.slice(2));
const credentials = Boolean(process.env.YACHT_LOGIN && process.env.YACHT_PASSWORD);

// Without credentials the admin suite cannot run, and asking for it without
// them is a mistake worth saying out loud rather than a silent empty report.
let suites = args.suites ?? ALL.filter((one) => one !== "admin" || credentials);
if (suites.includes("admin") && !credentials) {
  console.error("набору admin нужны YACHT_LOGIN и YACHT_PASSWORD в окружении");
  process.exit(2);
}
const unknown = suites.filter((one) => !ALL.includes(one));
if (unknown.length > 0) {
  console.error(`нет таких наборов: ${unknown.join(", ")} (есть: ${ALL.join(", ")})`);
  process.exit(2);
}

if (!args.site && !existsSync("out/index.html")) {
  console.error("нет out/index.html — сначала `npm run build`, либо запускайте с --site");
  process.exit(2);
}

const { version } = loadPlaywright();
const server = args.site ? null : await serveExport({ port: 0 });
const base = args.site ?? server.url;

console.log(`playwright ${version}`);
console.log(`адрес: ${base}${args.site ? " (боевой сайт)" : " (локальная сборка out/)"}`);
console.log(`браузеры: ${args.browsers.join(", ")}`);
console.log(`наборы: ${suites.join(", ")}`);

const runs = [];
let broke = 0;

for (const name of args.browsers) {
  let browser;
  try {
    browser = await openBrowser(name, { headed: args.headed });
  } catch (error) {
    console.log(`\n### ${name}: не запустился — ${String(error).split("\n")[0]}`);
    broke += 1;
    continue;
  }

  for (const suiteName of suites) {
    // Everything except the per-browser smoke check is the same in every
    // engine; running two hundred assertions four times would say nothing new
    // and take four times as long. Т-02 is what the other engines are for.
    if (name !== args.browsers[0] && suiteName !== "platform") continue;

    const suite = await import(`./suites/${suiteName}.mjs`);
    const report = createRun({ label: `${name}/${suiteName}` });
    console.log(`\n############ ${name} · ${suite.title} ############`);
    try {
      await suite.run({ browser, base, run: report, site: args.site, browserName: name, headed: args.headed });
    } catch (error) {
      report.check("—", `набор ${suiteName} оборвался`, false, String(error).split("\n")[0]);
    }
    runs.push(report);
  }

  await browser.close();
}

const failed = summarise(runs);
if (server) await server.close();

if (broke > 0) console.log(`\n${broke} браузер(ов) не запустилось`);
process.exit(failed + broke);
