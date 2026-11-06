import type { SignInReason } from "@/lib/firebase/auth";
import type { AdminViewId } from "../views";

/**
 * Every word of the admin panel's interface, in English (ТЗ v4, §6, criterion
 * С-13).
 *
 * This file is the source of the shape: `AdminCopy` is `typeof EN`, so the
 * Russian file has to carry exactly the same keys or it fails to compile. That
 * is the whole reason the two languages are separate files rather than one file
 * of `{ en, ru }` pairs — a missing translation is a type error here, while in
 * a pairs file a `ru` left as the English text looks perfectly fine.
 *
 * Nothing in here is `as const`: the inferred types have to be `string` and
 * `(n: number) => string` for the Russian file to be assignable to them.
 *
 * What is *not* here: anything a visitor reads. Trip text, interest names and
 * people's bios stay bilingual in the database whatever language the panel is
 * in — the owner fills both in from either interface (§6.3), and the two
 * language switches are kept apart for that reason.
 */

const EN = {
  shell: {
    documentTitle: "Admin — nazarov.net",
    panel: "Control panel",
    menu: "Menu",
    interface: "Interface",
    interfaceLanguage: "Panel language",
    toSite: "Open the site",
    signOut: "Sign out",
    comingSoon: (item: string) => `This section arrives with plan item ${item}.`,
  },

  app: {
    loading: "Loading…",
    notOwner: (email: string) => `The account ${email} is not an owner of this site.`,
    notOwnerHow: (uid: string) =>
      `Sign in with the owner's account. If this is your account, it has to be ` +
      `added to the list of owners in the database — collection "owners", ` +
      `document with the id ${uid}.`,
    unreachable: "Could not reach the database.",
    unreachableHow:
      "Check your connection and reload the page. If that does not help, the " +
      "Firestore access rules may not have been published.",
  },

  signIn: {
    subtitle: "Site control panel",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
    failed: {
      invalidEmail: "That is not a valid email address.",
      invalidCredential: "Wrong email or password.",
      disabled: "This account has been disabled.",
      tooManyAttempts:
        "Too many sign-in attempts. Wait a few minutes and try again.",
      offline: "No connection to the server. Check your internet.",
      unknown: "Could not sign in. Please try again.",
    } satisfies Record<SignInReason, string>,
  },

  views: {
    trips: {
      label: "Trips",
      description: "Creating, publishing, the archive and announcement emails.",
    },
    interests: {
      label: "Directions",
      description: "The Sailing, Snowboarding, Skydiving and Son tabs, and new ones.",
    },
    people: {
      label: "People",
      description: "The crew directory: photo, role and bio in both languages.",
    },
    suggestions: {
      label: "Trip ideas",
      description: "Trips suggested by visitors: review, approve or decline.",
    },
    applications: {
      label: "Applications",
      description: "Applications to join a trip, and Solutions enquiries.",
    },
    subscribers: {
      label: "Subscribers",
      description: "Lists by direction, and a CSV export.",
    },
    settings: {
      label: "Settings",
      description: "Story, About, the Solutions copy, Calendly, counter thresholds.",
    },
  } satisfies Record<AdminViewId, { label: string; description: string }>,

  rebuild: {
    unconfigured:
      "The site does not update by itself — the Worker has no GitHub token.",
    updating: "The site is updating…",
    updated: (ago: string) => (ago ? `Site updated ${ago}.` : "Site updated."),
    failed: (ago: string) =>
      ago ? `The last site update failed ${ago}.` : "The last site update failed.",
    button: "Update the site",
    refused: "The site updated a moment ago — your changes are already on it.",
    /** "just now", "5 minutes ago"; empty when the time makes no sense. */
    ago: (seconds: number) => {
      if (seconds < 90) return "just now";
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
      const hours = Math.round(minutes / 60);
      if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
      const days = Math.round(hours / 24);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    },
  },

  field: {
    contentLanguage: "Content language",
    contentLanguageHint: "Which language of the text below you are editing",
    hasGaps: "has empty fields",
    empty: "not filled in",
    lineCount: (count: number) => `${count} ${count === 1 ? "line" : "lines"}`,
    up: "Move up",
    down: "Move down",
    remove: "Remove",
    noMoreThan: (max: number) => `No more than ${max} can be added.`,
    addBlock: "+ Add block",
    removeBlock: "Remove block",
    blockAbsent: "The block is absent — it will not appear on the trip page.",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    delete: "Delete",
    deleteConfirm: "Delete?",
    deleteYes: "Yes, delete",
    deleteNo: "No",
    toList: "Back to the list",
  },

  image: {
    compressing: "Compressing…",
    uploading: "Uploading…",
    replace: "Replace photo",
    upload: "Upload photo",
    clear: "Remove",
    showAddress: "enter an address instead",
    hideAddress: "hide the address",
    address: "Image address",
    addressHint:
      "For images that are already on the site. Ones uploaded with the button " +
      "above are filled in here automatically.",
    uploadFailed: (detail: string) => `Could not upload: ${detail}`,
    measuring: "Measuring the image…",
    stored: (size: string) =>
      `Uploaded, ${size}. A smaller copy is kept for cards and phones.`,
    linked: (size: string) =>
      `An image from the site, ${size}. It was not uploaded to storage and will not be deleted.`,
    advice:
      "From a phone you can take a photo or pick one from the gallery. Photos " +
      "are resized and compressed before uploading.",
  },

  trips: {
    loading: "Loading the trips…",
    notFound: "Trip not found.",
    noInterests:
      "Set up at least one direction first — a trip has to belong somewhere.",
    toInterests: "Go to directions",
    create: "New trip",
    none: "No trips yet.",
    showing: (shown: number, total: number) => `Showing ${shown} of ${total}.`,
    untitled: "Untitled",
    noInterest: "no direction set",
    filterStatus: "Status",
    filterInterest: "Direction",
    statuses: {
      all: "All",
      draft: "Drafts",
      published: "Published",
      past: "Past",
      archived: "Archive",
    },
    badges: {
      archived: "archived",
      past: "past",
      published: "published",
      draft: "draft",
      kidFriendly: "with kids",
      hiddenInPast: "hidden among past",
    },
    booking: {
      open: "open for booking",
      fewSpots: "few spots left",
      soldOut: "sold out",
      completed: "completed",
    },
    edit: "Edit",
    duplicate: "Duplicate",
    archive: "Archive",
    restore: "Restore",
    duplicated:
      "A copy was created as a draft. Its photos are the same files, shared with the original.",
    restoredLive: "The trip is back on the site.",
    restoredDraft: "The trip is back in drafts.",
    archived: "The trip was taken off the site into the archive.",
    emptyFilter: "No trips match this filter.",
    showAll: "Show all",
    loadFailed: (detail: string) => `Could not load the trips: ${detail}`,
  },

  tripForm: {
    edit: "Edit trip",
    create: "New trip",
    live: "published",
    contents: "Blocks",
    backup: "Last time, this trip was left unsaved.",
    backupRestore: "Restore it",
    backupDiscard: "Not needed",
    missing: "Missing before it can be published",
    missingNone: "Everything required is filled in — the trip can be published.",
    worthFinishing: "Worth finishing",
    saveChanges: "Save changes",
    saveDraft: "Save draft",
    publish: "Publish",
    unpublish: "Unpublish",
    preview: "Preview",
    discard: "Discard changes",
    back: "Back",
    deleteConfirm: "Delete this trip?",
    saveFailed: (detail: string) => `Could not save: ${detail}`,

    basics: { title: "The basics", subtitle: "The first screen of the trip page." },
    interest: "Direction",
    interestPlaceholder: "Choose a direction…",
    name: "Trip title",
    subtitle: "Subtitle",
    startDate: "Start date",
    startDateHint: "In the form 2026-11-12.",
    endDate: "End date",
    endDateHint: "After it the trip moves into Past by itself.",
    place: "Place",

    seats: {
      title: "Status and seats",
      subtitle: "Shown on the card and on the trip page.",
    },
    bookingStatus: "Booking status",
    bookingStatusHint:
      "After the end date the status becomes Completed by itself; there is no need to change it by hand.",
    totalSeats: "Seats in total",
    seatsLeft: "Seats left",
    going: "How many people are going",
    goingHint:
      "Left empty, it is counted as total seats minus seats left. Fill it in to set your own number.",

    gallery: {
      title: "First-screen photos",
      subtitle:
        "Three to ten photos. The last slide is usually the map. The cover is the one shown on the trip card and in a link preview.",
    },
    galleryPhoto: (index: number) => `Photo ${index}`,
    galleryCover: (index: number) => `Photo ${index} · cover`,
    galleryAdd: "Add a photo",
    galleryEmpty: "No photos yet. A trip cannot be published with fewer than three.",
    photoAddress: "Photo address",
    photoAlt: "Description for screen readers and for search",
    makeCover: "Make this the cover",

    price: { title: "Price", subtitle: "On the site this block is headed “Price”." },
    priceAmount: "Amount",
    priceAmountHint:
      "Plain text rather than a number: “$3,500” and “3500 $” are written differently.",
    priceIncluded: "What the price includes",
    priceIncludedHint: "One item per line.",
    priceNotIncluded: "What it does not include",

    placeBlock: {
      title: "The place",
      subtitle: "On the site this block is headed “The place”. Two to four paragraphs.",
    },
    placeParagraphs: "Description of the place",
    placeParagraphsHint: "No blank lines needed — one paragraph per line.",

    audience: {
      title: "Who it suits",
      subtitle: "On the site this block is headed “Is this trip for you?”.",
    },
    audienceItems: "List items",
    note: "Note",

    whatYouGet: {
      title: "What you get",
      subtitle: "On the site this block is headed “What you get”. One to six cards.",
    },
    howToPrepare: {
      title: "How to prepare",
      subtitle: "On the site this block is headed “How to prepare”.",
    },
    card: (index: number) => `Card ${index}`,
    cardAdd: "Add a card",
    cardsEmpty: "No cards yet.",
    cardTitle: "Heading",
    cardText: "Text",

    program: {
      title: "Programme by stage",
      subtitle: "On the site this block is headed “Program”.",
    },
    stage: (index: number) => `Stage ${index}`,
    stageAdd: "Add a stage",
    stagesEmpty: "No stages yet.",
    stageDuration: "How long",
    stagePlace: "Place",
    stageText: "Description",
    programNote: "Note on the programme",

    route: {
      title: "Day by day",
      subtitle: "On the site this block is headed “Day by day”.",
    },
    routeIntro: "Introduction",
    day: (index: number) => `Day ${index}`,
    dayAdd: "Add a day",
    daysEmpty: "No days yet.",
    dayDate: "Date, as it should be shown",
    dayDateHint: "Plain text: the month is written differently in English and Russian.",
    dayPlace: "Place",
    dayText: "What happens that day",
    dayPhoto: "Photo of the day",

    map: {
      title: "Map",
      subtitle:
        "On the site this block is headed “Route map”. Pictures of the route and, if needed, a point on the map.",
    },
    mapImage: (index: number) => `Picture ${index}`,
    mapImageAdd: "Add a picture",
    mapImagesEmpty: "No pictures yet.",
    mapImageAddress: "Picture address",
    mapCaption: "Caption under the map",
    latitude: "Latitude",
    longitude: "Longitude",

    media: {
      title: "Photos and videos",
      subtitle: "On the site this block is headed “Photos & videos”.",
    },
    mediaPhotosEmpty: "No photos yet.",
    video: (index: number) => `Video ${index}`,
    videoAdd: "Add a video",
    videosEmpty: "No video links yet.",
    videoUrl: "YouTube link",

    crew: {
      title: "Crew",
      subtitle:
        "On the site this block is headed “Your crew”. People come from the directory; there is no need to type them in again.",
    },
    crewNoDirectory:
      "The directory is empty. Add people in the People section — after that they can be put on any trip.",
    crewNobody: "Nobody added.",
    crewAdd: "Add from the directory",
    crewChoose: "Choose a person…",

    rules: {
      title: "Format and rules",
      subtitle: "On the site this block is headed “Rules & safety”.",
    },
    rulesTitle: "Heading",
    rulesText: "Text",

    faq: {
      title: "Questions and answers",
      subtitle: "On the site this block is headed “FAQ”. With no pairs, the block does not appear.",
    },
    question: (index: number) => `Question ${index}`,
    questionAdd: "Add a question",
    questionsEmpty: "No questions yet.",
    faqQuestion: "Question",
    faqAnswer: "Answer",

    flags: {
      title: "Flags and address",
      subtitle: "Housekeeping — this block does not exist on the trip page.",
    },
    slug: "Page address",
    kidFriendly: "Children welcome (kid-friendly)",
    kidFriendlyHint:
      "The trip gets a “Kids welcome” mark, the application form gains a question about children, and it appears on the Son tab.",
    kidAgeFrom: "Children's age, from",
    kidAgeTo: "Children's age, to",
    organizer: "Organizer's email",
    organizerHint:
      "Who, besides you, this trip is open to. Filled in by itself when the " +
      "trip was made from an idea. Access to the panel for that person arrives " +
      "with plan item 2.6.",
    fromIdea: "Made from an idea sent through the site.",
    showInPast: "Show among past trips",
    showInPastHint:
      "Switched off, the trip will not appear in this tab's “Past trips” block once it is over.",

    social: {
      title: "For social networks",
      subtitle:
        "The heading and description shown when the link is sent in Facebook, Telegram or WhatsApp.",
    },
    socialTitle: "Preview heading",
    socialTitleHint: "Left empty, the trip's title is used.",
    socialDescription: "Preview description",
    socialDescriptionHint: "Left empty, the subtitle is used.",

    bookingLabels: {
      open: "Open for booking",
      fewSpots: "Few spots left",
      soldOut: "Sold out",
      completed: "Completed",
    },
  },

  preview: {
    banner: "Preview — this is how visitors will see the trip.",
    draft: "A draft; it is not on the site yet.",
    back: "Back to the form",
  },

  interests: {
    loading: "Loading the directions…",
    notFound: "Direction not found",
    create: "New direction",
    none: "No directions yet.",
    count: (total: number) =>
      `Directions: ${total}. The order here is the order in the site's menu.`,
    hidden: "hidden from the site",
    noPast: "no past trips",
    inSuggestForm: "in the idea form",
    isOther: "“Other” category",
    collector: "gathers trips with children",
    edit: "Edit",
    editTitle: "Edit direction",
    createTitle: "New direction",
    name: "Tab name",
    nameHint:
      "By §16 of the spec the tabs are named in English in both language versions — but the Russian field is here if you want otherwise.",
    slug: "Tab address",
    slugHint: (slug: string) =>
      `The page will be at nazarov.net/${slug}/ and nazarov.net/ru/${slug}/`,
    caption: "Caption under the home-page section",
    description: "Description of the tab",
    cover: "Tab cover",
    order: "Order in the menu",
    orderHint: "Lower is further left in the “MY INTERESTS” block and higher on the home page.",
    playlist: "YouTube playlist",
    playlistHint: "Optional. Videos from this playlist appear on the tab's page.",
    showPast: "Show past trips",
    showPastHint:
      "Switched off, this tab has no “Past trips” block at all, even when there are past trips.",
    hide: "Hide the tab from the site",
    hideHint:
      "The tab disappears from the menu and the home page, but the trips survive and come back with it.",
    collects: "Gather trips with children from other tabs",
    suggestable: "Offer in the Suggest an Adventure form",
    suggestableHint:
      "Independent of the tab being visible. A direction can be suggestable " +
      "before it has a single trip — a tab with nothing under it is worse " +
      "than no tab.",
    suggestOther: "This is the “Other” category",
    suggestOtherHint:
      "Whoever picks it is asked to name their own category. Usually only one " +
      "direction has this.",
    collectsHint:
      "This is how the Son tab works: it shows every trip marked kid-friendly. They are the same trips, not copies.",
    loadFailed: (detail: string) => `Could not load the directions: ${detail}`,
    saveFailed: (detail: string) => `Could not save: ${detail}`,
    deleteFailed: (detail: string) => `Could not delete: ${detail}`,
  },

  people: {
    loading: "Loading the directory…",
    notFound: "Person not found.",
    create: "New person",
    none: "Nobody yet. People from the directory can be put on any trip without typing them in again.",
    count: (total: number) =>
      `People: ${total}. They can be put on any trip without typing them in again.`,
    unnamed: "No name",
    edit: "Edit",
    editTitle: "Edit person",
    createTitle: "New person",
    name: "Name",
    role: "Role",
    roleHint: "How the person is captioned in the “Your crew” block of a trip page.",
    bio: "Bio",
    photo: "Photo",
    loadFailed: (detail: string) => `Could not load the directory: ${detail}`,
    saveFailed: (detail: string) => `Could not save: ${detail}`,
    deleteFailed: (detail: string) => `Could not delete: ${detail}`,
  },

suggestions: {
    loading: "Loading the ideas…",
    none: "No ideas yet. They arrive through the Suggest an Adventure form on the site.",
    count: (total: number, fresh: number) =>
      fresh > 0 ? `Ideas: ${total}, of them ${fresh} unread.` : `Ideas: ${total}.`,
    notFound: "Idea not found.",
    emptyFilter: "No ideas with this status.",
    showAll: "Show all",
    untitled: "Untitled idea",
    noDirection: "direction not set",
    filterStatus: "Status",
    statuses: {
      all: "All",
      new: "New",
      underReview: "Under review",
      needsInfo: "Needs info",
      approved: "Approved",
      published: "Published",
      declined: "Declined",
    },
    open: "Open",
    back: "Back to the list",
    received: (when: string) => `Received ${when}`,
    sentIn: (language: string) => `Filled in on the ${language} site`,
    languages: { en: "English", ru: "Russian" },

    idea: "The idea",
    author: "Who sent it",
    category: "Category",
    otherCategory: "Their own category",
    description: "The idea",
    place: "Destination",
    when: "When",
    budget: "Budget per person",
    groupSize: "Group size",
    experienceLevel: "Experience level",
    levels: {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      allLevels: "All levels",
    },
    name: "Name",
    email: "Email",
    links: "Social links",
    experience: "Their experience organizing",
    audience: "Who they want to bring together",
    photoLinks: "Photos and references",
    source: "Sent from",
    empty: "— not filled in —",

    decision: "What to do with it",
    status: "Status",
    note: "Note to yourself",
    noteHint: "Only you see it. The author never does.",
    saveNote: "Save the note",
    noteSaved: "Note saved.",
    statusChanged: "Status changed.",

    createTrip: "Create a trip from this idea",
    createTripHint:
      "Makes a draft with the fields carried across, in the language it was written in. " +
      "The other language, the dates and the photos are still yours to fill in.",
    creating: "Creating…",
    openTrip: "Open the trip",
    alreadyCreated: "A trip has already been made from this idea.",
    created: "A draft was created. The idea is now marked approved.",

    deleteIdea: "Delete the idea",
    deleteConfirm: "Delete this idea? It cannot be brought back.",

    loadFailed: (detail: string) => `Could not load the ideas: ${detail}`,
    saveFailed: (detail: string) => `Could not save: ${detail}`,
    createFailed: (detail: string) => `Could not create the trip: ${detail}`,
  },

  error: {
    permissionDenied:
      "the database refused access — either the Firestore rules have not been " +
      "published, or this account is not in the list of owners.",
  },
};

export type AdminCopy = typeof EN;

export default EN;
