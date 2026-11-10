import type { Quote } from "../shared/types";
type Row = [string, string, string];
const epictetus: Row[] = [
  [
    "I",
    "There are things which are within our power, and there are things which are beyond our power.",
    "چیزهایی در اختیار ما هستند و چیزهایی بیرون از اختیار ما.",
  ],
  [
    "I",
    "Within our power are opinion, aim, desire, aversion, and, in one word, whatever affairs are our own.",
    "داوری، قصد، خواستن و نخواستن در اختیار ماست؛ در یک کلام، آنچه به کردار خودمان تعلق دارد.",
  ],
  [
    "I",
    "You are but a semblance and by no means the real thing.",
    "تو تنها یک نمود هستی، نه لزوماً خودِ واقعیت.",
  ],
  [
    "II",
    "Where it is practically necessary for you to pursue or avoid anything, do even this with discretion and gentleness and moderation.",
    "حتی آنجا که باید چیزی را دنبال کنی یا از آن دور شوی، با سنجیدگی، نرمی و میانه‌روی عمل کن.",
  ],
  [
    "IV",
    "When you set about any action, remind yourself of what nature the action is.",
    "پیش از هر کاری، به خودت یادآوری کن که ماهیت آن کار چیست.",
  ],
  [
    "V",
    "Men are disturbed not by things, but by the views which they take of things.",
    "آنچه آدم‌ها را آشفته می‌کند خودِ اتفاق‌ها نیست، بلکه نگاهشان به آن‌هاست.",
  ],
  [
    "VI",
    "Be not elated at any excellence not your own.",
    "به برتری‌ای که از آنِ خودت نیست مغرور نشو.",
  ],
  [
    "VIII",
    "Demand not that events should happen as you wish; but wish them to happen as they do happen, and you will go on well.",
    "نخواه که رویدادها همیشه مطابق میل تو باشند؛ آن‌ها را چنان‌که رخ می‌دهند بپذیر، تا آسوده‌تر پیش بروی.",
  ],
  [
    "IX",
    "Sickness is an impediment to the body, but not to the will unless itself pleases.",
    "بیماری مانع تن است، نه مانع اراده، مگر آنکه اراده خود تن بدهد.",
  ],
  [
    "X",
    "Upon every accident, remember to turn toward yourself and inquire what faculty you have for its use.",
    "در هر پیشامد، به درونت برگرد و بپرس کدام توانایی‌ات می‌تواند به کارت بیاید.",
  ],
  [
    "X",
    "And when thus habituated, the phenomena of existence will not overwhelm you.",
    "وقتی به این شیوه خو گرفتی، پیشامدهای زندگی تو را از پا نمی‌اندازند.",
  ],
  ["XII", "Begin therefore with little things.", "پس از چیزهای کوچک آغاز کن."],
  [
    "XII",
    "This is the price paid for peace and tranquillity; and nothing is to be had for nothing.",
    "این بهایی است که برای آرامش می‌پردازی؛ هیچ چیز بی‌بها به دست نمی‌آید.",
  ],
  [
    "XIV",
    "Exercise, therefore, what is in your power.",
    "پس آنچه را در اختیار توست به کار بگیر.",
  ],
  [
    "XV",
    "Put out your hand and take a moderate share.",
    "دست پیش ببر و سهمی به‌اندازه بردار.",
  ],
  [
    "XV",
    "Do not yearn in desire toward it, but wait till it reaches you.",
    "با بی‌تابی در آرزویش نمان؛ صبر کن تا نوبتش برسد.",
  ],
  [
    "XVII",
    "For this is your business—to act well the given part, but to choose it belongs to another.",
    "کار تو این است که نقشِ سپرده‌شده را خوب بازی کنی؛ انتخاب نقش همیشه با تو نیست.",
  ],
  [
    "XVIII",
    "For whatsoever happens, it belongs to me to derive advantage therefrom.",
    "هرچه رخ بدهد، بهره‌گرفتن از آن در اختیار من است.",
  ],
  [
    "XIX",
    "You can be unconquerable if you enter into no combat in which it is not in your own power to conquer.",
    "اگر وارد نبردی نشوی که پیروزی در آن بیرون از اختیار توست، می‌توانی شکست‌ناپذیر باشی.",
  ],
  [
    "XX",
    "For if you once gain time and respite, you will more easily command yourself.",
    "اگر کمی زمان و فرصت مکث به دست آوری، آسان‌تر بر خودت مسلط می‌شوی.",
  ],
  [
    "XXII",
    "For remember that, if you are persistent, those very persons who at first ridiculed will afterwards admire you.",
    "به یاد داشته باش: اگر پایدار بمانی، همان کسانی که نخست مسخره‌ات کردند، بعدها تحسینت می‌کنند.",
  ],
  [
    "XXIV",
    "It is enough if everyone fully performs his own proper business.",
    "کافی است هرکس کارِ درخورِ خودش را به‌تمامی انجام دهد.",
  ],
  [
    "XXIX",
    "In every affair consider what precedes and what follows, and then undertake it.",
    "در هر کار، مقدمه و پیامدش را بسنج؛ سپس دست به آن بزن.",
  ],
  [
    "XXIX",
    "When you have reckoned up all this, if your inclination still holds, set about the combat.",
    "وقتی همهٔ این‌ها را سنجیدی، اگر هنوز خواهانش بودی، وارد میدان شو.",
  ],
  [
    "XXIX",
    "Consider first, man, what the matter is, and what your own nature is able to bear.",
    "نخست ببین با چه کاری روبه‌رو هستی و توان خودت تا کجاست.",
  ],
  [
    "XXXIV",
    "If you are dazzled by the semblance of any promised pleasure, guard yourself against being bewildered by it; but let the affair wait your leisure, and procure yourself some delay.",
    "اگر وعدهٔ لذتی چشمت را گرفت، مراقب باش مسحورش نشوی؛ کمی درنگ کن و به خودت فرصت بده.",
  ],
  [
    "XXXV",
    "When you do anything from a clear judgment that it ought to be done, never shrink from being seen to do it, even though the world should misunderstand it;",
    "وقتی با داوری روشن می‌دانی کاری درست است، از دیده‌شدن در انجامش نترس، حتی اگر دیگران بد بفهمند.",
  ],
  [
    "XXXVIII",
    "As in walking you take care not to tread upon a nail, or turn your foot, so likewise take care not to hurt the ruling faculty of your mind.",
    "همان‌طور که هنگام راه‌رفتن مراقب قدم‌هایت هستی، مراقب نیروی داوری ذهنت نیز باش.",
  ],
  [
    "XLIII",
    "Everything has two handles: one by which it may be borne, another by which it cannot.",
    "هر چیز دو دستگیره دارد: از یکی می‌توان آن را برداشت، از دیگری نمی‌توان.",
  ],
  [
    "XLV",
    "For unless you perfectly understand his motives, how should you know if he acts ill?",
    "تا انگیزه‌های کسی را درست نفهمیده‌ای، چگونه می‌دانی کارش بد است؟",
  ],
  [
    "XLVI",
    "Never proclaim yourself a philosopher, nor make much talk among the ignorant about your principles, but show them by actions.",
    "خودت را فیلسوف اعلام نکن و از اصولت بسیار مگو؛ آن‌ها را با کردارت نشان بده.",
  ],
  [
    "XLVI",
    "Thus, therefore, do you not make an exhibition before the ignorant of your principles, but of the actions to which their digestion gives rise.",
    "به‌جای نمایش اصولت، کرداری را نشان بده که از فهم و جذب آن‌ها پدید آمده است.",
  ],
  [
    "XLIX",
    "And when I find an interpreter, what remains is to make use of his instructions. This alone is the valuable thing.",
    "وقتی راهنما را یافتم، آنچه می‌ماند به‌کاربستن آموخته‌های اوست؛ ارزش واقعی در همین است.",
  ],
  [
    "L",
    "Let whatever appears to be the best be to you an inviolable law.",
    "آنچه به داوری تو بهترین است، برایت قانونی استوار باشد.",
  ],
  [
    "L",
    "And though you are not yet a Socrates, you ought, however, to live as one seeking to be a Socrates.",
    "اگر هنوز سقراط نشده‌ای، دست‌کم مانند کسی زندگی کن که می‌کوشد به او نزدیک شود.",
  ],
];
const marcus: Row[] = [
  [
    "4.2",
    "Let no act be done without a purpose, nor otherwise than according to the perfect principles of art.",
    "هیچ کاری را بی‌هدف انجام نده؛ آن را با اصول درستِ انجام‌دادنش پیش ببر.",
  ],
  [
    "4.3",
    "Constantly then give to thyself this retreat, and renew thyself;",
    "پیوسته این خلوت را به خودت ببخش و خودت را تازه کن.",
  ],
  [
    "4.3",
    "The universe is transformation: life is opinion.",
    "جهان دگرگونی است؛ زندگی، برداشت ما.",
  ],
  [
    "4.8",
    "That which does not make a man worse than he was, also does not make his life worse, nor does it harm him either from without or from within.",
    "چیزی که انسان را بدتر نکند، زندگی‌اش را نیز بدتر نمی‌کند و به درون یا بیرون او آسیب نمی‌رساند.",
  ],
  [
    "4.11",
    "Do not have such an opinion of things as he has who does thee wrong, or such as he wishes thee to have, but look at them as they are in truth.",
    "رویدادها را از چشم کسی که به تو بدی می‌کند نبین؛ آن‌ها را چنان‌که واقعاً هستند ببین.",
  ],
  [
    "4.17",
    "While thou livest, while it is in thy power, be good.",
    "تا زنده‌ای و تا در اختیار توست، خوب باش.",
  ],
  [
    "4.20",
    "Everything which is in any way beautiful is beautiful in itself, and terminates in itself, not having praise as part of itself.",
    "هر چیز زیبا، زیبایی‌اش را در خود دارد؛ ستایش دیگران جزئی از آن نیست.",
  ],
  [
    "4.22",
    "Do not be whirled about, but in every movement have respect to justice, and on the occasion of every impression maintain the faculty of comprehension or understanding.",
    "آشفته به هر سو نرو؛ در هر حرکت عدالت را نگه دار و در برابر هر دریافت، نیروی فهمت را حفظ کن.",
  ],
  [
    "4.23",
    "Nothing for me is too early nor too late, which is in due time for thee.",
    "آنچه در زمان درستِ تو رخ می‌دهد، برای من نه زود است و نه دیر.",
  ],
  [
    "4.24",
    "Accordingly on every occasion a man should ask himself, Is this one of the unnecessary things?",
    "در هر موقعیت از خودت بپرس: آیا این هم یکی از کارهای غیرضروری است؟",
  ],
  [
    "4.26",
    "Do not disturb thyself. Make thyself all simplicity.",
    "خودت را آشفته نکن؛ ساده و بی‌پیرایه باش.",
  ],
  [
    "4.26",
    "Thou must turn to profit the present by the aid of reason and justice.",
    "با یاری خرد و عدالت، از اکنون بهره بگیر.",
  ],
  [
    "4.31",
    "Love the art, poor as it may be, which thou hast learned, and be content with it;",
    "هنری را که آموخته‌ای دوست بدار، هرچند کوچک باشد، و به آن دلگرم باش.",
  ],
  [
    "4.35",
    "Everything is only for a day, both that which remembers and that which is remembered.",
    "همه‌چیز گذراست؛ هم آن‌که به یاد می‌آورد و هم آنچه به یاد می‌ماند.",
  ],
  [
    "4.36",
    "For everything that exists is in a manner the seed of that which will be.",
    "هرچه اکنون هست، به‌گونه‌ای بذر چیزی است که خواهد بود.",
  ],
  [
    "4.43",
    "Time is like a river made up of the events which happen, and a violent stream;",
    "زمان همچون رودی از رویدادهاست؛ جریانی تند و پیوسته.",
  ],
  [
    "4.49",
    "Be like the promontory against which the waves continually break, but it stands firm and tames the fury of the water around it.",
    "چون صخره‌ای باش که موج‌ها پیوسته بر آن می‌شکنند، اما استوار می‌ماند و خروش آب را آرام می‌کند.",
  ],
  [
    "4.51",
    "Always run to the short way; and the short way is the natural:",
    "همیشه راه کوتاه را بجوی؛ و راه کوتاه، راهِ سازگار با طبیعت است.",
  ],
  [
    "5.1",
    "I am rising to the work of a human being.",
    "برمی‌خیزم تا کارِ یک انسان را انجام بدهم.",
  ],
  [
    "5.1",
    "Dost thou exist then to take thy pleasure, and not at all for action or exertion?",
    "آیا تنها برای لذت‌بردن به‌وجود آمده‌ای، نه برای عمل و کوشش؟",
  ],
  [
    "5.3",
    "if a thing is good to be done or said, do not consider it unworthy of thee.",
    "اگر گفتن یا انجام‌دادن چیزی خوب است، آن را بیرون از شأن خود ندان.",
  ],
  [
    "5.6",
    "but he goes on to another act, as a vine goes on to produce again the grapes in season.",
    "او به کار نیک بعدی می‌پردازد، همان‌طور که تاک در فصل خود دوباره انگور می‌دهد.",
  ],
  [
    "5.11",
    "About what am I now employing my own soul?",
    "اکنون جان و ذهنم را صرف چه چیزی می‌کنم؟",
  ],
  [
    "5.16",
    "Such as are thy habitual thoughts, such also will be the character of thy mind; for the soul is dyed by the thoughts.",
    "خوی ذهن تو رنگِ اندیشه‌های همیشگی‌ات را می‌گیرد؛ جان با فکرها رنگ می‌پذیرد.",
  ],
  [
    "5.16",
    "where a man can live, there he can also live well.",
    "هرجا انسان بتواند زندگی کند، می‌تواند خوب هم زندگی کند.",
  ],
  [
    "5.20",
    "and that which is an obstacle on the road helps us on this road.",
    "و آنچه مانع راه است، می‌تواند در همین راه یاری‌مان کند.",
  ],
  [
    "5.21",
    "And in like manner also reverence that which is best in thyself;",
    "به همین‌سان، بهترین بخشِ وجود خودت را نیز گرامی بدار.",
  ],
  [
    "5.23",
    "Often think of the rapidity with which things pass by and disappear, both the things which are and the things which are produced.",
    "بسیار به شتابِ گذشتن و ناپدیدشدن چیزها فکر کن؛ هم آنچه هست و هم آنچه تازه پدید می‌آید.",
  ],
  [
    "5.25",
    "I now have what the universal nature wills me to have; and I do what my nature now wills me to do.",
    "اکنون آنچه طبیعت جهان پیش رویم گذاشته دارم، و آنچه سرشت من می‌طلبد انجام می‌دهم.",
  ],
  [
    "6.3",
    "Look within. Let neither the peculiar quality of anything nor its value escape thee.",
    "به درون بنگر؛ نگذار ماهیت یا ارزش هیچ چیز از نگاهت پنهان بماند.",
  ],
  [
    "6.6",
    "The best way of avenging thyself is not to become like the wrong doer.",
    "بهترین پاسخ به بدکار این است که شبیه او نشوی.",
  ],
  [
    "6.11",
    "When thou hast been compelled by circumstances to be disturbed in a manner, quickly return to thyself and do not continue out of tune longer than the compulsion lasts;",
    "اگر شرایط آشفته‌ات کرد، زود به خودت برگرد؛ بیش از دوام آن شرایط از تعادل بیرون نمان.",
  ],
  [
    "6.15",
    "Motions and changes are continually renewing the world,",
    "حرکت‌ها و دگرگونی‌ها پیوسته جهان را تازه می‌کنند.",
  ],
  [
    "6.16",
    "But to reverence and honour thy own mind will make thee content with thyself,",
    "گرامی‌داشتن ذهن خودت، تو را با خودت آشتی می‌دهد.",
  ],
  [
    "6.19",
    "If a thing is difficult to be accomplished by thyself, do not think that it is impossible for man:",
    "اگر انجام کاری برای تو دشوار است، گمان نکن که برای انسان ناممکن است.",
  ],
  [
    "6.21",
    "If any man is able to convince me and show me that I do not think or act right, I will gladly change;",
    "اگر کسی نشانم دهد که درست نمی‌اندیشم یا عمل نمی‌کنم، با خوشحالی تغییر خواهم کرد.",
  ],
  [
    "6.21",
    "for I seek the truth by which no man was ever injured.",
    "زیرا من حقیقت را می‌جویم؛ چیزی که هیچ‌کس از آن آسیب ندیده است.",
  ],
  [
    "6.22",
    "I do my duty: other things trouble me not;",
    "کار خودم را انجام می‌دهم؛ چیزهای دیگر آشفته‌ام نمی‌کنند.",
  ],
  [
    "6.26",
    "just so then in this life also remember that every duty is made up of certain parts.",
    "در زندگی هم به یاد داشته باش که هر وظیفه از بخش‌های کوچک‌تر ساخته شده است.",
  ],
  [
    "6.30",
    "Strive to continue to be such as philosophy wished to make thee.",
    "بکوش همان کسی بمانی که فلسفه می‌خواست از تو بسازد.",
  ],
];
const literature: Quote[] = [
  {
    id: "virgil-gates",
    en: "The gates of hell are open night and day;\nSmooth the descent, and easy is the way.",
    fa: "دروازه‌های دوزخ شب و روز گشوده‌اند؛ فرود آسان است و راه هموار.",
    author: "ویرژیل",
    work: "انه‌اید",
    location: "کتاب ششم، ابیات ۱۹۲–۱۹۳ در ترجمه",
    translator: "جان درایدن",
    source: "https://www.gutenberg.org/files/228/228-h/228-h.htm",
  },
];
function poems(
  author: string,
  work: string,
  source: string,
  prefix: string,
  rows: Row[],
) {
  return rows.map(([location, en, fa], i) => ({
    id: `${prefix}-${i + 1}`,
    author,
    work,
    source,
    location,
    en,
    fa,
  }));
}
export const quotes: Quote[] = [
  ...literature,
  ...epictetus.map(([location, en, fa], i) => ({
    id: `epictetus-${i + 1}`,
    author: "اپیکتتوس",
    work: "دست‌نامه",
    translator: "توماس ونت‌ورث هیگینسون",
    location: `بخش ${location}`,
    source: "https://www.gutenberg.org/files/45109/45109-h/45109-h.htm",
    en,
    fa,
  })),
  ...marcus.map(([location, en, fa], i) => ({
    id: `marcus-${i + 1}`,
    author: "مارکوس اورلیوس",
    work: "تأملات",
    translator: "جورج لانگ",
    location: `کتاب و بند ${location}`,
    source: `https://classics.mit.edu/Antoninus/meditations.${location[0]}.${({ "4": "four", "5": "five", "6": "six" } as Record<string, string>)[location[0]]}.html`,
    en,
    fa,
  })),
  ...poems(
    "جان میلتون",
    "بهشت گمشده",
    "https://www.gutenberg.org/cache/epub/26/pg26.txt",
    "milton",
    [
      [
        "کتاب دوم، ابیات ۴۳۲–۴۳۳",
        "Long is the way\nAnd hard, that out of Hell leads up to Light.",
        "راهی که از دوزخ به روشنایی می‌رسد، طولانی و دشوار است.",
      ],
      [
        "کتاب اول، ابیات ۲۵۴–۲۵۵",
        "The mind is its own place, and in itself\nCan make a Heaven of Hell, a Hell of Heaven.",
        "ذهن جایگاه خویش است؛ در خود می‌تواند از دوزخ بهشت بسازد و از بهشت دوزخ.",
      ],
      [
        "کتاب دوازدهم، ابیات ۶۴۶–۶۴۷",
        "The world was all before them, where to choose\nTheir place of rest, and Providence their guide.",
        "جهان پیش رویشان بود تا جای آرام‌گرفتنشان را برگزینند، و عنایت راهنمایشان بود.",
      ],
    ],
  ),
  ...poems(
    "هنری وادزورث لانگ‌فلو",
    "سرود زندگی",
    "https://en.wikisource.org/wiki/Voices_of_the_Night/A_Psalm_of_Life",
    "longfellow",
    [
      [
        "بند سوم",
        "But to act, that each to-morrow\nFind us farther than to-day.",
        "باید عمل کنیم، تا هر فردا ما را پیش‌تر از امروز بیابد.",
      ],
      [
        "بند چهارم",
        "Art is long, and Time is fleeting,",
        "هنر دیرپا و زمان در گذر است.",
      ],
      [
        "بند پنجم",
        "Be not like dumb, driven cattle!\nBe a hero in the strife!",
        "چون گله‌ای خاموش و رانده‌شده مباش؛ در کشاکش زندگی دلیر باش.",
      ],
      [
        "بند ششم",
        "Act,—act in the living Present!",
        "عمل کن؛ در همین اکنونِ زنده عمل کن!",
      ],
      [
        "بند هفتم",
        "Lives of great men all remind us\nWe can make our lives sublime,",
        "زندگی انسان‌های بزرگ یادآور می‌شود که ما هم می‌توانیم به زندگی‌مان شکوه ببخشیم.",
      ],
      [
        "بند نهم",
        "Still achieving, still pursuing,\nLearn to labor and to wait.",
        "همچنان بساز، همچنان بجوی؛ کارکردن و شکیبایی را بیاموز.",
      ],
    ],
  ),
  ...poems(
    "ویلیام ارنست هنلی",
    "شکست‌ناپذیر",
    "https://en.wikisource.org/wiki/Oxford_Book_of_English_Verse_1250-1900/Invictus",
    "henley",
    [
      [
        "بند اول",
        "I thank whatever gods may be\nFor my unconquerable soul.",
        "هر خدایی که باشد، سپاسگزارم برای روح شکست‌ناپذیرم.",
      ],
      [
        "بند دوم",
        "Under the bludgeonings of chance\nMy head is bloody, but unbow’d.",
        "زیر ضربه‌های روزگار، سرم خونین است، اما فروافتاده نیست.",
      ],
      [
        "بند سوم",
        "And yet the menace of the years\nFinds, and shall find me, unafraid.",
        "و با این همه، تهدید سال‌ها مرا بی‌باک می‌یابد و خواهد یافت.",
      ],
      [
        "بند چهارم",
        "I am the master of my fate:\nI am the captain of my soul.",
        "من فرمانروای سرنوشت خویشم؛ من ناخدای جان خویشم.",
      ],
    ],
  ),
  ...poems(
    "رودیارد کیپلینگ",
    "اگر",
    "https://en.wikisource.org/wiki/Rewards_and_Fairies/If%E2%80%94",
    "kipling",
    [
      [
        "بند اول",
        "If you can trust yourself when all men doubt you,\nBut make allowance for their doubting too;",
        "اگر وقتی همه به تو شک دارند، به خودت اعتماد کنی و با این حال برای شک آن‌ها هم جایی بگذاری؛",
      ],
      [
        "بند اول",
        "If you can wait and not be tired by waiting,",
        "اگر بتوانی صبر کنی و از صبرکردن خسته نشوی؛",
      ],
      [
        "بند دوم",
        "If you can meet with Triumph and Disaster\nAnd treat those two impostors just the same;",
        "اگر پیروزی و شکست را دیدار کنی و با این دو فریبکار یکسان رفتار کنی؛",
      ],
      [
        "بند دوم",
        "Or watch the things you gave your life to, broken,\nAnd stoop and build ’em up with worn-out tools:",
        "یا ببینی آنچه عمرت را پایش گذاشتی شکسته است، و خم شوی و با ابزار فرسوده دوباره بسازی؛",
      ],
      [
        "بند چهارم",
        "If you can fill the unforgiving minute\nWith sixty seconds’ worth of distance run,",
        "اگر بتوانی دقیقهٔ بی‌بازگشت را با شصت ثانیه پیش‌رفتن پُر کنی؛",
      ],
    ],
  ),
  ...poems(
    "آلفرد تنیسون",
    "اولیس",
    "https://en.wikisource.org/wiki/Poems_(Tennyson,_1843)/Volume_2/Ulysses",
    "tennyson",
    [
      [
        "سطر ۱۸",
        "I am a part of all that I have met;",
        "من بخشی از هر آن چیزی هستم که با آن روبه‌رو شده‌ام.",
      ],
      [
        "سطرهای ۵۶–۵۷",
        "Come, my friends,\n’T is not too late to seek a newer world.",
        "بیایید دوستانم؛ برای جستن جهانی تازه هنوز دیر نشده است.",
      ],
      [
        "سطر ۷۰",
        "To strive, to seek, to find, and not to yield.",
        "کوشیدن، جستن، یافتن، و تسلیم‌نشدن.",
      ],
    ],
  ),
  ...poems(
    "ویلیام شکسپیر",
    "اندازه در برابر اندازه",
    "https://shakespeare.mit.edu/measure/measure.1.4.html",
    "shakespeare-measure",
    [
      [
        "پردهٔ اول، صحنهٔ چهارم؛ لوسیو",
        "Our doubts are traitors,\nAnd make us lose the good we oft might win\nBy fearing to attempt.",
        "تردیدهایمان خیانتکارند؛ با ترساندن ما از تلاش، خوبی‌هایی را که می‌توانستیم به دست آوریم از ما می‌گیرند.",
      ],
    ],
  ),
  ...poems(
    "ویلیام شکسپیر",
    "هملت",
    "https://shakespeare.mit.edu/hamlet/hamlet.1.3.html",
    "shakespeare-hamlet",
    [
      [
        "پردهٔ اول، صحنهٔ سوم؛ پولونیوس",
        "This above all: to thine own self be true,",
        "بالاتر از همه: با خودت صادق باش.",
      ],
    ],
  ),
  ...poems(
    "ویلیام شکسپیر",
    "ژولیوس سزار",
    "https://shakespeare.mit.edu/julius_caesar/julius_caesar.1.2.html",
    "shakespeare-caesar",
    [
      [
        "پردهٔ اول، صحنهٔ دوم؛ کاسیوس",
        "The fault, dear Brutus, is not in our stars,\nBut in ourselves, that we are underlings.",
        "بروتوس عزیز، تقصیرِ زیردست‌ماندن ما در ستاره‌هایمان نیست، در خود ماست.",
      ],
    ],
  ),
];

// Daily encouragement stays centered on resisting harm, choosing courage, and
// continuing the work; remove reflections that are thoughtful but off-theme.
const encouragement = /gates of hell|be a hero in the strife|unconquerable soul|my head is bloody|unafraid|master of my fate|captain of my soul|to strive, to seek|not to yield|not too late to seek|act,—act in the living present|farther than to-day|learn to labor|persistent|set about the combat|obstacle on the road|stands firm|I am rising to the work|do not think that it is impossible|to act well the given part|exercise, therefore, what is in your power|begin therefore with little things|do my duty|strive to continue|difficult.*up to light|come, my friends/i;
export const focusedQuotes = quotes.filter((quote) => encouragement.test(quote.en));
