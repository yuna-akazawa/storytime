// src/components/StoryReaderWithLanguageSelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoryBySlug, type Story } from "../lib/stories";
import StoryReader from "./StoryReader";
import LanguageSelector from "./LanguageSelector";

type Language = {
  code: string;
  name: string;
  voiceId?: string;
};

type Props = {
  story: Story;
  availableLanguages: Language[];
  childName: string;
  initialLanguage: string;
};

export default function StoryReaderWithLanguageSelector({
  story,
  availableLanguages,
  childName,
  initialLanguage,
}: Props) {
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const [currentStory, setCurrentStory] = useState(story);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLanguageChange = (languageCode: string) => {
    if (languageCode === currentLanguage) return;

    // Get the story in the new language
    const newStory = getStoryBySlug(story.slug, languageCode);
    if (!newStory) {
      console.error(`Story not found for language: ${languageCode}`);
      return;
    }

    setCurrentLanguage(languageCode);
    setCurrentStory(newStory);

    // Update URL to reflect language change
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('lang', languageCode);
    
    // Preserve the name parameter if it exists
    const name = searchParams.get('name');
    if (name) {
      newSearchParams.set('name', name);
    }

    router.replace(`/read/${story.slug}?${newSearchParams.toString()}`);
  };

  // Update story when initialLanguage changes (e.g., from URL navigation)
  useEffect(() => {
    if (initialLanguage !== currentLanguage) {
      const newStory = getStoryBySlug(story.slug, initialLanguage);
      if (newStory) {
        setCurrentLanguage(initialLanguage);
        setCurrentStory(newStory);
      }
    }
  }, [initialLanguage, currentLanguage, story.slug]);

  // Get the voice ID for the current language
  const currentVoiceId = availableLanguages.find(lang => lang.code === currentLanguage)?.voiceId;

  // Create the language selector component to pass as prop
  const languageSelectorComponent = (
    <LanguageSelector
      languages={availableLanguages}
      currentLanguage={currentLanguage}
      onLanguageChange={handleLanguageChange}
    />
  );

  return (
    <StoryReader
      pages={currentStory.pages}
      childName={childName}
      title={currentStory.title}
      voiceId={currentVoiceId}
      languageSelector={languageSelectorComponent}
    />
  );
}
