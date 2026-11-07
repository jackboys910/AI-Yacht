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
 * No unsubscribe link yet, and that is deliberate rather than forgotten: the
 * page behind such a link arrives with plan item 3.3, and a link to a 404 in
 * a letter about trust would be worse than the sentence that stands in for it
 * — reply and the address comes off. The link replaces that sentence the day
 * the page exists, and `manageKey` is already written on every subscriber so
 * no second migration is needed.
 */
export interface WelcomeEmailData {
  /** The directions they chose, already in the right language. */
  directions: string[];
  locale: "en" | "ru";
  /** Where a reply goes — the owner, not the shared sending mailbox. */
  ownerEmail?: string;
  /** True when the address was already on the list and only added directions. */
  returning?: boolean;
}

export function buildWelcomeEmail(data: WelcomeEmailData): OutgoingEmail {
  const ru = data.locale === "ru";
  const list = data.directions.join(", ");

  const body = ru
    ? [
        "Что будет приходить: письмо, когда открывается новая поездка по выбранным направлениям. Обычно это несколько писем в год — столько, сколько поездок.",
        "Чего не будет: рекламы, чужих рассылок и передачи адреса кому бы то ни было. Телефон у вас никто не спросит.",
        "Не хотите больше — ответьте на это письмо одной строкой, и адрес уберут из списка. Ничего подтверждать и нигде входить для этого не нужно.",
      ].join("\n\n")
    : [
        "What arrives: a letter when a new trip opens in the directions you picked. That is a handful of letters a year — as many as there are trips.",
        "What does not: advertising, other people's mailings, and your address going anywhere else. Nobody will ask you for a phone number.",
        "Had enough? Reply to this letter with one line and the address comes off the list. Nothing to confirm, nowhere to sign in.",
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
