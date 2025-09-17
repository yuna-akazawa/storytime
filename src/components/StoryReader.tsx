// src/components/StoryReader.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Atkinson_Hyperlegible } from "next/font/google";
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });
import { applyTemplate } from "../lib/template";


type PageData = { text: string; imageUrl: string };
type Props = {
  pages: PageData[] | string[]; // backward compat
  childName: string;
  title?: string;
};

/**
 * Minimal reader using the browser's SpeechSynthesis.
 * iPad Safari requires a user gesture to start audio: the "Read to me" button.
 * You can swap in a cloud TTS later and just feed the per-page audio instead.
 */
export default function StoryReader({ pages, childName, title }: Props) {
  const [index, setIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [autoPlay, setAutoPlay] = useState(false); // enable autoplay after first user play
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  

  function isDesktop(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    return !isMobile;
  }


  const normalizedPages: PageData[] = useMemo(() => {
    if (typeof pages[0] === "string") {
      return (pages as string[]).map((t) => ({ text: t, imageUrl: "/images/placeholder.svg" }));
    }
    return pages as PageData[];
  }, [pages]);

  const renderedPages = useMemo(
    () => normalizedPages.map((p) => ({ ...p, text: applyTemplate(p.text, { childName }) })),
    [normalizedPages, childName]
  );

  const current = renderedPages[index];

  function cancelSpeech() {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
    }
    // Also cancel browser speech synthesis
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
    setSpeaking(false);
  }

  function speakWithBrowserTTS(text: string) {
    if (typeof speechSynthesis === 'undefined') {
      console.error("Speech synthesis not supported");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for children
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    speechSynthesis.speak(utterance);
    setAutoPlay(true);
  }

  async function speak(text: string) {
    cancelSpeech();

    try {
      // Check if TTS API is available first
      const ttsResponse = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);

      if (ttsResponse.ok) {
        const contentType = ttsResponse.headers.get('content-type');

        // Check if we got a fallback response (JSON) instead of audio
        if (contentType?.includes('application/json')) {
          const fallbackData = await ttsResponse.json();
          if (fallbackData.useFallback) {
            // Use browser's built-in speech synthesis
            console.log("Using browser speech synthesis fallback");
            return speakWithBrowserTTS(text);
          }
        }

        // We have audio data, use normal audio playback
        // Initialize audio element with iOS-friendly settings
        if (!audioRef.current) {
          audioRef.current = new Audio();
          // iOS Safari specific settings
          audioRef.current.preload = "none"; // Don't preload on iOS
          (audioRef.current as any).playsInline = true; // Prevent fullscreen on iOS
        }

        // Reset audio element for each new playback
        audioRef.current.currentTime = 0;

        // Use regular TTS audio
        const src = `/api/tts?text=${encodeURIComponent(text)}`;
        audioRef.current.src = src;
      
      // Set up event handlers before loading
      audioRef.current.onended = () => {
        setSpeaking(false);
      };
      
      audioRef.current.onerror = (e) => {
        console.error("Audio error:", e);
        setSpeaking(false);
      };
      
      // iOS-specific: Wait for the audio to be ready before playing
      const playAudio = () => {
        return new Promise<void>((resolve, reject) => {
          if (!audioRef.current) {
            reject(new Error("No audio element"));
            return;
          }
          
          const audio = audioRef.current;
          
          // Set playback rate after loading
          const onCanPlay = () => {
            audio.playbackRate = 0.95;
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (e: any) => {
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            reject(e);
          };
          
          audio.addEventListener('canplay', onCanPlay);
          audio.addEventListener('error', onError);
          
          // Load the audio
          audio.load();
        });
      };
      
      // Load and play the audio
      await playAudio();
      await audioRef.current.play();
      setSpeaking(true);
      setAutoPlay(true);

      } else {
        // TTS API returned error status, use browser fallback
        console.log("TTS API unavailable, using browser speech synthesis");
        return speakWithBrowserTTS(text);
      }

    } catch (error) {
      console.error("TTS API failed, falling back to browser speech:", error);
      // Fallback to browser speech synthesis
      speakWithBrowserTTS(text);
    }
  }

  useEffect(() => {
    // Stop any ongoing speech when page changes or component unmounts
    return () => {
      cancelSpeech();
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoplay when page index changes (after first user gesture)
  // Disabled on iOS devices due to autoplay restrictions
  useEffect(() => {
    if (!autoPlay) return;
    
    // Skip autoplay on iOS devices
    const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && index > 0) {
      // On iOS, don't autoplay when changing pages - user must tap play button
      return;
    }
    
    const page = current;
    if (page && page.text) {
      speak(page.text);
    }
  }, [index, autoPlay, current]);


  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  }

  function onTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const SWIPE_THRESHOLD = 40;
    if (absX > absY && absX > SWIPE_THRESHOLD) {
      if (dx < 0) {
        // swipe left → next
        if (index < renderedPages.length - 1) {
          cancelSpeech();
          setIndex(index + 1);
        }
      } else {
        // swipe right → prev
        if (index > 0) {
          cancelSpeech();
          setIndex(index - 1);
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  function restartFromBeginning() {
    cancelSpeech();
    const first = renderedPages[0];
    setIndex(0);
    setAutoPlay(true);
    if (first?.text) {
      speak(first.text);
    }
  }

  return (
    <section className={atkinson.className} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch", position: "relative" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Exit (X) button - top-right */}
      <Link href="/" onClick={cancelSpeech} aria-label="Exit story" style={closeBtn as React.CSSProperties}>
        <img src="/icons/close.svg" alt="Close" width={18} height={18} />
      </Link>
      {/* Left: text column */}
      <div style={{ display: "flex", flexDirection: "column", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 24px", minHeight: 480 }}>
        {/* Title */}
        {typeof title === "string" && title.length > 0 ? (
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#7c3aed", marginBottom: 16 }}>{title}</h2>
        ) : <div style={{ height: 8 }} />}

        {/* Page text */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 16 }}>
            {current.text}
          </div>
        </div>

        {/* Footer row: pagination left, controls right */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>page {index + 1} of {renderedPages.length}</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              style={iconBtn}
              aria-label="Back"
              disabled={index === 0}
            >
              <img src="/icons/back.svg" alt="Back" width={20} height={20} />
            </button>
            {!speaking ? (
              index === renderedPages.length - 1 ? (
                <button onClick={restartFromBeginning} style={iconBtn} aria-label="Restart">
                  <img src="/icons/restart.svg" alt="Restart" width={20} height={20} />
                </button>
              ) : (
                <button onClick={() => speak(current.text)} style={iconBtn} aria-label="Read">
                  <img src="/icons/read.svg" alt="Read" width={20} height={20} />
                </button>
              )
            ) : (
              <button onClick={cancelSpeech} style={iconBtn} aria-label="Pause">
                <img src="/icons/pause.svg" alt="Pause" width={20} height={20} />
              </button>
            )}
            <button
                  onClick={() => {
                    // advance page
                    const nextIdx = Math.min(renderedPages.length - 1, index + 1);
                    cancelSpeech();
                    setIndex(nextIdx);
                    
                    // Check if we're on iOS
                    const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
                    
                    // On desktop (and first interaction), auto-play immediately
                    if (!autoPlay && isDesktop() && !isIOS) {
                      const nextPage = renderedPages[nextIdx];
                      if (nextPage?.text) {
                        speak(nextPage.text);
                        setAutoPlay(true);
                      }
                    }
                    // On iOS, just enable autoplay for manual play button use
                    else if (isIOS && !autoPlay) {
                      setAutoPlay(true);
                    }
                  }}
              style={iconBtn}
              aria-label="Next"
              disabled={index === renderedPages.length - 1}
            >
              <img src="/icons/next.svg" alt="Next" width={20} height={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Right: image column */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {current.imageUrl ? (
          <img src={current.imageUrl} alt="Story page illustration" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12, border: "1px solid #e5e7eb" }} />
        ) : null}
      </div>
    </section>
  );
}

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #111827",
  background: "white",
};

const btnPrimary: React.CSSProperties = { ...btn, background: "#111827", color: "white" };

const iconBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const closeBtn = {
  position: "absolute",
  top: 8,
  right: 8,
  width: 36,
  height: 36,
  borderRadius: 9999,
  background: "white",
  border: "1px solid #e5e7eb",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
} as const;
