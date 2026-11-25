import type { Localized } from "@/lib/content/types";

type Text = Localized<string>;

/**
 * The Privacy Policy (§6.7, Т-06).
 *
 * Written from what the site actually does rather than from a template, and
 * that is the only way it can be kept true: every service named here is one
 * this repository really talks to, and every piece of data named is one a
 * form really asks for. A policy that lists an analytics suite nobody
 * installed is worse than none — it is a promise about the wrong thing.
 *
 * Dates are deliberately absent from the body: "last updated" is rendered
 * from `updatedAt` below so that changing a paragraph and forgetting the date
 * cannot happen.
 */

export const PRIVACY_UPDATED = "2026-11-19";

export const privacyCopy = {
  eyebrow: { en: "Legal", ru: "Правовая информация" } satisfies Text,
  title: { en: "Privacy Policy", ru: "Политика конфиденциальности" } satisfies Text,
  updated: {
    en: "Last updated",
    ru: "Последнее обновление",
  } satisfies Text,
  lead: {
    en: "This site is a small community run by one person. It collects the little it needs to answer you and to send you what you asked for — nothing is sold, and nothing is shared with anybody who is not listed below.",
    ru: "Этот сайт — небольшое сообщество, которое ведёт один человек. Он собирает ровно то, что нужно, чтобы вам ответить и прислать то, о чём вы просили. Ничего не продаётся и никому, кроме перечисленных ниже, не передаётся.",
  } satisfies Text,

  sections: [
    {
      title: { en: "Who is responsible", ru: "Кто отвечает за данные" } satisfies Text,
      paragraphs: [
        {
          en: "The site nazarov.net is run by Nazarov together with CTMASS LLC, which builds and hosts it. Questions about anything on this page, and any request about your own data, go to support@ctmass.com and are answered by a person.",
          ru: "Сайт nazarov.net ведёт Назаров вместе с CTMASS LLC, которая его разрабатывает и размещает. Вопросы по этой странице и любые просьбы о своих данных — на support@ctmass.com; отвечает человек.",
        } satisfies Text,
      ],
    },
    {
      title: { en: "What is collected, and when", ru: "Что собирается и когда" } satisfies Text,
      paragraphs: [
        {
          en: "Nothing at all while you are only reading. There are no accounts for visitors, no passwords, no tracking of who read which page. Data appears only when you fill something in yourself:",
          ru: "Пока вы просто читаете — ничего. У посетителей нет аккаунтов и паролей, и никто не следит, кто какую страницу открыл. Данные появляются только когда вы сами что-то заполняете:",
        } satisfies Text,
      ],
      list: [
        {
          en: "**Subscribing**, or pressing “I'm interested” on a trip — your email address, the directions you chose and the language of the site you were on.",
          ru: "**Подписка** или кнопка «I'm interested» на поездке — адрес почты, выбранные направления и язык сайта, на котором вы были.",
        } satisfies Text,
        {
          en: "**Applying to a trip** — your name, email, where you live, a phone or messenger if you give one, links to your social profiles if you give them, and what you wrote about yourself. This is read by the person organising that trip, because they decide who comes.",
          ru: "**Заявка на поездку** — имя, почта, откуда вы, телефон или мессенджер, если указали, ссылки на соцсети, если дали, и то, что вы написали о себе. Это читает тот, кто ведёт поездку: он и решает, кто едет.",
        } satisfies Text,
        {
          en: "**Suggesting an adventure** — the idea itself and how to reach you about it.",
          ru: "**Идея приключения** — сама идея и то, как с вами о ней связаться.",
        } satisfies Text,
        {
          en: "**A Solutions enquiry** — your name, email, a phone if you give one, and what you need built.",
          ru: "**Заявка на разработку** — имя, почта, телефон, если указали, и что нужно сделать.",
        } satisfies Text,
        {
          en: "**With every form**, one line recording where the visit came from: the page you were on, the campaign tags in the link if it carried any, and the site that sent you. It describes the path, not the person.",
          ru: "**С каждой формой** — одна строка о том, откуда пришёл визит: страница, на которой вы были, метки кампании, если они были в ссылке, и сайт, с которого вы пришли. Это о пути, а не о человеке.",
        } satisfies Text,
      ],
    },
    {
      title: { en: "What it is used for", ru: "Для чего это нужно" } satisfies Text,
      paragraphs: [
        {
          en: "To answer you, to send you the announcements you subscribed to, and to decide together who goes on a trip. That is the whole list. Your address is never passed to another company to write to you, and there is no advertising sent by email.",
          ru: "Чтобы вам ответить, присылать анонсы, на которые вы подписались, и вместе решить, кто едет в поездку. Это весь список. Ваш адрес не передаётся другой компании для писем вам, и рекламы по почте мы не рассылаем.",
        } satisfies Text,
      ],
    },
    {
      title: { en: "Who else sees it", ru: "Кто ещё это видит" } satisfies Text,
      paragraphs: [
        {
          en: "The services the site is built on. Each one sees only what it needs for its part:",
          ru: "Службы, на которых работает сайт. Каждая видит только то, что нужно для её части:",
        } satisfies Text,
      ],
      list: [
        {
          en: "**Google Firebase** — the database, the photographs and the sign-in for the people who run trips. Everything you fill in is stored there.",
          ru: "**Google Firebase** — база, фотографии и вход для тех, кто ведёт поездки. Всё, что вы заполняете, хранится там.",
        } satisfies Text,
        {
          en: "**Cloudflare** — serves the pages and runs the small piece of server code behind the forms. Its Turnstile check is what tells a person from a robot, and it looks at the browser rather than at you.",
          ru: "**Cloudflare** — отдаёт страницы и выполняет небольшой серверный код за формами. Его проверка Turnstile отличает человека от робота и смотрит на браузер, а не на вас.",
        } satisfies Text,
        {
          en: "**EmailJS** — sends the letters: the welcome, the announcements, the receipt for a form.",
          ru: "**EmailJS** — отправляет письма: приветственное, анонсы, подтверждение заявки.",
        } satisfies Text,
        {
          en: "**YouTube** — the video blocks. Nothing is loaded from YouTube and no cookie of theirs is set until you press play on a video yourself.",
          ru: "**YouTube** — блоки с видео. Пока вы сами не нажмёте «играть», с YouTube ничего не загружается и его cookies не ставятся.",
        } satisfies Text,
        {
          en: "**OpenStreetMap** — the map on the Suggest an Adventure form, and only if you open it. Pressing the map button asks openstreetmap.org for the picture of the area you are looking at; nothing is requested from it before that press, and no account of theirs is involved.",
          ru: "**OpenStreetMap** — карта в форме «Предложите приключение», и только если вы её открыли. Нажатие на кнопку карты просит у openstreetmap.org картинку того участка, который вы смотрите; до нажатия туда не уходит ни один запрос, и никакого аккаунта там не нужно.",
        } satisfies Text,
        {
          en: "**Calendly** — the booking calendar on the Solutions page, loaded only when you scroll down to it.",
          ru: "**Calendly** — календарь записи на странице Solutions, загружается только когда вы до него доходите.",
        } satisfies Text,
        {
          en: "**Meta (Facebook)** — advertising statistics, and only if you agree to it in the banner. Without that agreement nothing is requested from facebook.com at all.",
          ru: "**Meta (Facebook)** — статистика рекламы, и только если вы согласились на это в баннере. Без согласия к facebook.com не уходит ни один запрос.",
        } satisfies Text,
      ],
    },
    {
      title: { en: "Cookies", ru: "Cookies" } satisfies Text,
      paragraphs: [
        {
          en: "The site itself keeps almost nothing in your browser: your answer to the cookie banner, and — for a moment — where on the page you were when you switched language. Neither identifies you, and neither leaves your browser.",
          ru: "Сам сайт почти ничего не держит в вашем браузере: ваш ответ на баннер и — на мгновение — место на странице, где вы были, когда переключили язык. Ни то, ни другое вас не опознаёт и из браузера не уходит.",
        } satisfies Text,
        {
          en: "Advertising cookies are a separate matter and they are the reason the banner exists. They are set by Meta, not by us, and only after you agree. “Only what is necessary” means they are never set, and the site works exactly the same.",
          ru: "Рекламные cookies — отдельная история, ради них баннер и существует. Их ставит Meta, а не мы, и только после вашего согласия. «Только необходимое» означает, что их не будет вовсе, а сайт работает точно так же.",
        } satisfies Text,
      ],
    },
    {
      title: { en: "How long it is kept", ru: "Сколько это хранится" } satisfies Text,
      paragraphs: [
        {
          en: "A subscription is kept until you end it. An application or an idea is kept as the record of a trip that happened — ask and it is deleted. A Solutions enquiry is kept while the project is being discussed and for as long as the law requires after it.",
          ru: "Подписка — пока вы её не прекратите. Заявка или идея — как запись о состоявшейся поездке; попросите, и мы её удалим. Заявка на разработку — пока обсуждается проект и столько после, сколько требует закон.",
        } satisfies Text,
      ],
    },
    {
      title: { en: "What you can ask for", ru: "О чём вы можете попросить" } satisfies Text,
      paragraphs: [
        {
          en: "To stop the letters: the “Unsubscribe” link at the bottom of every one of them, or the page linked in the footer of this site. It takes one press, no password, and you can keep only the directions you still want.",
          ru: "Прекратить письма: ссылка «Unsubscribe» внизу каждого письма или страница, на которую ведёт подвал сайта. Одно нажатие, без пароля, и можно оставить только те направления, которые ещё интересны.",
        } satisfies Text,
        {
          en: "To see what is stored about you, to have it corrected, or to have it deleted entirely: write to support@ctmass.com. Deleting is deleting — the record goes, not a flag on it. If you are in the European Union, California or another place with its own rules about this, those rights are what this paragraph is here to honour.",
          ru: "Узнать, что о вас хранится, исправить это или удалить целиком: напишите на support@ctmass.com. Удаление — это удаление: уходит запись, а не отметка на ней. Если вы в Европейском союзе, Калифорнии или другом месте со своими правилами на этот счёт — этот абзац именно о соблюдении таких прав.",
        } satisfies Text,
      ],
    },
    {
      title: { en: "Children", ru: "Дети" } satisfies Text,
      paragraphs: [
        {
          en: "Some trips are for families and children come on them, but the forms are for the adult organising that. Nothing here is addressed to a child, and we do not knowingly collect anything from one.",
          ru: "Некоторые поездки семейные, и дети в них едут, но формы — для взрослого, который это организует. Ничего на сайте не адресовано ребёнку, и мы сознательно не собираем данные детей.",
        } satisfies Text,
      ],
    },
    {
      title: { en: "Changes", ru: "Изменения" } satisfies Text,
      paragraphs: [
        {
          en: "If this page changes, the date above changes with it. A change that affects what happens to data already collected is announced in the letters as well, not only here.",
          ru: "Если страница изменится, изменится и дата выше. Об изменении, которое касается уже собранных данных, мы сообщим и в письмах, а не только здесь.",
        } satisfies Text,
      ],
    },
  ],

  contactTitle: { en: "Writing to us", ru: "Как с нами связаться" } satisfies Text,
  contactLead: {
    en: "By email, and that is the fastest way:",
    ru: "Письмом — это самый быстрый способ:",
  } satisfies Text,
  postalLabel: { en: "Postal address", ru: "Почтовый адрес" } satisfies Text,
  unsubscribeLink: {
    en: "Manage or end your subscription",
    ru: "Управлять подпиской или отписаться",
  } satisfies Text,
} as const;
