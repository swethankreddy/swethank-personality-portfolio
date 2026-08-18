# Session Summary

## What was built

This portfolio is a Next.js 16 app with two personas (Builder / Creator), a full-screen hero, and an integrated conversational chatbot. Work spanned multiple sessions. This document captures the complete state as of the most recent session.

---

## Architecture

```
app/
  layout.tsx          — SF Pro Display via next/font/local, global font token
  globals.css         — Tailwind v4, OKLCH tokens, surface transitions
  page.tsx            — Server component, reads ?persona= from searchParams
  api/
    chat/route.ts     — SSE streaming endpoint, Anthropic SDK

components/
  PortfolioPage.tsx   — Client wrapper, owns chatOpen + initialQuery state
  Hero.tsx            — Persona toggle, headline, CTAs, chat trigger
  Nav.tsx             — Minimal top nav
  ChatSection.tsx     — Editorial transcript-style conversation

public/
  fonts/              — SF Pro Display OTF files (4 weights, user must supply)
  reference/          — builder-portrait.png, creator-portrait.png, DESIGN-apple.md
```

---

## Key decisions

### Persona system
- Two personas: Builder and Creator
- URL-persisted via `?persona=builder` / `?persona=creator`
- `data-persona` attribute on `<html>` drives CSS variable `--surface` for background color
- Background transitions 400ms ease on switch
- Framer Motion segmented control with `layoutId="toggle-bg"` spring animation

### Typography
- SF Pro Display self-hosted (4 OTF files in `public/fonts/`)
- `next/font/local` — validated at build time, fails if files missing
- Placeholder font files installed so the build succeeds without real SF Pro
- **User must replace with real SF Pro Display OTF files from developer.apple.com**
- Display type: `clamp(44px, 6vw, 80px)` fluid, `line-height: 1.0`
- Body: 17px / 1.47 / tracking -0.022em

### Colors (OKLCH)
- Builder surface: `oklch(93% 0.018 85)` — warm cream
- Creator surface: `oklch(92% 0.025 72)` — amber cream
- Ink: `oklch(11% 0.010 85)`
- Muted: `oklch(45% 0.010 85)`
- Gold (focus): `oklch(80% 0.170 90)`

### Chat trigger (Hero)
- Styled `<button>` that looks like an input — NOT a real `<input>`
- Clicking it opens ChatSection and scrolls there
- Suggestion chips send a pre-filled query
- This avoids the double-input UX problem (both hero and chat section having active inputs simultaneously)

### ChatSection
- Opens below the hero with `y: 24 → y: 0`, 500ms ease
- Auto-focuses textarea on mount (350ms delay to let animation settle)
- Editorial transcript style: "You" / "Swethank" 10px uppercase labels, 17px body
- SSE streaming from `/api/chat` with blinking cursor during stream
- No section label (removed to avoid redundancy with hero trigger label)
- Thin rule always visible above input, tighter margin when no messages
- `textarea:focus` global CSS suppresses browser's native focus chrome

### Streaming API
- `app/api/chat/route.ts` — SSE with `ReadableStream`, `text/event-stream`
- Uses `@anthropic-ai/sdk` with `claude-haiku-4-5-20251001`
- Two system prompts: builder (research / AI products) and creator (motion / visual)
- Reads persona from POST body, not URL
- **Requires `ANTHROPIC_API_KEY` in `.env.local`**

### Portrait
- Desktop: `hidden flex-1 lg:block`, `object-contain object-right-bottom`
- Mobile: `h-72 lg:hidden` at top of page
- Both portraits always mounted, opacity toggled (avoids React 19 Strict Mode double-mount bug with Framer Motion)
- Left-fade gradient on desktop: `w-48 from-surface to-transparent` blends portrait into text column

---

## Setup required

### 1. SF Pro Display fonts
Place these four files in `public/fonts/`:
```
SF-Pro-Display-Light.otf      (weight 300)
SF-Pro-Display-Regular.otf    (weight 400)
SF-Pro-Display-Semibold.otf   (weight 600)
SF-Pro-Display-Bold.otf       (weight 700)
```
Download from developer.apple.com (requires Apple Developer account).
Current placeholder files are Geist woff2 renamed — the font will not look correct until replaced.

### 2. Anthropic API key
```
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Writing rules (always apply)
- No em dashes, no semicolons
- No: "passionate about", "leveraging", "bridging the gap", "where X meets Y"
- Short sentences. Direct language. Editorial tone.

---

## What still needs work
- Conversation history: messages clear on page reload (no persistence)
- No way to close the chat section once opened
- Markdown rendering in Swethank's responses (currently plain text)
- Mobile: send button in hero trigger may appear slightly clipped at 390px (Playwright artifact — looks correct in real browser)
- `public/fonts/` needs real SF Pro files
- `.env.local` needs real API key
