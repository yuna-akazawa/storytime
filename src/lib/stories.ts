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
};

export const stories: Story[] = [
  {
    slug: "helpful-hero-forest",
    title: "The Helpful Hero",
    moral: "Inspired by The Good Samaritan, The Helpful Hero teaches you to love your neighbor: be kind and help people in need, even if they are different from you. ",
    pages: [
      { text: "On a sunny forest path, a little hedgehog named Pip trotted along. He carried a small snack basket and hummed a tune.", imageUrl: "/images/helpful-hero-forest/01.png" },
      { text: "Two naughty raccoons leapt from behind a bush. They grabbed his snacks and knocked Pip into the grass, giving him a boo-boo on his knee.", imageUrl: "/images/helpful-hero-forest/02.png" },
      { text: "Pip felt scared and his knee hurt. He whispered, “Can someone help me?”", imageUrl: "/images/helpful-hero-forest/03.png" },
      { text: "A grand Peacock who loved to lead parades strutted by. He looked at Pip’s boo-boo and hurried to the other side of the path.", imageUrl: "/images/helpful-hero-forest/04.png" },
      { text: "Next came a busy Fox with a clipboard. “I’m late,” the Fox said, and rushed away without helping Pip.", imageUrl: "/images/helpful-hero-forest/05.png" },
      { text: "Then a superhero in a bright cape rolled in on skates. The hero was from another town and wore a different team badge.", imageUrl: "/images/helpful-hero-forest/06.png" },
      { text: "The superhero knelt beside Pip. “Are you okay?” he said, “Let me help you clean that boo-boo.”", imageUrl: "/images/helpful-hero-forest/07.png" },
      { text: "The hero cleaned the boo-boo and wrapped it with a tiny bandage. Pip took a deep breath and felt safer.", imageUrl: "/images/helpful-hero-forest/08.png" },
      { text: "The superhero lifted Pip onto the scooter. They glided carefully toward the Friendly Forest Kindergarten.", imageUrl: "/images/helpful-hero-forest/09.png" },
      { text: "At the door, the hero said, “Teacher, please take care of my friend Pip.” He gave the teacher two shiny acorns as a gift.", imageUrl: "/images/helpful-hero-forest/10.png" },
      { text: "“I'm going on a patrol to make sure all our neighbors are safe.” promised the hero. Pip waved, happy and safe, and his boo-boo felt better.", imageUrl: "/images/helpful-hero-forest/11.png" },
      { text: "That evening the forest animals talked about the word “neighbor.” A neighbor is anyone near you who needs kindness or help — even if they’re not your friend or from your team.", imageUrl: "/images/helpful-hero-forest/12.png" },
      { text: "Kindness, is how we treat everyone.", imageUrl: "/images/helpful-hero-forest/13.png" },
      { text: "{{childName}} can be a helper too. Look for chances to be brave, share snacks, and care for people in need.", imageUrl: "/images/helpful-hero-forest/14.png" },
    ],
  },
  {
    slug: "bedtime-stars",
    title: "Bedtime Under the Stars",
    moral: "A calm routine makes big dreams easier.",
    pages: [
      {
        text: "{{childName}} brushed teeth, put on cozy pajamas, and opened the favorite bedtime book.",
        imageUrl: "/images/placeholder.svg",
      },
      {
        text: "Outside, the stars twinkled. “One page at a time,” whispered the moon.",
        imageUrl: "/images/placeholder.svg",
      },
      {
        text: "With a deep breath in and a gentle breath out, {{childName}} felt sleep arrive like a soft blanket.",
        imageUrl: "/images/placeholder.svg",
      },
      {
        text: "Tomorrow would bring new adventures, but tonight was for rest and sweet dreams.",
        imageUrl: "/images/placeholder.svg",
      },
    ],
  },
];

export function getStoryBySlug(slug: string) {
  return stories.find((s) => s.slug === slug);
}
