#!/usr/bin/env node
/**
 * Т-01: Lighthouse for mobile, on the home page, a direction page and a trip.
 *
 *   node tests/lighthouse.mjs                      # the live site
 *   node tests/lighthouse.mjs --site http://…      # anything else
 *   node tests/lighthouse.mjs --local              # the export in out/
 *
 * The thresholds are the ones the ТЗ fixes: 85 for performance, 90 for
 * accessibility and for SEO. Best practices is measured and printed without a
 * threshold, because the ТЗ does not set one and a number nobody agreed to is
 * not a pass or a fail.
 *
 * Lighthouse is run through `npx` rather than added to the project. It pulls
 * in several hundred packages for something that runs by hand a few times a
 * year, and a dependency in `package.json` is a dependency the deploy installs
 * on every build.
 *
 * It is pointed at the **live site** by default on purpose: a local export
 * served by a Node script over plain http has no compression, no cache
 * headers and no CDN, so its numbers say nothing about what a visitor gets.
 * `--local` is there for comparing two builds, not for the criterion.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { loadPlaywright } from "./harness.mjs";
import { serveExport } from "./serve.mjs";

const THRESHOLDS = { performance: 85, accessibility: 90, seo: 90 };
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

const args = process.argv.slice(2);
const local = args.includes("--local");
const siteArg = args.indexOf("--site");
const site = siteArg >= 0 ? args[siteArg + 1].replace(/\/$/, "") : null;
const out = join(process.cwd(), "lighthouse");

/** A Chrome for Lighthouse to drive: the one Playwright already downloaded. */
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const { playwright } = loadPlaywright();
  return playwright.chromium.executablePath();
}

/**
 * How to start Lighthouse without a shell.
 *
 * Its own `cli/index.js` first, when it is installed: that is one process
 * instead of three and it cannot fail while npx tidies its cache, which on
 * Windows it does while the files are still held.
 *
 * Otherwise npm's `npx-cli.js`, run by this Node — on Windows `npx` is a
 * `.cmd`, which Node refuses to spawn without `shell: true`, and a shell then
 * has to quote paths containing spaces.
 */
function lighthouseCommand() {
  const near = [
    join(dirname(process.execPath), "node_modules/lighthouse/cli/index.js"),
    join(dirname(process.execPath), "../lib/node_modules/lighthouse/cli/index.js"),
    join(process.cwd(), "node_modules/lighthouse/cli/index.js"),
  ].find((one) => existsSync(one));
  if (near) return { command: process.execPath, lead: [near], how: "установленный lighthouse" };

  const npx = [
    join(dirname(process.execPath), "node_modules/npm/bin/npx-cli.js"),
    join(dirname(process.execPath), "../lib/node_modules/npm/bin/npx-cli.js"),
  ].find((one) => existsSync(one));
  if (npx) return { command: process.execPath, lead: [npx, "-y", "lighthouse"], how: "npx lighthouse" };

  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    lead: ["-y", "lighthouse"],
    shell: true,
    how: "npx через оболочку",
  };
}

function run(address, name) {
  // With two output formats Lighthouse treats the path as a base and appends
  // its own extension to each: `home` becomes `home.report.json`.
  const report = join(out, `${name}.report.json`);
  const cli = lighthouseCommand();
  const result = spawnSync(
    cli.command,
    [
      ...cli.lead,
      address,
      "--quiet",
      "--output=json",
      "--output=html",
      `--output-path=${join(out, name)}`,
      // The ТЗ asks for the mobile score, which is Lighthouse's own default
      // preset: a slow 4G connection and a throttled processor.
      "--form-factor=mobile",
      "--screenEmulation.mobile",
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
      `--only-categories=${CATEGORIES.join(",")}`,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      env: { ...process.env, CHROME_PATH: chromePath() },
      // A throttled run of a page is slow by design, and a cold npx has to
      // fetch Lighthouse first.
      timeout: 10 * 60 * 1000,
      shell: cli.shell ?? false,
    },
  );

  // The report, not the exit code, is the answer. Lighthouse audits the page
  // and then deletes the throwaway Chrome profile it made, and on Windows that
  // last step fails often enough — a file still held, an antivirus — to throw
  // away a finished measurement over it.
  const finished = existsSync(report);
  if (!finished) {
    const why =
      (result.error ? String(result.error) : "") ||
      (result.stderr || result.stdout || "").split("\n").filter(Boolean).slice(-4).join(" | ");
    return { error: why || `lighthouse вышел с кодом ${result.status}` };
  }

  const parsed = JSON.parse(readFileSync(report, "utf8"));
  const warning =
    result.status !== 0
      ? "замер прошёл, но Lighthouse не смог убрать за собой временный профиль Chrome"
      : null;
  const scores = {};
  for (const key of CATEGORIES) {
    scores[key] = Math.round((parsed.categories[key]?.score ?? 0) * 100);
  }
  return { scores, warning, html: join(out, `${name}.report.html`) };
}

const server = local ? await serveExport({ port: 0 }) : null;
const base = site ?? (local ? server.url : "https://nazarov.net");

// The three pages the plan names: the home page, a direction and a trip.
const page = (path, name) => ({ address: `${base}${path}`, name });
const targets = [page("/", "home"), page("/sailing/", "sailing"), page("/sailing/ai-yacht/", "trip")];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

console.log(`Lighthouse, мобильный профиль: ${base}`);
console.log(`как запускается: ${lighthouseCommand().how}`);
console.log(`порог: производительность ${THRESHOLDS.performance}, доступность и SEO ${THRESHOLDS.accessibility}/${THRESHOLDS.seo}\n`);

let failures = 0;
for (const target of targets) {
  process.stdout.write(`${target.address} … `);
  const { scores, error, warning, html } = run(target.address, target.name);
  if (error) {
    console.log(`НЕ ПОЛУЧИЛОСЬ — ${error}`);
    failures += 1;
    continue;
  }

  const bad = Object.entries(THRESHOLDS).filter(([key, least]) => scores[key] < least);
  console.log(
    `производительность ${scores.performance}, доступность ${scores.accessibility}, ` +
      `SEO ${scores.seo}, практики ${scores["best-practices"]}` +
      (bad.length === 0 ? "  — проходит" : `  — НЕ ПРОХОДИТ: ${bad.map(([k, v]) => `${k} < ${v}`).join(", ")}`),
  );
  if (warning) console.log(`   замечание: ${warning}`);
  console.log(`   отчёт: ${html}`);
  failures += bad.length;
}

if (server) await server.close();
console.log(failures === 0 ? "\nТ-01: все три страницы проходят порог." : `\nТ-01: ${failures} показателей ниже порога.`);
process.exit(failures === 0 ? 0 : 1);
