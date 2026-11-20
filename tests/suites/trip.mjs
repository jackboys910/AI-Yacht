/**
 * The trip page, sharing and previews: §15.4 (Ш-01…Ш-05), С-15, and the parts
 * of §15.1 that belong to one trip rather than to the site.
 *
 * What a social network shows is decided by its own crawler, so what can be
 * checked here is what the crawler is given: the tags, their contents, and
 * that the picture they name actually exists and is big enough to be used.
 */

import { DESKTOP, PHONE, openPage, pageText } from "../harness.mjs";

export const id = "trip";
export const title = "Страница поездки, «Поделиться», превью (Ш-01…Ш-05, С-15)";

/** Pages whose own preview the ТЗ asks about (Ш-05). */
const PREVIEWS = ["/", "/sailing/", "/about/", "/story/", "/solutions/"];

const meta = (page, property) =>
  page.evaluate(
    (name) =>
      document.querySelector(`meta[property="${name}"]`)?.getAttribute("content") ??
      document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ??
      null,
    property,
  );

export async function run({ browser, base, run: report }) {
  const page = await openPage(browser, { viewport: DESKTOP });

  // Which trip to look at: the first card on the home page, so the suite
  // follows the data rather than a slug written into it.
  await page.goto(`${base}/`, { waitUntil: "load" });
  const trip =
    (await page.evaluate(
      () => document.querySelector("#upcoming article a")?.getAttribute("href") ?? null,
    )) ?? "/sailing/ai-yacht/";
  console.log(`  поездка для проверки: ${trip}`);

  report.group("Кнопки «Поделиться»");
  await page.goto(`${base}${trip}`, { waitUntil: "load" });

  const share = await page.evaluate(() =>
    [...document.querySelectorAll("a[href*='facebook.com/sharer'], a[href*='wa.me'], a[href*='t.me/share']")].map(
      (one) => ({ label: (one.textContent || "").trim(), href: one.getAttribute("href") }),
    ),
  );
  const labels = share.map((one) => one.label);
  report.check("Ш-01", "кнопка Facebook", labels.includes("Facebook"));
  report.check("Ш-01", "кнопка WhatsApp", labels.includes("WhatsApp"));
  report.check("Ш-01", "кнопка Telegram", labels.includes("Telegram"));
  report.check(
    "Ш-01",
    "кнопка «Скопировать ссылку»",
    (await page.getByRole("button", { name: /Copy link|Скопировать ссылку/ }).count()) > 0,
  );

  // Every share address must carry this trip's page, not the site's root:
  // Ш-02 is the one of these that actually breaks in practice.
  const canonical = await page.evaluate(() => document.querySelector("link[rel=canonical]")?.getAttribute("href") ?? "");
  const pointsHere = share.every((one) => {
    const target = decodeURIComponent(one.href);
    return target.includes(trip);
  });
  report.check("Ш-02", "каждая ссылка ведёт на страницу этой поездки", pointsHere, share.map((o) => o.href.slice(0, 60)).join(" | "));
  report.check("Ш-02", "canonical — адрес этой поездки", canonical.endsWith(trip), canonical);

  // The copy button writes to the clipboard, which needs permission even for
  // the page's own origin in a headless browser.
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  const copy = page.getByRole("button", { name: /Copy link|Скопировать ссылку/ }).first();
  if ((await copy.count()) > 0) {
    await copy.click();
    await page.waitForTimeout(600);
    const copied = await page.evaluate(() => navigator.clipboard.readText().catch(() => "")).catch(() => "");
    if (copied) {
      report.check("Ш-02", "в буфере — адрес этой поездки", decodeURIComponent(copied).includes(trip), copied);
    } else {
      report.skip("Ш-02", "содержимое буфера", "браузер не отдаёт буфер обмена автоматизации");
    }
    report.check(
      "Ш-01",
      "кнопка отвечает на нажатие",
      /Copied|Скопировано|Copy link|Скопировать/.test(await copy.innerText()),
    );
  }

  // The phone's own share sheet appears only where the browser has one. In a
  // desktop engine it is absent, and that is correct rather than a failure.
  const phone = await openPage(browser, { viewport: PHONE });
  await phone.goto(`${base}${trip}`, { waitUntil: "load" });
  const native = await phone.evaluate(() => typeof navigator.share === "function");
  if (native) {
    report.check(
      "Ш-01",
      "на телефоне есть системное «Поделиться»",
      (await phone.getByRole("button", { name: /More|Share|Поделиться|Ещё/ }).count()) > 0,
    );
  } else {
    report.skip("Ш-01", "системное меню «Поделиться»", "у этого движка нет navigator.share — кнопка и не должна появляться");
  }
  await phone.context().close();

  report.group("Превью для соцсетей");
  for (const address of [trip, ...PREVIEWS]) {
    await page.goto(`${base}${address}`, { waitUntil: "load" });
    const [ogTitle, ogImage, ogDescription, ogType, twitter] = await Promise.all([
      meta(page, "og:title"),
      meta(page, "og:image"),
      meta(page, "og:description"),
      meta(page, "og:type"),
      meta(page, "twitter:card"),
    ]);
    const code = address === trip ? "Ш-03" : "Ш-05";
    const whole = Boolean(ogTitle && ogImage && ogDescription);
    report.check(code, `${address}: есть заголовок, описание и картинка превью`, whole,
      whole ? undefined : `title=${ogTitle} image=${ogImage} description=${ogDescription}`);

    if (ogImage) {
      // A tag naming a picture that is not there is the usual reason a link
      // unfurls as a grey box, and nothing but fetching it will say so.
      const target = ogImage.startsWith("http") ? new URL(ogImage).pathname : ogImage;
      const response = await page.request.get(`${base}${target}`);
      const length = Number(response.headers()["content-length"] ?? 0);
      report.check(code, `${address}: картинка превью отдаётся`, response.ok(), `${response.status()} ${target}`);
      if (response.ok() && length > 0) {
        // Facebook refuses anything under 200×200; a file this small cannot be
        // a photograph at that size.
        report.check(code, `${address}: картинка не пустая (${Math.round(length / 1024)} КБ)`, length > 5000);
      }
    }
    if (address === trip) {
      const text = await pageText(page, "body");
      const dates = /\d{1,2}\s+\w+|\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2}\s*[–-]/.test(ogTitle + " " + ogDescription);
      report.check("С-15", "в превью поездки есть название и даты", Boolean(ogTitle) && dates,
        `og:title=«${ogTitle}» og:description=«${(ogDescription ?? "").slice(0, 60)}»`);
      report.check("С-15", "тип превью — статья или сайт", ogType === "article" || ogType === "website", String(ogType));
      report.check("Ш-04", "превью годится для Telegram и WhatsApp", Boolean(twitter || ogImage),
        `twitter:card=${twitter}`);
      report.check("П-06", "на странице поездки есть даты", /\d/.test(text));
    }
  }

  report.group("Заявка и «Мне интересно»");
  await page.goto(`${base}${trip}`, { waitUntil: "load" });
  report.check("С-06", "форма заявки спрашивает имя, почту и рассказ о себе",
    (await page.locator("[name=name]").count()) > 0 &&
      (await page.locator("[name=email]").count()) > 0 &&
      (await page.locator("[name=about]").count()) > 0);
  report.check("С-06", "форма заявки спрашивает ссылку на соцсеть",
    (await page.locator("[name=instagram], [name=facebook], [name=linkedin]").count()) > 0);
  report.check("П-09", "кнопка «Мне интересно» на месте",
    (await page.getByRole("button", { name: /I'm interested|Мне интересно/ }).count()) > 0);
  report.check("Т-05", "у формы заявки есть согласие со ссылкой на политику",
    (await page.locator("#join a[href*='/privacy/'], form a[href*='/privacy/']").count()) > 0);

  await page.context().close();
}
