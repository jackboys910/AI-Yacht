/**
 * The forms: §15.3 as far as a browser can decide it (Н-01…Н-04, Н-06, Н-09,
 * Н-10, Н-12), С-05…С-07, П-14 and the consent half of Т-05.
 *
 * Nothing here is sent. Each endpoint is answered inside the browser, and the
 * suite asserts two things a real submission cannot be trusted to show: what
 * the page actually sends — which is where a missing field or a stray one
 * would be — and what it shows afterwards. The Worker's own half, including
 * refusing a request with no Turnstile token, is checked against its routes.
 */

import { DESKTOP, WIDTHS, captureApi, field, fillIfPresent, openPage, pageText, until } from "../harness.mjs";

export const id = "forms";
export const title = "Формы: подписка, заявка, идея, Solutions (Н-01…Н-12, С-05…С-07)";

/** The subscribe dialog, whichever element the browser gave it. */
const inDialog = (page, selector) =>
  page.locator(`dialog[open] ${selector}, [role=dialog] ${selector}`).first();

export async function run({ browser, base, run: report }) {
  // ——— subscribing ————————————————————————————————————————————
  report.group("Подписка");
  let page = await openPage(browser, { viewport: DESKTOP });
  const sent = await captureApi(page, "/api/subscribe", { ok: true, created: true, directions: ["Sailing"] });

  await page.goto(`${base}/sailing/`, { waitUntil: "load" });
  await page.getByRole("button", { name: /\+ Subscribe to|\+ Подписаться на/ }).first().click();
  await page.waitForTimeout(900);

  const dialog = page.locator("dialog[open], [role=dialog]").first();
  report.check("Н-01", "диалог подписки открывается", await dialog.isVisible());

  const inside = await page.evaluate(() => {
    const host = document.querySelector("dialog[open], [role=dialog]");
    if (!host) return null;
    return {
      text: (host.textContent || "").replace(/\s+/g, " ").trim(),
      fields: [...host.querySelectorAll("input, select, textarea")].map((one) => ({
        type: one.type,
        name: one.name,
      })),
      // The directions are buttons that stay pressed, not tick boxes.
      choices: [...host.querySelectorAll("[aria-pressed]")].map((one) => ({
        label: (one.textContent || "").trim(),
        on: one.getAttribute("aria-pressed") === "true",
      })),
    };
  });

  report.check("Н-02", "спрашивается только почта, телефон — нет",
    inside.fields.some((one) => one.type === "email") &&
      !inside.fields.some((one) => one.type === "tel" || /phone|телефон/i.test(one.name)));
  report.check("С-05", "подписка без регистрации — ни пароля, ни имени",
    !inside.fields.some((one) => one.type === "password") && !inside.fields.some((one) => /^name$/i.test(one.name)));
  report.check("Н-03", "направление страницы отмечено заранее",
    inside.choices.some((one) => one.on),
    `выбор: ${inside.choices.map((one) => `${one.label}${one.on ? "✓" : ""}`).join(", ")}`);
  report.check("Н-03", "направлений для выбора несколько", inside.choices.length > 1);
  report.check("Т-05", "в диалоге подписки есть ссылка на политику",
    (await page.locator("dialog a[href*='/privacy/'], [role=dialog] a[href*='/privacy/']").count()) > 0);
  report.check("Н-12", "капчу решать не нужно", !/captcha|капч/i.test(inside.text));

  // A second direction added to the one already chosen: Н-03 is about both
  // halves, and a dialog that silently replaces the choice would pass only
  // the first.
  const unchosen = page.locator("dialog [aria-pressed=false], [role=dialog] [aria-pressed=false]").first();
  if ((await unchosen.count()) > 0) await unchosen.click();
  await page.waitForTimeout(300);
  const chosenNow = await page.evaluate(
    () =>
      [...document.querySelectorAll("dialog [aria-pressed=true], [role=dialog] [aria-pressed=true]")].map((one) =>
        (one.textContent || "").trim(),
      ),
  );
  report.check("Н-03", "можно выбрать несколько направлений", chosenNow.length > 1, chosenNow.join(", "));

  await inDialog(page, "input[type=email]").fill("tests@example.invalid");
  await inDialog(page, "button[type=submit]").click();

  const answered = await until(async () => sent().length > 0, { timeout: 8000 });
  report.check("Н-04", "кнопка отправляет подписку", answered);
  if (answered) {
    const body = sent()[0] ?? {};
    report.check("Н-02", "в запросе только почта, направления и служебные поля",
      body.email === "tests@example.invalid" &&
        Array.isArray(body.interestIds) &&
        !("phone" in body) &&
        !("name" in body),
      Object.keys(body).join(", "));
    report.check("Н-03", "в запросе — все выбранные направления",
      (body.interestIds ?? []).length === chosenNow.length,
      (body.interestIds ?? []).join(", "));
    report.check("Н-12", "в запросе есть токен Turnstile", Boolean(body.turnstileToken));
  }

  await page.waitForTimeout(1200);
  const confirmation = await page.evaluate(() => {
    const host = document.querySelector("dialog[open], [role=dialog]");
    return (host?.textContent || "").replace(/\s+/g, " ").trim();
  });
  report.check("Н-04", "показано подтверждение подписки",
    /You are on the list|Вы в списке|subscribed|подписались/i.test(confirmation), confirmation.slice(0, 90));

  // The same address a second time is not a second subscriber: the Worker
  // answers `created: false`, and the page has to say so rather than claim a
  // new subscription.
  await page.context().close();
  page = await openPage(browser, { viewport: DESKTOP });
  await captureApi(page, "/api/subscribe", { ok: true, created: false, directions: ["Sailing"] });
  await page.goto(`${base}/sailing/`, { waitUntil: "load" });
  await page.getByRole("button", { name: /\+ Subscribe to|\+ Подписаться на/ }).first().click();
  await page.waitForTimeout(900);
  await inDialog(page, "input[type=email]").fill("tests@example.invalid");
  await inDialog(page, "button[type=submit]").click();
  await page.waitForTimeout(1500);
  const repeat = await page.evaluate(() => {
    const host = document.querySelector("dialog[open], [role=dialog]");
    return (host?.textContent || "").replace(/\s+/g, " ").trim();
  });
  report.check("Н-06", "повторная подписка не выдаётся за новую", /already|уже/i.test(repeat), repeat.slice(0, 120));

  // ——— unsubscribing ——————————————————————————————————————————
  report.group("Отписка");
  await page.goto(`${base}/unsubscribe/`, { waitUntil: "load" });
  const manage = await pageText(page, "body");
  report.check("Н-10", "страница отписки открывается без пароля",
    (await page.locator("input[type=password]").count()) === 0 && manage.length > 100);
  report.check("Н-09", "на странице отписки сказано, о чём она", /unsubscrib|отпис/i.test(manage));

  // ——— the application ————————————————————————————————————————
  report.group("Заявка на поездку");
  await page.context().close();
  page = await openPage(browser, { viewport: DESKTOP });
  const application = await captureApi(page, "/api/application", { ok: true });

  await page.goto(`${base}/`, { waitUntil: "load" });
  // Whichever trip is first on the home page. A slug written in here would
  // turn an archived trip into a failing suite.
  const trip = await page.evaluate(
    () => document.querySelector("#upcoming article a")?.getAttribute("href") ?? null,
  );
  if (!trip) {
    report.skip("С-06", "заявка на поездку", "на сайте нет опубликованных поездок — заявку отправлять некуда");
    report.skip("А-17", "заявка попадает в панель", "на сайте нет опубликованных поездок");
  } else {
    await page.goto(`${base}${trip}`, { waitUntil: "load" });

    await field(page, "name").fill("Проверка набора");
    await field(page, "email").fill("tests@example.invalid");
    await fillIfPresent(page, "city", "Glastonbury");
    await fillIfPresent(page, "instagram", "https://instagram.com/example");
    await fillIfPresent(page, "about", "Строка для проверки формы, не заявка.");
    await fillIfPresent(page, "why", "Проверка.");

    await page.getByRole("button", { name: /Send the application|Отправить заявку/ }).first().click();
    const gotApplication = await until(async () => application().length > 0, { timeout: 8000 });
    report.check("С-06", "заявка уходит на сервер", gotApplication);
    if (gotApplication) {
      const body = application()[0] ?? {};
      // `links` is a list of whichever addresses were given, which is what the
      // panel shows; the criterion asks for a link, not for a field name.
      const links = body.links ?? [];
      const social = Array.isArray(links)
        ? links.length > 0
        : Boolean(links.instagram || links.facebook || links.linkedin);
      report.check("С-06", "в заявке имя, почта, соцсеть и рассказ о себе",
        Boolean(body.name && body.email && body.about) && social,
        JSON.stringify({ name: body.name, email: body.email, links, about: Boolean(body.about) }).slice(0, 120));
      report.check("А-17", "в заявке указана поездка", Boolean(body.tripId || body.tripSlug || body.trip),
        JSON.stringify({ tripId: body.tripId, tripSlug: body.tripSlug }));
      report.check("Н-12", "в заявке есть токен Turnstile", Boolean(body.turnstileToken));
    }
    await page.waitForTimeout(1200);
    report.check("С-06", "посетителю показано, что заявка принята",
      /Got it|Заявка принята|thank/i.test(await pageText(page, "body")));

    // An empty form must not reach the server at all: a required field that is
    // only decoration is how junk gets into the database.
    await page.context().close();
    page = await openPage(browser, { viewport: DESKTOP });
    const empty = await captureApi(page, "/api/application", { ok: true });
    await page.goto(`${base}${trip}`, { waitUntil: "load" });
    await page.getByRole("button", { name: /Send the application|Отправить заявку/ }).first().click();
    await page.waitForTimeout(1500);
    report.check("А-17", "пустая заявка не отправляется", empty().length === 0);
  }

  // ——— an idea ————————————————————————————————————————————————
  report.group("Идея поездки");
  await page.context().close();
  page = await openPage(browser, { viewport: DESKTOP });
  const idea = await captureApi(page, "/api/suggestion", { ok: true });
  await page.goto(`${base}/suggest/`, { waitUntil: "load" });

  await field(page, "title").fill("Проверка набора: идея");
  // A required select that still says "choose one" stops the form in the
  // browser, before anything is sent.
  await field(page, "category").selectOption({ index: 1 });
  await field(page, "description").fill("Описание для проверки формы, не настоящая идея.");
  await field(page, "name").fill("Проверка набора");
  await field(page, "email").fill("tests@example.invalid");
  for (const one of ["place", "experience", "audience"]) {
    await fillIfPresent(page, one, "Проверка");
  }

  // The four answers the client asked to stop being free text (24.11.2026):
  // a date picked from a calendar, a number with a currency beside it, a
  // place that can come off a map, and photographs that are uploaded. Here
  // the first two are filled and checked through what the form sends; the
  // map and the uploader reach the network, so they have their own group.
  const fields = await page.evaluate(() =>
    [...document.querySelectorAll("form input, form select")].map((one) => `${one.name}:${one.type}`),
  );
  report.check("Н-10", "даты выбираются календарём, а не вписываются",
    fields.includes("whenFrom:date") && fields.includes("whenTo:date"), fields.join(" "));
  report.check("Н-10", "у бюджета есть валюта",
    fields.includes("budgetAmount:number") && fields.some((one) => one.startsWith("budgetCurrency:")));
  report.check("Н-10", "поля LinkedIn в форме идеи нет",
    !fields.some((one) => /linkedin/i.test(one)));
  report.check("Н-10", "фотографии загружаются, а не вписываются ссылками",
    fields.some((one) => one.endsWith(":file")));

  await field(page, "whenFrom").fill("2027-05-08");
  await field(page, "whenTo").fill("2027-05-16");
  await field(page, "budgetAmount").fill("1500");
  await field(page, "budgetCurrency").selectOption("EUR");

  // Before sending: a successful send replaces the form with a card, and
  // there is no form left to look in.
  report.check("Т-05", "у формы идеи есть ссылка на политику",
    (await page.locator("form a[href*='/privacy/']").count()) > 0);

  await page.getByRole("button", { name: /Send the idea|Отправить идею/ }).first().click();
  const gotIdea = await until(async () => idea().length > 0, { timeout: 8000 });
  report.check("С-07", "идея уходит на сервер", gotIdea);
  if (gotIdea) {
    const body = idea()[0] ?? {};
    report.check("С-07", "в идее есть название, описание и автор",
      Boolean(body.title && body.description && body.email), Object.keys(body).join(", "));
    report.check("Н-12", "в идее есть токен Turnstile", Boolean(body.turnstileToken));
    // Two controls, one line in the record: what the owner reads in the
    // letter is "€1 500" and "8 May 2027 — 16 May 2027", and what can be
    // sorted on is the pair of ISO dates beside them.
    report.check("Н-10", "бюджет уходит с валютой",
      typeof body.budget === "string" && /[€$£₽]/.test(body.budget), String(body.budget));
    report.check("Н-10", "даты уходят и словами, и как даты",
      body.whenFrom === "2027-05-08" && body.whenTo === "2027-05-16" &&
        typeof body.when === "string" && body.when.includes("2027"),
      `${body.when} (${body.whenFrom} … ${body.whenTo})`);
  }
  // That the idea is not on the site until it is published is the other half
  // of С-07, and it is the panel that can show it.
  report.skip("С-07", "идея не видна на сайте до публикации", "проверяется в наборе admin");

  // ——— the map behind the destination ————————————————————————————
  report.group("Карта в форме идеи");
  await page.context().close();
  page = await openPage(browser, { viewport: DESKTOP });

  const toOsm = [];
  page.on("request", (one) => {
    if (/openstreetmap\.org/.test(one.url())) toOsm.push(one.url());
  });

  await page.goto(`${base}/suggest/`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  // The privacy half of the feature: a visitor who never opens the map is
  // never shown to OpenStreetMap. The same promise the video wall makes.
  report.check("Т-05", "без нажатия к OpenStreetMap не ходят", toOsm.length === 0,
    toOsm.slice(0, 2).join(" "));

  const mapButton = page.getByRole("button", { name: /Choose on the map|Выбрать на карте/ }).first();
  report.check("Н-10", "у поля «куда» есть кнопка карты", await mapButton.count() > 0);

  if (await mapButton.count()) {
    await mapButton.click();
    const drawn = await until(
      async () => (await page.locator(".leaflet-container").count()) > 0,
      { timeout: 10000 },
    );
    report.check("Н-10", "карта открывается по нажатию", drawn);
    report.check("Н-10", "у карты есть ссылка на OpenStreetMap",
      (await page.locator(".leaflet-container a[href*='openstreetmap.org']").count()) > 0);
  }

  // ——— что ни одна надпись не лежит поверх поля ————————————————
  report.group("Вёрстка формы идеи (П-15)");
  await page.context().close();
  page = await openPage(browser, { viewport: DESKTOP });

  // A hint is pulled up by a negative margin so that it sits close under the
  // field it explains, and that works only where there is a gap for it to
  // eat. Put one where there is none and the line is drawn straight through
  // the field above it, at every width at once — which is what happened to
  // the hint under the dates. Two rectangles are enough to catch the whole
  // family of that mistake, and cheaper than an eye on every screenshot.
  const laidOver = () =>
    page.evaluate(() => {
      const controls = [...document.querySelectorAll("input, textarea, select, button")];
      const texts = [...document.querySelectorAll("p, span, label, h1, h2, h3, a")].filter((one) =>
        [...one.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim()));
      const over = (a, b) =>
        a.left < b.right - 0.5 && b.left < a.right - 0.5 &&
        a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

      const found = [];
      for (const one of texts) {
        const text = one.getBoundingClientRect();
        if (!text.width || !text.height) continue;
        for (const control of controls) {
          // A caption wrapping its own field overlaps it by construction.
          if (one.contains(control) || control.contains(one)) continue;
          const box = control.getBoundingClientRect();
          if (!box.width || !box.height) continue;
          if (over(text, box)) {
            found.push(`«${one.textContent.trim().slice(0, 40)}» поверх ${
              control.tagName.toLowerCase()}[${control.name || ""}]`);
          }
        }
      }
      return [...new Set(found)];
    });

  for (const path of ["/suggest/", "/ru/suggest/"]) {
    await page.goto(`${base}${path}`, { waitUntil: "load" });
    const over = [];
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(120);
      for (const line of await laidOver()) over.push(`${width}px — ${line}`);
    }
    report.check("П-15", `${path}: ни одна надпись не лежит поверх поля`,
      over.length === 0, over.slice(0, 3).join("; "));
  }
  await page.setViewportSize(DESKTOP);

  // ——— Solutions ——————————————————————————————————————————————
  report.group("Форма Solutions");
  await page.context().close();
  page = await openPage(browser, { viewport: DESKTOP });
  const solutions = await captureApi(page, "/api/solutions", { ok: true });
  await page.goto(`${base}/solutions/`, { waitUntil: "load" });

  await field(page, "name").fill("Проверка набора");
  await field(page, "email").fill("tests@example.invalid");
  await field(page, "message").fill("Строка для проверки формы.");
  const type = field(page, "projectType");
  if ((await type.count()) > 0) await type.selectOption({ index: 1 }).catch(() => {});
  await page.getByRole("button", { name: /^(Send|Отправить)$/ }).first().click();
  const gotSolutions = await until(async () => solutions().length > 0, { timeout: 8000 });
  report.check("П-14", "форма Solutions уходит на сервер", gotSolutions);
  if (gotSolutions) {
    const body = solutions()[0] ?? {};
    report.check("П-14", "в запросе Solutions есть имя, почта и текст",
      Boolean(body.name && body.email && body.message), Object.keys(body).join(", "));
    report.check("Н-12", "в запросе Solutions есть токен Turnstile", Boolean(body.turnstileToken));
  }
  await page.waitForTimeout(1200);
  report.check("П-14", "посетителю показано, что обращение принято",
    /Thanks|Спасибо/i.test(await pageText(page, "body")));

  // ——— what a letter has to carry ————————————————————————————
  report.group("Что в письмах (Н-09)");
  await page.goto(`${base}/privacy/`, { waitUntil: "load" });
  report.check("Н-09", "почтовый адрес отправителя опубликован",
    /Suite|Street|United States/i.test(await pageText(page, "body")));
  report.check("Н-09", "ссылка отписки ведёт на рабочую страницу", (await page.request.get(`${base}/unsubscribe/`)).ok());
  report.skip("Н-05", "письмо приходит в течение 5 минут", "решает почтовая служба; проверяется с реального ящика");
  report.skip("Н-07", "рассылка только подписчикам направления", "рассылка отправляет письма — проверяется в наборе admin");
  report.skip("Н-08", "повторная рассылка требует подтверждения", "проверяется в наборе admin");

  await page.context().close();
}
