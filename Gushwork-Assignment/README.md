# Gushwork — UI Developer Assignment

A single-page, responsive product detail page built with **vanilla HTML, CSS, and JavaScript only** — no frameworks, no libraries, no build step. Implements the Figma design at [Gushwork Assignment](https://www.figma.com/design/DOv07H7C2tA5UrVLhmfwfW/Gushwork-Assignment?node-id=490-8785).

## Run

```bash
# No install — open index.html directly, or serve over HTTP
npx serve .
# then open http://localhost:3000
```

The page is fully static. No `package.json`, no bundler, no transpilation.

## File layout

```
.
├── index.html          # Semantic markup for every section + 2 <dialog> modals
├── styles.css          # All styling, organized by section, with a print stylesheet
├── script.js           # 10 named modules behind a single DOMContentLoaded bootstrap
├── Asset/              # Compressed JPEGs (2.6 MB total) + SVG icons + logos
└── README.md
```

## Required features

### 1. Sticky header (PDF requirement)

> *Implement a sticky header that appears when scrolling beyond the first fold. The header should position itself above the navigation bar. The header should disappear when scrolling back up. Ensure smooth transitions and animations.*

Implementation in [`script.js`](script.js) → `initStickyHeader()`:

- A compact `.sticky-prebar` (product thumb + title + price + *Request a Quote* CTA) sits **above** the main `.header` on scroll-past-fold — matches Figma reference `490:20494` (double-navbar at y=0 / y=77).
- Scroll-direction tracker (rAF-throttled, with a 2-px dead-band against jitter) reveals the pair on scroll-down and hides them on scroll-up via a `.sticky-hidden` class.
- `transition: transform 0.3s ease-in-out` on both elements drives the slide animation.
- `@media (prefers-reduced-motion: reduce)` disables the transition for users who opt out.

### 2. Image carousel with zoom (PDF requirement)

> *Create an interactive image carousel as shown in the design. On hovering over any carousel image, display a zoomed preview. The zoom functionality should match the specifications in the Figma file.*

Two cooperating modules in [`script.js`](script.js):

**`initGallery()`** — the hero thumbnail strip:
- Click a thumbnail or use ←/→/↑/↓/Enter to swap the main image (WAI-ARIA tab pattern).
- Left/right arrow buttons cycle through. Active thumb gets `aria-selected="true"` + a visible ring.

**`initHoverZoom()`** — the magnifier overlays:
- `.zoom-lens` — translucent square inside the main image showing the area being magnified (clamped to image bounds).
- `.thumbnail-zoom-preview` — 320×320 preview pane to the right of the image, showing the same area at 2.5× via `background-position`.
- Positioning derives from `getBoundingClientRect()` but writes only to elements anchored in the page coordinate system, so the pane stays correctly placed when the user scrolls.
- Gated by `matchMedia('(hover: hover) and (pointer: fine)')` so it never fires on touch devices.

### 3. Modals (Figma node 490-16128)

Two native `<dialog>` elements live at the bottom of `index.html`, wired by attribute:

| Trigger button | Modal |
|---|---|
| **Download Full Technical Datasheet** (Specs section) | `#datasheetModal` — *Let us email the entire catalogue to you* |
| **Get Custom Quote** (Hero), **Request a Quote** (sticky pre-bar + Features), **Talk to an Expert** (CTA card) | `#quoteModal` — *Request a call back* |

`initModals()`:
- Native `<dialog>` handles ESC + focus trap out of the box.
- Dark + blurred backdrop via `::backdrop { backdrop-filter: blur(20px) }` matching Figma's `effect_OSYS4Z`.
- Backdrop click closes; body scroll is locked while a modal is open.
- HTML5 form validation runs on submit (`type=email`, `required`); on success the button transitions *Sending…* → *Sent ✓* and the modal auto-closes after ~2 s.

## Responsive design

Container padding aligned with the annotated Figma frames:

| Min width | Container padding |
|---|---|
| ≥ 1440 px | 100 px |
| 1200–1439 px | 60 px |
| 1080–1199 px | 48 px |
| 800–1079 px | 48 px |
| 360–799 px | 16 px |

Every section uses `padding-block` only — `.container` owns the horizontal gutter, so no section double-pads.

The Applications + Testimonials carousels intentionally **bleed past the container** to the viewport edges (matches Figma's overflowing card row). The track is positioned with `translateX(-halfCard)` (Applications) or `scrollLeft = halfCard` (Testimonials) so the first card is always half-cut on the left and the last visible card is half-cut on the right.

## Accessibility

- Semantic landmarks throughout: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<address>`, `<dialog>`.
- **Skip-to-main-content** link as the first focusable element (visible on focus, off-screen otherwise).
- Every interactive control is a real `<button>` or `<a>`; every `<button>` has an explicit `type=` to prevent accidental form submissions.
- Form inputs all have associated `<label>` (visually hidden when the design uses placeholder-only) + `name=` + `autocomplete=`.
- `:focus-visible` ring on every focusable element (suppressed on mouse click).
- Keyboard support on the gallery thumbnails (←/→/↑/↓/Enter) following the WAI-ARIA tab pattern.
- `aria-selected` on thumbnails, `aria-expanded` on FAQ items, `aria-hidden` on decorative icons + dialogs when closed, `aria-labelledby` on modals.
- `prefers-reduced-motion` respected on the sticky bar transitions.

## Performance

- **Image weight** reduced 97 % (21 MB → 580 KB) by compressing `Frame-1/2/3.jpg` to 1280-px-wide JPEGs at quality 80–85.
- `loading="lazy"` + `decoding="async"` on every below-fold image.
- `width` + `height` attributes on every `<img>` so the browser can reserve layout space before the image loads (zero CLS).
- Sticky-header scroll listener is rAF-throttled, uses CSS transforms (no layout thrash).
- Company-logo strip's responsive visibility is driven by `@media` rules (no JS resize listener).
- `preconnect` to Google Fonts so the H1's `Urbanist` typeface starts downloading before CSS parses.
- All CSS hand-written; total page weight under 200 KB on first load.

## Code quality

- One JS entry point: `document.addEventListener('DOMContentLoaded', …)` calls ten named init functions. Each module returns early if its DOM nodes are missing, so sections can be removed from the markup without breaking the script.
- JSDoc block at the top of [`script.js`](script.js) documents each module.
- Zero inline `style="…"` attributes in the HTML — every visual is in `styles.css`.
- Print stylesheet hides the navigation, carousels, and forms; expands the FAQ; appends URLs to printed links.
- Open Graph + Twitter Card meta tags for proper link previews.
- HTML self-audit ([validate.js](https://validator.w3.org/nu/) equivalent) passes: tag balance, duplicate IDs, void-element closing tags, every `<img>` has alt, every form control has `name`, every `<button>` has `type`.

## Browser support

Tested on the latest Chrome, Firefox, Safari, and Edge. Uses:

- CSS custom properties + `clamp()` (Safari 14+)
- `:focus-visible` (Safari 15.4+)
- Native `<dialog>` with `::backdrop` (Safari 15.4+, Firefox 98+, Chrome 37+)
- `backdrop-filter` (Safari 9+ with `-webkit-` prefix, Firefox 103+)
- `IntersectionObserver` (universal in modern browsers)
- Native `<details>`/`<summary>` for the FAQ accordion (universal)

Older browsers degrade gracefully — the sticky bar transitions become snap-toggles, focus rings revert to UA defaults, modal backdrops appear without blur, and the FAQ accordion still works because it's plain `<details>`.

## Known deviations from the Figma spec

A few places where I chose to deviate slightly from a literal read of the design, with reasoning:

| Deviation | Why |
|---|---|
| Application card overlay has **no `backdrop-filter: blur(8px)`** (Figma `effect_07T4LZ`) | Browsers apply `backdrop-filter` everywhere the overlay element is transparent — which is the entire card top — so the literal spec blurred the whole photo into an unrecognizable smudge. The dark gradient alone provides enough contrast for the white text. |
| The duplicate **"Flexible Installation"** bullet in the hero feature list is rendered **once** | Figma shows it twice but the same string back-to-back reads as a typo. Easy to revert. |
| `letter-spacing: -0.6%` in Figma → **`-0.006em`** in CSS | CSS `letter-spacing` doesn't accept percentages; `-0.006em` is the mathematical equivalent. |
