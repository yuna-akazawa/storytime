// src/app/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { stories } from "../lib/stories";

const STORAGE_KEY = "storytime_child_names";

export default function HomePage() {
  const [childName, setChildName] = useState("");
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [showAddButton, setShowAddButton] = useState(false);

  // Load saved names from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const names = JSON.parse(saved);
        setSavedNames(names);
        // Auto-select the most recently used name
        if (names.length > 0) {
          setChildName(names[0]);
        }
      }
    }
  }, []);

  // Show/hide Add button based on input
  useEffect(() => {
    const trimmedName = childName.trim();
    const isNewName = trimmedName.length > 0 && !savedNames.includes(trimmedName);
    setShowAddButton(isNewName);
  }, [childName, savedNames]);

  const addName = () => {
    const trimmedName = childName.trim();
    if (trimmedName && !savedNames.includes(trimmedName)) {
      const newNames = [trimmedName, ...savedNames].slice(0, 5); // Keep max 5 names
      setSavedNames(newNames);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newNames));
      }
      setShowAddButton(false);
    }
  };

  const selectName = (name: string) => {
    setChildName(name);
    // Move selected name to front of the list
    const reorderedNames = [name, ...savedNames.filter(n => n !== name)];
    setSavedNames(reorderedNames);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reorderedNames));
    }
  };

  const removeName = (nameToRemove: string) => {
    const filteredNames = savedNames.filter(name => name !== nameToRemove);
    setSavedNames(filteredNames);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredNames));
    }
    if (childName === nameToRemove) {
      setChildName("");
    }
  };

  return (
    <main style={{ 
      padding: "40px 20px",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ 
          fontSize: 48, 
          fontWeight: 500, 
          marginBottom: 12,
          color: "#6366f1",
          letterSpacing: "-0.025em"
        }}>
          Welcome to my storytime
        </h1>
        <p style={{ 
          fontSize: 18,
          color: "#6b7280",
          marginBottom: 32,
          lineHeight: 1.6
        }}>
          Enter your child's name and pick a story. Make sure you have turned on the volume on your device.
        </p>

        {/* Name Input Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ 
            display: "flex", 
            gap: 12, 
            alignItems: "flex-end",
            marginBottom: 16
          }}>
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Add child's name"
              style={{ 
                padding: "12px 16px",
                fontSize: 16,
                border: "2px solid #e5e7eb",
                borderRadius: 12,
                outline: "none",
                transition: "border-color 0.2s",
                minWidth: "200px"
              }}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
            {showAddButton && (
              <button
                onClick={addName}
                style={{
                  padding: "12px 24px",
                  fontSize: 16,
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#4f46e5"}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#6366f1"}
              >
                Add name
              </button>
            )}
          </div>

          {savedNames.length > 0 && (
            <div>
              <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>Saved names:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {savedNames.map((name) => (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      background: name === childName ? "#eff6ff" : "#f9fafb",
                      border: name === childName ? "2px solid #6366f1" : "1px solid #e5e7eb",
                      borderRadius: 20,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onClick={() => selectName(name)}
                  >
                    <span>{name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeName(name);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#9ca3af",
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: 0,
                        width: "18px",
                        height: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%"
                      }}
                      onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#f3f4f6"}
                      onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "transparent"}
                      title="Remove name"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stories Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 24,
        marginTop: 40
      }}>
        {stories.map((s) => {
          const href = `/read/${encodeURIComponent(s.slug)}?name=${encodeURIComponent(childName || "")}`;
          const thumbnailImage = s.pages[0]?.imageUrl || "/images/placeholder.svg";
          
          return (
            <Link
              key={s.slug}
              href={href}
              style={{
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <div 
                style={{
                  background: "#fbbf24", // Yellow background like in the image
                  borderRadius: 20,
                  padding: 20,
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px -1px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                }}
              >
                {/* Story Image */}
                <div style={{
                  width: "100%",
                  height: 240,
                  borderRadius: 16,
                  overflow: "hidden",
                  marginBottom: 16,
                  background: "#f3f4f6"
                }}>
                  <img 
                    src={thumbnailImage}
                    alt={s.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                    }}
                  />
                </div>

                {/* Story Title */}
                <h3 style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  marginBottom: 8,
                  color: "#1f2937",
                  lineHeight: 1.3
                }}>
                  {s.title}
                </h3>

                {/* Story Description/Moral */}
                <p style={{ 
                  fontSize: 14,
                  color: "#4b5563",
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  {s.moral}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
