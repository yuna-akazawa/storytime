// src/components/StoryReader.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Atkinson_Hyperlegible } from "next/font/google";
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });
import { applyTemplate } from "../lib/template";
import { RotateCcw, ChevronLeft, ChevronRight, Play, Pause, X } from 'react-feather';

// Simple cache for alignment data to speed up page turns
const alignmentCache = new Map<string, any>();

type PageData = { text: string; imageUrl: string };
type Props = {
  pages: PageData[] | string[]; // backward compat
  childName: string;
  title?: string;
  voiceId?: string; // ElevenLabs voice ID for TTS
  languageSelector?: React.ReactNode; // Optional language selector component
};

/**
 * Minimal reader using the browser's SpeechSynthesis.
 * iPad Safari requires a user gesture to start audio: the "Read to me" button.
 * You can swap in a cloud TTS later and just feed the per-page audio instead.
 */
export default function StoryReader({ pages, childName, title, voiceId, languageSelector }: Props) {
  const [index, setIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [autoPlay, setAutoPlay] = useState(false); // enable autoplay after first user play
  const [autoScroll, setAutoScroll] = useState(false); // enable auto-scroll after first page
  const [isPageChanging, setIsPageChanging] = useState(false); // track if we're auto-advancing
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  
  // Word highlighting state
  const [wordTimings, setWordTimings] = useState<Array<{word: string, start: number, end: number}>>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const hasAutoStartedRef = useRef<boolean>(false);
  
  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.log("Fullscreen not supported or failed:", error);
    }
  };

  // Lock orientation to portrait (when supported)
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // Modern Screen Orientation API
        if ('screen' in window && 'orientation' in window.screen && 'lock' in window.screen.orientation) {
          await (window.screen.orientation as any).lock('portrait-primary');
          console.log('Orientation locked to portrait');
        }
        // Fallback for older browsers
        else if ('orientation' in window.screen && 'lockOrientation' in window.screen) {
          (window.screen as any).lockOrientation('portrait-primary');
        }
        // Legacy webkit
        else if ('webkitLockOrientation' in window.screen) {
          (window.screen as any).webkitLockOrientation('portrait-primary');
        }
        // Legacy moz
        else if ('mozLockOrientation' in window.screen) {
          (window.screen as any).mozLockOrientation('portrait-primary');
        }
      } catch (error) {
        console.log('Orientation lock not supported or failed:', error);
      }
    };

    // Only attempt orientation lock on mobile devices
    if (typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      lockOrientation();
    }

    // Cleanup function
    return () => {
      try {
        if ('screen' in window && 'orientation' in window.screen && 'unlock' in window.screen.orientation) {
          (window.screen.orientation as any).unlock();
        }
      } catch (error) {
        // Ignore unlock errors
      }
    };
  }, []);
  
  // Touch event handlers for buttons
  const handleButtonTouchStart = (e: React.TouchEvent) => {
    // Prevent the default touch behavior and add visual feedback
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
    (e.currentTarget as HTMLElement).style.opacity = '0.8';
  };
  
  const handleButtonTouchEnd = (e: React.TouchEvent, action: () => void) => {
    // Reset visual state and execute action
    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
    (e.currentTarget as HTMLElement).style.opacity = '1';
    action();
  };
  
  const handleButtonTouchCancel = (e: React.TouchEvent) => {
    // Reset visual state if touch is cancelled
    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };
  

  function isDesktop(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    return !isMobile;
  }

  function extractWordsFromAlignment(alignment: any, text: string): Array<{word: string, start: number, end: number}> {
    // Convert character-level timing to word-level timing
    const words: Array<{word: string, start: number, end: number}> = [];
    const characters = alignment.characters || [];
    const startTimes = alignment.character_start_times_seconds || [];
    const endTimes = alignment.character_end_times_seconds || [];
    
    let currentWord = '';
    let wordStartTime = 0;
    let wordStartIndex = -1;
    
    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const startTime = startTimes[i] || 0;
      const endTime = endTimes[i] || 0;
      
      // Check if this character should end the current word
      const isWordSeparator = char === ' ' || char === '\n' || char === '\t';
      const isEndOfText = i === characters.length - 1;
      
      if (isWordSeparator || isEndOfText) {
        // End of word (or end of text)
        if (isEndOfText && !isWordSeparator) {
          currentWord += char; // Include the last character if it's not a separator
        }
        
        if (currentWord.trim().length > 0) {
          const wordEndTime = isEndOfText ? endTime : endTimes[i - 1] || 0;
          
          words.push({
            word: currentWord.trim(),
            start: wordStartTime,
            end: wordEndTime
          });
        }
        
        // Reset for next word
        currentWord = '';
        wordStartIndex = -1;
      } else {
        // Building a word - include letters, numbers, and punctuation that's part of words
        if (wordStartIndex === -1) {
          wordStartIndex = i;
          wordStartTime = startTime;
        }
        currentWord += char;
      }
    }
    
    return words;
  }

  function updateWordHighlight(currentTimeSeconds: number) {
    if (wordTimings.length === 0) return;
    
    // Find the best word to highlight based on current time
    let bestIndex = -1;
    
    // First, try to find exact matches within timing windows
    for (let i = 0; i < wordTimings.length; i++) {
      const word = wordTimings[i];
      // More generous timing window for exact matches
      if (currentTimeSeconds >= word.start - 0.15 && currentTimeSeconds <= word.end + 0.25) {
        bestIndex = i;
        break;
      }
    }
    
    // If no exact match, find the word that should be playing now or next
    if (bestIndex === -1) {
      for (let i = 0; i < wordTimings.length; i++) {
        const word = wordTimings[i];
        
        // If we're before this word but close to it, highlight it
        if (currentTimeSeconds < word.start && word.start - currentTimeSeconds <= 0.3) {
          bestIndex = i;
          break;
        }
        
        // If we're past this word but not too far, keep it highlighted
        if (currentTimeSeconds > word.end && currentTimeSeconds - word.end <= 0.2) {
          bestIndex = i;
          // Don't break here, let later words override
        }
      }
    }
    
    // If still no match, find the closest word by position in time
    if (bestIndex === -1) {
      let minDistance = Infinity;
      for (let i = 0; i < wordTimings.length; i++) {
        const word = wordTimings[i];
        const distance = Math.abs(currentTimeSeconds - (word.start + word.end) / 2);
        if (distance < minDistance && distance <= 1.0) { // Within 1 second
          minDistance = distance;
          bestIndex = i;
        }
      }
    }
    
    // Update highlighting if we found a different word
    if (bestIndex !== currentWordIndex) {
      setCurrentWordIndex(bestIndex);
    }
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
    setCurrentWordIndex(-1);
    setWordTimings([]);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }

  function speakWithBrowserTTS(text: string) {
    if (typeof speechSynthesis === 'undefined') {
      console.error("Speech synthesis not supported");
      throw new Error("Speech synthesis not supported");
    }

    // Reset highlighting state (disabled for cost reduction)
    setCurrentWordIndex(-1);
    setWordTimings([]);
    lastUpdateTimeRef.current = 0;

    console.log('Using browser TTS without text highlighting');

    // Cancel any existing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Increased from 0.9 to 1.1 for faster reading
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setSpeaking(true);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setCurrentWordIndex(-1);
      
      // Auto-scroll to next page after TTS finishes (if enabled and not on last page)
      console.log(`Browser TTS ended. autoScroll: ${autoScroll}, index: ${index}, totalPages: ${renderedPages.length}`);
      if (autoScroll && index < renderedPages.length - 1) {
        setTimeout(() => {
          console.log('Auto-advancing to next page (browser TTS)');
          setIsPageChanging(true);
          setIndex(prevIndex => prevIndex + 1);
        }, 1500); // 1.5 second delay before auto-advance
      } else {
        console.log('Auto-advance not triggered - either autoScroll is false or on last page');
      }
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setCurrentWordIndex(-1);
    };

    try {
      speechSynthesis.speak(utterance);
      setAutoPlay(true);
    } catch (error) {
      console.error("Failed to start browser TTS:", error);
      setSpeaking(false);
      throw error;
    }
  }

  async function speak(text: string) {
    // Reset highlighting state
    setCurrentWordIndex(-1);
    setWordTimings([]);
    lastUpdateTimeRef.current = 0;
    cancelSpeech();

    try {
      // Initialize audio element with iOS-friendly settings
      if (!audioRef.current) {
        audioRef.current = new Audio();
        // iOS Safari specific settings
        audioRef.current.preload = "none"; // Don't preload on iOS
        (audioRef.current as any).playsInline = true; // Prevent fullscreen on iOS
      }
      
      // Reset audio element for each new playback
      audioRef.current.currentTime = 0;
      
      // Use regular audio without alignment to reduce costs
      console.log('Using standard TTS without text highlighting');
      const src = `/api/tts?text=${encodeURIComponent(text)}${voiceId ? `&voiceId=${voiceId}` : ''}`;
      audioRef.current.src = src;
      
      // Set up event handlers before loading
      audioRef.current.onended = () => {
        setSpeaking(false);
        setCurrentWordIndex(-1);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Auto-scroll to next page after TTS finishes (if enabled and not on last page)
        console.log(`ElevenLabs TTS ended. autoScroll: ${autoScroll}, index: ${index}, totalPages: ${renderedPages.length}`);
        if (autoScroll && index < renderedPages.length - 1) {
          setTimeout(() => {
            console.log('Auto-advancing to next page');
            setIsPageChanging(true);
            setIndex(prevIndex => prevIndex + 1);
          }, 1500); // 1.5 second delay before auto-advance
        } else {
          console.log('Auto-advance not triggered - either autoScroll is false or on last page');
        }
      };
      
      audioRef.current.onerror = (e) => {
        console.error("Audio error:", e);
        setSpeaking(false);
        setCurrentWordIndex(-1);
      };
      
      // No word highlighting - removed to reduce costs
      
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
            audio.playbackRate = 1.15; // Increased from 0.95 to 1.15 for faster reading
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

    } catch (error) {
      console.error("TTS API failed, falling back to browser speech:", error);
      // Fallback to browser speech synthesis
      try {
        speakWithBrowserTTS(text);
      } catch (browserError) {
        console.error("Browser TTS also failed:", browserError);
        setSpeaking(false);
        // Still trigger auto-scroll even if TTS fails
        if (autoScroll && index < renderedPages.length - 1) {
          setTimeout(() => {
            console.log('Auto-advancing to next page (TTS failed)');
            setIsPageChanging(true);
            setIndex(prevIndex => prevIndex + 1);
          }, 2000);
        }
      }
    }
  }

  useEffect(() => {
    // Auto-start reading the first page when component loads (only once)
    if (hasAutoStartedRef.current || renderedPages.length === 0) {
      return;
    }

    const startFirstPage = async () => {
      // Don't auto-start audio - require user interaction on all devices
      console.log("Story loaded - waiting for user interaction to start audio");
      setAutoPlay(true);
      hasAutoStartedRef.current = true;
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(startFirstPage, 200);

    // Cleanup function
    return () => {
      clearTimeout(timer);
    };
  }, [renderedPages]);

  useEffect(() => {
    // Cleanup when component unmounts
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
  useEffect(() => {
    if (!autoPlay || !autoScroll) return;
    
    // Auto-play during automatic page changes OR manual navigation after auto-scroll is enabled
    if (isPageChanging) {
      const page = current;
      if (page && page.text) {
        console.log(`Auto-playing page ${index + 1} after auto-advance`);
        speak(page.text);
      }
      
      // Reset the page changing flag
      setIsPageChanging(false);
    } else if (index > 0 && !speaking) {
      // If user manually navigated and auto-scroll is enabled, auto-play
      const page = current;
      if (page && page.text) {
        console.log(`Auto-playing page ${index + 1} after manual navigation`);
        speak(page.text);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]); // Only depend on index changes

  // Pre-cache disabled to reduce API costs

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
    setAutoScroll(true); // Enable auto-scroll when restarting
    if (first?.text) {
      speak(first.text);
    }
  }

  return (
    <>
      {/* Landscape orientation warning overlay */}
      <div className="landscape-warning" style={{ display: "none" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>📱</div>
        <h2>Please rotate your device</h2>
        <p>This app is designed for portrait mode.<br />Please turn your device upright to continue reading.</p>
      </div>

      <section 
  className={`${atkinson.className} story-reader-layout`}
  style={{ 
    display: "grid", 
    gridTemplateColumns: "40% 60%", // Use fr units instead of "30fr 70fr"
    gridTemplateRows: "1fr",
    gap: 16,
    alignItems: "stretch", 
    position: "relative",
    height: "100vh",
    width: "100%", // Changed from 100vw to 100%
    padding: "4px",
    maxHeight: "100vh",
    overflow: "hidden",
    margin: 0
  }}
  onTouchStart={onTouchStart} 
  onTouchEnd={onTouchEnd}
>
      {/* Exit (X) button - top-right */}
      <Link 
        href="/" 
        onClick={cancelSpeech}
        onTouchStart={handleButtonTouchStart}
        onTouchEnd={(e) => handleButtonTouchEnd(e, cancelSpeech)}
        onTouchCancel={handleButtonTouchCancel}
        aria-label="Exit story" 
        style={closeBtn as React.CSSProperties}
      >
        <X size={18} />
      </Link>
      {/* Left: text column */}
      <div style={{ display: "flex", flexDirection: "column", padding: "16px 20px", width: "auto"}}>
        {/* Title */}
        {typeof title === "string" && title.length > 0 ? (
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#7c3aed", marginBottom: 16 }}>{title}</h2>
        ) : <div style={{ height: 8 }} />}

        {/* Page text without highlighting */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div data-allow-select style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 20 }}>
            {current.text}
          </div>
      </div>

        {/* Footer row: language selector left, controls right */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
          {/* Language selector on the left */}
          <div>
            {languageSelector}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {/* Pagination just left of the buttons */}
            <div style={{ fontSize: 14, color: "#6b7280", marginRight: 8 }}>Page {index + 1} of {renderedPages.length}</div>
            
            {/* Restart button - only show on page 2 onwards */}
            {index > 0 && (
              <button 
                onClick={restartFromBeginning}
                onTouchStart={handleButtonTouchStart}
                onTouchEnd={(e) => handleButtonTouchEnd(e, restartFromBeginning)}
                onTouchCancel={handleButtonTouchCancel}
                style={iconBtn} 
                aria-label="Restart"
              >
                <RotateCcw size={20} />
              </button>
            )}
            
            {/* Previous button */}
            <button
              onClick={() => {
                cancelSpeech(); // Stop current audio
                setIndex((i) => Math.max(0, i - 1));
              }}
              onTouchStart={handleButtonTouchStart}
              onTouchEnd={(e) => handleButtonTouchEnd(e, () => {
                cancelSpeech(); // Stop current audio
                setIndex((i) => Math.max(0, i - 1));
              })}
              onTouchCancel={handleButtonTouchCancel}
              style={iconBtn}
              aria-label="Previous"
              disabled={index === 0}
            >
              <ChevronLeft size={20} />
            </button>
            
            {/* Play/Pause button */}
            {!speaking ? (
              <button 
                onClick={() => {
                  console.log('Play button clicked - enabling auto-scroll');
                  setAutoScroll(true); // Enable auto-scroll on first play
                  speak(current.text);
                }}
                onTouchStart={handleButtonTouchStart}
                onTouchEnd={(e) => handleButtonTouchEnd(e, () => {
                  setAutoScroll(true); // Enable auto-scroll on first play
                  speak(current.text);
                })}
                onTouchCancel={handleButtonTouchCancel}
                style={iconBtn} 
                aria-label="Play"
              >
                <Play size={20} />
              </button>
            ) : (
              <button 
                onClick={cancelSpeech}
                onTouchStart={handleButtonTouchStart}
                onTouchEnd={(e) => handleButtonTouchEnd(e, cancelSpeech)}
                onTouchCancel={handleButtonTouchCancel}
                style={iconBtn} 
                aria-label="Pause"
              >
                <Pause size={20} />
              </button>
            )}
            
            {/* Next button */}
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
              onTouchStart={handleButtonTouchStart}
              onTouchEnd={(e) => handleButtonTouchEnd(e, () => {
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
              })}
              onTouchCancel={handleButtonTouchCancel}
              style={iconBtn}
              aria-label="Next"
              disabled={index === renderedPages.length - 1}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Right: image column */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "auto" }}>
        {current.imageUrl ? (
          <img src={current.imageUrl} alt="Story page illustration" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12, border: "1px solid #e5e7eb" }} />
        ) : null}
      </div>
    </section>
    </>
  );
}


const iconBtn: React.CSSProperties = {
  width: 50,
  height: 50,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 0.1s ease, opacity 0.1s ease",
  cursor: "pointer",
};

const closeBtn = {
  position: "absolute",
  top: 8,
  right: 8,
  width: 50,
  height: 50,
  borderRadius: 9999,
  background: "white",
  border: "1px solid #e5e7eb",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  transition: "transform 0.1s ease, opacity 0.1s ease",
  cursor: "pointer",
} as const;
