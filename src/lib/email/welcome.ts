import { manageUrl, unsubscribeUrl } from "./manage";
import {
  renderEmailHtml,
  renderEmailText,
  type EmailContent,
  type OutgoingEmail,
} from "./shell";

/**
 * The letter that greets a new subscriber (Н-05).
 *
 * Short on purpose. Somebody typed an address into a window and pressed one
 * button; a page of welcome would be out of proportion to that, and the
 * things worth saying are few — what will arrive, what will not, and how to
 * stop it.
 *
 * Written in the language of the page they subscribed from. Н-11 is why it
 * goes through the same shell as every other letter here: Gmail shows a
 * hand-rolled `<div>` soup as source text often enough that the rendering is
 * not worth improvising twice.
 *
 * The unsubscribe link is the real one now that the page behind it exists
 * (item 3.3). It travels on the subscriber's `manageKey`, not on their
 * address, so a forwarded letter cannot be used to guess anybody else's.
 * Without a key the letter falls back to the sentence it carried before —
 * reply and the address comes off — because a link to a page that cannot
 * identify anyone is worse than no link.
 */
export interface WelcomeEmailData {
  /** The directions they chose, already in the right language. */
  directions: string[];
  locale: "en" | "ru";
  /** Where a reply goes — the owner, not the shared sending mailbox. */
  ownerEmail?: string;
  /** True when the address was already on the list and only added directions. */
  returning?: boolean;
  /** What the unsubscribe link travels on; absent on an older subscriber. */
  manageKey?: string;
  /** The sender's postal address, as every mailing must carry (Н-09). */
  postalAddress?: string;
}

export function buildWelcomeEmail(data: WelcomeEmailData): OutgoingEmail {
  const ru = data.locale === "ru";
  const list = data.directions.join(", ");

const key = data.manageKey;

  const leaving = key
    ? ru
      ? "Не хотите больше — ссылка внизу письма убирает адрес из списка. Там же можно оставить только нужные направления. Ни пароля, ни подтверждений."
      : "Had enough? The link at the bottom takes the address off the list — or leaves only the directions you still want. No password, nothing to confirm."
    : ru
      ? "Не хотите больше — ответьте на это письмо одной строкой, и адрес уберут из списка. Ничего подтверждать и нигде входить для этого не нужно."
      : "Had enough? Reply to this letter with one line and the address comes off the list. Nothing to confirm, nowhere to sign in.";

  const body = ru
    ? [
        "Что будет приходить: письмо, когда открывается новая поездка по выбранным направлениям. Обычно это несколько писем в год — столько, сколько поездок.",
        "Чего не будет: рекламы, чужих рассылок и передачи адреса кому бы то ни было. Телефон у вас никто не спросит.",
        leaving,
      ].join("\n\n")
    : [
        "What arrives: a letter when a new trip opens in the directions you picked. That is a handful of letters a year — as many as there are trips.",
        "What does not: advertising, other people's mailings, and your address going anywhere else. Nobody will ask you for a phone number.",
        leaving,
      ].join("\n\n");

  const content: EmailContent = {
    preheader: ru
      ? `Вы подписались на новости: ${list}`
      : `You are subscribed: ${list}`,
    brand: "NAZAROV.NET",
    kicker: ru ? "Подписка" : "Subscription",
    title: ru ? "Вы в списке" : "You are on the list",
    subtitle: data.returning
      ? ru
        ? "Адрес уже был в списке — направления обновлены."
        : "The address was already on the list — the directions are updated."
      : ru
        ? "Теперь вы узнаете о новой поездке раньше остальных."
        : "You will hear about a new trip before anybody else does.",
    rowsLabel: ru ? "Ваша подписка" : "Your subscription",
    rows: [
      { label: ru ? "Направления" : "Directions", value: list },
      {
        label: ru ? "Язык писем" : "Letters in",
        value: ru ? "Русский" : "English",
      },
    ],
    block: {
      label: ru ? "Коротко" : "In short",
      text: body,
      emptyText: "",
    },
    calloutHtml: ru
      ? "Есть идея поездки, которой здесь не хватает? На сайте есть форма " +
        "<strong>Suggest an Adventure</strong> — если идея подойдёт, вести эту " +
        "поездку будете вы сами."
      : "Got a trip in mind that is missing here? The site has a " +
        "<strong>Suggest an Adventure</strong> form — and if the idea fits, you " +
        "are the one who runs that trip.",
    // Н-09: the way out and the sender's address, in this letter as in
    // every other one that goes to a list.
    footer: key
      ? {
          note: ru
            ? `Вы получили это письмо, потому что подписались на nazarov.net.${
                data.postalAddress ? ` ${data.postalAddress}` : ""
              }`
            : `You're receiving this because you subscribed at nazarov.net.${
                data.postalAddress ? ` ${data.postalAddress}` : ""
              }`,
          links: [
            {
              label: ru ? "Отписаться" : "Unsubscribe",
              href: unsubscribeUrl(key, data.locale),
            },
            {
              label: ru ? "Выбрать направления" : "Manage topics",
              href: manageUrl(key, data.locale),
            },
          ],
        }
      : undefined,
  };

  return {
    subject: ru
      ? "nazarov.net · Вы подписались на новости о поездках"
      : "nazarov.net · You are on the trip list",
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "nazarov.net",
    replyTo: data.ownerEmail,
  };
}
