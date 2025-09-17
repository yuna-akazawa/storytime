// src/components/LanguageSelector.tsx
"use client";

import React from "react";

type Language = {
  code: string;
  name: string;
  voiceId?: string;
};

type Props = {
  languages: Language[];
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => void;
};

export default function LanguageSelector({ languages, currentLanguage, onLanguageChange }: Props) {
  if (languages.length <= 1) {
    return null; // Don't show selector if only one language available
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Language:</span>
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        style={{
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          background: "white",
          fontSize: 14,
          fontWeight: 500,
          color: "#374151",
          cursor: "pointer",
          minWidth: 100,
        }}
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
