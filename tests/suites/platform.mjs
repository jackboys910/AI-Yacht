/**
 * The site in each browser, and the things that are true of the site as a
 * whole: Т-02 (Chrome, Safari, Firefox, Edge), Т-03 (https), Т-06, and the
 * widths of П-15 measured in the engine at hand.
 *
 * This is the one suite the runner repeats in every engine, because it is the
 * one whose answer can differ between them. WebKit here is Safari's engine —
 * the same one an iPhone runs — which is as close as a desktop can get to the
 * criterion without an iPhone in the room.
 */

import { DESKTOP, PHONE, hasSideScroll, openPage, pageText } from "../harness.mjs";

export const id = "platform";
export const title = "Браузеры и общие требования (Т-02, Т-03, Т-06, П-15)";

/** Enough of the site that a broken engine cannot pass by accident. */
const PAGES = ["/", "/sailing/", "/about/", "/solutions/", "/suggest/", "/privacy/", "/ru/"];

export async function run({ browser, base, run: report, browserName, site }) {
  const engine = { chromium: "Chrome", msedge: "Edge", firefox: "Firefox", webkit: "Safari" }[browserName] ?? browserName;

  report.group(`${engine}: страницы открываются и работают`);
  const page = await openPage(browser, { viewport: DESKTOP });

  const broken = [];
  page.on("pageerror", (error) => broken.push(String(error).split("\n")[0]));

  for (const address of PAGES) {
    const response = await page.goto(`${base}${address}`, { waitUntil: "load" });
    const text = await pageText(page, "body");
    const ok = (response?.status() ?? 0) < 400 && text.length > 200 && (await page.locator("h1").count()) > 0;
    report.check("Т-02", `${engine}: ${address}`, ok, `статус ${response?.status()}, символов ${text.length}`);
    // Let the page settle before leaving it. The counters are fetched after
    // hydration, and a request still in the air when the next navigation
    // starts is reported by WebKit as "cannot load … due to access control
    // checks" — a cancelled request, not a broken page, and not something to
    // fail an engine over.
    await page.waitForTimeout(1500);
  }

  // A page that throws while it hydrates looks fine in a screenshot and does
  // nothing when pressed, which is exactly the failure Т-02 is about.
  report.check("Т-02", `${engine}: без ошибок в консоли`, broken.length === 0, broken.slice(0, 3).join(" | "));

  // One thing that has to actually work, not merely render: the filter is the
  // smallest piece of behaviour on the site that every engine must manage.
  await page.goto(`${base}/`, { waitUntil: "load" });
  const count = () => page.locator("#upcoming article").count();
  const before = await count();
  const chip = page.locator("button", { hasText: /^Sailing$/ }).first();
  if ((await chip.count()) > 0) {
    await chip.click();
    await page.waitForTimeout(600);
    const after = await count();
    report.check("Т-02", `${engine}: фильтр на главной отвечает`, after > 0 && after <= before, `${before} → ${after}`);
  }

  // And one dialog, because `<dialog>` is where engines differ most.
  await page.goto(`${base}/sailing/`, { waitUntil: "load" });
  await page.getByRole("button", { name: /\+ Subscribe to|\+ Подписаться на/ }).first().click();
  await page.waitForTimeout(900);
  report.check("Т-02", `${engine}: диалог подписки открывается`,
    await page.locator("dialog[open], [role=dialog]").first().isVisible());

  report.group(`${engine}: телефон`);
  const phone = await openPage(browser, { viewport: PHONE });
  await phone.goto(`${base}/`, { waitUntil: "load" });
  report.check("П-15", `${engine}: 390 px без горизонтальной прокрутки`, !(await hasSideScroll(phone)));
  const burger = phone.getByRole("button", { name: /Menu|Меню/ });
  if ((await burger.count()) > 0) {
    await burger.first().click();
    await phone.waitForTimeout(500);
    report.check("Т-02", `${engine}: меню на телефоне открывается`,
      await phone.evaluate(() =>
        [...document.querySelectorAll("a")].some(
          (one) => one.getAttribute("href") === "/sailing/" && one.getClientRects().length > 0,
        ),
      ));
  }
  await phone.context().close();

  report.group("Общие требования");
  const map = await page.request.get(`${base}/sitemap.xml`);
  report.check("Т-06", "карта сайта отдаётся", map.ok());
  const robots = await page.request.get(`${base}/robots.txt`);
  const robotsText = robots.ok() ? await robots.text() : "";
  report.check("Т-06", "robots.txt указывает на карту сайта", /Sitemap:/i.test(robotsText));
  report.check("Т-06", "robots.txt закрывает админку", /Disallow:\s*\/admin\//i.test(robotsText));

  if (site && site.startsWith("https://")) {
    // Only the live site can answer this: a local export has no certificate
    // and no redirect in front of it.
    const plain = site.replace("https://", "http://");
    const response = await fetch(`${plain}/sailing/`, { redirect: "manual" });
    const location = response.headers.get("location") ?? "";
    report.check("Т-03", "http переадресует на https",
      response.status >= 300 && response.status < 400 && location.startsWith("https://"),
      `${response.status} → ${location}`);
    report.check("Т-03", "переадресация сохраняет адрес страницы", location.endsWith("/sailing/"), location);

    const secure = await fetch(`${site}/sailing/`);
    report.check("Т-03", "https отдаёт страницу", secure.ok, String(secure.status));
  } else {
    report.skip("Т-03", "http переадресует на https", "локальная сборка отдаётся по http — проверяется с --site");
  }

  await page.context().close();
}
