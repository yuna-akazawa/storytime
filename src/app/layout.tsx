// src/app/layout.tsx
import React from "react";

export const metadata = { title: "Storytime MVP", description: "Kid-friendly storytelling MVP" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial', lineHeight: 1.5, padding: 24, maxWidth: 820, margin: '0 auto' }}>
        {children}
      </body>
    </html>
  );
}
