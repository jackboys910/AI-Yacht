/**
 * The words on the first screen of the home page (ТЗ v4, §4.2).
 *
 * Apart from the markup because the owner may rewrite them from the panel
 * (§7.7): these are the defaults the settings fall back to, and a default
 * that lives inside a component cannot be imported by the resolver without
 * dragging the component into every build that needs one string.
 */
import type { Locale } from "@/i18n/config";

type Text = Record<Locale, string>;

export const HOME_OPENING = {
  communityA: { en: "A community,", ru: "Сообщество," },
  communityB: { en: "not a business.", ru: "а не бизнес." },
  free: { en: "100% free. Forever.", ru: "Бесплатно. Навсегда." },
  noFees: {
    en: "No fees · No subscriptions · No commissions",
    ru: "Без взносов · Без подписок · Без комиссий",
  },
  titleA: { en: "Sail. Ride. Jump.", ru: "Плывём. Катаемся. Прыгаем." },
  titleB: { en: "Explore. Build. Together.", ru: "Открываем. Создаём. Вместе." },
  backdropAlt: {
    en: "Yachts moored in a quiet bay at dusk",
    ru: "Яхты на стоянке в тихой бухте в сумерках",
  },
} satisfies Record<string, Text>;

