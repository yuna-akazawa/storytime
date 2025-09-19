// src/lib/template.ts
/**
 * Simple {{token}} replacement with fallbacks. Extensible later for possessives/case.
 */
export function applyTemplate(
  text: string, 
  params: Record<string, string>, 
  fallbacks: Record<string, string> = {}
) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key]?.trim() ?? "";
    
    // If value is empty, check for story-specific fallback
    if (!value && fallbacks[key] !== undefined) {
      return fallbacks[key]; // Could be empty string for no fallback
    }
    
    // Default fallback for childName (for backwards compatibility)
    if (key === "childName" && !value && fallbacks[key] === undefined) {
      return "You";
    }
    
    return value;
  });
}
