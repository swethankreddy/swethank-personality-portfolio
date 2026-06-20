# Project Reference: SwethankOS (3D Retro Terminal Portfolio)

Source repo: [`swethankreddy/3d-portfolio-web`](https://github.com/swethankreddy/3d-portfolio-web)

This is an earlier personal portfolio site, built as a fictional retro
operating system ("SwethankOS") rendered in 3D. Instead of a normal scrolling
page, visitors click a 3D laptop model to "boot" into a CRT-styled terminal
desktop with draggable windows, a typed command-line interface, and embedded
mini-games.

Use this file as the source of truth when adding this project to the main
portfolio's project catalog (`chat-context.ts` / `item-details.ts`) and to
the visible projects page.

---

## 1. The concept, in one line

A 3D-rendered laptop sits in a dark, fog-lit scene. Clicking it triggers a
CRT-style boot sequence, then drops the visitor into a draggable-window
desktop where a typed terminal is the primary way to explore the portfolio.

## 2. Tech stack

| Layer | Tech |
|---|---|
| 3D rendering | **Three.js** via **React Three Fiber** (`@react-three/fiber`) |
| 3D helpers | `@react-three/drei` (model loading, progress tracking) |
| Post-processing | `@react-three/postprocessing` — scanline, noise, vignette effects |
| 3D assets | **Blender**-modeled `.glb` / `.gltf` files (laptop model, scene variants) |
| Animation | Framer Motion (`framer-motion`) |
| Charts | `chart.js` / `react-chartjs-2` (used inside the NeuroTrade mini-game) |
| Typing effect | `react-simple-typewriter` |
| Window dragging | `react-draggable` |
| Build tooling | Vite + React 19 |

## 3. Core interaction flow

1. **Landing scene** — a `<Canvas>` (React Three Fiber) renders a fogged,
   neon-lit 3D scene containing a laptop model (`MyModel.jsx`, loaded from
   `/public/models/`). Scroll wheel zooms the camera in/out (clamped between
   z=4 and z=10) via a custom `ZAxisZoomCamera` component.
2. **Click the laptop** → triggers `openTerminal()`.
3. **Boot sequence** — `BootLoader.jsx` shows a CRT-styled progress bar
   (`useProgress` from drei, tracking asset load progress) with scanline
   overlay, then fires `onComplete` once loading hits 100%.
4. **Desktop environment** — once booted, the UI shows:
   - A **RetroDock** (`RetroDock.jsx`) — a CRT-flicker-styled dock with
     icons (Terminal, About, Folder, Resume, Reach Out, Arcade) that open
     different windows.
   - **Draggable windows** (`TerminalWindow.jsx`, `SnakeGameModal.jsx`,
     `TestRetroWindow.jsx`) with their own z-index stacking, managed by a
     custom `zIndexManager.jsx` (`bringToFront`, `getNextZIndex`).
5. **Terminal commands** — `TerminalWindow.jsx` implements a typed
   command-line interface with a registry of commands:
   - `help` — lists available commands
   - `about` — shows a short bio ("Neural Signature," role, location)
   - `skills` — lists technical skills
   - `projects` — lists other projects (HealthSync AI, RegimeRadar,
     Memory Trees)
   - `contact` — shows email/social links
   - `neurotrade` — launches the **NeuroTrade** mini-game
     (`NeuroTradeGameModal.jsx`, a finance-themed mini-game using
     `chart.js`)
   - `neuro.reboot()` — reboots the session
   - `exit` / `clear` — session control
   - Includes command history navigation (custom `HistoryNode` linked-list
     structure) and tab-style autocomplete suggestions.
6. **Sound design** — `useSound.jsx` hook plays SFX (`/public/sfx/`) for
   boot, typing, and entering commands, adding to the retro-terminal feel.
7. **Visual effects** — `GlitchBackground.jsx` and `AnaglyphRenderer.jsx`
   add CRT/glitch/anaglyph (red-cyan 3D) visual treatments on top of the
   Three.js scene, reinforcing the retro-tech aesthetic.
8. **Mobile fallback** — on mobile user agents, the entire 3D experience is
   replaced with a plain-text "TERMINAL NOT SUPPORTED... please use a
   desktop" message, styled like a green-on-black terminal, since the
   experience is desktop-only by design.

## 4. Notable engineering details worth highlighting

- **Z-index stacking system**: rather than relying on DOM order, a custom
  `zIndexManager.jsx` tracks and assigns z-index values so multiple draggable
  windows can be brought to front independently, like a real desktop OS.
- **Command history as a linked list**: `TerminalWindow.jsx` implements its
  own `HistoryNode` class (prev/next pointers) for command history
  navigation, rather than just using an array — a deliberate data structure
  choice for up/down arrow history traversal.
- **Adaptive rendering for performance**: device pixel ratio, shadow
  casting, and post-processing effects are all conditionally disabled on
  detected mobile devices (`isMobile` check) to avoid overloading weaker
  GPUs, even though the full 3D experience itself is mobile-gated off
  separately.
- **Boot progress tied to real asset loading**: the boot loader's
  percentage isn't a fake animation — it's wired to drei's `useProgress`,
  which tracks actual `.glb`/`.gltf` model loading progress, so the boot bar
  reflects real load time.

## 5. Suggested catalog entry content

**Title:** SwethankOS — 3D Retro Terminal Portfolio

**Category:** Project

**Tags:** `threejs`, `react-three-fiber`, `blender`, `3d`, `react`, `vite`,
`creative-dev`

**1-line summary (for the slim index):**
> An earlier portfolio reimagined as a fictional OS — click a 3D laptop to boot into a CRT terminal desktop with draggable windows and a command-line interface.

**Full detail (for `getItemDetails`):**
> Built an earlier personal portfolio as a fully interactive 3D retro
> operating system rather than a conventional scrolling page. Visitors
> click a Blender-modeled, Three.js-rendered laptop to trigger a CRT-styled
> boot sequence (built with React Three Fiber and drei's asset-loading
> progress tracking), which transitions into a draggable-window desktop
> environment. The centerpiece is a typed terminal interface with a custom
> command registry (`about`, `skills`, `projects`, `contact`, and more),
> including command history implemented as a linked list and tab-style
> autocomplete. The desktop also includes a custom z-index window manager,
> a CRT-flicker-styled dock, ambient sound effects, and two embedded
> mini-games (a Snake game and a finance-themed "NeuroTrade" game built
> with Chart.js). Visual treatments include scanline, noise, and vignette
> post-processing, plus a glitch/anaglyph rendering mode, all built with
> `@react-three/postprocessing`. The experience is intentionally
> desktop-only, with a styled fallback message shown to mobile visitors.

**GitHub:** https://github.com/swethankreddy/3d-portfolio-web

---

## 6. Open item: the GitHub repo's README

The repo's `README.md` is still the unedited default Vite + React
boilerplate text ("This template provides a minimal setup to get React
working in Vite..."). It does not describe the actual project at all. This
should be rewritten separately (not part of the portfolio catalog task) so
that anyone clicking through from the portfolio to GitHub sees an accurate
description, screenshots, and setup instructions rather than starter
template text.
