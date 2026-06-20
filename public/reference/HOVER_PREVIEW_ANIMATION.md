# Cursor-Following Project Preview Animation

This documents the floating, cursor-tracking image preview that appears when
hovering over a project row on [sagartamang.com/projects](https://sagartamang.com/projects)
— the small laptop-mockup card that follows your mouse and tilts as you move.

Source: `app/components/hover-link-preview.tsx` + `app/components/projects.tsx`

---

## 1. What it actually is

It is **not** a CSS `:hover` effect and **not** a tooltip library. It's a custom
React hook + a React Portal, built with **Framer Motion** (`motion/react`).

Three moving parts:

1. **A hook (`useCursorPreview`)** that tracks the mouse position and converts
   it into spring-animated motion values.
2. **A portal (`PreviewPortal`)** that renders the floating card directly onto
   `document.body` (not nested inside the row), positioned with `fixed`
   coordinates driven by the hook.
3. **Two thin wrapper components** (`HoverLinkPreview` for external links,
   `HoverPreviewLink` for internal Next.js `<Link>`s) that attach the mouse
   handlers to whatever you wrap — in Sagar's case, an entire project row.

---

## 2. The motion engine — `useCursorPreview()`

```tsx
import { useMotionValue, useSpring } from "motion/react"

const useCursorPreview = () => {
  const [showPreview, setShowPreview] = useState(false)
  const [mounted, setMounted] = useState(false)
  const prevX = useRef<number | null>(null)

  useEffect(() => setMounted(true), [])

  const motionTop = useMotionValue(0)
  const motionLeft = useMotionValue(0)
  const motionRotate = useMotionValue(0)

  const springTop = useSpring(motionTop, { stiffness: 300, damping: 30 })
  const springLeft = useSpring(motionLeft, { stiffness: 300, damping: 30 })
  const springRotate = useSpring(motionRotate, { stiffness: 300, damping: 20 })

  const onMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // jump so the card appears AT the cursor instead of springing in from (0,0)
    motionTop.jump(e.clientY - PREVIEW_HEIGHT - OFFSET_Y)
    motionLeft.jump(e.clientX - PREVIEW_WIDTH / 2)
    setShowPreview(true)
    prevX.current = null
  }

  const onMouseLeave = () => {
    setShowPreview(false)
    prevX.current = null
    motionRotate.set(0)
  }

  const onMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    motionTop.set(e.clientY - PREVIEW_HEIGHT - OFFSET_Y)
    motionLeft.set(e.clientX - PREVIEW_WIDTH / 2)

    // tilt the card based on horizontal cursor VELOCITY, not position
    if (prevX.current !== null) {
      const deltaX = e.clientX - prevX.current
      motionRotate.set(Math.max(-15, Math.min(15, deltaX * 1.2)))
    }
    prevX.current = e.clientX
  }

  return {
    mounted, showPreview, springTop, springLeft, springRotate,
    handlers: { onMouseEnter, onMouseLeave, onMouseMove },
  }
}
```

### Why this feels "alive" — the three key tricks

**Trick 1 — `motionValue.jump()` on enter, `.set()` on move.**
`useMotionValue` is a Framer Motion primitive that holds a value outside
React's render cycle (so updating it doesn't trigger re-renders — it directly
mutates the DOM transform, which is why this stays buttery smooth even with
fast mouse movement).

- `.jump(value)` sets the value **instantly**, bypassing the spring.
- `.set(value)` sets the *target* the spring will animate towards.

On `onMouseEnter`, the code calls `.jump()` so the card teleports straight to
the cursor with zero animation lag — if it used `.set()` here, the card would
visibly spring in from the top-left corner of the screen on every hover,
which looks broken. On `onMouseMove`, it switches to `.set()`, so as the
mouse moves further, the spring chases the new target smoothly rather than
snapping.

**Trick 2 — `useSpring()` wraps each raw motion value.**
The raw `motionTop`/`motionLeft`/`motionRotate` values update instantly and
exactly to the cursor. But the actual `position` and `rotate` styles in the
JSX are bound to the **spring-wrapped** versions (`springTop`, `springLeft`,
`springRotate`) — these lag slightly behind the raw target with spring
physics (`stiffness: 300, damping: 30`), which is what produces the soft,
elastic "catching up" motion instead of the card rigidly snapping to the
cursor's exact pixel position every frame.

**Trick 3 — tilt is driven by *velocity*, not position.**
This is the subtlest and most important detail. The rotation isn't "tilt
based on where the cursor is" — it's:

```ts
const deltaX = e.clientX - prevX.current   // how far the mouse moved THIS event
motionRotate.set(Math.max(-15, Math.min(15, deltaX * 1.2)))
```

So if you move the mouse quickly to the right, `deltaX` is large and positive
→ the card tilts right (clamped to a max of 15°). Move quickly left → tilts
left. Stop moving → `deltaX` becomes near 0 → card returns to level. This
mimics the physics of a flat card being dragged through air — the *faster*
you move, the more it tilts, just like a piece of paper. The `Math.max/min`
clamp prevents it from ever looking absurd (no 90° flips).

---

## 3. The portal — why it renders to `document.body`

```tsx
const PreviewPortal = ({ cursor, preload, children }) => {
  if (!cursor.mounted) return null

  return createPortal(
    <>
      {preload && (
        <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0 }}>
          {preload}
        </div>
      )}

      <AnimatePresence>
        {cursor.showPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            style={{
              position: "fixed",
              top: cursor.springTop,
              left: cursor.springLeft,
              rotate: cursor.springRotate,
              zIndex: 50,
              pointerEvents: "none",
            }}
          >
            <div className="bg-background border border-border rounded-2xl shadow-lg p-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  )
}
```

Two reasons this uses `createPortal` instead of just rendering inline next to
the row:

1. **Avoids clipping.** If the floating card rendered as a normal child of
   the project row, any parent with `overflow: hidden` (very common in list
   layouts) would clip the card whenever it tried to float outside the row's
   bounding box. Portaling straight to `document.body` guarantees it's never
   clipped by anything.
2. **Avoids z-index wars.** Being a direct child of `<body>` with
   `position: fixed` and `zIndex: 50` means it reliably floats above
   everything else on the page, regardless of how deeply nested the
   triggering row is in the component tree.

`pointerEvents: "none"` matters too — without it, the floating card itself
would intercept mouse events and break the `onMouseMove` tracking on the
underlying link the moment your cursor crosses over the (moving) card.

**The hidden `preload` block** is a clever performance touch: it renders the
image at `width: 0, height: 0, opacity: 0` the moment the component mounts
(not on hover) — so by the time someone actually hovers, the browser has
already fetched and decoded the image, and it appears instantly instead of
flashing in mid-load.

---

## 4. Wiring it up — `HoverPreviewLink` (the reusable wrapper)

```tsx
const HoverPreviewLink = ({ href, preview, className, children }) => {
  const cursor = useCursorPreview()

  return (
    <>
      <Link href={href} className={className} {...cursor.handlers}>
        {children}
      </Link>

      <PreviewPortal cursor={cursor}>{preview}</PreviewPortal>
    </>
  )
}
```

This is the actual public API you use elsewhere in the app — it bundles the
hook + portal + a Next.js `<Link>` into one drop-in component. `{...cursor.handlers}`
spreads `onMouseEnter`, `onMouseLeave`, `onMouseMove` directly onto the link.

There's a sibling, `HoverLinkPreview`, which is identical but uses a plain
`<a target="_blank">` instead of Next's `<Link>` — for external URLs that
should open in a new tab rather than client-side navigate.

---

## 5. How each project row actually triggers it — `projects.tsx`

```tsx
return (
  <HoverPreviewLink
    key={project.slug}
    className={rowClassName}
    href={`/projects/${project.slug}`}
    preview={
      <Image
        src={project.metadata.image}
        alt={project.metadata.title}
        width={192}
        height={112}
        draggable={false}
        className="w-48 h-28 object-cover rounded-md"
      />
    }
  >
    {rowContent}
  </HoverPreviewLink>
)
```

Every project row in the list is itself the `HoverPreviewLink`. The
`preview` prop is just the project's thumbnail image, sized to
`192×112` (a 12:7 aspect ratio — roughly matching a laptop screen's
proportions, which is what gives it that "tilted MacBook mockup" look you
described, even though it's really just a rounded image card).

There's a graceful fallback: if a project has no `image` in its metadata,
the code skips `HoverPreviewLink` entirely and renders a plain `<Link>` —
so the hover effect never breaks on projects missing an image.

---

## 6. Minimal version to adapt for your own site

Here's the trimmed-down shape to implement this yourself, assuming you also
use Next.js + Framer Motion (`motion` package):

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react"

const PREVIEW_WIDTH = 192
const PREVIEW_HEIGHT = 112
const OFFSET_Y = 40

function HoverPreviewLink({ href, preview, className, children }: {
  href: string
  preview: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(false)
  const prevX = useRef<number | null>(null)

  useEffect(() => setMounted(true), [])

  const top = useMotionValue(0)
  const left = useMotionValue(0)
  const rotate = useMotionValue(0)
  const springTop = useSpring(top, { stiffness: 300, damping: 30 })
  const springLeft = useSpring(left, { stiffness: 300, damping: 30 })
  const springRotate = useSpring(rotate, { stiffness: 300, damping: 20 })

  return (
    <>
      <Link
        href={href}
        className={className}
        onMouseEnter={(e) => {
          top.jump(e.clientY - PREVIEW_HEIGHT - OFFSET_Y)
          left.jump(e.clientX - PREVIEW_WIDTH / 2)
          setShow(true)
          prevX.current = null
        }}
        onMouseMove={(e) => {
          top.set(e.clientY - PREVIEW_HEIGHT - OFFSET_Y)
          left.set(e.clientX - PREVIEW_WIDTH / 2)
          if (prevX.current !== null) {
            const dx = e.clientX - prevX.current
            rotate.set(Math.max(-15, Math.min(15, dx * 1.2)))
          }
          prevX.current = e.clientX
        }}
        onMouseLeave={() => {
          setShow(false)
          rotate.set(0)
        }}
      >
        {children}
      </Link>

      {mounted && createPortal(
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              style={{
                position: "fixed",
                top: springTop,
                left: springLeft,
                rotate: springRotate,
                zIndex: 50,
                pointerEvents: "none",
              }}
            >
              <div className="bg-background border border-border rounded-2xl shadow-lg p-2">
                {preview}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
```

**Usage on your project list:**

```tsx
<HoverPreviewLink
  href={`/projects/${project.slug}`}
  preview={
    <img
      src={project.image}
      alt={project.title}
      width={192}
      height={112}
      className="w-48 h-28 object-cover rounded-md"
    />
  }
  className="group flex items-start gap-4"
>
  {/* your normal row content: title, summary, tags */}
</HoverPreviewLink>
```

### Dependency required

```bash
pnpm add motion
```

(`motion/react` is the modern import path for what used to be
`framer-motion` — same library, newer package name.)

### Things to tune to taste

- `stiffness`/`damping` on the springs — higher stiffness = snappier/faster
  follow; lower damping = more bounce/overshoot before settling.
- The `15°` tilt clamp and `1.2` velocity multiplier — increase the
  multiplier for a more dramatic tilt on fast movement.
- `OFFSET_Y = 40` — how far above the cursor the card floats. Set to a
  negative value or `0` if you'd rather it float below/at the cursor.
- The image aspect ratio (`192×112`, i.e. ~12:7) — this is what gives it the
  "laptop screen" proportions; swap for `16:9` or `4:3` if your screenshots
  are shot differently.
