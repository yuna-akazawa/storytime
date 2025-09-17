// src/lib/template.ts
/**
 * Simple {{token}} replacement with fallbacks. Extensible later for possessives/case.
 */
export function applyTemplate(text: string, params: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key]?.trim() ?? "";
    
    // Use "You" as fallback for childName when empty or not provided
    if (key === "childName" && !value) {
      return "You";
    }
    
    return value;
  });
}
