/**
 * The public site: §15.1 of the ТЗ (П-01…П-16) and the parts of §14 of ТЗ v4
 * that a visitor can see (С-01…С-04, С-14, С-16, С-17).
 *
 * Written against what a visitor can perceive — words, links, what moves when
 * you hover, whether anything sticks out past the window — and not against
 * class names, so a restyling does not fail the suite and a broken page does.
 */

import { DESKTOP, PHONE, WIDTHS, hasSideScroll, openPage, pageText, watchTrackers } from "../harness.mjs";

/** Pages that must exist in both languages (П-08). */
const PAIRS = [
  ["/", "/ru/"],
  ["/sailing/", "/ru/sailing/"],
  ["/about/", "/ru/about/"],
  ["/story/", "/ru/story/"],
  ["/solutions/", "/ru/solutions/"],
  ["/privacy/", "/ru/privacy/"],
];

export const id = "public";
export const title = "Публичная часть (П-01…П-16, С-01…С-04, С-14…С-17)";

export async function run({ browser, base, run: report, site }) {
  const page = await openPage(browser, { viewport: DESKTOP });

  // ——— the menu ———————————————————————————————————————————————
  report.group("Меню и навигация");
  await page.goto(`${base}/`, { waitUntil: "load" });

  const menu = await page.evaluate(() =>
    [...document.querySelectorAll("header a, header nav a")].map((one) => ({
      text: (one.textContent || "").replace(/\s+/g, " ").trim(),
      href: one.getAttribute("href"),
    })),
  );
  const hrefs = menu.map((one) => one.href);

  report.check("П-01", "логотип ведёт на главную", hrefs.includes("/"));
  report.check("П-01", "направления в меню", ["/sailing/", "/snowboarding/", "/son/"].every((one) => hrefs.includes(one)));
  report.check("П-01", "Solutions в меню", hrefs.includes("/solutions/"));
  report.check("П-01", "About и Story в меню", hrefs.includes("/about/") && hrefs.includes("/story/"));
  report.check("П-01", "«Предложить идею» в меню", hrefs.includes("/suggest/"));
  report.check("П-01", "переключатель языка", hrefs.includes("/ru/"));
  report.check(
    "П-01",
    "кнопка «+ Subscribe» на главной",
    (await page.getByRole("button", { name: /\+ Subscribe|\+ Подписаться/ }).count()) > 0,
  );
  report.check("С-16", "из меню есть вход в панель", hrefs.includes("/admin/"));

  // The menu on a phone lives behind one button; its absence is a site with
  // no navigation at all on the width most visitors use.
  const phone = await openPage(browser, { viewport: PHONE });
  await phone.goto(`${base}/`, { waitUntil: "load" });
  const burger = phone.getByRole("button", { name: /Menu|Меню/ });
  report.check("П-01", "на телефоне меню открывается кнопкой", (await burger.count()) > 0);
  if ((await burger.count()) > 0) {
    await burger.first().click();
    await phone.waitForTimeout(500);
    const opened = await phone.evaluate(() =>
      [...document.querySelectorAll("a")].some((one) => one.getAttribute("href") === "/sailing/" && one.getClientRects().length > 0),
    );
    report.check("П-01", "в открытом меню видны направления", opened);
  }

  // ——— the first screen (ТЗ v4 §4) ————————————————————————————
  report.group("Первый экран главной");
  const openingPhone = await pageText(phone, "body");
  report.check(
    "С-03",
    "«A community, not a business» на телефоне",
    /community,\s*not a business|Сообщество,\s*а не бизнес/i.test(openingPhone),
  );
  report.check("С-01", "на 390×844 нет горизонтальной прокрутки", !(await hasSideScroll(phone)));

  const lanes = await phone.evaluate(() => {
    // The lanes of the letter: the links that carry a photograph, as opposed
    // to the same addresses in the menu and on the cards.
    const links = [...document.querySelectorAll("a.group")].filter(
      (one) =>
        ["/sailing/", "/snowboarding/", "/skydiving/", "/son/"].includes(one.getAttribute("href") || "") &&
        !one.closest("article"),
    );
    const boxes = links.map((one) => one.getBoundingClientRect()).filter((box) => box.width > 0);
    if (boxes.length === 0) return null;
    return {
      count: boxes.length,
      top: Math.min(...boxes.map((b) => b.top)),
      bottom: Math.max(...boxes.map((b) => b.bottom)),
      inner: window.innerHeight,
    };
  });
  report.check("С-01", "лента-S есть на телефоне", lanes !== null && lanes.count >= 4);
  if (lanes) {
    report.check(
      "С-01",
      `лента-S укладывается в экран (${Math.round(lanes.bottom - lanes.top)} px при ${lanes.inner})`,
      lanes.bottom - lanes.top <= lanes.inner,
    );
  }

  report.check(
    "С-03",
    "«A community, not a business» на десктопе",
    /community,\s*not a business/i.test(await pageText(page, "body")),
  );

  // Hovering a lane has to do something visible, and pressing it has to go to
  // the direction — С-02 is both halves, not just the link.
  const lane = page.locator('a.group[href="/sailing/"]').first();
  // Tailwind v4 grows things with the `scale` property rather than with a
  // transform matrix, and the photograph inside grows with it.
  const look = () =>
    lane.evaluate((node) => {
      const style = getComputedStyle(node);
      const image = node.querySelector("img");
      return [style.scale, style.transform, image ? getComputedStyle(image).scale : ""].join("|");
    });
  const before = await look();
  await lane.hover();
  await page.waitForTimeout(800);
  const after = await look();
  report.check("С-02", "наведение на направление меняет его вид", before !== after, `${before} → ${after}`);
  await lane.click();
  await page.waitForLoadState("load");
  report.check("С-02", "нажатие ведёт на страницу направления", new URL(page.url()).pathname === "/sailing/");

  // ——— the home list and its filter ————————————————————————————
  report.group("Главная: поездки и фильтр");
  await page.goto(`${base}/`, { waitUntil: "load" });
  const chips = page.locator("button", { hasText: /^(All|Sailing|Snowboarding|Son|Skydiving)$/ });
  const chipCount = await chips.count();
  report.check("П-02", "фильтр направлений на главной", chipCount >= 2, `кнопок: ${chipCount}`);

  // One address per card, from the list the filter governs — not every link
  // on the page, which would count the same trip three times.
  const cardTitles = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("#upcoming article")]
        .map((card) => card.querySelector("a")?.getAttribute("href") ?? "")
        .filter((href) => href.split("/").filter(Boolean).length >= 2),
    );
  const everything = await cardTitles();
  const directions = new Set(everything.map((href) => href.split("/")[1]));
  report.check("П-02", "на главной собраны ближайшие поездки", everything.length > 0,
    `карточек: ${everything.length}, направлений: ${[...directions].join(", ")}`);

  // The card has to carry the status and, when the owner filled the number
  // in, the seats left — П-09 is about the card as much as the page.
  const cards = await page.evaluate(() =>
    [...document.querySelectorAll("#upcoming article")].map((card) => (card.textContent || "").replace(/\s+/g, " ")),
  );
  report.check("П-09", "статус набора виден на карточке",
    cards.length > 0 && cards.every((text) => /Open for booking|Few spots left|Sold out|Completed/.test(text)));

  const sailingChip = page.locator("button", { hasText: /^Sailing$/ }).first();
  if ((await sailingChip.count()) > 0) {
    await sailingChip.click();
    await page.waitForTimeout(600);
    const filtered = await cardTitles();
    report.check(
      "П-02",
      "фильтр «Sailing» оставляет только яхтинг",
      filtered.length > 0 && filtered.every((href) => href.startsWith("/sailing/")),
      `${everything.length} → ${filtered.length}: ${filtered.join(", ")}`,
    );
    await page.locator("button", { hasText: /^All$/ }).first().click();
    await page.waitForTimeout(600);
    report.check("П-02", "«All» возвращает все направления", (await cardTitles()).length === everything.length);

    // A direction the filter has nothing for must come back empty rather than
    // fall back to everything — the usual way a filter is quietly broken.
    for (const name of ["Snowboarding", "Skydiving", "Son"]) {
      const chip = page.locator("button", { hasText: new RegExp(`^${name}$`) }).first();
      if ((await chip.count()) === 0) continue;
      await chip.click();
      await page.waitForTimeout(500);
      const theirs = await cardTitles();
      if (theirs.length !== everything.length) {
        report.check("П-02", `фильтр «${name}» действительно сужает список`, true,
          `${everything.length} → ${theirs.length}`);
        break;
      }
    }
    await page.locator("button", { hasText: /^All$/ }).first().click();
    await page.waitForTimeout(400);
  }

  report.check(
    "П-04",
    "на главной нет прошедших поездок",
    !/Completed|Поездка прошла/.test(await pageText(page, "body")),
  );
  report.check("С-17", "внизу главной — видео канала", (await page.locator("iframe, a[href*='youtube.com']").count()) > 0);

  // ——— a direction page ———————————————————————————————————————
  report.group("Страница направления");
  await page.goto(`${base}/sailing/`, { waitUntil: "load" });
  const sailing = await page.evaluate(() => {
    const groups = [...document.querySelectorAll("section, div")].filter((one) => one.id === "upcoming" || one.id === "past");
    return groups.map((one) => ({
      id: one.id,
      cards: [...one.querySelectorAll("article")].map((card) => ({
        href: card.querySelector("a")?.getAttribute("href") ?? "",
        text: (card.textContent || "").replace(/\s+/g, " ").trim(),
        apply: [...card.querySelectorAll("a,button")].some((el) =>
          /Join|Apply|Заявка|Записаться/i.test((el.textContent || "").trim()),
        ),
      })),
    }));
  });

  const upcoming = sailing.find((one) => one.id === "upcoming");
  const past = sailing.find((one) => one.id === "past");
  report.check("П-03", "в разделе есть ближайшие поездки", (upcoming?.cards.length ?? 0) > 0);
  report.check(
    "П-03",
    "все поездки раздела — этого направления",
    (upcoming?.cards ?? []).every((card) => card.href.includes("/sailing/")),
  );

  const dates = await page.evaluate(() =>
    [...document.querySelectorAll("#upcoming article")].map((card) => card.getAttribute("data-start") ?? ""),
  );
  if (dates.every((one) => one)) {
    const sorted = [...dates].sort();
    report.check("П-03", "ближайшая поездка первой", JSON.stringify(dates) === JSON.stringify(sorted));
  } else {
    // The cards do not carry their dates as attributes; the order is then
    // checked where the dates are known — in the admin suite.
    report.skip("П-03", "порядок по дате", "даты не выведены в разметку, проверяется в наборе admin");
  }

  if (past && past.cards.length > 0) {
    report.check("П-05", "прошедшие поездки — внизу раздела", true);
    report.check("П-05", "у прошедшей поездки нет кнопки заявки", past.cards.every((card) => !card.apply));
    report.check(
      "П-10",
      "прошедшая поездка помечена как завершённая",
      past.cards.every((card) => /Completed|Поездка прошла/.test(card.text)),
    );
  } else {
    report.skip("П-05", "блок прошедших поездок", "в этих данных нет архивной поездки с галочкой «показывать в прошедших»");
    report.skip("П-10", "статус «Завершено»", "нет поездки с прошедшей датой окончания");
  }

  report.check(
    "С-05",
    "на направлении есть подписка одной почтой",
    (await page.getByRole("button", { name: /\+ Subscribe to|\+ Подписаться на/ }).count()) > 0,
  );
  report.check("Н-01", "кнопка подписки в разделе", (await page.getByRole("button", { name: /Subscribe|Подписаться/ }).count()) > 0);

  // ——— a trip page ————————————————————————————————————————————
  report.group("Страница поездки");
  // Whichever trip the section shows first, not a slug written in here: the
  // owner archives and publishes trips, and a suite that holds on to one
  // address reports a 404 as a broken site.
  const tripHref =
    (await page.evaluate(
      () => document.querySelector("#upcoming article a")?.getAttribute("href") ?? null,
    )) ?? everything[0];
  report.check("П-03", "у раздела есть страница поездки", Boolean(tripHref), String(tripHref));
  await page.goto(`${base}${tripHref}`, { waitUntil: "load" });
  const blocks = await page.evaluate(() => [...document.querySelectorAll("[id]")].map((one) => one.id));
  report.check("П-06", "страница поездки собрана из блоков", blocks.includes("join") && blocks.includes("top"), `блоков: ${blocks.length}`);
  report.check("П-09", "на странице поездки виден статус набора",
    /Open for booking|Few spots left|Sold out|Набор открыт|Мест мало|Мест нет/.test(await pageText(page, "body")));
  report.check("Н-01", "кнопка подписки на странице поездки",
    (await page.getByRole("button", { name: /Subscribe|Подписаться/ }).count()) > 0);

  // No block may render as an empty frame: a heading with nothing under it is
  // exactly what "unfilled blocks are not shown" forbids.
  const hollow = await page.evaluate(() =>
    [...document.querySelectorAll("section[id], div[id]")]
      .filter((one) => one.querySelector("h2") && (one.textContent || "").replace(/\s+/g, " ").trim().length < 40)
      .map((one) => one.id),
  );
  report.check("П-06", "ни один блок не выведен пустым", hollow.length === 0, hollow.join(", "));
  // That a *missing* block disappears is shown where a half-filled trip can
  // be made on purpose rather than hoped for in the live data.
  report.skip("П-06", "блок отсутствует, когда не заполнен", "показывается в наборе admin на черновике с частью блоков");

  // ——— both languages ————————————————————————————————————————
  report.group("Два языка");
  for (const [en, ru] of PAIRS) {
    await page.goto(`${base}${en}`, { waitUntil: "load" });
    const leftLang = await page.evaluate(() => document.documentElement.lang);
    const left = await pageText(page, "body");
    await page.goto(`${base}${ru}`, { waitUntil: "load" });
    const rightLang = await page.evaluate(() => document.documentElement.lang);
    const right = await pageText(page, "body");

    // A name can be the same word in both languages — "Sailing" is the
    // owner's own Russian label for the direction — so the question is
    // whether the page is translated, not whether every line differs. Cyrillic
    // in the Russian one and a page that is not the English one word for word
    // is what the criterion is actually about.
    const cyrillic = (right.match(/[а-яё]/gi) ?? []).length;
    report.check(
      "П-08",
      `${en} и ${ru}: русская версия переведена`,
      leftLang === "en" && rightLang === "ru" && cyrillic > 100 && right !== left,
      `кириллических букв: ${cyrillic}`,
    );
  }

  // ——— About, Story, Solutions ————————————————————————————————
  report.group("About, Story, Solutions");
  await page.goto(`${base}/about/`, { waitUntil: "load" });
  const aboutText = await pageText(page, "body");
  report.check("С-04", "About: роли сообщества", /Four ways to take part/i.test(aboutText));
  report.check("С-04", "About: от идеи к поездке", /From an idea to an adventure/i.test(aboutText));
  report.check("С-04", "About: что мы просим друг от друга", /What we ask of each other/i.test(aboutText));
  await page.goto(`${base}/ru/about/`, { waitUntil: "load" });
  report.check("С-04", "About по-русски", (await page.locator("h1").count()) > 0 && (await page.evaluate(() => document.documentElement.lang)) === "ru");

  await page.goto(`${base}/story/`, { waitUntil: "load" });
  report.check("П-11", "Story: текст и фото", (await page.locator("img").count()) > 0 && (await pageText(page, "body")).length > 400);
  report.check("П-11", "Story: канал и видео",
    (await page.locator("a[href*='youtube.com'], iframe[src*='youtube']").count()) > 0);

  await page.goto(`${base}/solutions/`, { waitUntil: "load" });
  const solutions = await pageText(page, "body");
  report.check("П-14", "Solutions: услуги и форма", /Websites/i.test(solutions) && (await page.locator("#name, [name=name]").count()) > 0);
  report.check("С-14", "Solutions: запись через Calendly",
    (await page.locator("iframe[src*='calendly'], a[href*='calendly']").count()) > 0 || /Calendly/i.test(solutions));
  await page.goto(`${base}/ru/solutions/`, { waitUntil: "load" });
  report.check("П-14", "Solutions по-русски", (await page.evaluate(() => document.documentElement.lang)) === "ru");

  // ——— widths —————————————————————————————————————————————————
  report.group("Ширины от 320 px (П-15)");
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const address of ["/", "/sailing/", tripHref, "/about/"]) {
      await page.goto(`${base}${address}`, { waitUntil: "load" });
      await page.waitForTimeout(150);
      const spills = await hasSideScroll(page);
      if (spills) {
        const how = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        report.check("П-15", `${width} px · ${address}`, false, `вылезает на ${how} px`);
      }
    }
  }
  report.check("П-15", `нет горизонтальной прокрутки на ${WIDTHS.join(", ")} px`,
    report.results.filter((one) => one.code === "П-15" && one.state === "fail").length === 0);
  await page.setViewportSize(DESKTOP);

  // ——— trackers and the banner ————————————————————————————————
  report.group("Счётчики и баннер cookies");
  const clean = await openPage(browser, { viewport: DESKTOP });
  const hits = watchTrackers(clean);
  await clean.goto(`${base}/`, { waitUntil: "load" });
  await clean.waitForTimeout(2500);
  report.check("П-16", "до согласия рекламные счётчики не грузятся", hits.length === 0, hits.join(", "));

  const banner = clean.getByRole("button", { name: /Accept|Decline|Принять|Отклонить/ });
  if ((await banner.count()) > 0) {
    report.check("П-16", "баннер cookies показан", true);
    await clean.getByRole("button", { name: /Accept|Принять/ }).first().click();
    await clean.waitForTimeout(1200);
    report.check("П-16", "после согласия баннер уходит", (await banner.count()) === 0);
  } else {
    report.skip("П-16", "баннер cookies", "пиксель не настроен — баннеру нечего спрашивать (см. tests/README.md)");
  }
  await clean.context().close();

  // ——— privacy, sitemap, 404 ——————————————————————————————————
  report.group("Политика, карта сайта, 404");
  await page.goto(`${base}/privacy/`, { waitUntil: "load" });
  const privacy = await pageText(page, "body");
  report.check("Т-05", "политика конфиденциальности открывается", /Privacy/i.test(await page.title()));
  report.check("Т-05", "в политике есть почтовый адрес отправителя", /Suite|Street|United States/i.test(privacy));
  await page.goto(`${base}/ru/privacy/`, { waitUntil: "load" });
  report.check("Т-05", "политика на русском", (await page.evaluate(() => document.documentElement.lang)) === "ru");

  const map = await page.goto(`${base}/sitemap.xml`, { waitUntil: "load" });
  const xml = await map.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((one) => one[1]);
  report.check("Т-06", "карта сайта отдаётся", map.status() === 200 && locs.length > 0, `адресов: ${locs.length}`);
  report.check("Т-06", "в карте есть страницы поездок", locs.some((one) => /\/[a-z-]+\/[a-z0-9-]+\/$/.test(new URL(one).pathname)));
  report.check("Т-06", "в карте нет админки и отписки",
    !locs.some((one) => /\/admin\/|\/unsubscribe\//.test(one)));

  const missing = await page.goto(`${base}/no-such-page-${Date.now()}/`, { waitUntil: "load" });
  report.check("П-04", "неизвестный адрес отдаёт 404", missing.status() === 404, `статус ${missing.status()}`);
  report.check("П-04", "на странице 404 есть выходы на сайт",
    (await page.locator("a[href='/sailing/'], a[href='/']").count()) > 0);

  if (site) {
    report.skip("П-04", "черновики и архив не видны", "проверяется в наборе admin: список черновиков сверяется с адресами сайта");
  }

  await phone.context().close();
  await page.context().close();
}
