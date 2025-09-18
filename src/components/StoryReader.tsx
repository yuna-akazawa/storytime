// src/components/StoryReader.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Atkinson_Hyperlegible } from "next/font/google";
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });
import { applyTemplate } from "../lib/template";

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
      return;
    }

    // Reset highlighting state
    setCurrentWordIndex(-1);
    setWordTimings([]);
    lastUpdateTimeRef.current = 0;

    // Create estimated word timings for browser TTS highlighting
    console.log('Using browser TTS with estimated timing for highlighting');
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const baseWordsPerSecond = 2.0; // Slightly slower for browser TTS
    let currentTime = 0.2; // Small delay at start
    
    const estimatedTimings = words.map((word, i) => {
      // Adjust timing based on word characteristics
      let wordDuration = 1 / baseWordsPerSecond;
      
      // Longer words take more time
      if (word.length > 6) wordDuration *= 1.3;
      else if (word.length < 3) wordDuration *= 0.8;
      
      // Punctuation adds a pause
      if (word.match(/[.!?]$/)) wordDuration *= 1.4;
      else if (word.match(/[,;:]$/)) wordDuration *= 1.2;
      
      const startTime = currentTime;
      const endTime = currentTime + wordDuration;
      currentTime = endTime + 0.04; // Small gap between words
      
      return {
        word: word,
        start: startTime,
        end: endTime
      };
    });
    
    setWordTimings(estimatedTimings);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for children
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Create a timer-based highlighting system for browser TTS
    let highlightTimer: NodeJS.Timeout | null = null;
    let startTime: number;

    utterance.onstart = () => {
      setSpeaking(true);
      startTime = Date.now();
      
      // Start the highlighting timer
      const updateHighlight = () => {
        if (!speaking) return; // Stop if no longer speaking
        
        const elapsed = (Date.now() - startTime) / 1000; // Convert to seconds
        updateWordHighlight(elapsed);
        
        // Continue updating every 50ms for smooth highlighting
        highlightTimer = setTimeout(updateHighlight, 50);
      };
      
      updateHighlight();
    };

    utterance.onend = () => {
      setSpeaking(false);
      setCurrentWordIndex(-1);
      if (highlightTimer) {
        clearTimeout(highlightTimer);
        highlightTimer = null;
      }
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setCurrentWordIndex(-1);
      if (highlightTimer) {
        clearTimeout(highlightTimer);
        highlightTimer = null;
      }
    };

    speechSynthesis.speak(utterance);
    setAutoPlay(true);
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
      
      // Try alignment first, but don't block on it
      let useAlignment = false;
      const cacheKey = text.trim();
      
      try {
        // Check cache first
        let alignmentData = alignmentCache.get(cacheKey);
        
        if (!alignmentData) {
          // Fetch with timeout if not cached
          const ttsUrl = `/api/tts?text=${encodeURIComponent(text)}&alignment=true${voiceId ? `&voiceId=${voiceId}` : ''}`;
          const alignmentResponse = await Promise.race([
            fetch(ttsUrl),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)) // 3s timeout
          ]) as Response;
          
          if (alignmentResponse.ok) {
            alignmentData = await alignmentResponse.json();
            // Cache the result if it has proper alignment data
            if (alignmentData?.alignment?.characters && alignmentData?.audio_base64) {
              alignmentCache.set(cacheKey, alignmentData);
            }
          }
        }
        
        // Check if we have valid alignment data
        if (alignmentData?.alignment?.characters && alignmentData?.audio_base64) {
          const words = extractWordsFromAlignment(alignmentData.alignment, text);
          if (words.length > 0) {
            console.log('Using ElevenLabs alignment for precise highlighting');
            setWordTimings(words);
            
            // Convert base64 audio to blob URL
            const audioBlob = new Blob([Uint8Array.from(atob(alignmentData.audio_base64), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current.src = audioUrl;
            useAlignment = true;
          }
        }
      } catch (error) {
        console.log('Alignment request failed:', error);
      }
      
      // Fallback to regular audio if alignment failed
      if (!useAlignment) {
        console.log('Using fallback estimated timing for highlighting');
        const src = `/api/tts?text=${encodeURIComponent(text)}${voiceId ? `&voiceId=${voiceId}` : ''}`;
        audioRef.current.src = src;
        
        // Create better estimated word timings based on word length and speech patterns
        const words = text.split(/\s+/).filter(w => w.trim().length > 0);
        const baseWordsPerSecond = 2.2; // Slightly slower for better accuracy
        let currentTime = 0.3; // Small delay at start
        
        const estimatedTimings = words.map((word, i) => {
          // Adjust timing based on word characteristics
          let wordDuration = 1 / baseWordsPerSecond;
          
          // Longer words take more time
          if (word.length > 6) wordDuration *= 1.3;
          else if (word.length < 3) wordDuration *= 0.8;
          
          // Punctuation adds a pause
          if (word.match(/[.!?]$/)) wordDuration *= 1.4;
          else if (word.match(/[,;:]$/)) wordDuration *= 1.2;
          
          const startTime = currentTime;
          const endTime = currentTime + wordDuration;
          currentTime = endTime + 0.05; // Small gap between words
          
          return {
            word: word,
            start: startTime,
            end: endTime
          };
        });
        
        setWordTimings(estimatedTimings);
      }
      
      // Set up event handlers before loading
      audioRef.current.onended = () => {
        setSpeaking(false);
        setCurrentWordIndex(-1);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
      
      audioRef.current.onerror = (e) => {
        console.error("Audio error:", e);
        setSpeaking(false);
        setCurrentWordIndex(-1);
      };
      
      // Set up word highlighting during playback
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current && wordTimings.length > 0) {
          const currentTime = audioRef.current.currentTime;
          // Update highlighting more frequently for better responsiveness
          if (currentTime - lastUpdateTimeRef.current >= 0.02) { // 50fps updates
            updateWordHighlight(currentTime);
            lastUpdateTimeRef.current = currentTime;
          }
        }
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

    } catch (error) {
      console.error("TTS API failed, falling back to browser speech:", error);
      // Fallback to browser speech synthesis
      speakWithBrowserTTS(text);
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

  // Pre-cache next page audio for faster page turns
  useEffect(() => {
    const nextIndex = index + 1;
    if (nextIndex < renderedPages.length) {
      const nextPage = renderedPages[nextIndex];
      if (nextPage?.text) {
        const nextCacheKey = nextPage.text.trim();
        if (!alignmentCache.has(nextCacheKey)) {
          // Pre-fetch alignment data in background
          const preCacheUrl = `/api/tts?text=${encodeURIComponent(nextPage.text)}&alignment=true${voiceId ? `&voiceId=${voiceId}` : ''}`;
          fetch(preCacheUrl)
            .then(response => {
              if (response.ok) {
                return response.json();
              }
            })
            .then(alignmentData => {
              if (alignmentData?.alignment && alignmentData?.audio_base64) {
                alignmentCache.set(nextCacheKey, alignmentData);
              }
            })
            .catch(() => {
              // Ignore pre-cache failures
            });
        }
      }
    }
  }, [index, renderedPages]);

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
          gridTemplateColumns: "40% 60%", 
          gridTemplateRows: "1fr",
          gap: 16, // Gap between text and image columns
          alignItems: "stretch", 
          position: "relative",
          height: "100vh", // Use viewport height
          width: "100vw", // Use viewport width
          padding: "4px", // Reduced padding
          maxHeight: "100vh",
          maxWidth: "100vw",
          overflow: "hidden",
          boxSizing: "border-box",
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
        <img src="/icons/close.svg" alt="Close" width={18} height={18} />
      </Link>
      {/* Left: text column */}
      <div style={{ display: "flex", flexDirection: "column", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", height: "100%", minHeight: "0" }}>
        {/* Title */}
        {typeof title === "string" && title.length > 0 ? (
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#7c3aed", marginBottom: 16 }}>{title}</h2>
        ) : <div style={{ height: 8 }} />}

        {/* Page text with word highlighting */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div data-allow-select style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 20 }}>
            {wordTimings.length > 0 ? (
              // Render with word-level highlighting
              wordTimings.map((wordData, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: i === currentWordIndex ? "#fef3c7" : "transparent", // Yellow highlight
                    color: i === currentWordIndex ? "#92400e" : "inherit", // Darker text when highlighted
                    padding: "2px 1px",
                    borderRadius: "3px",
                    transition: "all 0.15s ease-in-out",
                    boxShadow: i === currentWordIndex ? "0 0 0 2px #fbbf24" : "none", // Subtle glow
                  }}
                >
                  {wordData.word}
                  {i < wordTimings.length - 1 ? " " : ""}
                </span>
              ))
            ) : (
              // Fallback to regular text if no timing data
              current.text
            )}
          </div>
      </div>

        {/* Footer row: language selector left, controls right */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
          {/* Language selector on the left */}
          <div>
            {languageSelector}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {/* Pagination just left of the back button */}
            <div style={{ fontSize: 12, color: "#6b7280", marginRight: 8 }}>page {index + 1} of {renderedPages.length}</div>
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
              onTouchStart={handleButtonTouchStart}
              onTouchEnd={(e) => handleButtonTouchEnd(e, () => setIndex((i) => Math.max(0, i - 1)))}
              onTouchCancel={handleButtonTouchCancel}
              style={iconBtn}
              aria-label="Back"
          disabled={index === 0}
        >
              <img src="/icons/back.svg" alt="Back" width={20} height={20} />
        </button>
        {!speaking ? (
              index === renderedPages.length - 1 ? (
                <button 
                  onClick={restartFromBeginning}
                  onTouchStart={handleButtonTouchStart}
                  onTouchEnd={(e) => handleButtonTouchEnd(e, restartFromBeginning)}
                  onTouchCancel={handleButtonTouchCancel}
                  style={iconBtn} 
                  aria-label="Restart"
                >
                  <img src="/icons/restart.svg" alt="Restart" width={20} height={20} />
          </button>
        ) : (
                <button 
                  onClick={() => speak(current.text)}
                  onTouchStart={handleButtonTouchStart}
                  onTouchEnd={(e) => handleButtonTouchEnd(e, () => speak(current.text))}
                  onTouchCancel={handleButtonTouchCancel}
                  style={iconBtn} 
                  aria-label="Read"
                >
                  <img src="/icons/read.svg" alt="Read" width={20} height={20} />
                </button>
              )
            ) : (
              <button 
                onClick={cancelSpeech}
                onTouchStart={handleButtonTouchStart}
                onTouchEnd={(e) => handleButtonTouchEnd(e, cancelSpeech)}
                onTouchCancel={handleButtonTouchCancel}
                style={iconBtn} 
                aria-label="Pause"
              >
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
              <img src="/icons/next.svg" alt="Next" width={20} height={20} />
        </button>
          </div>
        </div>
      </div>

      {/* Right: image column */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "0" }}>
        {current.imageUrl ? (
          <img src={current.imageUrl} alt="Story page illustration" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12, border: "1px solid #e5e7eb", maxHeight: "100vh" }} />
        ) : null}
      </div>
    </section>
    </>
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
  transition: "transform 0.1s ease, opacity 0.1s ease",
  cursor: "pointer",
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
  transition: "transform 0.1s ease, opacity 0.1s ease",
  cursor: "pointer",
} as const;
