// src/app/read/[slug]/page.tsx
import React from "react";
import { getStoryBySlug } from "../../../lib/stories";
import StoryReader from "../../../components/StoryReader";

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { slug } = await params;
  const { name } = await searchParams;
  
  const story = getStoryBySlug(slug);
  if (!story) {
    return <main><h1>Story not found</h1></main>;
  }

  const childName = (name || "").trim();

  return (
    <main>
      <StoryReader pages={story.pages} childName={childName} title={story.title} />
    </main>
  );
}
