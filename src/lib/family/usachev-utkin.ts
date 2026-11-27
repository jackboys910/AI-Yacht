import type { FamilyTree, Person, Text } from "./types";

/**
 * Yakov Nazarov's ancestors: the Usachevs and the Utkins.
 *
 * Source: "Усачевы и Уткины: история предков Якова" (15.11.2026), itself built
 * on the State Archive of the Arkhangelsk Region — confession lists, the
 * revisions of 1719–1858, parish registers and the censuses of 1897 and 1920
 * — and, for the twentieth century, on what the family remembers. Every date
 * and relation below is that document's. The only additions are general
 * facts about the country in each era (the "world" half of the chapters),
 * chosen to be kind: this is a family tree, not a list of disasters.
 *
 * Deliberately left out, as agreed with the client on 27.11.2026: recruit
 * levies, causes of death, illnesses, street addresses of the living, and the
 * family's open questions. The deportation of the Utkins is one neutral line.
 *
 * Facts that came from the client rather than the document: Yakov lives in
 * Massachusetts, having moved "a couple of years ago" — no exact year, so
 * none is shown.
 *
 * Dates before 1918 are Old Style, as in the archive.
 */

const t = (en: string, ru: string): Text => ({ en, ru });

const people: Record<string, Person> = {
  stepan: {
    id: "stepan",
    name: t("Stepan Nazarov", "Степан Назаров"),
    short: t("Stepan", "Степан"),
    initials: t("S", "С"),
    role: t("Yakov's son", "сын Якова"),
    notes: [
      t(
        "The fourteenth generation, counting from Stepan Usachev — the first name in the family records.",
        "Четырнадцатое поколение, если считать от Степана Усачева — первого имени в документах рода.",
      ),
    ],
    focus: true,
  },
  yakov: {
    id: "yakov",
    name: t("Yakov Nazarov", "Яков Назаров"),
    short: t("Yakov Nazarov", "Яков Назаров"),
    initials: t("YN", "ЯН"),
    place: t("Massachusetts, USA", "Массачусетс, США"),
    role: t("Lyubov's son", "сын Любови Николаевны"),
    siblings: t("Sister Natalia", "Сестра Наталья"),
    children: t("Son Stepan", "Сын Степан"),
    notes: [
      t("Entered university in Moscow in 2000.", "В 2000 году поступил в вуз в Москве."),
      t("Moved to Massachusetts, USA.", "Переехал в Массачусетс, США."),
    ],
  },
  natalia: {
    id: "natalia",
    name: t("Natalia Nazarova", "Наталья Назарова"),
    short: t("Natalia", "Наталья"),
    initials: t("N", "Н"),
    role: t("Lyubov's daughter", "дочь Любови Николаевны"),
    notes: [t("Entered university in Moscow in 1998.", "В 1998 году поступила в вуз в Москве.")],
  },
  lyubov: {
    id: "lyubov",
    name: t("Lyubov Nikolaevna Nazarova", "Любовь Николаевна Назарова"),
    short: t("Lyubov Nikolaevna", "Любовь Николаевна"),
    initials: t("LN", "ЛН"),
    life: t("b. 21 Jul 1954", "р. 21.07.1954"),
    place: t("Severodvinsk", "Северодвинск"),
    role: t("Augusta's daughter", "дочь Августы Афанасьевны"),
    spouses: [t("Husband — Nazarov", "Муж — Назаров")].map((name) => ({ name })),
    children: t("Natalia, Yakov", "Наталья, Яков"),
    notes: [
      t(
        "Born in Molotovsk, which became Severodvinsk in 1957.",
        "Родилась в Молотовске, который в 1957 году стал Северодвинском.",
      ),
      t(
        "Met her husband on a horse-riding tour near Ufa, at Beloretsk; he moved to Severodvinsk to be with her. They lived there from 1980.",
        "С мужем познакомилась в конном туре под Уфой, у Белорецка, и он переехал к ней. С 1980 года они жили в Северодвинске.",
      ),
      t(
        "In 2003 the parents moved to Krasnoarmeysk, then to Pushkino, then to Moscow.",
        "В 2003 году родители переехали в Красноармейск, потом в Пушкино, затем в Москву.",
      ),
    ],
  },
  augusta: {
    id: "augusta",
    name: t("Augusta Afanasyevna", "Августа Афанасьевна"),
    short: t("Augusta Afanasyevna", "Августа Афанасьевна"),
    initials: t("AA", "АА"),
    place: t("Stepychevskaya → Severodvinsk", "Степычевская → Северодвинск"),
    role: t("Afanasy and Maria's daughter", "дочь Афанасия и Марии"),
    spouses: [
      { name: t("Nikolai Galega", "Николай Галега"), note: t("a driver", "водитель") },
    ],
    siblings: t("Alexandra (Shura), Gury", "Александра (Шура), Гурий"),
    children: t("Daughter Lyubov (21.07.1954)", "Дочь Любовь (21.07.1954)"),
    notes: [
      t(
        "Born in Stepychevskaya; the family then moved to the Second District of Molotovsk.",
        "Родилась в Степычевской, потом семья переехала на Второй участок Молотовска.",
      ),
      t("Lived in Severodvinsk all her life.", "Прожила в Северодвинске всю жизнь."),
    ],
  },

  // ——— The Usachev line ———————————————————————————————————————————————
  afanasy: {
    id: "afanasy",
    name: t("Afanasy Pavlovich Usachev", "Афанасий Павлович Усачев"),
    short: t("Afanasy Pavlovich", "Афанасий Павлович"),
    initials: t("AU", "АУ"),
    life: t("18 Jan 1901 – Apr 1942", "18.01.1901 – апрель 1942"),
    place: t("Stepychevskaya", "Степычевская"),
    role: t("eldest son", "старший сын"),
    spouses: [{ name: t("Maria Ilyinichna Utkina", "Мария Ильинична Уткина") }],
    siblings: t("Evdokia (c. 1905), Evgeny (17.02.1910)", "Евдокия (ок. 1905), Евгений (17.02.1910)"),
    children: t("Augusta, Alexandra (Shura), Gury", "Августа, Александра (Шура), Гурий"),
    notes: [
      t(
        "Born in Stepychevskaya (Middle Varamino), Shegovary parish.",
        "Родился в деревне Степычевской (Среднее Варамино), Шеговарский приход.",
      ),
      t("A Red Army soldier.", "Красноармеец."),
      t(
        "Fell in battle in April 1942 near the village of Mostki, Chudovo district. He lies in a mass grave that the family visits.",
        "Погиб в бою в апреле 1942 года под деревней Мостки Чудовского района. Похоронен в братской могиле, которую семья посещает.",
      ),
    ],
    memorial: true,
  },
  pavel: {
    id: "pavel",
    name: t("Pavel Ivanovich Usachev", "Павел Иванович Усачев"),
    short: t("Pavel Ivanovich", "Павел Иванович"),
    initials: t("PU", "ПУ"),
    life: t("6 Sep 1871 – 25 Mar 1918", "06.09.1871 – 25.03.1918"),
    place: t("Stepychevskaya", "Степычевская"),
    spouses: [
      {
        name: t("Anna Zakharovna Pechinina", "Анна Захаровна Печинина"),
        note: t(
          "1883 – after 1920, from Litvinovskaya; married February 1900",
          "1883 – после 1920, из Литвиновской; венчание в феврале 1900",
        ),
      },
    ],
    children: t("Afanasy (1901), Evdokia (c. 1905), Evgeny (1910)", "Афанасий (1901), Евдокия (ок. 1905), Евгений (1910)"),
    notes: [
      t("Farmed the land alongside his father.", "Земледелец при отце."),
      t(
        "Anna was the daughter of Zakhar Semyonovich Pechinin and Akilina Vasilyevna.",
        "Анна — дочь Захара Семёновича Печинина и Акилины Васильевны.",
      ),
    ],
  },
  ivanV: {
    id: "ivanV",
    name: t("Ivan Varlaamovich Usachev", "Иван Варлаамович Усачев"),
    short: t("Ivan Varlaamovich", "Иван Варлаамович"),
    initials: t("IU", "ИУ"),
    life: t("7 May 1842 – 14 Oct 1902", "07.05.1842 – 14.10.1902"),
    place: t("Stepychevskaya", "Степычевская"),
    spouses: [
      {
        name: t("Ustinya (Iustina) Mikhailovna Petrova", "Устинья (Иустина) Михайловна Петрова"),
        note: t(
          "1847 – after 1920, from Zakharovskaya; married 15 May 1867",
          "1847 – после 1920, из Захаровской; венчание 15.05.1867",
        ),
      },
    ],
    children: t(
      "Nikanor (c. 1869), Pavel (1871), Fedosya, Alexandra, Pelageya",
      "Никанор (ок. 1869), Павел (1871), Федосья, Александра, Пелагея",
    ),
    notes: [
      t(
        "In the 1897 census: head of the household, a farmer and a carpenter.",
        "В переписи 1897 года — хозяин, земледелец и плотник.",
      ),
      t(
        "Literate; studied at the village school. Owned his own wooden house.",
        "Грамотный, учился в сельском училище. Свой деревянный дом.",
      ),
    ],
  },
  varlaam: {
    id: "varlaam",
    name: t("Varlaam Semyonovich Usachev", "Варлаам Семёнович Усачев"),
    short: t("Varlaam Semyonovich", "Варлаам Семёнович"),
    initials: t("VU", "ВУ"),
    life: t("19 Jun 1804 – 10 Oct 1869", "19.06.1804 – 10.10.1869"),
    place: t("Trufanovskaya → Stepychevskaya", "Труфановская → Степычевская"),
    spouses: [
      {
        name: t("Ekaterina Mikhailovna Ivshina", "Екатерина Михайловна Ившина"),
        note: t(
          "1806/07 – 20.10.1885, from Zakharovskaya; married 18 Feb 1834",
          "1806/07 – 20.10.1885, из Захаровской; венчание 18.02.1834",
        ),
      },
    ],
    children: t(
      "Varvara, Vasily, Marfa, Ivan (1842), Sergey, Evfimy, Akilina, Egor, Fyodor",
      "Варвара, Василий, Марфа, Иван (1842), Сергей, Евфимий, Акилина, Егор, Фёдор",
    ),
    notes: [
      t(
        "In the 1830s moved the family from Trufanovskaya (Lower Varamino) to Stepychevskaya (Middle Varamino).",
        "В 1830-х годах перевёл семью из Труфановской (Нижнее Варамино) в Степычевскую (Среднее Варамино).",
      ),
      t(
        "Ekaterina was a widow: her first husband, Pyotr Istomin, died in 1831.",
        "Екатерина — вдова: её первый муж Пётр Истомин умер в 1831 году.",
      ),
    ],
  },
  semyonS: {
    id: "semyonS",
    name: t("Semyon Semyonovich Usachev", "Семён Семёнович Усачев"),
    short: t("Semyon Semyonovich", "Семён Семёнович"),
    initials: t("SU", "СУ"),
    life: t("c. 1764 – 9 Feb 1831", "ок. 1764 – 09.02.1831"),
    place: t("Trufanovskaya", "Труфановская"),
    spouses: [
      {
        name: t("Elena Fyodorovna Usova", "Елена Фёдоровна Усова"),
        note: t(
          "c. 1772 – 26.03.1850, from Nemirovskaya, Bogoslovsky parish; married 12 Jul 1790",
          "ок. 1772 – 26.03.1850, из Немировской Богословского прихода; венчание 12.07.1790",
        ),
      },
    ],
    children: t(
      "Nine children: Ignaty, Mikhail, Afanasy, Kirill, Varlaam (1804), Evdokia, Parfeny and others",
      "Девять детей: Игнатий, Михаил, Афанасий, Кирилл, Варлаам (1804), Евдокия, Парфений и другие",
    ),
  },
  semyonM: {
    id: "semyonM",
    name: t("Semyon Mikhailovich Usachev", "Семён Михайлович Усачев"),
    short: t("Semyon Mikhailovich", "Семён Михайлович"),
    initials: t("SU", "СУ"),
    life: t("c. 1744 – 2 May 1824", "ок. 1744 – 02.05.1824"),
    place: t("Trufanovskaya", "Труфановская"),
    spouses: [
      {
        name: t("Anna Stepanovna Lobanova", "Анна Степановна Лобанова"),
        note: t(
          "c. 1743 – 21.10.1804, from Kuvakinskaya, Predtechensky parish",
          "ок. 1743 – 21.10.1804, из Кувакинской Предтеченского прихода",
        ),
      },
    ],
    children: t(
      "Semyon, Stepanida, Fyodora, Vasily, Evdokia, Rodion, Egor, Maria, Lev",
      "Семён, Степанида, Фёдора, Василий, Евдокия, Родион, Егор, Мария, Лев",
    ),
    notes: [t("Recorded in 1792 as a palace peasant.", "В 1792 году записан дворцовым крестьянином.")],
  },
  mikhailL: {
    id: "mikhailL",
    name: t("Mikhail Lavrentyevich Usachev", "Михаил Лаврентьевич Усачев"),
    short: t("Mikhail Lavrentyevich", "Михаил Лаврентьевич"),
    initials: t("MU", "МУ"),
    life: t("c. 1717 – 1784", "ок. 1717 – 1784"),
    place: t("Trufanovskaya", "Труфановская"),
    spouses: [
      {
        name: t("Fyokla Anikeevna Istomina", "Фёкла Аникеевна Истомина"),
        note: t(
          "c. 1719 – 19.03.1794, daughter of Anikey Istomin, from Zakharovskaya (Upper Varamino)",
          "ок. 1719 – 19.03.1794, дочь Аникея Истомина, из Захаровской (Верхнее Варамино)",
        ),
      },
    ],
    children: t("Son Semyon", "Сын Семён"),
  },
  lavrenty: {
    id: "lavrenty",
    name: t("Lavrenty Gerasimovich Usachev", "Лаврентий Герасимович Усачев"),
    short: t("Lavrenty Gerasimovich", "Лаврентий Герасимович"),
    initials: t("LU", "ЛУ"),
    life: t("c. 1659 – after 1735", "ок. 1659 – после 1735"),
    place: t("Trufanovskaya", "Труфановская"),
    spouses: [{ name: t("Evdokia", "Евдокия"), note: t("probably his second wife", "вероятно, вторая жена") }],
    children: t("Semyon, Larion, Mikhail, Darya, Maria", "Семён, Ларион, Михаил, Дарья, Мария"),
    notes: [t("Sixty years old in the first revision of 1719.", "В первой ревизии 1719 года ему 60 лет.")],
  },
  gerasim: {
    id: "gerasim",
    name: t("Gerasim Stepanovich Usachev", "Герасим Степанович Усачев"),
    short: t("Gerasim Stepanovich", "Герасим Степанович"),
    initials: t("GU", "ГУ"),
    life: t("c. 1629 – ?", "ок. 1629 – ?"),
    place: t("Trufanovskaya", "Труфановская"),
    children: t("Son Lavrenty; nephew Mina", "Сын Лаврентий; племянник Мина"),
    notes: [
      t(
        "Ninety years old in 1719 — the oldest Usachev named in the documents.",
        "В 1719 году ему 90 лет — самый старший Усачев, названный в документах.",
      ),
    ],
  },
  stepanU: {
    id: "stepanU",
    name: t("Stepan Usachev", "Степан Усачев"),
    short: t("Stepan Usachev", "Степан Усачев"),
    initials: t("SU", "СУ"),
    life: t("before 1610", "до 1610"),
    place: t("Trufanovskaya", "Труфановская"),
    children: t("Son Gerasim", "Сын Герасим"),
    notes: [t("Known only through his son's patronymic.", "Известен только по отчеству сына.")],
  },

  // ——— The Utkin line —————————————————————————————————————————————————
  maria: {
    id: "maria",
    name: t("Maria Ilyinichna Utkina", "Мария Ильинична Уткина"),
    short: t("Maria Ilyinichna", "Мария Ильинична"),
    initials: t("MU", "МУ"),
    life: t("23 Jan 1901 – 1980", "23.01.1901 – 1980"),
    place: t("Kulikovskaya (Ust-Syuma)", "Куликовская (Усть-Сюма)"),
    role: t("eldest of eight", "старшая из восьмерых"),
    spouses: [{ name: t("Afanasy Pavlovich Usachev", "Афанасий Павлович Усачев") }],
    siblings: t(
      "Evgeny, Valentin, Evgenia, Tatyana, Alexander, Pyotr, Anna",
      "Евгений, Валентин, Евгения, Татьяна, Александр, Пётр, Анна",
    ),
    children: t("Augusta, Alexandra (Shura), Gury", "Августа, Александра (Шура), Гурий"),
    notes: [
      t(
        "Born in Kulikovskaya (Ust-Syuma, Pogost) — a week after Afanasy.",
        "Родилась в деревне Куликовской (Усть-Сюма, Погост) — через неделю после Афанасия.",
      ),
      t(
        "In 1920: nineteen, literate, had studied at the village school, worked on the family farm.",
        "В 1920 году: 19 лет, грамотная, училась в сельском училище, работает в хозяйстве.",
      ),
      t(
        "Lists gave her birth year as 1899; the parish register says 1901.",
        "По документам считалась 1899 года рождения, по метрике — 1901.",
      ),
    ],
  },
  ilya: {
    id: "ilya",
    name: t("Ilya Semyonovich Utkin", "Илья Семёнович Уткин"),
    short: t("Ilya Semyonovich", "Илья Семёнович"),
    initials: t("IU", "ИУ"),
    life: t("23 Jun 1878 – after 1927", "23.06.1878 – после 1927"),
    place: t("Kulikovskaya", "Куликовская"),
    spouses: [
      {
        name: t("Agrippina Lukinichna Khavanova", "Агриппина Лукинична Хаванова"),
        note: t(
          "1878 – after 1927, daughter of the church warden Luka Khavanov, from Lekhovskaya; married 9 Nov 1898",
          "1878 – после 1927, дочь церковного старосты Луки Хаванова, из Леховской; венчание 09.11.1898",
        ),
      },
    ],
    children: t(
      "Maria (1901), Evgeny, Valentin, Evgenia, Tatyana, Alexander, Pyotr, Anna",
      "Мария (1901), Евгений, Валентин, Евгения, Татьяна, Александр, Пётр, Анна",
    ),
    notes: [
      t(
        "At eighteen, in 1897, worked on building the Vologda–Arkhangelsk railway.",
        "В 18 лет (1897) работал на постройке Вологодско-Архангельской железной дороги.",
      ),
      t(
        "Finished the village school. In 1920 — watchman at the Ust-Syuma post office.",
        "Окончил сельское училище. В 1920 году — сторож почтового отделения в Усть-Сюме.",
      ),
      t(
        "A 1927 household list records that the family was sent away to Arkhangelsk.",
        "По похозяйственному списку 1927 года семья выслана в Архангельск.",
      ),
    ],
  },
  semyonA: {
    id: "semyonA",
    name: t("Semyon Anisimovich Utkin", "Семён Анисимович Уткин"),
    short: t("Semyon Anisimovich", "Семён Анисимович"),
    initials: t("SU", "СУ"),
    life: t("1 Feb 1843 – 18 Jun 1905", "01.02.1843 – 18.06.1905"),
    place: t("Kulikovskaya", "Куликовская"),
    spouses: [
      {
        name: t("Anna Dmitrievna Oshurkova", "Анна Дмитриевна Ошуркова"),
        note: t(
          "1841 – 10.10.1902, from Lekhovskaya; married 6 Feb 1861",
          "1841 – 10.10.1902, из Леховской; венчание 06.02.1861",
        ),
      },
    ],
    children: t(
      "Ivan, Maria, Evlampia, Maria, Anfisa, Ilya (1878)",
      "Иван, Мария, Евлампия, Мария, Анфиса, Илья (1878)",
    ),
    notes: [
      t("Grew up in the house of his grandfather Ivan.", "Рос у деда Ивана."),
      t(
        "In 1897: owner of his own house, a farmer who also made tar.",
        "В 1897 году — хозяин собственного дома, земледелец, подрабатывал смолокурением.",
      ),
    ],
  },
  anisim: {
    id: "anisim",
    name: t("Anisim Ivanovich Utkin", "Анисим Иванович Уткин"),
    short: t("Anisim Ivanovich", "Анисим Иванович"),
    initials: t("AU", "АУ"),
    life: t("15 Feb 1820 – after 1852", "15.02.1820 – после 1852"),
    place: t("Kulikovskaya", "Куликовская"),
    spouses: [
      {
        name: t("Mariamna Vasilyevna Kotova", "Мариамна Васильевна Котова"),
        note: t("1819 – 15.01.1849, from Lekhovskaya; married 14 Jan 1842", "1819 – 15.01.1849, из Леховской; венчание 14.01.1842"),
      },
      {
        name: t("Ekaterina Ivanovna Cherepanova", "Екатерина Ивановна Черепанова"),
        note: t("from Korchaginskaya, Shegovary parish; married 31 Jan 1849", "из Корчагинской Шеговарского прихода; венчание 31.01.1849"),
      },
    ],
    children: t("Semyon (1843), Melania", "Семён (1843), Мелания"),
    notes: [
      t(
        "At his second wedding, in 1849, the guarantor was Mikhail Semyonovich Usachev of Shegovary parish — most likely the brother of Varlaam Usachev.",
        "На его свадьбе в 1849 году поручителем был Михаил Семёнович Усачев из Шеговарского прихода — скорее всего, родной брат Варлаама Усачева.",
      ),
    ],
  },
  ivanM: {
    id: "ivanM",
    name: t("Ivan Mikhailovich (Misailov) Utkin", "Иван Михайлович (Мисайлов) Уткин"),
    short: t("Ivan Mikhailovich", "Иван Михайлович"),
    initials: t("IU", "ИУ"),
    life: t("9 Sep 1797 – 1 Apr 1859", "09.09.1797 – 01.04.1859"),
    place: t("Kulikovskaya", "Куликовская"),
    spouses: [
      {
        name: t("Ustinya Vasilyevna Seliverstova", "Устинья Васильевна Селиверстова"),
        note: t(
          "1798 – 08.10.1835, from Zakharovskaya (Upper Varamino); married 23 Apr 1817",
          "1798 – 08.10.1835, из Захаровской (Верхнее Варамино); венчание 23.04.1817",
        ),
      },
      {
        name: t("Efrosinya Perfilyevna Perveva", "Ефросинья Перфильевна Первева"),
        note: t("1812 – 17.09.1895; married 31 Jan 1836", "1812 – 17.09.1895; венчание 31.01.1836"),
      },
    ],
    children: t("Anisim (1820), Fyodor, Paraskeva, Marina, Makary", "Анисим (1820), Фёдор, Параскева, Марина, Макарий"),
    notes: [
      t(
        "Ustinya came from Zakharovskaya, Upper Varamino — the Usachevs' own corner of the Vaga.",
        "Устинья — из Захаровской (Верхнее Варамино), из мест Усачевых.",
      ),
    ],
  },
  isay: {
    id: "isay",
    name: t("Isay (Misail) Fyodorovich Utkin", "Исай (Мисаил) Фёдорович Уткин"),
    short: t("Isay (Misail) Fyodorovich", "Исай (Мисаил) Фёдорович"),
    initials: t("IU", "ИУ"),
    life: t("c. 1764 – 20 May 1815", "ок. 1764 – 20.05.1815"),
    place: t("Kulikovskaya", "Куликовская"),
    spouses: [
      {
        name: t("Fevronya Fyodorovna Popova", "Февронья Фёдоровна Попова"),
        note: t(
          "1765 – after 1816, from the same village; married 1 Jun 1789",
          "1765 – после 1816, из той же деревни; венчание 01.06.1789",
        ),
      },
    ],
    children: t("Darya, Kharitonya, Anna, Ivan (1797), Vasily", "Дарья, Харитонья, Анна, Иван (1797), Василий"),
  },
  fyodor: {
    id: "fyodor",
    name: t("Fyodor Perfilyevich Utkin", "Фёдор Перфильевич Уткин"),
    short: t("Fyodor Perfilyevich", "Фёдор Перфильевич"),
    initials: t("FU", "ФУ"),
    life: t("c. 1747 – 2 Jan 1811", "ок. 1747 – 02.01.1811"),
    place: t("Kulikovskaya", "Куликовская"),
    spouses: [
      { name: t("Ksenia", "Ксения") },
      {
        name: t("Ekaterina Ivanovna Kovalyova", "Екатерина Ивановна Ковалёва"),
        note: t("from Antroshevskaya, Kitsk volost", "из Антрошевской Кицкой волости"),
      },
      {
        name: t("Evdokia Gerasimovna (Borovkova)", "Евдокия Герасимовна (Боровкова)"),
        note: t("married 9 Feb 1783", "венчание 09.02.1783"),
      },
    ],
    children: t("Isay (Misail), Philipp, Stefan", "Исай (Мисаил), Филипп, Стефан"),
    notes: [
      t("Moved to Kulikovskaya with his father.", "Переехал в Куликовскую с отцом."),
      t("Married three times.", "Был женат трижды."),
    ],
  },
  perfily: {
    id: "perfily",
    name: t("Perfily Pankratovich Utkin", "Перфилий Панкратович Уткин"),
    short: t("Perfily Pankratovich", "Перфилий Панкратович"),
    initials: t("PU", "ПУ"),
    life: t("c. 1721 – 1776", "ок. 1721 – 1776"),
    place: t("Ermolinskaya → Kulikovskaya", "Ермолинская → Куликовская"),
    spouses: [
      {
        name: t("Elena Vasilyevna", "Елена Васильевна"),
        note: t("c. 1718 – 28.05.1789, from Kitsk volost", "ок. 1718 – 28.05.1789, из Кицкой волости"),
      },
    ],
    children: t("Irina, Fyodor, Ivan", "Ирина, Фёдор, Иван"),
    notes: [
      t(
        "Between 1745 and 1762 moved to Kulikovskaya (Ust-Syuma), where the family then stayed.",
        "Между 1745 и 1762 годами перебрался в Куликовскую (Усть-Сюма), и семья жила там и дальше.",
      ),
    ],
  },
  pankrat: {
    id: "pankrat",
    name: t("Pankrat Vasilyevich Utkin", "Панкрат Васильевич Уткин"),
    short: t("Pankrat Vasilyevich", "Панкрат Васильевич"),
    initials: t("PU", "ПУ"),
    life: t("c. 1693 – 1754", "ок. 1693 – 1754"),
    place: t("Ermolinskaya", "Ермолинская"),
    spouses: [{ name: t("Pelageya Leontyevna", "Пелагея Леонтьевна"), note: t("c. 1697 – 1765", "ок. 1697 – 1765") }],
    children: t("Perfily, Moisey, Pakhom", "Перфилий, Моисей, Пахом"),
    notes: [
      t(
        "Settled in Ermolinskaya, Yamskaya Gora volost — probably coming from Matveevskaya, opposite the mouth of the Vaga.",
        "Поселился в деревне Ермолинской Ямскогорской волости, вероятно, прийдя из Матвеевской, напротив устья Ваги.",
      ),
      t("First recorded in the second revision (1745), aged 52.", "Впервые записан во второй ревизии (1745), 52 лет."),
    ],
  },
  vasilyU: {
    id: "vasilyU",
    name: t("Vasily Utkin", "Василий Уткин"),
    short: t("Vasily Utkin", "Василий Уткин"),
    initials: t("VU", "ВУ"),
    life: t("before 1674", "до 1674"),
    place: t("probably Matveevskaya", "вероятно, Матвеевская"),
    children: t("Sons Pankrat and Kirill (Artemy)", "Сыновья Панкрат и Кирилл (Артемий)"),
    notes: [t("Known only through his son's patronymic.", "Известен только по отчеству сына.")],
  },
};

export const usachevUtkin: FamilyTree = {
  hero: {
    eyebrow: t("Nazarov · Story", "Nazarov · История"),
    title: t("Our family. Our history.", "Наша семья. Наша история."),
    lead: t(
      "The Usachevs and the Utkins: fourteen generations, from the banks of the Vaga in Russia's North to Massachusetts.",
      "Усачевы и Уткины: четырнадцать поколений — от берегов Ваги на Русском Севере до Массачусетса.",
    ),
    stats: [
      { value: 14, label: t("generations", "поколений") },
      { value: 400, suffix: t("+", "+"), label: t("years of history", "лет истории") },
      { value: 2, label: t("family lines", "рода") },
      { value: 300, prefix: "~", label: t("years on one river", "лет на одной реке") },
    ],
  },

  lines: [
    t("The Usachevs · Varamino", "Род Усачевых · Варамино"),
    t("The Utkins · Ust-Syuma", "Род Уткиных · Усть-Сюма"),
  ],

  people,

  rows: [
    {
      id: "today",
      kind: "single",
      people: ["stepan"],
      year: t("2020s", "2020-е"),
      title: t("A new generation", "Новое поколение"),
      summary: t(
        "Yakov moves to Massachusetts. The line that begins with Stepan Usachev goes on with another Stepan, across the ocean.",
        "Яков переезжает в Массачусетс. Род, который начинается со Степана Усачева, продолжается Степаном — уже за океаном.",
      ),
      placeId: "massachusetts",
      era: "today",
    },
    {
      id: "moscow",
      kind: "single",
      people: ["yakov", "natalia"],
      year: t("1998–2003", "1998–2003"),
      title: t("Moscow", "Москва"),
      summary: t(
        "Natalia and Yakov go to university in Moscow; soon their parents follow them south.",
        "Наталья и Яков поступают в вузы в Москве, а вскоре из Северодвинска под Москву переезжают и родители.",
      ),
      placeId: "moscow",
      era: "today",
    },
    {
      id: "severodvinsk",
      kind: "single",
      people: ["lyubov"],
      year: t("1954", "1954"),
      title: t("By the White Sea", "У Белого моря"),
      summary: t(
        "Lyubov is born on 21 July 1954 in Molotovsk. Three years later the town takes the name Severodvinsk.",
        "21 июля 1954 года в Молотовске родилась Любовь. Через три года город получит имя Северодвинск.",
      ),
      placeId: "severodvinsk",
      era: "modern",
    },
    {
      id: "molotovsk",
      kind: "single",
      people: ["augusta"],
      year: t("1936–1938", "1936–1938"),
      title: t("A new town", "Новый город"),
      summary: t(
        "The family leaves Stepychevskaya for the Second District of Molotovsk — a shipbuilders' settlement that became a town in 1938.",
        "Семья переезжает из Степычевской на Второй участок Молотовска — посёлка корабелов, который в 1938 году стал городом.",
      ),
      placeId: "severodvinsk",
      era: "modern",
    },
    {
      id: "union",
      kind: "pair",
      people: ["afanasy", "maria"],
      year: t("1901", "1901"),
      title: t("Two families meet", "Два рода сходятся"),
      summary: t(
        "Afanasy Usachev and Maria Utkina are born in January 1901, a week apart, in villages about ten kilometres from each other.",
        "Афанасий Усачев и Мария Уткина родились в январе 1901 года с разницей в неделю — в деревнях километрах в десяти друг от друга.",
      ),
      placeId: "stepychevskaya",
      era: "modern",
    },
    {
      id: "railway",
      kind: "pair",
      people: ["pavel", "ilya"],
      year: t("1870s", "1870-е"),
      title: t("A railway to the North", "Железная дорога на Север"),
      summary: t(
        "At eighteen Ilya Utkin helps build the line from Vologda to Arkhangelsk; Pavel Usachev farms with his father.",
        "18-летний Илья Уткин строит дорогу Вологда — Архангельск, Павел Усачев пашет землю вместе с отцом.",
      ),
      placeId: "kulikovskaya",
      era: "imperial",
    },
    {
      id: "crafts",
      kind: "pair",
      people: ["ivanV", "semyonA"],
      year: t("1840s", "1840-е"),
      title: t("A carpenter and a tar-maker", "Плотник и смолокур"),
      summary: t(
        "Ivan Usachev is a literate carpenter with a house of his own; Semyon Utkin makes tar — the craft the Shenkursk district was known for.",
        "Иван Усачев — грамотный плотник со своим домом, Семён Уткин курит смолу: этим промыслом славился Шенкурский уезд.",
      ),
      placeId: "stepychevskaya",
      era: "imperial",
    },
    {
      id: "middle",
      kind: "pair",
      people: ["varlaam", "anisim"],
      year: t("1804 · 1820", "1804 · 1820"),
      title: t("The move to Middle Varamino", "Переезд в Среднее Варамино"),
      summary: t(
        "In the 1830s Varlaam moves the family a few hundred metres upriver, to Stepychevskaya, where the Usachevs then live for about a hundred years.",
        "В 1830-х Варлаам переводит семью в Степычевскую — Среднее Варамино. Здесь Усачевы проживут около ста лет.",
      ),
      placeId: "stepychevskaya",
      era: "imperial",
    },
    {
      id: "thread",
      kind: "pair",
      people: ["semyonS", "ivanM"],
      year: t("1764 · 1797", "1764 · 1797"),
      title: t("The first thread between the families", "Первая ниточка между родами"),
      summary: t(
        "In 1817 Ustinya from Upper Varamino marries Ivan Utkin: the two families meet eighty years before Afanasy and Maria.",
        "В 1817 году Устинья из Верхнего Варамина выходит за Ивана Уткина — роды встречаются за восемьдесят лет до Афанасия и Марии.",
      ),
      placeId: "kulikovskaya",
      era: "imperial",
    },
    {
      id: "catherine",
      kind: "pair",
      people: ["semyonM", "isay"],
      year: t("1744 · 1764", "1744 · 1764"),
      title: t("The age of Catherine II", "Эпоха Екатерины II"),
      summary: t(
        "Shenkursk becomes a district town, and the revision of 1782 records the family in the \"Shenkursk district of the Vologda vicegerency\".",
        "Шенкурск становится уездным городом, а ревизия 1782 года записывает предков в «Шенкурской округе Вологодского наместничества».",
      ),
      placeId: "shenkursk",
      era: "imperial",
    },
    {
      id: "lomonosov",
      kind: "pair",
      people: ["mikhailL", "fyodor"],
      year: t("1717 · 1747", "1717 · 1747"),
      title: t("In Lomonosov's time", "Во времена Ломоносова"),
      summary: t(
        "While Mikhail Usachev ploughs his land on the Vaga, another northerner, Mikhail Lomonosov, walks to Moscow with a fish convoy to study.",
        "Пока Михаил Усачев пашет землю на Ваге, другой северянин, Михайло Ломоносов, уходит с рыбным обозом учиться в Москву.",
      ),
      placeId: "trufanovskaya",
      era: "early",
    },
    {
      id: "peter",
      kind: "pair",
      people: ["lavrenty", "perfily"],
      year: t("1659 · 1721", "1659 · 1721"),
      title: t("Peter the Great counts everyone", "Пётр I переписывает всех"),
      summary: t(
        "In 1719 the first revision counts every man in the country — and puts Lavrenty and his ninety-year-old father on paper.",
        "В 1719 году первая ревизия переписывает всех мужчин страны — так в документы попадают Лаврентий и его 90-летний отец.",
      ),
      placeId: "ermolinskaya",
      era: "early",
    },
    {
      id: "romanovs",
      kind: "pair",
      people: ["gerasim", "pankrat"],
      year: t("1629 · 1693", "1629 · 1693"),
      title: t("The first Romanovs", "Первые Романовы"),
      summary: t(
        "Gerasim is born in the reign of the first Romanov tsar; two generations later Pankrat Utkin moves up the Vaga to Ermolinskaya.",
        "Герасим родился при первом царе из Романовых, а Панкрат Уткин позже поднимется вверх по Ваге — в Ермолинскую.",
      ),
      placeId: "trufanovskaya",
      era: "early",
    },
    {
      id: "roots",
      kind: "pair",
      people: ["stepanU", "vasilyU"],
      year: t("before 1610", "до 1610"),
      title: t("The earliest roots", "Самые ранние корни"),
      summary: t(
        "Stepan Usachev and Vasily Utkin — the first names of the two families, known only through their sons.",
        "Степан Усачев и Василий Уткин — первые имена двух родов. Они известны только по отчествам своих сыновей.",
      ),
      placeId: "trufanovskaya",
      era: "early",
    },
  ],

  chapters: [
    {
      rowId: "today",
      world: [
        t(
          "Massachusetts is one of the oldest corners of the United States: in 1620 the Mayflower brought its first settlers to these shores — at about the time Stepan Usachev was living on the Vaga.",
          "Массачусетс — один из старейших уголков США: в 1620 году к его берегам пристал «Мэйфлауэр» с первыми переселенцами. Примерно тогда же на Ваге жил Степан Усачев.",
        ),
      ],
      family: [
        t("Yakov moves to Massachusetts.", "Яков переезжает в Массачусетс."),
        t(
          "His son Stepan is the fourteenth generation counted from Stepan Usachev. The family's story begins with a Stepan and goes on with one.",
          "Его сын Степан — четырнадцатое поколение, если считать от Степана Усачева. История рода начинается со Степана и Степаном продолжается.",
        ),
      ],
    },
    {
      rowId: "moscow",
      world: [
        t(
          "At the turn of the century Moscow draws students from the whole country — the North included.",
          "На рубеже веков Москва собирает студентов со всей страны, и с Севера тоже.",
        ),
      ],
      family: [
        t("1998 — Natalia enters university in Moscow.", "1998 — Наталья поступает в вуз в Москве."),
        t("2000 — Yakov enters university in Moscow.", "2000 — Яков поступает в вуз в Москве."),
        t(
          "2003 — the parents leave Severodvinsk for Krasnoarmeysk, then Pushkino, and then Moscow.",
          "2003 — родители переезжают из Северодвинска в Красноармейск, потом в Пушкино, затем в Москву.",
        ),
      ],
    },
    {
      rowId: "severodvinsk",
      world: [
        t("In 1957 Molotovsk is renamed Severodvinsk.", "В 1957 году Молотовск переименован в Северодвинск."),
        t(
          "On 12 April 1961 Yuri Gagarin becomes the first person to fly into space. Lyubov is six.",
          "12 апреля 1961 года Юрий Гагарин совершает первый полёт человека в космос. Любови шесть лет.",
        ),
      ],
      family: [
        t(
          "On 21 July 1954 Lyubov is born to Augusta Afanasyevna and Nikolai Galega, a driver.",
          "21 июля 1954 года в семье Августы Афанасьевны и Николая Галеги, водителя, родилась Любовь.",
        ),
        t(
          "She meets her husband on a horse-riding tour near Ufa, at Beloretsk, and he moves north to be with her. From 1980 they live in Severodvinsk.",
          "С мужем она познакомилась в конном туре под Уфой, у Белорецка, и он переехал к ней. С 1980 года они живут в Северодвинске.",
        ),
        t("In 1980 Maria Ilyinichna passes away.", "В 1980 году не стало Марии Ильиничны."),
      ],
    },
    {
      rowId: "molotovsk",
      world: [
        t(
          "From 1936 a shipbuilders' settlement, Sudostroy, rises on the White Sea. In 1938 it becomes the town of Molotovsk, and from 1957 it is Severodvinsk.",
          "С 1936 года у Белого моря строят посёлок Судострой. В 1938 году он становится городом Молотовском, а с 1957-го — Северодвинском.",
        ),
      ],
      family: [
        t(
          "After Stepychevskaya, where Augusta was born, the family moves to the Second District of Molotovsk — one of the busiest parts of the settlement.",
          "После Степычевской, где родилась Августа, семья переезжает в Молотовск, на Второй участок — один из самых многолюдных районов посёлка.",
        ),
        t(
          "By 1938 the district had more than forty houses, mostly single-storey barracks, a workers' club, a fire tower and a school. Nearby, on Bychya channel, Sawmill No. 2 was being built from 1937; the street from its gates became Dvinskaya Street.",
          "К 1938 году там стояло более 40 домов, в основном одноэтажных бараков, рабочий клуб, пожарная каланча и школа. Рядом, на берегу Бычьей протоки, с 1937 года строился лесозавод № 2; улица от его ворот стала Двинской.",
        ),
        t(
          "Afanasy and Maria have three children: Augusta, Alexandra (Shura) and Gury. Augusta spends her whole life in Severodvinsk.",
          "У Афанасия и Марии трое детей: Августа, Александра (Шура) и Гурий. Августа прожила в Северодвинске всю жизнь.",
        ),
      ],
    },
    {
      rowId: "union",
      world: [
        t(
          "In 1929 the Vaga lands become part of the Northern Krai, and the Shenkursk district takes its modern shape.",
          "С 1929 года земли на Ваге входят в Северный край, появляется Шенкурский район.",
        ),
      ],
      family: [
        t(
          "Afanasy Pavlovich is born on 18 January 1901 in Stepychevskaya; Maria Ilyinichna on 23 January 1901 in Kulikovskaya, Ust-Syuma.",
          "Афанасий Павлович родился 18 января 1901 года в Степычевской, Мария Ильинична — 23 января 1901 года в Куликовской, Усть-Сюма.",
        ),
        t(
          "The 1920 census finds Ilya Utkin's household at home: nine people. Ilya is the post office watchman, and the family farms its land without hired hands.",
          "Перепись 1920 года застаёт всю семью Ильи Уткина дома, 9 человек. Илья — сторож почтового отделения, хозяйство ведут своими силами.",
        ),
        t(
          "As the family tells it, the Red Army soldier Afanasy met Maria in Ust-Syuma and took her home to Stepychevskaya. Her parents were later sent away — to Arkhangelsk, by a record of 1927.",
          "По семейному преданию, красноармеец Афанасий встретил Марию в Усть-Сюме и увёз её к себе в Степычевскую. Её родителей позже выслали — по записи 1927 года, в Архангельск.",
        ),
        t(
          "Afanasy Pavlovich fell in battle in April 1942 near the village of Mostki, Chudovo district, Novgorod region. He lies in a mass grave that the family visits.",
          "Афанасий Павлович погиб в бою в апреле 1942 года под деревней Мостки Чудовского района Новгородской области. Он похоронен в братской могиле, которую семья посещает.",
        ),
      ],
    },
    {
      rowId: "railway",
      world: [
        t(
          "1894–1898: the railway from Vologda to Arkhangelsk is built by Savva Mamontov's company.",
          "1894–1898: общество Саввы Мамонтова строит железную дорогу Вологда — Архангельск.",
        ),
        t(
          "In 1897 the Russian Empire holds its first general census — it is why we know so much about the household of every ancestor alive that year.",
          "В 1897 году проходит первая всеобщая перепись Российской империи — поэтому о хозяйстве каждого предка того времени известно так много.",
        ),
      ],
      family: [
        t(
          "Eighteen-year-old Ilya Utkin works on the railway's construction (census of 1897).",
          "18-летний Илья Уткин работает на постройке дороги (перепись 1897 года).",
        ),
        t(
          "Ilya marries Agrippina Khavanova, the church warden's daughter, in 1898. Pavel Usachev marries Anna Pechinina from Litvinovskaya in 1900.",
          "В 1898 году Илья венчается с Агриппиной Хавановой, дочерью церковного старосты. В 1900 году Павел Усачев женится на Анне Печининой из Литвиновской.",
        ),
      ],
    },
    {
      rowId: "crafts",
      world: [
        t(
          "Tar-making was the great side trade of the North, and nowhere more than in the Shenkursk district.",
          "Смолокурение — главный подсобный промысел Севера, и сильнее всего он был развит именно в Шенкурском уезде.",
        ),
      ],
      family: [
        t(
          "Ivan Varlaamovich is a farmer and a carpenter, literate, schooled in the village school, with a wooden house of his own.",
          "Иван Варлаамович — земледелец и плотник, грамотный, учился в сельском училище, у него свой деревянный дом.",
        ),
        t(
          "Semyon Anisimovich, raised by his grandfather Ivan, owns his house, farms and makes tar.",
          "Семён Анисимович, выросший у деда Ивана, — хозяин своего дома, земледелец и смолокур.",
        ),
        t(
          "Around them the documents show the other trades of the family: sewing (Alexandra, Semyon's daughter-in-law), building the railway and the post office (Ilya).",
          "Рядом в документах видны и другие занятия семьи: шитьё (Александра, невестка Семёна), постройка железной дороги и служба на почте (Илья).",
        ),
      ],
    },
    {
      rowId: "middle",
      world: [
        t(
          "1837: Russia's first railway opens, from St Petersburg to Tsarskoye Selo.",
          "1837 год: открывается первая в России железная дорога — Царскосельская.",
        ),
      ],
      family: [
        t(
          "Every village here had two names. Trufanovskaya was Lower Varamino, Stepychevskaya was Middle Varamino, Zakharovskaya was Upper Varamino — which is why the records alternate between them.",
          "У деревень было по два названия: Труфановская — Нижнее Варамино, Степычевская — Среднее, Захаровская — Верхнее. Поэтому в документах они чередуются.",
        ),
        t(
          "In 1834 Varlaam marries Ekaterina Ivshina of Zakharovskaya, and in the 1830s he moves the family to Stepychevskaya.",
          "В 1834 году Варлаам венчается с Екатериной Ившиной из Захаровской и в 1830-х переводит семью в Степычевскую.",
        ),
        t(
          "At Anisim Utkin's wedding in 1849 the guarantor is Mikhail Semyonovich Usachev — most likely Varlaam's own brother. The families knew each other long before 1901.",
          "На свадьбе Анисима Уткина в 1849 году поручителем был Михаил Семёнович Усачев — скорее всего, родной брат Варлаама. Семьи знали друг друга задолго до 1901 года.",
        ),
      ],
    },
    {
      rowId: "thread",
      world: [
        t(
          "1797: the palace peasants pass to the new Department of Appanages and become \"appanage peasants\".",
          "1797 год: дворцовые крестьяне переданы в Ведомство уделов и стали «удельными».",
        ),
      ],
      family: [
        t(
          "Both families appear in nineteenth-century records as appanage peasants: they worked the land of the royal house and paid dues, rather than serving a landlord.",
          "Обе семьи в документах XIX века — удельные крестьяне: пахали землю царского двора и платили повинности, а не служили помещику.",
        ),
        t(
          "Semyon Semyonovich and Elena Usova of Nemirovskaya marry in 1790 and raise nine children.",
          "Семён Семёнович и Елена Усова из Немировской венчаются в 1790 году; у них девять детей.",
        ),
        t(
          "In 1817 Ustinya Seliverstova of Zakharovskaya, Upper Varamino, marries Ivan Utkin and moves to Kulikovskaya.",
          "В 1817 году Устинья Селиверстова из Захаровской, Верхнего Варамина, выходит за Ивана Уткина и переезжает в Куликовскую.",
        ),
      ],
    },
    {
      rowId: "catherine",
      world: [
        t(
          "1755: Moscow University is founded.",
          "1755 год: основан Московский университет.",
        ),
        t(
          "1780: Catherine II makes Shenkursk a district town of the Vologda vicegerency; from 1796 it belongs to the Arkhangelsk province.",
          "1780 год: Екатерина II делает Шенкурск уездным городом Вологодского наместничества, с 1796 года он — в Архангельской губернии.",
        ),
      ],
      family: [
        t(
          "The revision of 1782 records the ancestors in the \"Shenkursk district of the Vologda vicegerency\".",
          "Ревизия 1782 года записывает предков в «Шенкурской округе Вологодского наместничества».",
        ),
        t(
          "In 1792 Semyon Mikhailovich is recorded as a palace peasant. His wife Anna came from Kuvakinskaya.",
          "В 1792 году Семён Михайлович записан дворцовым крестьянином. Его жена Анна — из Кувакинской.",
        ),
        t(
          "In 1789 Isay Utkin marries Fevronya Popova from his own village.",
          "В 1789 году Исай Уткин венчается с Февроньей Поповой из своей же деревни.",
        ),
      ],
    },
    {
      rowId: "lomonosov",
      world: [
        t(
          "In December 1730 Mikhail Lomonosov, a fisherman's son from near Kholmogory, sets off for Moscow with a fish convoy to study. He will become one of Russia's great scientists.",
          "В декабре 1730 года Михайло Ломоносов, сын помора из-под Холмогор, уходит с рыбным обозом учиться в Москву. Он станет одним из великих учёных России.",
        ),
      ],
      family: [
        t(
          "Mikhail Lavrentyevich marries Fyokla Istomina of Zakharovskaya, Upper Varamino.",
          "Михаил Лаврентьевич женится на Фёкле Истоминой из Захаровской, Верхнего Варамина.",
        ),
        t(
          "Fyodor Perfilyevich moves to Kulikovskaya with his father and marries three times; his son Isay continues the Utkin line.",
          "Фёдор Перфильевич переезжает с отцом в Куликовскую и женится трижды; род Уткиных продолжает его сын Исай.",
        ),
      ],
    },
    {
      rowId: "peter",
      world: [
        t("1703: Peter I founds St Petersburg.", "1703 год: Пётр I основывает Санкт-Петербург."),
        t(
          "1708: the Vaga and the lands around it become part of the Archangelgorod province.",
          "1708 год: Вага с окрестными землями входит в Архангелогородскую губернию.",
        ),
        t(
          "1719: Peter introduces the poll tax and the revisions — censuses of every man. The revisions are why this tree reaches so far back.",
          "1719 год: Пётр I вводит подушную подать и ревизии — переписи всех мужчин. Благодаря ревизиям это древо уходит так далеко в прошлое.",
        ),
      ],
      family: [
        t(
          "In the first revision, 1719, Lavrenty Gerasimovich is sixty and his father Gerasim ninety.",
          "В первой ревизии 1719 года Лаврентию Герасимовичу 60 лет, а его отцу Герасиму — 90.",
        ),
        t(
          "Between 1745 and 1762 Perfily Utkin moves from Ermolinskaya to Kulikovskaya, Ust-Syuma.",
          "Между 1745 и 1762 годами Перфилий Уткин перебирается из Ермолинской в Куликовскую, Усть-Сюма.",
        ),
      ],
    },
    {
      rowId: "romanovs",
      world: [
        t(
          "1613: the Zemsky Sobor elects Mikhail Romanov tsar, and the Romanov dynasty begins.",
          "1613 год: Земский собор избирает на царство Михаила Романова — начинается династия Романовых.",
        ),
        t(
          "In the seventeenth century the Vaga land is divided into \"chetverti\" — Shenkursk, Podvinskaya and others. A survey of the Shenkursk parishes from the 1620s has survived.",
          "В XVII веке Важская земля делится на «чети» — Шенкурскую, Подвинскую и другие. Сохранилась перепись приходов Шенкурской чети 1620-х годов.",
        ),
      ],
      family: [
        t(
          "Stepan Usachev and his son Gerasim (born about 1629) live in Trufanovskaya.",
          "В Труфановской живут Степан Усачев и его сын Герасим (около 1629 года рождения).",
        ),
        t(
          "Pankrat Utkin settles in Ermolinskaya, probably from Matveevskaya at the mouth of the Vaga. He first appears in the revision of 1745, aged fifty-two.",
          "Панкрат Уткин поселяется в Ермолинской, вероятно, придя из Матвеевской у устья Ваги. Впервые он записан в ревизии 1745 года, 52 лет.",
        ),
      ],
    },
    {
      rowId: "roots",
      world: [
        t(
          "Before the Russians came, the Finno-Ugric people known as the Zavolochye Chud lived here. From the 11th–12th centuries Novgorodians came over the portages between rivers — hence the name Zavolochye, \"beyond the portages\".",
          "До русских здесь жила финно-угорская «заволоцкая чудь». С XI–XII веков сюда шли новгородцы — через волоки между реками, отсюда и слово «Заволочье».",
        ),
        t(
          "Shenkursk was an old Novgorod settlement in the fertile valley of the Vaga. In 1315 its churchyard was bought by the Novgorod posadnik Svoezemtsev; in 1471–1478 Ivan III joined Novgorod and Zavolochye to Moscow.",
          "Шенкурск — издавна новгородское поселение в плодородной долине Ваги. В 1315 году Шенкурский погост покупает новгородский посадник Своеземцев, а в 1471–1478 годах Иван III присоединяет Новгород и Заволочье к Москве.",
        ),
      ],
      family: [
        t(
          "Usachev and Utkin are Russian surnames from nicknames — \"Usach\", the moustached one, and \"Utka\", the duck. Where the first Usachevs came from the documents do not say.",
          "Усачев и Уткин — русские фамилии от прозвищ: «Усач» и «Утка». Откуда пришли первые Усачевы, документы не сохранили.",
        ),
        t(
          "The Usachevs lived in the Varamino villages of Shegovary volost for at least three hundred years. The Utkins came up the Vaga in the early 18th century from the Podvinskaya chetvert, near its mouth.",
          "Усачевы жили в деревнях Варамино Шеговарской волости не меньше 300 лет. Уткины в начале XVIII века перебрались вверх по Ваге из Подвинской четверти, от её устья.",
        ),
      ],
    },
  ],

  places: [
    { id: "trufanovskaya", name: t("Trufanovskaya", "Труфановская"), alias: t("Lower Varamino", "Нижнее Варамино"), lng: 42.8855, lat: 62.4155 },
    { id: "stepychevskaya", name: t("Stepychevskaya", "Степычевская"), alias: t("Middle Varamino", "Среднее Варамино"), lng: 42.8845, lat: 62.4188 },
    // The map has a Zakharovskaya well south of Varamino, which cannot be
    // "Upper Varamino"; the point is put just upriver of the other two.
    { id: "zakharovskaya", name: t("Zakharovskaya", "Захаровская"), alias: t("Upper Varamino", "Верхнее Варамино"), lng: 42.872, lat: 62.398, approximate: true },
    { id: "litvinovskaya", name: t("Litvinovskaya", "Литвиновская"), lng: 42.9515, lat: 62.3517 },
    { id: "kulikovskaya", name: t("Kulikovskaya", "Куликовская"), alias: t("Ust-Syuma", "Усть-Сюма"), lng: 42.7885, lat: 62.5048 },
    { id: "ermolinskaya", name: t("Ermolinskaya", "Ермолинская"), lng: 42.5953, lat: 62.4568 },
    { id: "matveevskaya", name: t("Matveevskaya", "Матвеевская"), alias: t("probably", "вероятно"), lng: 42.95, lat: 62.82, approximate: true },
    { id: "shenkursk", name: t("Shenkursk", "Шенкурск"), lng: 42.9076, lat: 62.1059 },
    { id: "vologda", name: t("Vologda", "Вологда"), lng: 39.8915, lat: 59.2205 },
    { id: "arkhangelsk", name: t("Arkhangelsk", "Архангельск"), lng: 40.5287, lat: 64.541 },
    { id: "severodvinsk", name: t("Severodvinsk", "Северодвинск"), alias: t("Molotovsk until 1957", "до 1957 — Молотовск"), lng: 39.8238, lat: 64.5634 },
    { id: "mostki", name: t("Mostki", "Мостки"), alias: t("in memory", "память"), lng: 31.4894, lat: 58.879, memorial: true },
    { id: "beloretsk", name: t("Beloretsk", "Белорецк"), lng: 58.41, lat: 53.9681 },
    { id: "moscow", name: t("Moscow", "Москва"), lng: 37.6173, lat: 55.7558 },
    { id: "krasnoarmeysk", name: t("Krasnoarmeysk", "Красноармейск"), lng: 38.1458, lat: 56.1211 },
    { id: "pushkino", name: t("Pushkino", "Пушкино"), lng: 37.8462, lat: 56.0104 },
    { id: "massachusetts", name: t("Massachusetts", "Массачусетс"), alias: t("USA", "США"), lng: -71.8, lat: 42.3 },
  ],

  journey: [
    {
      id: "vaga",
      year: t("before 1610", "до 1610"),
      title: t("The Vaga", "Река Вага"),
      text: t(
        "Everything starts on the Vaga, one of the oldest Russian lands of the North. The Usachevs live in Trufanovskaya, Lower Varamino.",
        "Всё начинается на Ваге — одной из самых старых русских земель Севера. Усачевы живут в Труфановской, Нижнем Варамине.",
      ),
      camera: { lng: 42.8, lat: 62.42, zoom: 8.2, pitch: 35 },
      places: ["trufanovskaya", "shenkursk"],
    },
    {
      id: "utkins",
      year: t("before 1674", "до 1674"),
      title: t("The Utkins downriver", "Уткины ниже по реке"),
      text: t(
        "Vasily Utkin probably lives in Matveevskaya, opposite the mouth of the Vaga.",
        "Василий Уткин, вероятно, живёт в Матвеевской, напротив устья Ваги.",
      ),
      camera: { lng: 42.8, lat: 62.62, zoom: 8, pitch: 30 },
      places: ["matveevskaya"],
    },
    {
      id: "ermolinskaya",
      year: t("by 1745", "к 1745"),
      title: t("Up the river", "Вверх по реке"),
      text: t(
        "Pankrat Utkin moves up the Vaga and settles in Ermolinskaya, Yamskaya Gora volost.",
        "Панкрат Уткин поднимается вверх по Ваге и поселяется в Ермолинской Ямскогорской волости.",
      ),
      camera: { lng: 42.75, lat: 62.62, zoom: 8.4, pitch: 35 },
      places: ["ermolinskaya"],
      routes: [{ from: "matveevskaya", to: "ermolinskaya", kind: "move" }],
    },
    {
      id: "ust-syuma",
      year: t("1745–1762", "1745–1762"),
      title: t("Ust-Syuma", "Усть-Сюма"),
      text: t(
        "Perfily Utkin moves to Kulikovskaya, Ust-Syuma. The Utkins will live here for the next two centuries.",
        "Перфилий Уткин перебирается в Куликовскую, Усть-Сюма. Здесь Уткины проживут почти два века.",
      ),
      camera: { lng: 42.72, lat: 62.47, zoom: 9.6, pitch: 40 },
      places: ["kulikovskaya"],
      routes: [{ from: "ermolinskaya", to: "kulikovskaya", kind: "move" }],
    },
    {
      id: "ustinya",
      year: t("1817", "1817"),
      title: t("The first thread", "Первая ниточка"),
      text: t(
        "Ustinya from Zakharovskaya, Upper Varamino, marries Ivan Utkin and moves to Kulikovskaya: the two families meet for the first time.",
        "Устинья из Захаровской, Верхнего Варамина, выходит за Ивана Уткина и переезжает в Куликовскую — роды впервые встречаются.",
      ),
      camera: { lng: 42.83, lat: 62.45, zoom: 10.2, pitch: 45 },
      places: ["zakharovskaya", "kulikovskaya", "trufanovskaya"],
      routes: [{ from: "zakharovskaya", to: "kulikovskaya", kind: "link" }],
    },
    {
      id: "middle",
      year: t("1830s", "1830-е"),
      title: t("A few hundred metres", "Несколько сотен метров"),
      text: t(
        "Varlaam Usachev moves the family from Lower to Middle Varamino, Stepychevskaya. A short move — and a home for the next hundred years.",
        "Варлаам Усачев переводит семью из Нижнего в Среднее Варамино, в Степычевскую. Переезд короткий — а дом на сто лет.",
      ),
      camera: { lng: 42.885, lat: 62.417, zoom: 13.6, pitch: 50 },
      places: ["trufanovskaya", "stepychevskaya"],
      routes: [{ from: "trufanovskaya", to: "stepychevskaya", kind: "move" }],
    },
    {
      id: "railway",
      year: t("1894–1898", "1894–1898"),
      title: t("The railway", "Железная дорога"),
      text: t(
        "Eighteen-year-old Ilya Utkin helps build the railway from Vologda to Arkhangelsk.",
        "18-летний Илья Уткин работает на постройке железной дороги Вологда — Архангельск.",
      ),
      camera: { lng: 41.2, lat: 61.9, zoom: 5.3, pitch: 20 },
      places: ["vologda", "arkhangelsk", "kulikovskaya"],
      path: {
        label: t("Vologda — Arkhangelsk railway", "Железная дорога Вологда — Архангельск"),
        // The line's main stations, north to south; the drawing is a sketch,
        // not a survey.
        points: [
          [39.8915, 59.2205],
          [40.25, 60.97],
          [40.2, 61.66],
          [40.29, 62.71],
          [40.31, 63.43],
          [40.5287, 64.541],
        ],
      },
    },
    {
      id: "1901",
      year: t("1901", "1901"),
      title: t("A week apart", "С разницей в неделю"),
      text: t(
        "Afanasy is born in Stepychevskaya on 18 January, Maria in Kulikovskaya on 23 January — about ten kilometres apart.",
        "18 января в Степычевской рождается Афанасий, 23 января в Куликовской — Мария. Между деревнями около десяти километров.",
      ),
      camera: { lng: 42.84, lat: 62.46, zoom: 10.4, pitch: 45 },
      places: ["stepychevskaya", "kulikovskaya"],
    },
    {
      id: "together",
      year: t("1920s", "1920-е"),
      title: t("Maria moves to Stepychevskaya", "Мария переезжает в Степычевскую"),
      text: t(
        "As the family tells it, Afanasy takes Maria home to Stepychevskaya. The two lines become one family.",
        "По семейному преданию, Афанасий увозит Марию к себе в Степычевскую. Два рода становятся одной семьёй.",
      ),
      camera: { lng: 42.84, lat: 62.46, zoom: 10.6, pitch: 50, bearing: -15 },
      places: ["kulikovskaya", "stepychevskaya"],
      routes: [{ from: "kulikovskaya", to: "stepychevskaya", kind: "link" }],
    },
    {
      id: "molotovsk",
      year: t("1936–1938", "1936–1938"),
      title: t("To the White Sea", "К Белому морю"),
      text: t(
        "The family moves to the Second District of Molotovsk, the new shipbuilders' town — today's Severodvinsk.",
        "Семья переезжает на Второй участок Молотовска — нового города корабелов, сегодняшнего Северодвинска.",
      ),
      camera: { lng: 41.4, lat: 63.55, zoom: 6, pitch: 30 },
      places: ["stepychevskaya", "severodvinsk"],
      routes: [{ from: "stepychevskaya", to: "severodvinsk", kind: "move" }],
    },
    {
      id: "memory",
      year: t("1942", "1942"),
      title: t("In memory", "Память"),
      text: t(
        "Afanasy Pavlovich falls in battle in April 1942 near Mostki, Novgorod region. The family visits his grave.",
        "Афанасий Павлович погиб в апреле 1942 года под Мостками Новгородской области. Семья навещает его могилу.",
      ),
      camera: { lng: 33.5, lat: 60.4, zoom: 5, pitch: 20 },
      places: ["mostki", "severodvinsk"],
    },
    {
      id: "lyubov",
      year: t("1954 · 1980", "1954 · 1980"),
      title: t("Severodvinsk", "Северодвинск"),
      text: t(
        "Lyubov is born in 1954. She meets her husband on a horse-riding tour near Beloretsk, and he moves north to her.",
        "В 1954 году рождается Любовь. С мужем она познакомится в конном туре под Белорецком, и он переедет к ней на Север.",
      ),
      camera: { lng: 47, lat: 59.5, zoom: 3.6, pitch: 15 },
      places: ["severodvinsk", "beloretsk"],
      routes: [{ from: "beloretsk", to: "severodvinsk", kind: "link" }],
    },
    {
      id: "moscow",
      year: t("1998–2003", "1998–2003"),
      title: t("Moscow", "Москва"),
      text: t(
        "Natalia and Yakov go to university in Moscow; in 2003 their parents follow — to Krasnoarmeysk, Pushkino and then Moscow.",
        "Наталья и Яков поступают в вузы в Москве, а в 2003 году следом едут родители — в Красноармейск, Пушкино и затем в Москву.",
      ),
      camera: { lng: 38.6, lat: 59.3, zoom: 4.6, pitch: 20 },
      places: ["severodvinsk", "moscow", "krasnoarmeysk", "pushkino"],
      routes: [
        { from: "severodvinsk", to: "moscow", kind: "move" },
        { from: "severodvinsk", to: "krasnoarmeysk", kind: "move" },
      ],
    },
    {
      id: "usa",
      year: t("2020s", "2020-е"),
      title: t("Across the ocean", "Через океан"),
      text: t(
        "Yakov takes off for Massachusetts. In the fourteenth generation from Stepan Usachev, the family story goes on with Stepan — in the New World.",
        "Яков стартует в Массачусетс. В четырнадцатом поколении от Степана Усачева история семьи продолжается со Степаном — в Новом Свете.",
      ),
      camera: { lng: -18, lat: 52, zoom: 1.6, pitch: 0 },
      places: ["moscow", "massachusetts"],
      routes: [{ from: "moscow", to: "massachusetts", kind: "rocket" }],
    },
  ],

  notes: [
    t(
      "Dates before 1918 are Old Style, as in the archive documents.",
      "Даты до 1918 года — по старому стилю, как в архивных документах.",
    ),
    t(
      "Years marked \"c.\" are worked out from ages in the lists and may be off by one to three years.",
      "Годы с «ок.» посчитаны по возрасту в списках и могут отличаться на 1–3 года.",
    ),
  ],

  sources: {
    credit: t(
      "Nearly everything before 1920 comes from the State Archive of the Arkhangelsk Region (GAAO). The ascending pedigrees were compiled by the researcher V. P. Dragni (December 2024). The twentieth century is written down from the family's words, November 2026.",
      "Почти все сведения до 1920 года взяты из документов Государственного архива Архангельской области (ГААО). Восходящие росписи составил исследователь В. П. Драгни (декабрь 2024). История XX века записана со слов семьи в ноябре 2026 года.",
    ),
    archives: [
      { label: t("Ascending pedigree: Afanasy Pavlovich Usachev", "Восходящая роспись: Усачев Афанасий Павлович") },
      { label: t("Ascending pedigree: Maria Utkina", "Восходящая роспись: Уткина Мария") },
      { label: t("GAAO archival certificate on the Usachevs", "Архивная справка ГААО по Усачевым") },
      { label: t("GAAO archival certificate No. 05-05/5101 of 14.07.2022 on the Utkins", "Архивная справка ГААО № 05-05/5101 от 14.07.2022 по Уткиным") },
      { label: t("Revision tales, 1719–1858", "Ревизские сказки 1719–1858 годов") },
      { label: t("Confession lists and parish registers", "Исповедные росписи и метрические книги") },
      { label: t("Censuses of 1897 and 1920", "Переписи 1897 и 1920 годов") },
    ],
    literature: [
      { label: t("A. P. Vorobey. Special settlers in the Northern Krai, 1930–1931", "А. П. Воробей. Спецпереселенцы в Северном крае 1930–1931") },
      { label: t("Vlasova. The population of the central regions of the Russian North", "Власова. Население центральных районов Русского Севера") },
      { label: t("Brockhaus and Efron Encyclopedic Dictionary: Shenkursk", "Энциклопедический словарь Брокгауза и Ефрона: Шенкурск") },
      { label: t("Sogrina (PetrSU): tar-making in the Shenkursk district", "Согрина (ПетрГУ): смолокурение в Шенкурском уезде") },
      { label: t("Severodvinsk museum project \"Gorod tot dorog\" — the Second District", "Музейный проект Северодвинска «Город тот дорог» — Второй участок") },
    ],
  },
};
