# 🛡️ Storytime Repository Guardrails

## 🚨 Critical Boundaries

### ⛔️ ABSOLUTE PROHIBITIONS
- **NO PALETTE AI CODE**: Never import, reference, or modify anything from Palette AI repositories
- **NO CROSS-CONTAMINATION**: If you detect files, env vars, or remotes containing "palette" or "getpalette-ai", STOP immediately and warn
- **NO CHILD PII**: Never store, log, or transmit personally identifiable information about children
- **NO OPEN TEXT GENERATION**: Stories must be curated, no dynamic story generation in MVP

### 🔒 Security & Privacy
- All audio playback requires explicit user interaction (tap to play)
- Child names are ephemeral (URL params only, no persistent storage)
- Support "Delete All Data" functionality for privacy compliance
- No analytics with PII, no user tracking beyond essential app functionality

### 📐 Technical Standards
- **TypeScript Strict Mode**: All code must pass strict type checking
- **ESLint + Prettier**: Enforce consistent code style
- **Component Architecture**: Keep components small and focused
- **Performance First**: Optimize for iPad/tablet experience

## 📁 Project Structure

### ✅ WORK WITHIN THESE FOLDERS
```
src/app/          # Next.js App Router pages
src/components/   # React components
src/lib/          # Utilities and data
public/           # Static assets
scripts/          # Build and deployment scripts
supabase/         # Database schema and migrations
```

### ❌ AVOID THESE PATHS
```
node_modules/     # Dependencies
.next/            # Build output
.turbo/           # Turborepo cache
.vercel/          # Deployment cache
dist/             # Distribution files
build/            # Build artifacts
coverage/         # Test coverage
**/*palette*/**   # Anything containing "palette"
**/*getpalette*/**# Anything containing "getpalette"
```

## 🏗️ Architecture Guidelines

### Component Patterns
- **Server Components**: Data fetching, static content
- **Client Components**: Audio controls, user interactions
- **Naming**: PascalCase for components, kebab-case for files, camelCase for functions

### Data Flow
```
Stories (curated) → Template Processing ({{childName}}) → TTS → Audio Playback
```

### Performance Requirements
- Single AudioContext instance across the app
- Preload next page audio on current page load
- Minimize bundle size, avoid heavy client libraries
- Optimize for touch interactions on tablets

## 🎯 MVP Scope

### ✅ IN SCOPE
- Curated story library
- Name insertion templating
- Page-by-page TTS playback
- Simple navigation (prev/next/play/pause)
- Basic story selection interface

### ❌ OUT OF SCOPE (MVP)
- User accounts or authentication
- User-generated content
- Story creation tools
- Advanced personalization
- Social features or sharing
- Analytics with personal data

## 🔧 Development Workflow

### Before Making Changes
1. Verify you're working within approved folders
2. Check for any Palette AI references (auto-fail if found)
3. Ensure TypeScript strict mode compliance
4. Test on tablet/iPad viewport

### Code Review Checklist
- [ ] No Palette AI imports or references
- [ ] TypeScript strict mode passes
- [ ] Components are appropriately sized
- [ ] No child PII in code or logs
- [ ] Audio requires user interaction
- [ ] Performance optimized for tablets

### Testing Requirements
- Unit tests for templating utilities
- Integration tests for audio playback
- Accessibility testing for touch interfaces
- Performance testing on tablet devices

## 🚨 Emergency Protocols

### If Palette AI Code Detected
1. **STOP ALL WORK IMMEDIATELY**
2. Do not modify, import, or reference the detected code
3. Warn the user about the boundary violation
4. Suggest working only within Storytime-specific folders
5. Document the incident in this file

### Privacy Incident Response
1. Immediately assess scope of data exposure
2. Implement "Delete All Data" if not already available
3. Review all code for additional PII storage
4. Update privacy safeguards to prevent recurrence

## 📋 Quick Reference

### Allowed Dependencies
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase client libraries
- TTS providers (PlayHT, ElevenLabs, Azure)

### Forbidden Dependencies
- Any package from Palette AI ecosystem
- Libraries that store user data locally
- Heavy audio processing libraries
- Packages with known security vulnerabilities

---

**Remember**: This is a kids' app. Safety, privacy, and simplicity are paramount. When in doubt, choose the more restrictive option.
