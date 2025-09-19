// src/app/layout.tsx
import React from "react";

export const metadata = { 
  title: "Storytime MVP", 
  description: "Kid-friendly storytelling MVP",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Storytime"
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/favicon.svg'
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  themeColor: "#6366f1"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Additional PWA and fullscreen meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Storytime" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Reset and fullscreen styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            html, body {
              height: 100vh;
              height: 100dvh; /* Dynamic viewport height for mobile */
              overflow-x: hidden;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Fullscreen experience on mobile/tablet */
            @media (max-width: 1024px) {
              html, body {
                overflow: hidden;
              }
              
              /* Use safe area insets for devices with notches */
              body {
                padding-left: env(safe-area-inset-left, 0);
                padding-right: env(safe-area-inset-right, 0);
                padding-top: env(safe-area-inset-top, 0);
                padding-bottom: env(safe-area-inset-bottom, 0);
              }
            }
            
            /* Prevent text selection and context menus on touch devices */
            @media (pointer: coarse) {
              * {
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                user-select: none;
              }
              
              /* Allow text selection for story content only */
              [data-allow-select] {
                -webkit-user-select: text;
                user-select: text;
              }
            }
            
            /* Base body styles */
            body {
              font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.5;
              background: white;
            }
            
            /* Desktop styles - full width and height */
            @media (min-width: 1025px) {
              html, body {
                overflow: hidden; /* Prevent any scrolling */
              }
              
              body {
                padding: 0; /* Remove padding to prevent overflow */
                width: 100%;
                height: 100vh;
                margin: 0;
              }
            }
            
            /* Story reader layout - optimized for portrait */
            .story-reader-layout {
              grid-template-columns: 1fr !important;
              grid-template-rows: auto 1fr !important;
              gap: 12px !important;
            }
            
            /* Image container comes first (top) */
            .story-reader-layout > div:last-of-type {
              order: 1;
              max-height: 45vh;
              min-height: 200px;
            }
            
            /* Text container comes second (bottom) */
            .story-reader-layout > div:first-of-type {
              order: 2;
              min-height: 200px;
            }
            
            /* Desktop: keep side-by-side for larger screens */
            @media (min-width: 1025px) {
              .story-reader-layout {
                grid-template-columns: 1fr 1fr !important;
                grid-template-rows: 1fr !important;
              }
              
              .story-reader-layout > div:first-of-type {
                order: 1;
              }
              
              .story-reader-layout > div:last-of-type {
                order: 2;
                max-height: none;
              }
            }
            
            /* Landscape orientation warning/block */
            @media (orientation: landscape) and (max-width: 1024px) {
              .landscape-warning {
                display: flex !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0, 0, 0, 0.95) !important;
                color: white !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 9999 !important;
                text-align: center !important;
                padding: 20px !important;
              }
              
              .landscape-warning h2 {
                font-size: 24px !important;
                margin-bottom: 16px !important;
              }
              
              .landscape-warning p {
                font-size: 18px !important;
                opacity: 0.8 !important;
              }
            }
            
            @media (orientation: portrait) {
              .landscape-warning {
                display: none !important;
              }
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
