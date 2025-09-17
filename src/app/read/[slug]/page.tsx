// src/app/read/[slug]/page.tsx
import React from "react";
import { getStoryBySlug, getStoryLanguages } from "../../../lib/stories";
import StoryReaderWithLanguageSelector from "../../../components/StoryReaderWithLanguageSelector";

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ name?: string; lang?: string }>;
}) {
  const { slug } = await params;
  const { name, lang } = await searchParams;
  
  // Get available languages for this story
  const availableLanguages = getStoryLanguages(slug);
  
  if (availableLanguages.length === 0) {
    return <main><h1>Story not found</h1></main>;
  }
  
  // Default to English if no language specified or invalid language
  const languageCode = lang && availableLanguages.some(l => l.code === lang) ? lang : "en";
  const story = getStoryBySlug(slug, languageCode);
  
  if (!story) {
    return <main><h1>Story not found for language: {languageCode}</h1></main>;
  }

  const childName = (name || "").trim();

  return (
    <main>
      <StoryReaderWithLanguageSelector 
        story={story}
        availableLanguages={availableLanguages}
        childName={childName}
        initialLanguage={languageCode}
      />
    </main>
  );
}
