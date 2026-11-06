/**
 * Everything the About page says, in both languages (ТЗ v4, §5).
 *
 * The source is the owner's own Community Concept document, and the wording
 * here follows it closely — this is his manifesto, not marketing copy someone
 * can improve by rewriting. Two liberties were taken deliberately:
 *
 *  - sections 3, 4 and 5 of the document ("Our idea", "Our mission", "Our
 *    vision") say the same thing three times over, so they are one section
 *    here. Read aloud as three they sound like padding, which is the opposite
 *    of what the document is for.
 *  - "Community Contributor" is left out. The document itself calls that role
 *    optional and to be introduced "as the community grows", and ТЗ v4 §13.3
 *    records the decision not to build it. A page describing a role the site
 *    cannot grant would be a promise it cannot keep.
 *
 * The text lives in code rather than in the panel for the same reason the home
 * page's first screen does: it is written once and not edited weekly. Item 4.3
 * moves it into settings, with these values as the defaults.
 */

/** One value in both languages. */
type L<T = string> = { en: T; ru: T };

export interface AboutCopy {
  hero: { eyebrow: L; title: L; paragraphs: L<string[]>; imageAlt: L };
  letter: {
    eyebrow: L;
    title: L;
    lead: L;
    items: { name: string; text: L }[];
    note: L;
  };
  idea: { eyebrow: L; title: L; paragraphs: L<string[]>; items: L<string[]>; imageAlt: L };
  roles: {
    eyebrow: L;
    title: L;
    lead: L;
    items: { name: L; tagline: L; text: L }[];
  };
  steps: {
    eyebrow: L;
    title: L;
    items: { name: L; text: L }[];
    orTitle: L;
    orText: L;
  };
  free: { eyebrow: L; title: L; lead: L; items: L<string[]>; note: L; imageAlt: L };
  values: { eyebrow: L; title: L; items: { name: L; text: L }[] };
  terms: { eyebrow: L; title: L; lead: L; items: L<string[]>; note: L };
  closing: { title: L; paragraphs: L<string[]>; sign: L };
}

export const ABOUT: AboutCopy = {
  hero: {
    eyebrow: { en: "About the community", ru: "О сообществе" },
    title: {
      en: "Life is more interesting when we live it together.",
      ru: "Жизнь интереснее, когда проживаешь её вместе.",
    },
    paragraphs: {
      en: [
        "I have always believed that life is about experiences, discoveries, challenges — and the people you share them with.",
        "Over the years I have sailed, snowboarded, jumped out of planes, travelled, explored new places and built things. Along the way I noticed something: the hardest part of doing something exciting is usually finding the right people to do it with.",
        "You might have an idea for an adventure, a place you have always wanted to see, or a project you would love to build. But where do you find people who share the interest, the enthusiasm and the values?",
        "That is why I started Nazarov.net — a place where people bring their ideas, find like-minded people, organise things and turn plans into real experiences. Free, open, and driven by people.",
        "You do not need to be an expert or an experienced organiser. You need curiosity, a bit of initiative, and the wish to meet people who share your vibe.",
      ],
      ru: [
        "Я всегда считал, что жизнь — это впечатления, открытия, вызовы и люди, с которыми ты всё это проживаешь.",
        "За эти годы я ходил под парусом, катался на сноуборде, прыгал с парашютом, путешествовал, открывал новые места и делал проекты. И заметил одно: самое трудное в интересном деле — найти тех, с кем его делать.",
        "У вас может быть идея поездки, место, куда всегда хотелось попасть, или проект, который хочется построить. Но где найти людей с тем же интересом, настроем и ценностями?",
        "Ради этого и появился Nazarov.net — место, где люди приносят свои идеи, находят единомышленников, собираются и превращают планы в настоящие события. Бесплатно, открыто и силами самих людей.",
        "Не нужно быть экспертом или опытным организатором. Нужны любопытство, немного инициативы и желание познакомиться с теми, кто на одной волне.",
      ],
    },
    imageAlt: {
      en: "Yasha at the helm at sunset",
      ru: "Яша за штурвалом на закате",
    },
  },

  letter: {
    eyebrow: { en: "The idea", ru: "Замысел" },
    title: { en: "Why the letter S", ru: "Почему буква S" },
    lead: {
      en: "The S is the heart of Nazarov.net. It is not a logo or a design flourish — it stands for the interests, the experiences and the ideas that bring this community together.",
      ru: "S — это сердце Nazarov.net. Не логотип и не украшение: за ней стоят увлечения, впечатления и идеи, которые собирают это сообщество.",
    },
    items: [
      {
        name: "Sailing",
        text: {
          en: "Explore the water and discover new horizons.",
          ru: "Выходить на воду и открывать новые горизонты.",
        },
      },
      {
        name: "Snowboarding",
        text: {
          en: "Find new mountains and ride them together.",
          ru: "Находить новые горы и кататься вместе.",
        },
      },
      {
        name: "Skydiving",
        text: {
          en: "Freedom, excitement and the view from above.",
          ru: "Свобода, адреналин и вид сверху.",
        },
      },
      {
        name: "Son",
        text: {
          en: "Family travel: see the world with your children and keep the memories.",
          ru: "Поездки с детьми: показать им мир и сохранить эти воспоминания.",
        },
      },
      {
        name: "Software",
        text: {
          en: "Build digital products, explore technology, turn ideas into real tools.",
          ru: "Делать цифровые продукты, разбираться в технологиях, превращать идеи в рабочие инструменты.",
        },
      },
    ],
    note: {
      en: "One S. Many directions. One community.",
      ru: "Одна S. Много направлений. Одно сообщество.",
    },
  },

  idea: {
    eyebrow: { en: "Mission", ru: "Зачем это" },
    title: {
      en: "Find your people. Share your ideas. Make things happen.",
      ru: "Найди своих. Поделись идеей. Сделай так, чтобы это случилось.",
    },
    paragraphs: {
      en: [
        "The best things in life tend to happen when people with similar interests, curiosity and values end up in the same place. Sailing across open water, riding in the mountains, jumping, travelling with family, building a new product — the idea behind all of it is the same.",
        "Nobody should have to wait for someone else to organise the experience they want to have. Sometimes all it takes is one person with an idea.",
      ],
      ru: [
        "Лучшее в жизни обычно случается, когда в одном месте оказываются люди с общими интересами, любопытством и ценностями. Переход под парусом, горы, прыжки, поездка с семьёй, новый продукт — замысел за всем этим один.",
        "Никто не должен ждать, пока кто-то другой организует то, чего ему хочется. Иногда достаточно одного человека с идеей.",
      ],
    },
    items: {
      en: [
        "Discover new adventures and activities.",
        "Meet people with similar interests and values.",
        "Find companions for trips and the outdoors.",
        "Share ideas and turn them into real experiences.",
        "Create your own events and invite others.",
        "Build friendships that outlast the trip.",
      ],
      ru: [
        "Находить новые поездки и занятия.",
        "Знакомиться с людьми схожих интересов и ценностей.",
        "Искать попутчиков для поездок и вылазок на природу.",
        "Делиться идеями и превращать их в настоящие события.",
        "Создавать свои события и звать других.",
        "Заводить дружбу, которая переживёт саму поездку.",
      ],
    },
    imageAlt: {
      en: "A group with boards beside a helicopter in the mountains",
      ru: "Группа с досками у вертолёта в горах",
    },
  },

  roles: {
    eyebrow: { en: "How it works", ru: "Как это устроено" },
    title: { en: "Four ways to take part", ru: "Четыре способа участвовать" },
    lead: {
      en: "You can start as a visitor and go further whenever you want to. Nothing here costs money, and nothing obliges you to the next step.",
      ru: "Можно начать с того, что просто смотришь, и пойти дальше тогда, когда захочется. Ничто здесь не стоит денег и ни к чему не обязывает.",
    },
    items: [
      {
        name: { en: "Visitor", ru: "Visitor — гость" },
        tagline: { en: "Discover and follow", ru: "Смотреть и следить" },
        text: {
          en: "Browse the directions, read what is coming up, and press + on a direction to get an email when a new trip appears there. No account, no registration, no cost.",
          ru: "Смотреть направления, читать про ближайшие поездки и нажать «+» у направления, чтобы получить письмо, когда там появится новая поездка. Без аккаунта, без регистрации, бесплатно.",
        },
      },
      {
        name: { en: "Member", ru: "Member — участник" },
        tagline: { en: "Join an adventure", ru: "Поехать" },
        text: {
          en: "Found a trip you like? Apply for a place. The application asks your name, where you are, a link to your Instagram, Facebook or LinkedIn, why this trip, what you value and what you bring to the group. It is read by a person, and a place in one trip is not a place in every trip.",
          ru: "Понравилась поездка — подайте заявку на место. В ней спрашиваем имя, город, ссылку на Instagram, Facebook или LinkedIn, почему именно эта поездка, что для вас важно и что вы принесёте группе. Заявку читает человек, и место в одной поездке — не место во всех.",
        },
      },
      {
        name: { en: "Organizer", ru: "Organizer — организатор" },
        tagline: { en: "Bring people together", ru: "Собрать своих" },
        text: {
          en: "Have an idea of your own? Suggest an adventure: what, where, roughly when, and what experience you have. If it is approved and published, you get access to your own trip here — its description, photos, programme and the applications to join it. Yours only.",
          ru: "Есть своя идея — предложите поездку: что, где, примерно когда и какой у вас опыт. Если её одобрят и опубликуют, вы получите доступ к своей поездке здесь: описание, фотографии, программа и заявки на участие. Только к своей.",
        },
      },
      {
        name: { en: "Administrator", ru: "Administrator — администратор" },
        tagline: { en: "Keep the place good", ru: "Следить за порядком" },
        text: {
          en: "Someone reads every application and every idea, publishes what is ready, grants organizer access, and keeps the standards of the place. Final approval rests here — that is what keeps the community a community.",
          ru: "Кто-то читает каждую заявку и каждую идею, публикует то, что готово, выдаёт доступ организаторам и следит за порядком. Последнее слово за ним — именно это и держит сообщество сообществом.",
        },
      },
    ],
  },

  steps: {
    eyebrow: { en: "The path", ru: "Путь" },
    title: { en: "From an idea to an adventure", ru: "От идеи до поездки" },
    items: [
      {
        name: { en: "Discover", ru: "Посмотреть" },
        text: {
          en: "Open the directions and find something that catches you.",
          ru: "Открыть направления и найти то, что зацепит.",
        },
      },
      {
        name: { en: "Subscribe", ru: "Подписаться" },
        text: {
          en: "Press + on a direction and hear about new trips there first.",
          ru: "Нажать «+» у направления и узнавать о новых поездках первым.",
        },
      },
      {
        name: { en: "Find your people", ru: "Найти своих" },
        text: {
          en: "Open a trip, read who is organising it and who is going.",
          ru: "Открыть поездку, прочитать, кто её ведёт и кто едет.",
        },
      },
      {
        name: { en: "Apply", ru: "Подать заявку" },
        text: {
          en: "Write a short introduction and send your application for a place.",
          ru: "Коротко рассказать о себе и отправить заявку на место.",
        },
      },
      {
        name: { en: "Get approved", ru: "Получить подтверждение" },
        text: {
          en: "Your application is read and your place confirmed by email.",
          ru: "Заявку читают, место подтверждают письмом.",
        },
      },
      {
        name: { en: "Go", ru: "Поехать" },
        text: {
          en: "Meet the others, sort out the details, and go and do it.",
          ru: "Познакомиться с остальными, обсудить детали и поехать.",
        },
      },
    ],
    orTitle: { en: "Or: start your own", ru: "Или: начните своё" },
    orText: {
      en: "If you have an idea, suggest it, apply to organise it, and bring your own people together.",
      ru: "Если идея ваша — предложите её, подайте заявку на организацию и соберите своих людей.",
    },
  },

  free: {
    eyebrow: { en: "No fees", ru: "Без денег" },
    title: {
      en: "A community, not a business.",
      ru: "Сообщество, а не бизнес.",
    },
    lead: {
      en: "Nazarov.net is free to join and free to take part in. The point is not to sell memberships or charge people for meeting each other — it is to take the barriers out from between people who want to do something interesting together.",
      ru: "В Nazarov.net бесплатно и вступить, и участвовать. Смысл не в том, чтобы продавать членство или брать деньги за знакомство, а в том, чтобы убрать преграды между людьми, которые хотят вместе сделать что-то интересное.",
    },
    items: {
      en: [
        "Free to look around.",
        "Free to subscribe to a direction.",
        "Free to apply for a place.",
        "Free to apply to organise.",
        "No paid tiers, no paid leads, nothing to buy to take part.",
      ],
      ru: [
        "Бесплатно смотреть.",
        "Бесплатно подписаться на направление.",
        "Бесплатно подать заявку на участие.",
        "Бесплатно подать заявку на организацию.",
        "Никаких платных уровней и платных контактов, ничего не нужно покупать, чтобы участвовать.",
      ],
    },
    note: {
      en: "A trip itself may of course cost money — transport, accommodation, equipment, tickets. Those costs belong to the trip and the organiser states them plainly.",
      ru: "Сама поездка, конечно, может стоить денег — дорога, жильё, снаряжение, билеты. Эти расходы относятся к поездке, и организатор называет их прямо.",
    },
    imageAlt: {
      en: "Yachts moored in a quiet bay at dusk",
      ru: "Яхты на стоянке в тихой бухте в сумерках",
    },
  },

  values: {
    eyebrow: { en: "Values", ru: "Ценности" },
    title: { en: "What we ask of each other", ru: "Чего мы ждём друг от друга" },
    items: [
      {
        name: { en: "Openness", ru: "Открытость" },
        text: {
          en: "Everyone deserves a chance to discover something and take part.",
          ru: "У каждого должна быть возможность что-то открыть для себя и поучаствовать.",
        },
      },
      {
        name: { en: "Initiative", ru: "Инициатива" },
        text: {
          en: "Do not wait for somebody else. Bring your idea.",
          ru: "Не ждите кого-то другого. Приносите свою идею.",
        },
      },
      {
        name: { en: "Respect", ru: "Уважение" },
        text: {
          en: "Different backgrounds, experiences and opinions make a community stronger.",
          ru: "Разный опыт, разное прошлое и разные взгляды делают сообщество сильнее.",
        },
      },
      {
        name: { en: "Responsibility", ru: "Ответственность" },
        text: {
          en: "Be honest about your experience, your intentions and what you commit to.",
          ru: "Честно говорите о своём опыте, намерениях и о том, на что подписываетесь.",
        },
      },
      {
        name: { en: "Curiosity", ru: "Любопытство" },
        text: {
          en: "Stay interested in the world and open to things you have not tried.",
          ru: "Сохраняйте интерес к миру и готовность попробовать новое.",
        },
      },
      {
        name: { en: "Collaboration", ru: "Совместность" },
        text: {
          en: "The good experiences are the ones everybody contributed to.",
          ru: "Удачными выходят те поездки, в которые вложился каждый.",
        },
      },
      {
        name: { en: "Positive energy", ru: "Настрой" },
        text: {
          en: "Bring enthusiasm, respect and a willingness to make things happen.",
          ru: "Приносите энтузиазм, уважение и готовность делать.",
        },
      },
    ],
  },

  terms: {
    eyebrow: { en: "Before you apply", ru: "Прежде чем подать заявку" },
    title: { en: "What you agree to", ru: "С чем вы соглашаетесь" },
    lead: {
      en: "By applying to take part in an activity, or to organise one, you agree to:",
      ru: "Подавая заявку на участие или на организацию, вы соглашаетесь:",
    },
    items: {
      en: [
        "Tell the truth about yourself.",
        "Treat the other participants with respect.",
        "Respect personal boundaries and differences.",
        "Follow the law and the safety requirements of the activity.",
        "Be honest about costs, experience and expectations.",
        "Respect the organiser's instructions and what was agreed.",
        "Avoid harassment, discrimination, fraud and inappropriate behaviour.",
        "Understand that taking part may involve risk.",
        "Take responsibility for your own decisions, fitness, equipment and participation.",
        "Understand that approval by Nazarov.net is not a guarantee of safety and not a professional certification of an organiser.",
      ],
      ru: [
        "Говорить о себе правду.",
        "Относиться к другим участникам с уважением.",
        "Уважать личные границы и различия.",
        "Соблюдать закон и требования безопасности для этого занятия.",
        "Честно говорить о расходах, опыте и ожиданиях.",
        "Выполнять указания организатора и соблюдать договорённости.",
        "Не допускать травли, дискриминации, обмана и неподобающего поведения.",
        "Понимать, что участие может быть связано с риском.",
        "Отвечать за свои решения, свою форму, своё снаряжение и своё участие.",
        "Понимать, что одобрение со стороны Nazarov.net не гарантирует безопасность и не является профессиональной аттестацией организатора.",
      ],
    },
    note: {
      en: "Nazarov.net is a place where people find each other and share opportunities. It is not automatically the operator, the travel agency, the instructor or the insurer of an activity that independent participants organise.",
      ru: "Nazarov.net — место, где люди находят друг друга и делятся возможностями. Он не является автоматически оператором, турагентством, инструктором или страховщиком того, что организуют сами участники.",
    },
  },

  closing: {
    title: {
      en: "One day it might be you who brings everyone together.",
      ru: "Однажды это вы соберёте остальных.",
    },
    paragraphs: {
      en: [
        "We all have places we want to see, mountains we want to ride, things we want to try and things we want to build. Sometimes all that is missing is the right people.",
        "You do not have to be an organiser. You do not have to be an expert. You do not have to know anyone. You can start by following one thing that interests you.",
      ],
      ru: [
        "У каждого есть места, куда хочется попасть, горы, которые хочется проехать, то, что хочется попробовать, и то, что хочется построить. Иногда не хватает только подходящих людей.",
        "Не обязательно быть организатором. Не обязательно быть экспертом. Не обязательно никого здесь знать. Можно начать с того, чтобы следить за одним интересным вам направлением.",
      ],
    },
    sign: {
      en: "Sail. Ride. Jump. Explore. Build. Together.",
      ru: "Паруса. Склоны. Небо. Открывать. Создавать. Вместе.",
    },
  },
};
