# Hero Design Specification
**Project:** Swethank Personality Portfolio  
**Direction:** Direction 1 — "The Journal"  
**Date:** 2026-06-18  
**Status:** Awaiting owner approval

---

## Design Philosophy

Five principles govern every decision in this spec. When implementation choices arise that the spec doesn't cover, use these to decide.

1. **One person, two lenses.** The toggle does not switch identities. It reveals two modes of operating from the same person. Engineering, Design, and Storytelling are the three disciplines; Builder and Creator are two entry points into that unified identity.

2. **Equal excellence.** Builder = Technical Excellence. Creator = Creative Excellence. Neither mode concedes seriousness, prestige, or professional weight to the other. The visual treatment, typography, and copy quality must be identical across both modes.

3. **The through-line is always visible.** Builder subtext carries a design thread. Creator subtext carries a precision/engineering thread. Neither mode erases the other facets of the identity.

4. **The halo is the constant.** The golden aura never changes between modes. It is the site's signature element and the visual proof that both portraits are the same person in the same light.

5. **Restraint as confidence.** Every element earns its presence. What is removed is as deliberate as what is included.

---

## 1. Final Content Architecture

```
HERO
├── NAV
│   ├── Wordmark: "Swethank."
│   └── Links: Projects · Lab · About
│
└── HERO CONTENT [two-column]
    ├── TEXT COLUMN [left]
    │   ├── PersonaToggle: "builder. · creator."
    │   ├── Greeting: "Hi, I'm Swethank."        [static — never animates]
    │   ├── Headline                               [animates on toggle]
    │   ├── Subtext                               [animates on toggle]
    │   ├── Tags                                  [animates on toggle]
    │   └── CTAs                                  [animates on toggle]
    │
    └── PORTRAIT COLUMN [right]
        └── Portrait image                         [animates on toggle]
```

**Static elements** (never change between modes): wordmark, nav, greeting.  
**Dynamic elements** (change with persona): headline, subtext, tags, CTAs, portrait, surface color.

The greeting is static because it is the anchor of the unified identity. The same person is always introducing themselves.

---

## 2. Final Builder Content

```
PERSONA LABEL:    builder.

GREETING:         Hi, I'm Swethank.

HEADLINE:         AI. Products. Craft.

SUBTEXT:          IIT Bombay. Research systems and AI products —
                  built to be understood, not just to function.

TAGS:             IIT Bombay  ·  AI  ·  Product  ·  Research

CTA PRIMARY:      Projects
CTA SECONDARY:    Resume

PORTRAIT:         builder-portrait.png
SURFACE:          --surface-builder
```

**Copy rationale:**
- `AI.` — direct and honest. Replaces "Systems" (generic) and "Intelligence" (AI buzzword). He works in AI; the word earns its place.
- `Products.` — accurate. He builds and ships products.
- `Craft.` — the shared anchor between Builder and Creator modes. Belongs equally to engineering and visual work. Communicates standard, not category.
- `"built to be understood, not just to function"` — a genuine design philosophy statement. Cannot be said by an engineer who treats UX as optional. The through-line to Creator is embedded in the word "understood" — design is what makes a system understandable.
- One-word CTA `Projects` — no verb prefix. The word is the destination. Maximum confidence, no instruction.

---

## 3. Final Creator Content

```
PERSONA LABEL:    creator.

GREETING:         Hi, I'm Swethank.

HEADLINE:         Motion. Frame. Craft.

SUBTEXT:          IIT Bombay. Motion design, video editing, and graphic work —
                  every frame composed, every cut considered.

TAGS:             IIT Bombay  ·  Motion  ·  Video  ·  Graphics

CTA PRIMARY:      Reel              [⚠ ASSUMPTION: showreel exists — verify before shipping]
CTA SECONDARY:    Resume

PORTRAIT:         creator-portrait.png
SURFACE:          --surface-creator
```

**Copy rationale:**
- `Motion.` — names the discipline precisely. Not "Creative" or "Visual" — Motion.
- `Frame.` — the atomic unit of motion design and video editing. A frame is to this work what a function is to engineering: the irreducible unit. This word can only be written by someone who actually works in the medium.
- `Craft.` — the shared anchor with Builder mode. When a visitor switches from Builder to Creator, the repeated `Craft.` creates recognition: same standard, different world.
- `"every frame composed, every cut considered"` — both verbs (`composed` / `considered`) are craft-native. "Composed" = design intent in every frame. "Considered" = intentionality in every edit decision. The through-line to Builder is embedded: this is engineering-level rigor applied to visual work.
- One-word CTA `Reel` — no verb prefix. Parallels Builder's one-word `Projects`.

**Structural symmetry between modes:**
```
Builder:   AI.      Products.  Craft.    [technology → output → standard]
Creator:   Motion.  Frame.     Craft.    [medium → unit → standard]
```
Both headlines travel the same arc — from the specific to the atomic to the philosophical — and land on the same word. Neither explains itself. Both declare.

---

## 4. Typography System

**Typeface:** Geist Sans only (mono-typeface design). Already loaded in `layout.tsx` via `next/font/google`. No second typeface is used.

This is a deliberate constraint, not an omission. The typographic variation comes from weight, size, tracking, and leading — Geist 700 at 72px and Geist 400 at 16px are already so different in character that they read as a pairing. Adding a second family would reduce the discipline that makes this design feel considered.

### Type Scale

| Token         | Size                          | Weight | Leading | Tracking | Usage                        |
|---------------|-------------------------------|--------|---------|----------|------------------------------|
| `text-meta`   | 11px / 0.688rem               | 400    | 1.0     | +0.12em  | Toggle labels (uppercase)    |
| `text-tag`    | 12px / 0.75rem                | 400    | 1.0     | +0.06em  | Tags row                     |
| `text-nav`    | 14px / 0.875rem               | 400    | 1.0     | 0        | Nav links                    |
| `text-body`   | 16px / 1rem                   | 400    | 1.625   | 0        | Subtext, body                |
| `text-greet`  | 20px / 1.25rem                | 600    | 1.4     | 0        | Greeting line                |
| `text-display`| `clamp(44px, 5.5vw, 72px)`   | 700    | 1.0     | −0.02em  | Hero headline (Builder)      |
| `text-display`| `clamp(44px, 5.5vw, 72px)`   | 700    | 1.0     | 0        | Hero headline (Creator only) |

**Creator tracking exception:** Creator headlines use `tracking: 0` instead of Builder's `−0.02em`. The difference is small but intentional — Creator text breathes, Builder text is locked. Same font, same weight, same size; the tracking encodes the personality.

### Wordmark Treatment

`Swethank.` — Geist 700, ~16px, with a trailing period. The period is part of the brand voice: it signals finality, confidence, a complete statement. The toggle labels mirror this: `builder.` and `creator.` both carry the period.

### Toggle Label Treatment

`builder.` and `creator.` — Geist 400, 11px, letter-spacing +0.12em, `text-transform: uppercase`. They read as metadata on the page — a dateline, a byline, a journal entry label — not as interactive buttons. The interactivity is discoverable but the visual language doesn't shout "click me."

---

## 5. Spacing System

**Grid:** Base-8. All spacing values are multiples of 4px (half-base) or 8px.

| Token       | Value  | Usage                                              |
|-------------|--------|----------------------------------------------------|
| `space-1`   | 4px    | Tight internal gaps (icon padding)                 |
| `space-2`   | 8px    | Within elements (toggle dot gap)                   |
| `space-4`   | 16px   | Between tightly related elements (greeting → headline gap) |
| `space-6`   | 24px   | Between related elements (headline → subtext gap)  |
| `space-8`   | 32px   | Between loosely related elements (subtext → tags)  |
| `space-12`  | 48px   | Major content block rhythm (tags → CTAs)           |
| `space-16`  | 64px   | Nav height, side padding (desktop)                 |
| `space-24`  | 96px   | Hero vertical breathing (nav bottom → content top) |
| `space-32`  | 128px  | Hero vertical breathing (content bottom → viewport)|

### Key Measurements

- **Container max-width:** 1280px
- **Side padding (desktop):** 64px
- **Side padding (tablet):** 40px
- **Side padding (mobile):** 24px
- **Nav height:** 64px
- **Text column width:** ~480px (fixed, not percentage)
- **Portrait column:** remaining width (~560px at 1280px), bleeds to right viewport edge
- **Toggle → greeting gap:** 32px (space-8)
- **Greeting → headline gap:** 16px (space-4)
- **Headline → subtext gap:** 24px (space-6)
- **Subtext → tags gap:** 32px (space-8)
- **Tags → CTAs gap:** 48px (space-12)
- **CTA gap (between buttons):** 12px

---

## 6. Color System

All values expressed in OKLCH for perceptual accuracy. Hex approximations provided for reference.

### Reference Tokens

```
ref.cream-builder   oklch(93% 0.018 85)    #F3EDE1   Builder surface
ref.cream-creator   oklch(92% 0.025 72)    #F6E8CE   Creator surface — warmer, more amber
ref.ink-warm        oklch(11% 0.010 85)    #111009   Primary text, full presence
ref.muted-warm      oklch(45% 0.010 85)    #6B6560   Secondary text, inactive toggle
ref.gold            oklch(80% 0.170 90)    #F2C000   Halo — portrait only, never UI chrome
ref.white           oklch(99% 0.000 0)     #FEFEFE   Not used directly
```

### Semantic Tokens

```
--surface             → ref.cream-builder (Builder) | ref.cream-creator (Creator)
--on-surface          → ref.ink-warm
--on-surface-muted    → ref.muted-warm
--accent              → ref.gold   [portrait halo only — never applied to UI elements]
--toggle-active       → ref.ink-warm
--toggle-inactive     → ref.muted-warm
--focus-ring          → ref.gold   [keyboard focus outline]
```

### Color Philosophy

The gold (`ref.gold`) is the most important constraint in the system: it **only appears inside the portrait**. It is never used as a button color, a link color, a border color, or a highlight. Its power comes entirely from its scarcity. When the visitor's eye catches the halo, there is no other gold anywhere on the page competing for that attention.

The surface shift between Builder and Creator is intentional but subtle:
- Builder (`#F3EDE1`): warm cream, slightly more yellow — structured, neutral
- Creator (`#F6E8CE`): amber-tinged cream, +0.007 chroma, −13° hue — warmer, earthier

The Creator surface leans toward the warmth of the portrait's halo and skin tones. It echoes the golden light rather than competing with it.

### Accessibility Verification

```
--on-surface on --surface-builder:
  Lightness delta: 82 points
  WCAG ratio: ~18:1 (exceeds AAA 7:1)
  APCA: well above 90 (preferred body text)
  ✓ Passes all thresholds

--on-surface-muted on --surface-builder:
  Lightness delta: 48 points
  WCAG ratio: ~5.5:1 (exceeds AA 4.5:1)
  APCA: above 60 (readable at 16px regular weight)
  ✓ Passes at body text size (16px)
  ⚠ Verify at 11px (toggle labels) — may need weight bump to 500 if APCA fails

--on-surface on --surface-creator:
  Lightness delta: 81 points
  ✓ Effectively identical to Builder — passes
```

### CTA Button Colors

Button styles use the same color system — no new colors introduced:

```
CTA Primary (filled):
  Background:     --on-surface (#111009)
  Text:           --surface (#F3EDE1 or #F6E8CE — whichever mode is active)
  Hover:          Background lightens to oklch(20% 0.010 85)
  Border-radius:  9999px (full pill)

CTA Secondary (outlined):
  Background:     transparent
  Border:         1px solid --on-surface at 25% opacity
  Text:           --on-surface
  Hover:          Border opacity increases to 50%, background --on-surface at 4% opacity
  Border-radius:  9999px (full pill)
```

---

## 7. Toggle Interaction Specification

### Visual Anatomy

```
builder.  ·  creator.
────────────────────

Active label:    --toggle-active color (11% lightness) — full presence
Inactive label:  --toggle-inactive color (45% lightness) — recedes
Separator "·":   --toggle-inactive color — always muted, not interactive
```

No borders. No capsules. No background fills. No underlines (unless focus state). The active label has presence; the inactive label recedes. That is the entire toggle UI.

### Interactive States

```
Default (Builder active):
  "builder." → --on-surface color
  "·"        → --muted color
  "creator." → --muted color

Default (Creator active):
  "builder." → --muted color
  "·"        → --muted color
  "creator." → --on-surface color

Hover on inactive label:
  Inactive label steps toward active: oklch(28% 0.010 85)
  Transition: 120ms, ease-out
  Cursor: pointer

Focus-visible on toggle:
  2px solid outline, color: ref.gold (#F2C000)
  Outline offset: 4px
  Only appears on keyboard navigation (not mouse)

Active/Pressed:
  No additional state — label color shifts are sufficient feedback
```

### Keyboard Behavior

```
Tab:              Reaches the toggle group (both labels in one focus group)
Left/Right Arrow: Switches between builder. and creator.
Enter / Space:    Activates currently focused label
Escape:           Returns focus to body, no mode change
```

### URL Persistence

```
Default load (no query param):  Builder mode, no animation
?persona=creator:               Creator mode, loaded instantly (no transition animation)
?persona=builder:               Builder mode, loaded instantly
On toggle:                      URL updates without page reload (router.replace, not router.push)
                                History is NOT pushed — the toggle is a view state, not navigation
```

### Reduced Motion

All transition durations set to 0ms. Content swaps are instant. No translateY offsets applied. The toggle still works; only the animation is removed.

---

## 8. Portrait Transition Specification

### Conceptual model

The halo is the constant. The figure within it changes. The transition should feel like the same light illuminating a different expression of the same person.

Implementation uses a single combined PNG per persona (figure + halo as one asset). The halo-pulse effect is applied to the portrait wrapper element via CSS transform, creating the illusion that the aura expands while the figure within it changes.

### Choreography (t = trigger moment)

**Exit phase:**

```
t + 0ms:    Toggle labels: color swap (instant — immediate feedback)
t + 0ms:    Page surface color: begins transition to new surface, 400ms ease-surface
            CSS: transition on background-color of :root or html element

t + 0ms:    Text group exit:
              opacity: 1 → 0
              translateY: 0 → -8px
              duration: 150ms
              easing: ease-in-expo  [cubic-bezier(0.7, 0, 0.84, 0)]
              all text elements exit together (no stagger on exit — clean, unified)

t + 50ms:   Portrait wrapper: begins halo pulse
              transform: scale(1) → scale(1.04)
              duration: 150ms
              easing: ease-spring  [cubic-bezier(0.34, 1.56, 0.64, 1)]

t + 100ms:  Portrait image: exit
              opacity: 1 → 0
              duration: 120ms
              easing: ease-in-expo
```

**Enter phase:**

```
t + 150ms:  Headline: enters
              opacity: 0 → 1
              translateY: +10px → 0
              duration: 220ms
              easing: ease-out-expo  [cubic-bezier(0.16, 1, 0.3, 1)]

t + 200ms:  Subtext: enters (50ms stagger after headline)
              opacity: 0 → 1
              translateY: +10px → 0
              duration: 220ms
              easing: ease-out-expo

t + 210ms:  Portrait image: new portrait enters within the pulsed halo
              opacity: 0 → 1
              duration: 180ms
              easing: ease-out-expo

t + 250ms:  Tags: enters (50ms stagger after subtext)
              opacity: 0 → 1
              translateY: +10px → 0
              duration: 200ms
              easing: ease-out-expo

t + 300ms:  CTAs: enters (50ms stagger after tags)
              opacity: 0 → 1
              translateY: +10px → 0
              duration: 200ms
              easing: ease-out-expo

t + 300ms:  Portrait wrapper: halo contracts back
              transform: scale(1.04) → scale(1)
              duration: 150ms
              easing: ease-in-expo

t + 400ms:  Background transition: complete
```

**Total perceived duration:** ~500ms. No interaction is blocked.

### Why text exits together but enters with stagger

Exit: unified exit (all at once) reads as "clearing the stage" — decisive, clean.  
Enter: staggered entry (headline first, then subtext, then tags, then CTAs) reads as content assembling itself — hierarchy reinforced through timing.

### Exit direction (−8px translateY on exit)

Text exits slightly *upward*, enters from slightly *below* (+10px). This creates a subtle sense of one card sliding up and away while the next rises into position — like turning a page forward.

---

## 9. Responsive Behavior

### Breakpoints

```
mobile:   0px   – 767px
tablet:   768px – 1023px
desktop:  1024px+
```

### Mobile (0–767px)

**Layout:** Single column, portrait stacks ABOVE text.

Portrait appears first on mobile — it is the most visually distinctive element and should be the first thing seen. Text follows below.

```
┌─────────────────────────────┐
│ Swethank.         ≡ [menu]  │  Nav: hamburger or collapsed
├─────────────────────────────┤
│                             │
│    ┌─────────────────┐      │
│    │    Portrait     │      │  Portrait: centered, max-width 280px
│    │  (golden halo)  │      │  Halo may crop at sides — acceptable
│    └─────────────────┘      │
│                             │
│  builder. · creator.        │  Toggle: left-aligned
│                             │
│  Hi, I'm Swethank.          │
│                             │
│  Systems.                   │  Display: clamp(36px, 9vw, 44px)
│  Products.                  │  Each word may break to own line at mobile
│  Intelligence.              │
│                             │
│  IIT Bombay student…        │  Subtext: full width
│                             │
│  IIT Bombay · AI · …        │  Tags: wrapping, same styling
│                             │
│  [Projects]  [Resume]       │  CTAs: side by side if they fit, stack if not
│                             │
└─────────────────────────────┘
```

**Typography adjustments:**
- Display: `clamp(36px, 9vw, 44px)`
- Side padding: 24px
- Toggle: left-aligned (not centered)

**Portrait behavior:**
- `max-width: 280px`, centered in container
- The halo may softly crop at the sides — this is acceptable and expected
- Portrait transitions work identically to desktop

### Tablet (768–1023px)

**Layout:** Two columns appear, portrait contained (does not bleed).

```
┌─────────────────────────────────────────┐
│ Swethank.           Projects Lab About  │
├─────────────────────────────────────────┤
│                                         │
│  builder. · creator.   ┌─────────────┐  │
│                         │   Portrait  │  │
│  Hi, I'm Swethank.      │             │  │
│                         │  (halo)     │  │
│  Systems.               │             │  │
│  Products.              └─────────────┘  │
│  Intelligence.                          │
│                                         │
│  Subtext…                               │
│  Tags · row                             │
│  [View Projects] [Resume]               │
│                                         │
└─────────────────────────────────────────┘
```

**Typography adjustments:**
- Display: `clamp(40px, 5vw, 56px)`
- Side padding: 40px
- Portrait: right column, contained within page bounds (no bleed)

### Desktop (1024px+)

**Layout:** Full editorial two-column, portrait bleeds to right viewport edge.

```
┌──────────────────────────────────────────────────────┐
│ Swethank.                     Projects   Lab   About │
├──────────────────────────────────────────────────────┤
│                                                      │
│  builder. · creator.         ┌────────────────────── │
│                               │                      │
│  Hi, I'm Swethank.            │      Portrait        │
│                               │                      │
│  Systems. Products.           │  (halo extends to    │
│  Intelligence.                │   right viewport     │
│                               │   edge)              │
│  IIT Bombay student…          │                      │
│                               │                      │
│  IIT Bombay · AI · …                                 │
│                                                      │
│  [Projects]  [Resume]                                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Typography adjustments:**
- Display: `clamp(44px, 5.5vw, 72px)`
- Side padding: 64px
- Portrait: bleeds to right edge of viewport (overflow: hidden on container)

---

## 10. Component Architecture

### File structure

```
app/
├── layout.tsx           [server] — metadata, fonts, html shell
├── page.tsx             [server] — renders <Hero />
└── globals.css          — CSS custom properties, Tailwind, base styles

components/
├── Hero.tsx             [client] — owns persona state, URL sync, all transitions
├── Nav.tsx              [server or client] — wordmark + nav links (no state needed)
├── PersonaToggle.tsx    [client] — receives persona + onSwitch props
└── HeroPortrait.tsx     [client] — receives persona prop, handles portrait animation
```

### Responsibility boundaries

**`Hero.tsx`** — single source of truth for persona state.
- Reads `?persona` from URL on mount
- Exposes `persona` state and `switchPersona()` handler
- Passes props down to PersonaToggle and HeroPortrait
- Renders all text content inline (no separate text components needed)
- Uses `'use client'` directive

**`PersonaToggle.tsx`** — presentational + interactive.
- Props: `persona: 'builder' | 'creator'`, `onSwitch: (p: 'builder' | 'creator') => void`
- Renders the two labels with correct active/inactive states
- Handles keyboard interactions (arrow keys, enter, space)
- Calls `onSwitch` on interaction; does not own state

**`HeroPortrait.tsx`** — animation wrapper for portrait images.
- Props: `persona: 'builder' | 'creator'`
- Wraps portrait in Framer Motion for halo-pulse + cross-dissolve
- Uses `AnimatePresence` with a keyed `motion.img` for cross-dissolve
- Handles `useReducedMotion()` fallback

**`Nav.tsx`** — stateless, renders wordmark and nav links. Can be server component.

### State model

```typescript
type Persona = 'builder' | 'creator'

// In Hero.tsx
const [persona, setPersona] = useState<Persona>('builder')  // default

const switchPersona = (next: Persona) => {
  setPersona(next)
  // URL update: router.replace with ?persona=next, no history push
}

// URL read on mount:
// const searchParams = useSearchParams()
// const urlPersona = searchParams.get('persona') as Persona | null
// if (urlPersona === 'creator') setPersona('creator')  (no animation on initial load)
```

### Data model — persona content

```typescript
const personaContent = {
  builder: {
    label: 'builder.',
    headline: ['AI.', 'Products.', 'Craft.'],
    subtext: 'IIT Bombay. Research systems and AI products — built to be understood, not just to function.',
    tags: ['IIT Bombay', 'AI', 'Product', 'Research'],
    cta: { primary: { label: 'Projects', href: '/projects' },
           secondary: { label: 'Resume', href: '/resume.pdf' } },
    portrait: '/reference/builder-portrait.png',
    surface: 'builder',
  },
  creator: {
    label: 'creator.',
    headline: ['Motion.', 'Frame.', 'Craft.'],
    subtext: 'IIT Bombay. Motion design, video editing, and graphic work — every frame composed, every cut considered.',
    tags: ['IIT Bombay', 'Motion', 'Video', 'Graphics'],
    cta: { primary: { label: 'Reel', href: '/reel' },    // ⚠ verify reel exists
           secondary: { label: 'Resume', href: '/resume.pdf' } },
    portrait: '/reference/creator-portrait.png',
    surface: 'creator',
  },
}
```

---

## 11. Page Architecture

### `layout.tsx` (server component)

Responsibilities:
- Sets `<html lang="en">` with Geist font class variables
- Renders `<body>` as a flex column, `min-height: 100dvh`
- Sets metadata: title, description, og:image, og:title
- Imports `globals.css`
- Does NOT import any client-only code

Metadata to define:
```
title:       "Swethank — AI. Products. Motion. Frame."
description: "IIT Bombay. Research systems, AI products, motion design, and video — built and crafted with equal precision."
og:title:    "Swethank"
og:image:    /og-image.png   (to be created — builder portrait on cream background)
```

### `globals.css`

Contains (in order):
1. `@import "tailwindcss"`
2. CSS custom property definitions (`@theme inline` for Tailwind v4)
3. Surface tokens and their transition
4. Base element resets

Key custom properties:
```css
:root {
  --surface-builder: oklch(93% 0.018 85);
  --surface-creator: oklch(92% 0.025 72);
  --on-surface: oklch(11% 0.010 85);
  --on-surface-muted: oklch(45% 0.010 85);
  --gold: oklch(80% 0.170 90);

  /* Active surface — toggled via data attribute or class on <html> */
  --surface: var(--surface-builder);

  /* Surface transition */
  background-color: var(--surface);
  transition: background-color 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

[data-persona="creator"] {
  --surface: var(--surface-creator);
}
```

The `data-persona` attribute is set on the `<html>` or `<body>` element by Hero.tsx to trigger the surface color transition globally.

### `page.tsx` (server component)

Minimal. Renders `<Hero />` inside a wrapper with the correct semantic structure:
```
<div className="relative min-h-dvh" style="overflow-x: hidden">
  <Hero />
</div>
```

Overflow hidden prevents portrait bleed from creating a horizontal scrollbar.

---

## 12. Motion Design System

### Named Easing Curves

```
ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1)       — elements entering viewport
ease-in-expo:   cubic-bezier(0.7, 0, 0.84, 0)        — elements exiting viewport
ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1)    — halo pulse (gentle overshoot)
ease-surface:   cubic-bezier(0.25, 0.46, 0.45, 0.94) — background color shift
```

### Duration Tokens

```
duration-instant:   0ms     — reduced motion fallback (all transitions)
duration-snap:      100ms   — toggle label color change
duration-fast:      150ms   — element exits, halo expand
duration-medium:    200ms   — element enters
duration-slow:      400ms   — surface color transition
duration-halo:      300ms   — full halo pulse sequence (expand + contract)
```

### Stagger Sequence

Text enters with a 50ms stagger, headline-first:

```
Headline:   t + 0ms   (relative to text enter start)
Subtext:    t + 50ms
Tags:       t + 100ms
CTAs:       t + 150ms
```

Text exits without stagger (all elements exit simultaneously at t=0 of exit phase).

### Page-Load Animation (first visit only)

On first page load, the hero performs a subtle entrance:
```
Greeting:   fade in, no translateY, 300ms, ease-out-expo, delay: 200ms
Toggle:     fade in, no translateY, 300ms, ease-out-expo, delay: 250ms
Headline:   fade in, translateY +12px → 0, 400ms, ease-out-expo, delay: 300ms
Subtext:    fade in, 350ms, ease-out-expo, delay: 400ms
Tags:       fade in, 300ms, ease-out-expo, delay: 450ms
CTAs:       fade in, 300ms, ease-out-expo, delay: 500ms
Portrait:   fade in, 500ms, ease-out-expo, delay: 150ms (portrait enters early)
```

The portrait enters before the text finishes — it's the first thing to settle, anchoring the right side while text builds on the left.

This animation only runs once (first paint). On page refresh or navigation return, no entrance animation.

### Reduced Motion (required)

When `prefers-reduced-motion: reduce` is detected via `useReducedMotion()` from Framer Motion:
- All `duration` values → 0ms
- All `translateY` offsets → 0 (no movement)
- No stagger (all elements appear simultaneously)
- Background color: instant swap (no transition)
- Portrait: instant swap (no opacity fade)
- Page-load animation: skipped entirely

The toggle still works. Only motion is removed.

### What motion is NOT used

- No parallax on scroll
- No continuous idle animations
- No hover animations on the portrait (the portrait is not interactive)
- No text scramble or character-by-character reveals
- No looping ambient effects

These are excluded because they would read as AI-generated design flourishes and dilute the halo-pulse's impact.

---

## Asset Requirements

### Portrait images

**Critical requirement:** Both portrait PNGs must have transparent backgrounds.

The current source files (`builder-portrait.png`, `creator-portrait.png`) appear to have black backgrounds in the reference images. On the cream page surface, black areas would be visible.

Options:
1. Re-export portraits with transparent backgrounds (correct approach)
2. Use `mix-blend-mode: multiply` on the portrait container — this causes black to become transparent when composited over light backgrounds (CSS-only workaround, may affect halo rendering)
3. Use `background-blend-mode` combined with a clip path

**Recommendation:** Option 1. Re-export as transparent-background PNGs. Confirm with the illustrator/designer.

### Portrait sizing

- Portraits should be provided at 2x resolution minimum (for retina displays)
- Recommended export: 1120px × 1280px (2x the column width × viewport height)
- The halo glow effect should be baked into the PNG, not approximated with CSS

### Other assets

```
/resume.pdf          — linked from CTA Secondary in both modes
/og-image.png        — Open Graph image (builder portrait on cream, with wordmark)
```

---

## Open Questions (Owner to Resolve Before Implementation)

1. **"View Reel" CTA** — Does a showreel exist? If yes, what is the URL? If no, replace with "View Work" pointing to a Creator work page.

2. **"View Projects" href** — What is the URL for the projects page? `/projects`? Does this page exist?

3. **"Lab" in nav** — What does Lab contain? Confirm this section exists and the route is correct.

4. **Portrait transparency** — Are the current portrait PNGs transparent-background, or do they need re-export? Check by placing on a non-black background.

5. **Tag accuracy** — Verify Creator tags: `Motion Design · Video Editing · Visual Design`. Add or remove based on actual work. The tags are metadata, not aspirational.

6. **Creator subtext accuracy** — "crafting motion design, video, and visual content" — does this accurately reflect what you make? Any discipline missing or incorrect?

7. **Resume location** — Is the resume a local PDF (`/resume.pdf`) or an external link (e.g., LinkedIn, Notion)?

8. **Page-load animation on return visits** — Should the entrance animation play on every visit, or only on first visit? Recommendation: only first visit (use sessionStorage flag).

---

*End of specification. Awaiting owner review and approval before implementation begins.*
