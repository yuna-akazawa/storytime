// src/lib/stories.ts
export type StoryPage = {
  text: string;
  imageUrl: string; // static image path in public/
};

export type Story = {
  slug: string;
  title: string;
  moral: string;
  pages: StoryPage[];
  language: string;
  languageCode: string;
  voiceId?: string; // ElevenLabs voice ID for this language
};

export const stories: Story[] = [
  {
    slug: "helpful-hero-forest",
    title: "The Helpful Hero",
    language: "English",
    languageCode: "en",
    voiceId: "2OEeJcYw2f3bWMzzjVMU", // Clara's voice for English
    moral: "Inspired by The Good Samaritan, The Helpful Hero teaches you to love your neighbor: be kind and help people in need, even if they are different from you. ",
    pages: [
      { text: "On a sunny forest path, a little hedgehog named Pip trotted along. He carried a small snack basket and hummed a tune.", imageUrl: "/images/helpful-hero-forest/01.png" },
      { text: "Two naughty raccoons leapt from behind a bush. They grabbed his snacks and knocked Pip into the grass, giving him a boo-boo on his knee.", imageUrl: "/images/helpful-hero-forest/02.png" },
      { text: "Pip felt scared and his knee hurt. He whispered, \"Can someone help me?\"", imageUrl: "/images/helpful-hero-forest/03.png" },
      { text: "A grand Peacock who loved to lead parades strutted by. He looked at Pip's boo-boo and hurried to the other side of the path.", imageUrl: "/images/helpful-hero-forest/04.png" },
      { text: "Next came a busy Fox with a clipboard. \"I'm late,\" the Fox said, and rushed away without helping Pip.", imageUrl: "/images/helpful-hero-forest/05.png" },
      { text: "Then a superhero in a bright cape rolled in on skates. The hero was from another town and wore a different team badge.", imageUrl: "/images/helpful-hero-forest/06.png" },
      { text: "The superhero knelt beside Pip. \"Are you okay?\" he said, \"Let me help you clean that boo-boo.\"", imageUrl: "/images/helpful-hero-forest/07.png" },
      { text: "The hero cleaned the boo-boo and wrapped it with a tiny bandage. Pip took a deep breath and felt safer.", imageUrl: "/images/helpful-hero-forest/08.png" },
      { text: "The superhero lifted Pip onto the scooter. They glided carefully toward the Friendly Forest Kindergarten.", imageUrl: "/images/helpful-hero-forest/09.png" },
      { text: "At the door, the hero said, \"Teacher, please take care of my friend Pip.\" He gave the teacher two shiny acorns as a gift.", imageUrl: "/images/helpful-hero-forest/10.png" },
      { text: "\"I'm going on a patrol to make sure all our neighbors are safe.\" promised the hero. Pip waved, happy and safe, and his boo-boo felt better.", imageUrl: "/images/helpful-hero-forest/11.png" },
      { text: "That evening the forest animals talked about the word \"neighbor.\" A neighbor is anyone near you who needs kindness or help — even if they're not your friend or from your team.", imageUrl: "/images/helpful-hero-forest/12.png" },
      { text: "Kindness, is how we treat everyone.", imageUrl: "/images/helpful-hero-forest/13.png" },
      { text: "{{childName}} can be a helper too. Look for chances to be brave, share snacks, and care for people in need.", imageUrl: "/images/helpful-hero-forest/14.png" },
    ],
  },
  {
    slug: "helpful-hero-forest",
    title: "こころやさしいヒーロー",
    language: "日本語",
    languageCode: "ja",
    voiceId: "PmgfHCGeS5b7sH90BOOJ", // Japanese voice ID as requested
    moral: "よきサマリアじんのおはなしにヒントをえた『こころやさしいヒーロー』は、あなたのとなりのひとをあいすることをおしえてくれます。たとえじぶんとちがっていても、こまっているひとにしんせつにし、たすけましょう。",
    pages: [
      { text: "あるはれたひのもりのみち、ハリネズミのピップはちいさなおやつかごをもって、スキップしながらあるいていました。", imageUrl: "/images/helpful-hero-forest/01.png" },
      { text: "にひきのわるいアライグマがきのうらからとびだしてきて、ピップのおやつをうばい、くさにおとして、ピップのひざにけがをさせました。", imageUrl: "/images/helpful-hero-forest/02.png" },
      { text: "ピップはこわくてひざがいたみました。「だれかたすけてくれますか？」とちいさくつぶやきました。", imageUrl: "/images/helpful-hero-forest/03.png" },
      { text: "パレードのせんとうをあるくのがだいすきな、りっぱなクジャクがとおりかかりました。クジャクはピップのすりきずをみると、みちのはんたいがわへいそいでわたってしまいました。", imageUrl: "/images/helpful-hero-forest/04.png" },
      { text: "つぎに、クリップボードをもったいそがしそうなキツネがやってきました。「おくれちゃうんだ！」とキツネはいい、ピップをたすけることなく、いそいではしりさってしまいました。", imageUrl: "/images/helpful-hero-forest/05.png" },
      { text: "そのとき、あかるいマントをつけたヒーローが、ローラースケートにのってやってきました。そのヒーローはべつのまちからきたため、ちがうチームのバッジをつけていました。", imageUrl: "/images/helpful-hero-forest/06.png" },
      { text: "ヒーローはピップのそばにひざまずきました。「だいじょうぶ？そのすりきず、きれいにてあてしてあげるよ」と、いいました。", imageUrl: "/images/helpful-hero-forest/07.png" },
      { text: "ヒーローはすりきずをきれいにし、ちいさなばんそうこうをまいてくれました。ピップはふかくいきをすいこむと、あんしんしました。", imageUrl: "/images/helpful-hero-forest/08.png" },
      { text: "ヒーローはピップをスクーターにのせました。ふたりはやさしいもりのようちえんにむかって、ゆっくりとすべっていきました。", imageUrl: "/images/helpful-hero-forest/09.png" },
      { text: "いりぐちで、ヒーローはいいました。「せんせい、ともだちのピップをおねがいします。」そしてせんせいにふたつのひかるどんぐりをプレゼントしました。", imageUrl: "/images/helpful-hero-forest/10.png" },
      { text: "「みんなのとなりのひとがあんぜんかパトロールにいってきます」とヒーローはやくそくしました。ピップはてをふり、しあわせであんぜんなきもちになり、けがもよくなったきがしました。", imageUrl: "/images/helpful-hero-forest/11.png" },
      { text: "そのよる、もりのどうぶつたちは「となりのひと」ということばについてはなしました。となりのひととは、あなたのちかくにいてしんせつやたすけをひつようとしているひとのことです。たとえそのひとがともだちでなくても、おなじチームでなくても。", imageUrl: "/images/helpful-hero-forest/12.png" },
      { text: "やさしさとは、みんなにたいするせっしかたのことです。", imageUrl: "/images/helpful-hero-forest/13.png" },
      { text: "{{childName}}もたすけるひとになれます。ゆうきをだして、おやつをわけたり、こまっているひとをおもいやるきかいをさがしてみましょう。", imageUrl: "/images/helpful-hero-forest/14.png" },
    ],
  },

  {
    slug: "ella-and-evan",
    title: "Ella and Evan",
    language: "English",
    languageCode: "en",
    voiceId: "2OEeJcYw2f3bWMzzjVMU", // Clara's voice for English
    moral: "This is a story about Ella and Evan, two best friends who are always together.",
    pages: [
      { text: "This is Ella, she is a very smart and sweet princess, who loves to play with her brother Evan.", imageUrl: "/images/ella-and-evan/01.png" },
      { text: "This is Evan, he is a very sweet and loving baby, who loves to play with his sister Ella.", imageUrl: "/images/ella-and-evan/02.png" },
      { text: "In the morning, Ella and Papa takes a bus to school together. They talk about Ella's exciting day at school.", imageUrl: "/images/ella-and-evan/03.png" },
      { text: "At school, Ella is with her friends and they play and learn together.", imageUrl: "/images/ella-and-evan/04.png" },
      { text: "In the meantime, Linda, Evan's nanny gets Evan ready for his day.", imageUrl: "/images/ella-and-evan/05.png" },
      { text: "Linda and Evan go to the park together. Evan loves to go on the swings.", imageUrl: "/images/ella-and-evan/06.png" },
      { text: "It's time to pick up Ella from school. Evan is so happy to see Ella after school.", imageUrl: "/images/ella-and-evan/07.png" },
      { text: "They then play in Central Park together and eat some snacks with friends.", imageUrl: "/images/ella-and-evan/08.png" },
      { text: "Ella and Evan go home together and play with their toys.", imageUrl: "/images/ella-and-evan/09.png" },
      { text: "Soon, it's time for dinner. Ella and Evan eat together and talk about their day. Today's dinner is beef, rice and asparagus - their favorite!", imageUrl: "/images/ella-and-evan/10.png" },
      { text: "After dinner, they take a bath. Evan loves to play with his dinosaur toys in the bath. Ella loves her mermaid toys.", imageUrl: "/images/ella-and-evan/11.png" },
      { text: "After bath, Papa brushes Ella's teeth and get's Ella ready for bed.", imageUrl: "/images/ella-and-evan/12.png" },
      { text: "Mummy reads Evan his favorite dinosaur book, while he drinks his milk.", imageUrl: "/images/ella-and-evan/13.png" },
      { text: "It's time for Evan to go to bed. Mummy tucks Evan in and gently kisses him goodnight.", imageUrl: "/images/ella-and-evan/14.png" },
    ],
  },
  {
    slug: "one-foot-rule-kindness-school",
    title: "The One-Foot Rule at Kindness School",
    language: "English",
    languageCode: "en",
    voiceId: "2OEeJcYw2f3bWMzzjVMU", // Clara's voice for English
    moral: "Inspired by Hillel “on one foot”, this story teaches you to be kind to others by thinking about how you would feel if someone did something to you.",
    pages: [
      { text: "Morning sunlight filled the courtyard of Kindness School. A student named Sam called out, \"What's the most important rule?\"", imageUrl: "/images/one-foot-rule-kindness-school/01.png" },
      { text: "Sam balanced on one foot like a flamingo. \"Tell me fast—before I wobble!\"", imageUrl: "/images/placeholder.svg" },
      { text: "With a sparkle of light, the teacher—Fairy Helen—fluttered down. \"Here it is: If you wouldn't like it done to you, don't do it to others.\"", imageUrl: "/images/placeholder.svg" },
      { text: "The class leaned in. \"That's the big rule,\" Fairy Helen said, \"simple enough to learn on one foot.\"", imageUrl: "/images/placeholder.svg" },
      { text: "\"You don't like your snack grabbed without asking. So don't grab someone else's snack.\"", imageUrl: "/images/placeholder.svg" },
      { text: "\"You don't like being laughed at when you make a mistake. So don't laugh at others when they slip up.\"", imageUrl: "/images/placeholder.svg" },
      { text: "\"You like being asked before someone borrows your pencil. So ask first, and return it gently.\"", imageUrl: "/images/placeholder.svg" },
      { text: "\"You want a turn at the swing or soccer ball. So take turns, cheer others on, and share the fun.\"", imageUrl: "/images/placeholder.svg" },
      { text: "\"When you feel mad, take the One-Foot Pause. Ask yourself: Would I like it if someone did this to me?\"", imageUrl: "/images/placeholder.svg" },
      { text: "\"If the answer is no, pick a kinder action. If yes, go ahead with care and respect.\"", imageUrl: "/images/placeholder.svg" },
      { text: "Sam wobbled, then grinned. \"I can remember that on one foot!\"", imageUrl: "/images/placeholder.svg" },
      { text: "The class tried it right away: they held a door, shared glue, and invited a new kid to play. Kindness spread like confetti.", imageUrl: "/images/placeholder.svg" },
      { text: "Fairy Helen twinkled. \"Big rules become real when you practice them in small moments.\"", imageUrl: "/images/placeholder.svg" },
      { text: "{{childName}} can try the One-Foot Rule today. Look, think, and choose kind.", imageUrl: "/images/placeholder.svg" },
    ],
  },
  {
    slug: "one-foot-rule-kindness-school",
    title: "やさしさがっこうのワンフットルール",
    language: "日本語",
    languageCode: "ja",
    voiceId: "PmgfHCGeS5b7sH90BOOJ", // Japanese voice ID
    moral: "なにかをするまえに、きいてみよう：わたしがされたらすきかな？もしきらいなら、しないで。やさしいことをえらぼう。",
    pages: [
      { text: "あさのひかりが、やさしさがっこうのにわをてらしました。がくせいのサムがさけびました。「いちばんたいせつなルールはなに？」", imageUrl: "/images/placeholder.svg" },
      { text: "サムはフラミンゴのようにかたあしでバランスをとりました。「はやくおしえて。ぐらぐらするまえに！」", imageUrl: "/images/placeholder.svg" },
      { text: "きらりとひかって、せんせいのようせいヘレンがとんできました。「これよ：じぶんがされたくないことは、ひとにしちゃだめ。」", imageUrl: "/images/placeholder.svg" },
      { text: "クラスのみんながちかづきました。「それがおおきなルールよ」とようせいヘレンはいいました。「かたあしでもおぼえられるくらいかんたん。」", imageUrl: "/images/placeholder.svg" },
      { text: "「あなたは、おやつをきかずにとられるのはいやでしょ？だから、ひとのおやつをとっちゃだめ。」", imageUrl: "/images/placeholder.svg" },
      { text: "「まちがえたときにわらわれるのはいやでしょ？だから、ひとがしっぱいしてもわらっちゃだめ。」", imageUrl: "/images/placeholder.svg" },
      { text: "「えんぴつをかりるときに、きいてもらいたいでしょ？だから、まずきいて、やさしくかえしてね。」", imageUrl: "/images/placeholder.svg" },
      { text: "「ブランコやサッカーボールで、じゅんばんをまちたいでしょ？だから、じゅんばんをまもって、おうえんして、いっしょにたのしもう。」", imageUrl: "/images/placeholder.svg" },
      { text: "「おこったとき、ワンフットポーズをしてね。じぶんにきいてみて：わたしがこれをされたらすき？」", imageUrl: "/images/placeholder.svg" },
      { text: "「こたえが『いや』なら、もっとやさしいことをえらんで。『うん』なら、きをつけて、そんけいしてやってね。」", imageUrl: "/images/placeholder.svg" },
      { text: "サムはぐらついて、それからにっこりしました。「かたあしでもおぼえられる！」", imageUrl: "/images/placeholder.svg" },
      { text: "クラスのみんなは、すぐにやってみました：ドアをもってあげて、のりをわけて、あたらしいこをあそびにさそいました。やさしさがこんふぇっちのようにひろがりました。", imageUrl: "/images/placeholder.svg" },
      { text: "ようせいヘレンがきらきらしました。「おおきなルールは、ちいさなしゅんかんにれんしゅうすると、ほんとうになるのよ。」", imageUrl: "/images/placeholder.svg" },
      { text: "{{childName}}も、きょう、ワンフットルールをためしてみてね。みて、かんがえて、やさしいことをえらぼう。", imageUrl: "/images/placeholder.svg" },
    ],
  },
];

export function getStoryBySlug(slug: string, languageCode?: string) {
  if (languageCode) {
    return stories.find((s) => s.slug === slug && s.languageCode === languageCode);
  }
  // Default to English if no language specified
  return stories.find((s) => s.slug === slug && s.languageCode === "en");
}

export function getAvailableLanguagesForStory(slug: string): Story[] {
  return stories.filter((s) => s.slug === slug);
}

export function getStoryLanguages(slug: string): Array<{code: string, name: string, voiceId?: string}> {
  return stories
    .filter((s) => s.slug === slug)
    .map((s) => ({
      code: s.languageCode,
      name: s.language,
      voiceId: s.voiceId
    }));
}
