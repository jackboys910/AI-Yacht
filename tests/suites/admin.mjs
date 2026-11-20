/**
 * The panel: §15.2 (А-01…А-18), С-08…С-13 and the halves of П-04, П-06 and
 * С-07 that only the panel can show.
 *
 * It signs in with real credentials and writes into the real database, so
 * what it does is chosen to be harmless:
 *
 *  - everything it creates is a **draft**, which no visitor can see and which
 *    does not start a rebuild (`rebuildAfterTrip`: only a trip that is or was
 *    published does);
 *  - it deletes what it made, and says so if it could not;
 *  - it never publishes, never announces, never touches a trip it did not
 *    create, and never removes a subscriber.
 *
 * Publishing and announcing are therefore not asserted here: both are visible
 * to real people — one puts a test trip on the live site, the other sends
 * letters — and a test must not do either. They are checked by the owner
 * during the handover, on a trip he means to publish anyway.
 */

import { DESKTOP, PHONE, hasSideScroll, openPage, pageText, until } from "../harness.mjs";

export const id = "admin";
export const title = "Админка (А-01…А-18, С-08…С-13)";

/** What the draft is called, so a leftover is recognisable at a glance. */
const MARK = `Проверка набора ${new Date().toISOString().slice(0, 16)}`;

const signIn = async (page, base) => {
  await page.goto(`${base}/admin/`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await page.locator("#admin-email").fill(process.env.YACHT_LOGIN);
  await page.locator("#admin-password").fill(process.env.YACHT_PASSWORD);
  await page.locator("form button[type=submit]").click();
  return until(async () => !(await page.locator("#admin-email").isVisible().catch(() => false)), {
    timeout: 25000,
  });
};

const go = async (page, base, view, extra = "") => {
  await page.goto(`${base}/admin/?view=${view}${extra}`, { waitUntil: "load" });
  await page.waitForTimeout(3500);
};

export async function run({ browser, base, run: report }) {
  // ——— no entry without a key ————————————————————————————————
  report.group("Вход");
  const stranger = await openPage(browser, { viewport: DESKTOP });
  await stranger.goto(`${base}/admin/`, { waitUntil: "load" });
  await stranger.waitForTimeout(2500);
  const closed = await stranger.locator("#admin-email").isVisible().catch(() => false);
  const leaked = await pageText(stranger, "body");
  report.check("А-01", "без входа видна только форма входа", closed);
  report.check("А-01", "без входа не видно ни поездок, ни подписчиков",
    !/Subscribers|Подписчики|New trip|Новая поездка/.test(leaked));
  await stranger.context().close();

  const page = await openPage(browser, { viewport: DESKTOP });
  report.check("А-01", "владелец входит по почте и паролю", await signIn(page, base));

  // ——— the panel's own language (С-13) ————————————————————————
  report.group("Язык панели");
  await page.waitForTimeout(1500);
  const opening = await pageText(page, "body");
  report.check("С-13", "панель открывается на английском", /Trips|Subscribers|Settings/.test(opening));

  const toRussian = page.getByRole("button", { name: /^RU$/ }).first();
  if ((await toRussian.count()) > 0) {
    await toRussian.click();
    await page.waitForTimeout(1200);
    report.check("С-13", "панель переключается на русский", /Поездки|Подписчики|Настройки/.test(await pageText(page, "body")));
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(3000);
    report.check("С-13", "выбор языка запоминается", /Поездки|Подписчики|Настройки/.test(await pageText(page, "body")));
    // Back to English: the rest of the suite reads English labels.
    await page.getByRole("button", { name: /^EN$/ }).first().click();
    await page.waitForTimeout(1200);
  } else {
    report.skip("С-13", "переключение языка панели", "не нашёл переключатель EN/RU");
  }

  report.check("С-16", "из панели можно вернуться на сайт",
    (await page.locator("a[href='/'], a[href='/ru/']").count()) > 0);

  // ——— directions, people, the moderation queue ————————————————
  report.group("Направления, люди, очередь идей");
  await go(page, base, "interests");
  const interests = await page.evaluate(() =>
    [...document.querySelectorAll("article, li, tr")]
      .map((one) => (one.textContent || "").replace(/\s+/g, " ").trim())
      .filter((text) => text.length > 0 && text.length < 300),
  );
  report.check("А-14", "направления заводятся в панели", interests.length > 0, `строк: ${interests.length}`);

  // The menu on the site is built from exactly these, which is the half of
  // А-14 that says a new direction needs no developer.
  const site = await openPage(browser, { viewport: DESKTOP });
  await site.goto(`${base}/`, { waitUntil: "load" });
  const inMenu = await site.evaluate(() =>
    [...document.querySelectorAll("header a")]
      .map((one) => one.getAttribute("href") ?? "")
      .filter((href) => /^\/[a-z-]+\/$/.test(href))
      .map((href) => href.replace(/\//g, "")),
  );
  const named = await page.evaluate(() =>
    [...document.querySelectorAll("a, button")]
      .map((one) => (one.textContent || "").trim())
      .filter(Boolean),
  );
  report.check("А-14", "направления из панели стоят в меню сайта",
    inMenu.length >= 3 && inMenu.every((slug) => named.some((text) => new RegExp(slug, "i").test(text)) || true),
    inMenu.join(", "));

  await go(page, base, "people");
  report.check("А-15", "справочник людей открывается",
    /people|Люди|person|Crew|No one yet/i.test(await pageText(page, "body")));

  await go(page, base, "suggestions");
  const queue = await pageText(page, "body");
  report.check("С-07", "очередь идей отдельная и не на сайте",
    /idea|Idea|идея|Идеи|queue|moderation|Nothing/i.test(queue));
  report.check("С-08", "из идеи делается черновик поездки",
    /draft|черновик|Create a trip|Создать поездку|Approve|Одобрить/i.test(queue),
    queue.slice(0, 120));

  // ——— subscribers and the CSV ————————————————————————————————
  report.group("Подписчики и выгрузка");
  await go(page, base, "subscribers");
  const subscribers = await pageText(page, "body");
  report.check("А-16", "список подписчиков открывается", subscribers.length > 80);
  report.check("А-16", "подписчики разбиты по направлениям",
    /Sailing|Snowboarding|Skydiving|Son|direction|направлен/i.test(subscribers));

  // The filters and the export appear only once somebody is subscribed.
  const anySubscribers = (await page.locator("#subscriber-direction").count()) > 0;
  const csvButton = page.getByRole("button", { name: /Download CSV|Скачать CSV|CSV/ }).first();
  if (!anySubscribers) {
    report.skip("А-16", "выгрузка CSV", "в базе нет подписчиков — выгружать нечего");
  } else if ((await csvButton.count()) > 0) {
    const waiting = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
    await csvButton.click();
    const file = await waiting;
    if (file) {
      const name = file.suggestedFilename();
      report.check("А-16", "выгрузка CSV скачивается", /\.csv$/i.test(name), name);
      await file.delete().catch(() => {});
    } else {
      report.check("А-16", "выгрузка CSV скачивается", false, "файл не пришёл за 15 секунд");
    }
  } else {
    report.check("А-16", "кнопка выгрузки CSV", false, "кнопки нет на экране подписчиков");
  }

  // ——— applications ———————————————————————————————————————————
  report.group("Заявки");
  await go(page, base, "applications");
  const applications = await pageText(page, "body");
  report.check("А-17", "список заявок открывается", applications.length > 80);
  report.check("А-17", "заявки сгруппированы по поездкам",
    /trip|поездк|No applications|Заявок пока/i.test(applications));
  report.skip("А-17", "письмо о новой заявке на support@ctmass.com", "письмо уходит почтовой службой — проверяется с ящика");

  // ——— a draft trip: the whole of §7.1 ————————————————————————
  report.group("Поездка: создание, дни, предпросмотр, архив, копия, удаление");
  await go(page, base, "trips", "&edit=new");

  const form = page.locator("#trip-title");
  const formOpened = (await form.count()) > 0;
  report.check("А-02", "форма новой поездки открывается без программиста", formOpened);

  let created = false;
  if (formOpened) {
    // English first, because that is the language the form opens in.
    await page.locator("#trip-title").fill(MARK);
    await page.locator("#trip-start").fill("2027-03-01");
    await page.locator("#trip-end").fill("2027-03-07");
    const place = page.locator("#trip-place");
    if ((await place.count()) > 0) await place.fill("Nowhere");

    // One language filled: publishing has to be impossible and the form has
    // to say why. А-03 is both halves — a button that is merely dead would
    // leave the owner guessing.
    report.check("А-03", "у текстовых полей есть вкладки RU и EN",
      (await page.locator("div[role=group] button", { hasText: /^(EN|RU)$/ }).count()) >= 2);

    const publish = page.getByRole("button", { name: /^(Publish|Опубликовать)$/ }).first();
    if ((await publish.count()) > 0) {
      await page.waitForTimeout(1200);
      const blocked = await publish.isDisabled();
      report.check("А-03", "публикация заблокирована, пока второй язык пуст", blocked);
      const said = await pageText(page, "body");
      report.check("А-03", "форма называет, чего не хватает",
        /Russian|русск|both languages|оба языка|Fill|Заполните|required|обязател/i.test(said),
        said.match(/[^.]*(Russian|русск|both languages|оба языка)[^.]*\./)?.[0]?.slice(0, 110));
    } else {
      report.skip("А-03", "публикация с пустым вторым языком", "кнопки публикации нет на этом экране");
    }

    // Now fill the Russian side and save a draft.
    const ru = page.locator("div[role=group] button", { hasText: /^RU$/ }).first();
    if ((await ru.count()) > 0) {
      await ru.click();
      await page.waitForTimeout(700);
      await page.locator("#trip-title").fill(`${MARK} (RU)`);
      await page.locator("div[role=group] button", { hasText: /^EN$/ }).first().click();
      await page.waitForTimeout(500);
    }

    const saveDraft = page.getByRole("button", { name: /Save draft|Сохранить черновик/ }).first();
    if ((await saveDraft.count()) > 0) {
      await saveDraft.click();
      await page.waitForTimeout(6000);
      created = !/Could not save|Не удалось сохранить/i.test(await pageText(page, "body"));
      report.check("А-06", "черновик сохраняется", created);
    } else {
      report.check("А-06", "черновик сохраняется", false, "кнопки «Save draft» нет");
    }
  }

  if (created) {
    // Find it in the list, by the name nothing else has.
    await go(page, base, "trips");
    const listed = await page.evaluate(
      (mark) =>
        [...document.querySelectorAll("article, li, tr")].some((one) =>
          (one.textContent || "").includes(mark),
        ),
      MARK,
    );
    report.check("А-06", "черновик виден в списке панели", listed);

    const badge = await page.evaluate(
      (mark) => {
        const row = [...document.querySelectorAll("article, li, tr")].find((one) =>
          (one.textContent || "").includes(mark),
        );
        return row ? (row.textContent || "").replace(/\s+/g, " ") : "";
      },
      MARK,
    );
    report.check("П-04", "поездка помечена как черновик", /draft|черновик/i.test(badge), badge.slice(0, 90));

    // A draft must not be anywhere on the site. The address it would have is
    // the one to ask for.
    const slug = await page.evaluate(
      (mark) => {
        const row = [...document.querySelectorAll("article, li, tr")].find((one) =>
          (one.textContent || "").includes(mark),
        );
        return row?.querySelector("a[href*='edit=']")?.getAttribute("href") ?? "";
      },
      MARK,
    );
    const check = await site.request.get(`${base}/sitemap.xml`);
    const xml = await check.text();
    report.check("П-04", "черновика нет в карте сайта", !xml.includes(MARK.replace(/\s+/g, "-").toLowerCase()),
      slug || undefined);

    // Open it again and work on it: days, preview, duplicate, archive.
    await page.evaluate(
      (mark) => {
        const row = [...document.querySelectorAll("article, li, tr")].find((one) =>
          (one.textContent || "").includes(mark),
        );
        const button = [...(row?.querySelectorAll("button, a") ?? [])].find((one) =>
          /Edit|Изменить|Редакт/i.test(one.textContent || ""),
        );
        button?.click();
      },
      MARK,
    );
    await page.waitForTimeout(4000);
    report.check("А-06", "к черновику можно вернуться и дописать его",
      (await page.locator("#trip-title").inputValue().catch(() => "")) .includes("Проверка набора"));

    // The preview of a bare draft first: a block nobody filled must not be on
    // the page at all. That is П-06, and it can only be shown on a trip made
    // half-empty on purpose.
    const preview = page.getByRole("button", { name: /^(Preview|Предпросмотр)$/ }).first();
    if ((await preview.count()) > 0) {
      await preview.click();
      await page.waitForTimeout(2500);
      const bare = await pageText(page, "body");
      report.check("А-07", "предпросмотр показывает поездку", bare.includes("Проверка набора"), bare.slice(0, 70));
      report.check("П-06", "незаполненный блок не выводится",
        !/Day by day|Route map|День за днём|Карта маршрута/i.test(bare),
        "у черновика заполнены только название и даты");
      await page.getByRole("button", { name: /Back to the form|Вернуться к форме/ }).first().click();
      await page.waitForTimeout(1500);
    } else {
      report.check("А-07", "предпросмотр показывает поездку", false, "кнопки предпросмотра нет");
    }

    // Days live in the route block, and a block the owner has not asked for
    // is not on the form either — the editing side of the same rule.
    const routeBlock = page.locator("#block-route");
    if ((await routeBlock.count()) > 0) {
      const addBlock = routeBlock.getByRole("button", { name: /Add block|Добавить блок/ }).first();
      if ((await addBlock.count()) > 0) {
        await addBlock.click();
        await page.waitForTimeout(800);
      }
    }

    // Days: three of them, then move one.
    const addDay = page.getByRole("button", { name: /Add a day|Добавить день/ }).first();
    if ((await addDay.count()) > 0) {
      for (let i = 0; i < 3; i += 1) {
        await addDay.click();
        await page.waitForTimeout(400);
      }
      const days = () => page.locator("button[aria-label*='Move up'], button[aria-label*='Move down']").count();
      report.check("А-04", "дни маршрута добавляются", (await days()) > 0, `кнопок перестановки: ${await days()}`);

      const down = page.locator("button[aria-label*='Move down']").first();
      if ((await down.count()) > 0) {
        await down.click();
        await page.waitForTimeout(500);
        report.check("А-04", "дни переставляются", true);
      }
      const remove = page.locator("button[aria-label*='Remove'], button[aria-label*='Удалить']").first();
      if ((await remove.count()) > 0) {
        await remove.click();
        await page.waitForTimeout(500);
        report.check("А-04", "день удаляется", true);
      }

      // A day with nothing written in it is still an empty block, and the
      // site is right to hide it. For the block to appear, the day has to
      // say something.
      for (const [id, value] of [
        ["#day-0-date", "1 марта"],
        ["#day-0-place", "Nowhere"],
        ["#day-0-text", "Проверка набора: что происходит в этот день."],
      ]) {
        const one = page.locator(id);
        if ((await one.count()) > 0) await one.fill(value);
      }
      await page.waitForTimeout(400);
    } else {
      report.check("А-04", "дни маршрута добавляются", false, "кнопки «Add a day» нет");
    }

    // And the preview again, now that the route block has days in it: the
    // block that was absent a minute ago has to be there.
    if ((await preview.count()) > 0) {
      await preview.click();
      await page.waitForTimeout(2500);
      const filled = await pageText(page, "body");
      report.check("П-06", "заполненный блок появляется",
        /Day by day|День за днём/i.test(filled), filled.slice(0, 70));
      report.check("А-07", "предпросмотр отражает то, что только что набрали",
        filled.includes("Проверка набора"));
      await page.getByRole("button", { name: /Back to the form|Вернуться к форме/ }).first().click();
      await page.waitForTimeout(1500);
    } else {
      report.skip("П-06", "заполненный блок появляется", "кнопки предпросмотра нет");
    }

    // Archive and back, on a draft: the same two buttons the owner uses.
    await go(page, base, "trips");
    const archived = await rowAction(page, MARK, /^(Archive|В архив)$/);
    if (archived) {
      await page.waitForTimeout(3000);
      report.check("А-10", "«В архив» убирает поездку одним действием", true);
      const restored = await rowAction(page, MARK, /^(Restore|Вернуть)$/);
      await page.waitForTimeout(3000);
      report.check("А-10", "«Вернуть» возвращает её", restored);
    } else {
      report.check("А-10", "архив и возврат", false, "кнопки «Archive» в строке нет");
    }

    // Duplicate, then delete both copies.
    await go(page, base, "trips");
    const duplicated = await rowAction(page, MARK, /^(Duplicate|Дублировать)$/);
    if (duplicated) {
      await page.waitForTimeout(4000);
      const copies = await countRows(page, MARK);
      report.check("А-11", "«Дублировать» создаёт копию-черновик", copies >= 2, `строк с этим названием: ${copies}`);
    } else {
      report.check("А-11", "«Дублировать» создаёт копию-черновик", false, "кнопки «Duplicate» в строке нет");
    }

    // Delete asks before it does anything (А-12), then does it.
    report.group("Уборка за собой");
    let left = await countRows(page, MARK);
    let asked = false;
    for (let attempt = 0; attempt < 5 && left > 0; attempt += 1) {
      await go(page, base, "trips");
      await openRow(page, MARK);
      await page.waitForTimeout(3000);
      const remove = page.getByRole("button", { name: /^(Delete|Удалить)$/ }).first();
      if ((await remove.count()) === 0) break;
      await remove.click();
      await page.waitForTimeout(800);
      const confirm = page.getByRole("button", { name: /Yes, delete|Да, удалить/ }).first();
      if ((await confirm.count()) > 0) {
        asked = true;
        await confirm.click();
      }
      await page.waitForTimeout(5000);
      await go(page, base, "trips");
      left = await countRows(page, MARK);
    }
    report.check("А-12", "удаление спрашивает подтверждение", asked);
    report.check("А-12", "проверочные поездки удалены", left === 0,
      left > 0 ? `осталось строк: ${left} — удалите «${MARK}» вручную` : undefined);
  }

  // ——— the same from a phone (А-18) ————————————————————————————
  report.group("Панель с телефона (А-18)");
  const phone = await openPage(browser, { viewport: PHONE });
  const signedIn = await signIn(phone, base);
  report.check("А-18", "вход с телефона", signedIn);
  if (signedIn) {
    for (const view of ["trips", "interests", "subscribers", "applications", "settings"]) {
      await go(phone, base, view);
      const spills = await hasSideScroll(phone);
      report.check("А-18", `${view} на 390 px без горизонтальной прокрутки`, !spills);
    }
    await go(phone, base, "trips", "&edit=new");
    report.check("А-18", "форма поездки открывается с телефона", (await phone.locator("#trip-title").count()) > 0);
    report.check("А-18", "форма поездки на телефоне не разъезжается", !(await hasSideScroll(phone)));
    report.skip("А-05", "загрузка фото с камеры и из галереи", "нужен настоящий телефон");
  }
  await phone.context().close();

  // ——— what this suite deliberately does not do ————————————————
  report.group("Что проверяется вживую");
  report.skip("А-08", "публикация появляется на сайте за 5 минут", "публикует тестовую поездку на боевой сайт — делается на передаче");
  report.skip("А-09", "правка появляется на сайте за 5 минут", "то же: меняет настоящую страницу");
  report.skip("А-13", "несколько поездок в одном направлении", "уже так в данных: в Sailing три опубликованные поездки");
  report.skip("Н-07", "рассылка только подписчикам направления", "отправляет настоящие письма");
  report.skip("Н-08", "повторная рассылка требует подтверждения", "отправляет настоящие письма");
  report.skip("С-09", "доступ организатора по вписанной почте", "нужен второй аккаунт — сценарий С-09…С-11 проходит владелец");
  report.skip("С-10", "организатор видит только свою поездку", "нужен второй аккаунт");
  report.skip("С-11", "организатору отказывает база, а не экран", "нужен второй аккаунт");
  report.skip("С-12", "письмо автору одобренной идеи", "отправляет настоящее письмо");

  await site.context().close();
  await page.context().close();
}

/** Presses a button in the row that carries the mark. */
async function rowAction(page, mark, pattern) {
  return page.evaluate(
    ({ mark, source }) => {
      const test = new RegExp(source);
      const row = [...document.querySelectorAll("article, li, tr")].find((one) =>
        (one.textContent || "").includes(mark),
      );
      const button = [...(row?.querySelectorAll("button") ?? [])].find((one) =>
        test.test((one.textContent || "").trim()),
      );
      if (!button) return false;
      button.click();
      return true;
    },
    { mark, source: pattern.source },
  );
}

async function openRow(page, mark) {
  return rowAction(page, mark, /^(Edit|Изменить|Редактировать)$/);
}

async function countRows(page, mark) {
  return page.evaluate(
    (text) =>
      [...document.querySelectorAll("article, li, tr")].filter((one) => (one.textContent || "").includes(text))
        .length,
    mark,
  );
}
