export type QuestionType = "continuous_slider" | "money_slider" | "binary";

export type QuestionId =
  | "floor_money"
  | "assistant_pay"
  | "assistant_salary"
  | "aux"
  | "honesty"
  | "fry"
  | "ai"
  | "irish_exit"
  | "vacation_destination"
  | "smart_button"
  | "move_help"
  | "phone_price"
  | "robot"
  | "revenge"
  | "history_sharing"
  | "song_lyrics";

/** A person referenced inside a generated sentence. */
export interface Subject {
  name: string;
  /** True when the subject is the viewer ("You"). Used for verb agreement. */
  you: boolean;
}

/** Pick the right verb form: v(s, "believes", "believe"). */
export const v = (s: Subject, third: string, second: string) => (s.you ? second : third);

export interface Question {
  id: QuestionId;
  category: string;
  /** Short label used in cards, stats and comparisons. */
  shortTitle: string;
  text: string;
  leftLabel: string;
  rightLabel: string;
  type: QuestionType;
  /** Money sliders only: dollar values at evenly spaced slider positions. */
  stops?: number[];
  /** Money sliders only: suffix such as "/year". */
  unit?: string;
  /** Five live captions for 0–20, 21–40, 41–60, 61–80, 81–100. */
  descriptors: [string, string, string, string, string];
  /** Five party-wide captions for the median, same ranges. */
  partyCaptions: [string, string, string, string, string];
  /** Emoji shown next to the slider for each range. */
  moods: [string, string, string, string, string];
  /** Funny one-liners about the answerer, used in the avatar reveal. */
  observations: { low: string; high: string };
  /** Which dimensions this question feeds (documentation + weighting sanity). */
  avatarWeights: Partial<Record<string, number>>;
  /** hi = the person with the higher slider value, lo = the lower one. */
  conversationTemplate: (hi: Subject, lo: Subject) => string;
  /** Money sliders only: caption for the person who would pay/require more. */
  moneyGapTemplate?: (hi: Subject, lo: Subject) => string;
}

export const QUESTIONS: Question[] = [
  {
    id: "floor_money",
    category: "Morality",
    shortTitle: "$20 on the floor",
    text: "You find $20 on the floor at the party. How hard are you trying to find the owner?",
    leftLabel: "Finders keepers",
    rightLabel: "I'm launching an investigation",
    type: "continuous_slider",
    descriptors: [
      "It's mine now. It was always mine.",
      "I'll glance around. Briefly.",
      "One loud \"anyone drop a twenty?\"",
      "Door-to-door interviews.",
      "Fingerprints. Timeline. Suspects.",
    ],
    partyCaptions: [
      "This party is a pickpocket's paradise.",
      "Half-hearted honesty is the house style.",
      "One announcement and then it's dinner money.",
      "Lost cash has a decent shot of coming home.",
      "Somebody here has already set up a lost-and-found table.",
    ],
    moods: ["😏", "👀", "🤷", "🕵️", "🔍"],
    observations: {
      low: "Found money is legally yours, apparently.",
      high: "Would run a full investigation over $20.",
    },
    avatarWeights: { conscientiousness: 0.3, minorNormConcern: 0.33 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} ${v(hi, "would", "would")} launch an investigation over $20 on the floor. ${lo.name} ${v(lo, "has", "have")} already spent it.`,
  },
  {
    id: "assistant_pay",
    category: "Money",
    shortTitle: "Personal assistant",
    text: "How much would you pay PER YEAR for a full-time personal assistant who handles your scheduling, reservations, errands, emails, paperwork, and life admin?",
    leftLabel: "I have Google Calendar",
    rightLabel: "Run my entire life",
    type: "money_slider",
    stops: [0, 1000, 2500, 5000, 10000, 20000, 35000, 50000, 75000, 100000],
    unit: "/year",
    descriptors: [
      "I have Google Calendar and a dream.",
      "A few errands would be nice.",
      "Please answer my emails.",
      "Handle everything. I'll be at the pool.",
      "Run my entire life. Don't tell me the details.",
    ],
    partyCaptions: [
      "This party runs on Google Calendar and denial.",
      "Everyone wants help, nobody wants the invoice.",
      "Emails are apparently worth real money here.",
      "This crowd is one bonus away from staff.",
      "Someone here is actively hiring.",
    ],
    moods: ["📅", "📝", "📧", "🛎️", "👔"],
    observations: {
      low: "Refuses to outsource life admin.",
      high: "Would pay serious money to never see an email again.",
    },
    avatarWeights: { luxury: 1 },
    conversationTemplate: (hi, lo) =>
      `You two value a personal assistant VERY differently. ${hi.name} ${v(hi, "is", "are")} ready to hire. ${lo.name} ${v(lo, "has", "have")} a calendar app.`,
    moneyGapTemplate: (hi) =>
      hi.you ? "Apparently you really hate scheduling." : `Apparently ${hi.name} really hates scheduling.`,
  },
  {
    id: "assistant_salary",
    category: "Money",
    shortTitle: "Becoming the assistant",
    text: "What's the MINIMUM salary someone would need to pay you to become their full-time personal assistant?",
    leftLabel: "Sure, boss",
    rightLabel: "You cannot afford me",
    type: "money_slider",
    stops: [20000, 40000, 60000, 80000, 100000, 150000, 250000, 500000, 1000000],
    unit: "/year",
    descriptors: [
      "Sure, boss. When do I start?",
      "I'd need a decent chair.",
      "Market rate, plus dignity.",
      "That's a lot of other people's emails.",
      "You cannot afford me.",
    ],
    partyCaptions: [
      "This party is surprisingly hireable.",
      "Reasonable people with reasonable rates.",
      "Nobody here works for free.",
      "The going rate for dignity is steep.",
      "Everyone here thinks they're a CEO.",
    ],
    moods: ["🫡", "🪑", "💼", "😤", "👑"],
    observations: {
      low: "Would be someone's assistant for suspiciously little.",
      high: "Charges a small fortune to answer someone else's emails.",
    },
    avatarWeights: { independencePrice: 0.5, confidence: 0.33 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} ${v(hi, "wants", "want")} a fortune to be someone's assistant. ${lo.name} ${v(lo, "is", "are")} basically available now.`,
    moneyGapTemplate: (hi) =>
      hi.you ? "You have a very high opinion of your time." : `${hi.name} has a very high opinion of their time.`,
  },
  {
    id: "aux",
    category: "Party",
    shortTitle: "Aux takeover",
    text: "Someone has been playing terrible music for 30 minutes. How justified are you in taking control of the aux?",
    leftLabel: "Suffer respectfully",
    rightLabel: "This is now a rescue operation",
    type: "continuous_slider",
    descriptors: [
      "Suffer respectfully. Their house, their noise.",
      "Passive-aggressive song requests.",
      "A polite coup after the next song.",
      "The aux is public property now.",
      "This is a rescue operation.",
    ],
    partyCaptions: [
      "Whoever has the aux right now is safe. Forever.",
      "Bad playlists are tolerated, quietly.",
      "The aux is on a thirty-minute probation.",
      "The aux is basically a shared resource here.",
      "Nobody's playlist is safe tonight.",
    ],
    moods: ["🎧", "😬", "🎵", "🎚️", "🚨"],
    observations: {
      low: "Will suffer through any playlist respectfully.",
      high: "Treats the aux like a rescue operation.",
    },
    avatarWeights: { chaos: 0.2, socialEnergy: 0.3, intervention: 0.33 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} ${v(hi, "sees", "see")} a bad playlist as a rescue operation. ${lo.name} ${v(lo, "suffers", "suffer")} respectfully. Decide who controls the aux tonight.`,
  },
  {
    id: "honesty",
    category: "Friendship",
    shortTitle: "Friend's terrible idea",
    text: "Your friend is extremely excited about an obviously terrible idea. How brutally honest are you?",
    leftLabel: "Support their journey",
    rightLabel: "Immediate intervention",
    type: "continuous_slider",
    descriptors: [
      "Support their journey. It's their life.",
      "\"Interesting!\" (It is not.)",
      "Gentle questions. Tactful honesty.",
      "A very direct conversation.",
      "Immediate intervention. Sit down.",
    ],
    partyCaptions: [
      "Terrible ideas thrive here. Nobody will stop you.",
      "Friends will nod. Friends will not warn you.",
      "Expect gentle, tactful honesty.",
      "Bring your terrible idea, get a direct answer.",
      "This party runs an intervention hotline.",
    ],
    moods: ["🥹", "🙂", "🤔", "😐", "🛑"],
    observations: {
      low: "Will support any terrible idea with a straight face.",
      high: "Stages immediate interventions for bad ideas.",
    },
    avatarWeights: { socialEnergy: 0.3, intervention: 0.33, loyalty: 0.25 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} ${v(hi, "stages", "stage")} interventions for bad ideas. ${lo.name} ${v(lo, "cheers", "cheer")} them on. One of you is an enabler.`,
  },
  {
    id: "fry",
    category: "Food",
    shortTitle: "Stealing one fry",
    text: "How acceptable is stealing ONE fry from a close friend's plate without asking?",
    leftLabel: "War crime",
    rightLabel: "Basically communal property",
    type: "continuous_slider",
    descriptors: [
      "War crime.",
      "Ask first.",
      "Depends how hungry I am.",
      "Fair game.",
      "Those fries belong to the people.",
    ],
    partyCaptions: [
      "Guard your plate. This party takes fries seriously.",
      "Fries are private property, with permits.",
      "Fries are semi-public property.",
      "One fry is a tax, not a theft.",
      "All fries at this party belong to the people.",
    ],
    moods: ["⚖️", "🙏", "🍟", "😋", "🫳"],
    observations: {
      low: "Suspiciously protective of other people's fries.",
      high: "Believes fries belong to the collective.",
    },
    avatarWeights: { chaos: 0.2, minorNormConcern: 0.33, boundaryRespect: 0.3 },
    conversationTemplate: (hi, lo) =>
      `You two need to discuss fry ownership. ${hi.name} ${v(hi, "thinks", "think")} fries are communal. ${lo.name} ${v(lo, "considers", "consider")} it a war crime.`,
  },
  {
    id: "ai",
    category: "Tech",
    shortTitle: "AI delegation",
    text: "How much of your life would you let a highly capable AI handle for you?",
    leftLabel: "Set a timer, maybe",
    rightLabel: "Here's my email, calendar, taxes, and life plan",
    type: "continuous_slider",
    descriptors: [
      "Set a timer. Maybe. Supervised.",
      "Draft the email, I'll hit send.",
      "Calendar and errands, nothing important.",
      "Taxes too. What's the worst that could happen?",
      "Here's my email, calendar, taxes, and life plan.",
    ],
    partyCaptions: [
      "The AI here is allowed to set timers. That's it.",
      "AI can draft, humans hit send.",
      "AI handles the boring half of life here.",
      "This party has quietly handed over the taxes.",
      "The AI is running this party's lives. Nobody minds.",
    ],
    moods: ["⏲️", "✍️", "📆", "🧾", "🤖"],
    observations: {
      low: "AI gets limited permissions.",
      high: "Would hand an AI the entire life plan.",
    },
    avatarWeights: { techDelegation: 0.5 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} would let an AI run ${hi.you ? "your" : "their"} entire life. ${lo.name} ${v(lo, "lets", "let")} it set a timer, supervised.`,
  },
  {
    id: "irish_exit",
    category: "Party",
    shortTitle: "Leaving without goodbye",
    text: "How socially acceptable is leaving a party without saying goodbye to anyone?",
    leftLabel: "Absolutely criminal",
    rightLabel: "The Irish exit is an art form",
    type: "continuous_slider",
    descriptors: [
      "Absolutely criminal. Say goodbye to everyone.",
      "At least text the host.",
      "Fine if it's late and nobody notices.",
      "Goodbyes take 40 minutes. No.",
      "The Irish exit is an art form.",
    ],
    partyCaptions: [
      "Expect a 40-minute goodbye lap tonight.",
      "Leaving requires at least a text.",
      "Quiet exits are tolerated after midnight.",
      "People will vanish. It's fine.",
      "This party will simply evaporate around 1 AM.",
    ],
    moods: ["🚔", "📱", "🤫", "🏃", "👻"],
    observations: {
      low: "Personally offended by Irish exits.",
      high: "Would absolutely Irish exit.",
    },
    avatarWeights: { chaos: 0.2, socialEnergy: -0.25, minorNormConcern: 0.33 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} ${v(hi, "believes", "believe")} Irish exits are an art form. ${lo.name} ${v(lo, "appears", "appear")} personally offended.`,
  },
  {
    id: "vacation_destination",
    category: "Travel",
    shortTitle: "New York or California",
    text: "You get a week off and a free trip. Where are you going: New York or California?",
    leftLabel: "New York",
    rightLabel: "California",
    type: "binary",
    descriptors: [
      "New York. Save me a slice.",
      "New York. Save me a slice.",
      "Two destinations. One ticket. Pick a side.",
      "California. Road-trip playlist ready.",
      "California. Road-trip playlist ready.",
    ],
    partyCaptions: [
      "This crowd is booking flights to New York.",
      "New York has the edge in the group chat.",
      "The room is split between New York and California.",
      "California has the edge in the group chat.",
      "This crowd is California-bound.",
    ],
    moods: ["🗽", "🗽", "🧳", "🌴", "🌴"],
    observations: {
      low: "Already planning the New York food tour.",
      high: "Has mentally booked a California road trip.",
    },
    avatarWeights: { lowStakesOpinions: 1 / 6 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} ${v(hi, "is", "are")} California-bound. ${lo.name} ${v(lo, "is", "are")} booking New York. Good luck choosing a trip together.`,
  },
  {
    id: "smart_button",
    category: "Hypothetical",
    shortTitle: "The 20% smarter button",
    text: "A button makes you 20% smarter but also 20% more annoying. How likely are you to press it?",
    leftLabel: "Absolutely not",
    rightLabel: "Pressing it before you finish the question",
    type: "continuous_slider",
    descriptors: [
      "Absolutely not. People already tolerate me.",
      "Only if there's an undo.",
      "Let me think about it for a week.",
      "The annoying part sounds like other people's problem.",
      "Already pressed it. Twice.",
    ],
    partyCaptions: [
      "This party values being liked over being right.",
      "Everyone wants an undo button first.",
      "The room is split on brains vs. bearability.",
      "This party has decided annoying is a feature.",
      "Everyone here is 20% smarter and you can tell.",
    ],
    moods: ["🙅", "↩️", "🧐", "😏", "🧠"],
    observations: {
      low: "Refuses free intelligence to stay likeable.",
      high: "Pressed the annoying button without hesitation.",
    },
    avatarWeights: { chaos: 0.2, competitiveness: 0.3 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} pressed the 20%-more-annoying button before the question ended. ${lo.name} ${v(lo, "refuses", "refuse")} on principle.`,
  },
  {
    id: "move_help",
    category: "Friendship",
    shortTitle: "Helping a friend move",
    text: "Your friend asks you to help them move at 8 AM on a Saturday. How morally obligated do you feel to show up?",
    leftLabel: "I suddenly have no phone",
    rightLabel: "I'm bringing boxes",
    type: "continuous_slider",
    descriptors: [
      "I suddenly have no phone.",
      "I'll \"try to make it\" (I won't).",
      "Fine, but I'm arriving at 10.",
      "I'll be there. Coffee first.",
      "I'm bringing boxes and a dolly.",
    ],
    partyCaptions: [
      "Nobody at this party is helping you move.",
      "Expect a lot of \"I'll try to make it.\"",
      "People will show up. Around 10.",
      "This is a reliable crowd. Bring coffee.",
      "This party owns multiple dollies.",
    ],
    moods: ["📵", "😅", "☕", "🫡", "📦"],
    observations: {
      low: "Mysteriously unreachable on moving day.",
      high: "Shows up at 8 AM with boxes.",
    },
    avatarWeights: { conscientiousness: 0.25, loyalty: 0.5 },
    conversationTemplate: (hi, lo) =>
      `${lo.name} apparently ${v(lo, "considers", "consider")} skipping an 8 AM moving appointment morally acceptable. ${hi.name} ${v(hi, "is", "are")} bringing boxes.`,
  },
  {
    id: "phone_price",
    category: "Money",
    shortTitle: "Phone-free year",
    text: "How much money would someone have to pay you to give up your smartphone for one full year?",
    leftLabel: "Honestly, take it",
    rightLabel: "My phone is apparently priceless",
    type: "money_slider",
    stops: [0, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000],
    descriptors: [
      "Honestly, take it. Free me.",
      "A decent vacation's worth.",
      "I'd need real compensation for the group chats.",
      "This is a life-altering amount.",
      "My phone is apparently priceless.",
    ],
    partyCaptions: [
      "This party would hand over their phones for a sandwich.",
      "Phones are worth about one vacation here.",
      "Losing the group chat is priced like a small car.",
      "This party is very attached to its notifications.",
      "Nobody here is giving up their phone. Ever.",
    ],
    moods: ["🕊️", "🏝️", "💬", "💸", "📱"],
    observations: {
      low: "Would give up the phone for pocket change.",
      high: "Values the phone like a house.",
    },
    avatarWeights: { independencePrice: 0.5 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} ${v(hi, "needs", "need")} a fortune to give up ${hi.you ? "your" : "their"} phone for a year. ${lo.name} would do it for a nice weekend.`,
    moneyGapTemplate: () => "One of you is much more attached.",
  },
  {
    id: "robot",
    category: "Tech",
    shortTitle: "Robot housekeeper",
    text: "How comfortable would you be letting a humanoid robot live in your home and handle chores while you're away?",
    leftLabel: "Absolutely not",
    rightLabel: "Here's a key",
    type: "continuous_slider",
    descriptors: [
      "Absolutely not. I've seen the movies.",
      "It can vacuum. While I watch.",
      "Chores, yes. Bedroom door stays locked.",
      "Sure. It seems nice.",
      "Here's a key. Feed the cat.",
    ],
    partyCaptions: [
      "This party has seen the movies. No robots.",
      "Robots may vacuum, under supervision.",
      "Robots are welcome in the kitchen, not the bedroom.",
      "This party trusts robots more than roommates.",
      "This party has already given the robot a key.",
    ],
    moods: ["🎬", "🧹", "🔒", "🙂", "🔑"],
    observations: {
      low: "Would barely let a robot inside.",
      high: "Would hand a humanoid robot the house keys.",
    },
    avatarWeights: { techDelegation: 0.5 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} would hand a humanoid robot the house keys. ${lo.name} would barely let it inside.`,
  },
  {
    id: "revenge",
    category: "Petty conflict",
    shortTitle: "Petty revenge",
    text: "A friend eats the food you specifically told them you were saving. How justified are you in doing something petty in return?",
    leftLabel: "Forgive and forget",
    rightLabel: "This requires consequences",
    type: "continuous_slider",
    descriptors: [
      "Peace was always an option.",
      "I'm annoyed.",
      "Noted for future reference.",
      "Justice will be proportional.",
      "They started this.",
    ],
    partyCaptions: [
      "A forgiving crowd. Your leftovers are not safe, though.",
      "People will be annoyed. Quietly.",
      "Everything is being noted for future reference.",
      "Justice at this party is proportional.",
      "Label your food. Consequences are real here.",
    ],
    moods: ["🕊️", "😒", "📝", "⚖️", "😈"],
    observations: {
      low: "Forgives food theft instantly. Suspicious.",
      high: "Believes petty revenge is justice.",
    },
    avatarWeights: { chaos: 0.2, competitiveness: 0.4, minorNormConcern: 0.2 },
    conversationTemplate: (hi, lo) =>
      `One of you believes petty revenge is justice. (It's ${hi.you ? "you" : hi.name}.) ${lo.name} ${v(lo, "would", "would")} forgive and forget.`,
  },
  {
    id: "history_sharing",
    category: "Digital life",
    shortTitle: "YouTube or ChatGPT history",
    text: "Hypothetically, which would you feel more comfortable showing your friends: your YouTube watch history or your ChatGPT query history?",
    leftLabel: "YouTube watch history",
    rightLabel: "ChatGPT query history",
    type: "continuous_slider",
    descriptors: [
      "YouTube, easily. The prompts stay private.",
      "I'd rather explain my recommendations.",
      "Equally comfortable. Or equally uncomfortable.",
      "I'd rather explain my prompts.",
      "ChatGPT, easily. The watch history stays private.",
    ],
    partyCaptions: [
      "YouTube histories are winning this hypothetical show-and-tell.",
      "This crowd would rather explain its recommendations.",
      "The room is torn about which history to share.",
      "This crowd would rather explain its prompts.",
      "ChatGPT histories are winning this hypothetical show-and-tell.",
    ],
    moods: ["📺", "🍿", "🤔", "💬", "🤖"],
    observations: {
      low: "Would sooner reveal the YouTube rabbit holes than the ChatGPT prompts.",
      high: "Would sooner reveal the ChatGPT prompts than the YouTube rabbit holes.",
    },
    avatarWeights: { extremity: 1 / 12, variance: 1 / 12 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} would rather share ${hi.you ? "your" : "their"} ChatGPT history. ${lo.name} would rather share ${lo.you ? "your" : "their"} YouTube history. Which one needs more explaining?`,
  },
  {
    id: "song_lyrics",
    category: "Music",
    shortTitle: "Knowing the lyrics",
    text: "When your favorite songs come on, how well do you know the lyrics?",
    leftLabel: "Just vibes and made-up words",
    rightLabel: "Every lyric, even the ad-libs",
    type: "continuous_slider",
    descriptors: [
      "The melody is right. The words are original.",
      "A few words, a lot of confidence.",
      "The chorus is covered. The verses? Maybe.",
      "Most verses, choruses, and dramatic pauses.",
      "Every lyric. Every ad-lib. No subtitles needed.",
    ],
    partyCaptions: [
      "Original lyrics only. The artist would be surprised.",
      "This crowd sings with more confidence than accuracy.",
      "The chorus is safe. The verses are a group project.",
      "Most of this room could carry karaoke night.",
      "This party is a walking lyrics database.",
    ],
    moods: ["🎶", "😅", "🎵", "🎤", "🌟"],
    observations: {
      low: "Knows the vibe. Invents the lyrics.",
      high: "Comes with built-in lyrics and all the ad-libs.",
    },
    avatarWeights: { extremity: 1 / 12, variance: 1 / 12 },
    conversationTemplate: (hi, lo) =>
      `${hi.name} ${v(hi, "knows", "know")} every lyric. ${lo.name} ${v(lo, "supplies", "supply")} the vibes and improvised words. Karaoke duet?`,
  },
];

export const QUESTION_COUNT = QUESTIONS.length;

export const QUESTION_BY_ID: Record<QuestionId, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
) as Record<QuestionId, Question>;

export const MONEY_QUESTION_IDS = QUESTIONS.filter((q) => q.type === "money_slider").map((q) => q.id);
export const CONTINUOUS_QUESTION_IDS = QUESTIONS.filter((q) => q.type === "continuous_slider").map(
  (q) => q.id,
);

/** Index 0–4 of the descriptor range for a 0–100 value. */
export function rangeIndex(value: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 20) return 0;
  if (value <= 40) return 1;
  if (value <= 60) return 2;
  if (value <= 80) return 3;
  return 4;
}

export function descriptorFor(q: Question, value: number): string {
  return q.descriptors[rangeIndex(value)];
}

export function moodFor(q: Question, value: number): string {
  return q.moods[rangeIndex(value)];
}

export function partyCaptionFor(q: Question, value: number): string {
  return q.partyCaptions[rangeIndex(value)];
}
