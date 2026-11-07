import { siteConfig } from "../site";
import {
  renderEmailHtml,
  renderEmailText,
  type EmailContent,
  type OutgoingEmail,
} from "./shell";

/**
 * The letter that tells an organizer the panel exists (ТЗ v4, С-12).
 *
 * It is sent after the owner has approved somebody's idea and written their
 * address on the trip. The temptation is to send a link and leave it there,
 * and the plan says so in as many words: "Человек не знает, что у сайта есть
 * админка. Письмо должно объяснять это словами, а не присылать голую ссылку."
 * So the body is four steps, in order, with the address they must register on
 * spelled out — because registering on a different one produces an account
 * with no trip behind it, and that failure looks exactly like a broken site.
 *
 * Written in the language the person used when they sent the idea. To them
 * this is the site answering, not an internal notice.
 *
 * What it does not do is set a password or carry a token. Firebase's own
 * confirmation letter is the proof of who owns the address, and a second
 * mechanism invented here would be a second way in to get wrong.
 */

export interface OrganizerInviteData {
  /** The organizer's address — the one the trip is tied to. */
  email: string;
  /** Their name, if the idea carried one. */
  name?: string;
  /** The trip, in the organizer's language where there is a translation. */
  tripTitle: string;
  place?: string;
  startDate?: string;
  endDate?: string;
  /**
   * Where a reply goes.
   *
   * The letter is sent by a machine from a shared mailbox, and it tells the
   * person to come back to the owner for anything they may not do themselves
   * — so "reply to this letter" has to actually reach him.
   */
  ownerEmail?: string;
  locale: "en" | "ru";
}

const ADMIN_URL = `${siteConfig.url}/admin/`;
const ADMIN_LABEL = `${siteConfig.domain}/admin/`;

function dates(data: OrganizerInviteData): string {
  const from = data.startDate?.trim();
  const to = data.endDate?.trim();
  if (from && to) return `${from} — ${to}`;
  return from || to || "";
}

export function buildOrganizerInviteEmail(
  data: OrganizerInviteData,
): OutgoingEmail {
  const ru = data.locale === "ru";
  const who = data.name?.trim();

  // Numbered rather than prose, and the address repeated inside step 2: this
  // is the one instruction in the letter that cannot be guessed at.
  const steps = ru
    ? [
        `1. Откройте ${ADMIN_LABEL} — это панель сайта.`,
        `2. Нажмите «Создать аккаунт» и зарегистрируйтесь именно на этот адрес: ${data.email}. Поездка привязана к адресу, другой не подойдёт.`,
        "3. Firebase пришлёт письмо с подтверждением — перейдите по ссылке из него. Без подтверждения доступ не откроется: так адрес никто не займёт за вас.",
        "4. Вернитесь в панель и войдите. Вы увидите свою поездку и заявки на неё — больше ничего в панели вам не покажут.",
      ].join("\n")
    : [
        `1. Open ${ADMIN_LABEL} — that is the site's control panel.`,
        `2. Press “Create an account” and register on this exact address: ${data.email}. The trip is tied to the address; another one will not do.`,
        "3. Firebase sends a confirmation letter — follow the link in it. Access stays shut until the address is confirmed, which is what stops anyone claiming it before you.",
        "4. Come back to the panel and sign in. You will see your trip and the applications to it, and nothing else in the panel.",
      ].join("\n");

  const content: EmailContent = {
    preheader: ru
      ? `Вы ведёте поездку «${data.tripTitle}». Вот как войти в панель.`
      : `You are running “${data.tripTitle}”. Here is how to get into the panel.`,
    brand: "NAZAROV.NET",
    kicker: ru ? "Организатор поездки" : "Trip organizer",
    title: ru ? "Ваша поездка принята" : "Your trip is on",
    subtitle: ru
      ? who
        ? `${who}, идея подходит — дальше поездку ведёте вы.`
        : "Идея подходит — дальше поездку ведёте вы."
      : who
        ? `${who}, the idea fits — the trip is yours to run.`
        : "The idea fits — the trip is yours to run.",
    rowsLabel: ru ? "Поездка" : "The trip",
    rows: [
      { label: ru ? "Название" : "Title", value: data.tripTitle },
      { label: ru ? "Куда" : "Destination", value: data.place ?? "" },
      { label: ru ? "Когда" : "When", value: dates(data) },
      { label: ru ? "Панель" : "Panel", value: ADMIN_LABEL, href: ADMIN_URL },
      { label: ru ? "Адрес для входа" : "Sign in with", value: data.email },
    ],
    block: {
      label: ru ? "Как попасть в панель" : "How to get in",
      text: steps,
      emptyText: "",
    },
    // What they may and may not do, said here rather than discovered by
    // being refused: the database turns a publish attempt into an error
    // message, and an error message is a poor way to learn the rules.
    calloutHtml: ru
      ? "В панели вы заполняете программу, описание, фотографии и список вещей, " +
        "видите заявки на поездку. <strong>Публикация и даты остаются за владельцем</strong> — " +
        "если нужно что-то перенести или опубликовать, ответьте на это письмо."
      : "In the panel you fill in the programme, the description, the photographs and the " +
        "packing list, and you see who applied. <strong>Publishing and the dates stay with the " +
        "owner</strong> — if something has to move or go live, reply to this letter.",
  };

  return {
    subject: ru
      ? `nazarov.net · Вы организатор поездки «${data.tripTitle}»`
      : `nazarov.net · You are the organizer of “${data.tripTitle}”`,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "nazarov.net",
    replyTo: data.ownerEmail,
  };
}
