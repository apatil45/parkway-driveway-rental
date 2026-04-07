# Mobile UI/UX Guide — Parkway Spot Web App

This doc summarizes the current mobile behavior and recommends dimensions, breakpoints, and UX patterns for a professional mobile experience.

---

## 1. Current State (from codebase)

| Area | Current behavior |
|------|------------------|
| **Breakpoints** | Tailwind: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1200px. Search uses **`< 1024px`** as “mobile” for layout (stacked map + list). |
| **Navbar** | `h-14` (56px) on small, `h-16` (64px) from `md` up. Desktop nav hidden below `lg`; hamburger opens `MobileMenu`. |
| **Mobile menu** | Right drawer: `w-80 max-w-[85vw]`, slide-in, body scroll locked. |
| **Touch** | `.btn` / `.input` use **min-height 44px** and `touch-action: manipulation`. |
| **Safe area** | Only search bottom sheet uses `pb-[env(safe-area-inset-bottom)]`. |
| **Search (mobile)** | Stacked: resizable map (default 40%, min 25%, max 65%) then list; FAB to open search; bottom sheet for selected pin with safe-area bottom padding. |
| **Viewport** | No explicit viewport in app layout; Next.js default is typically `width=device-width, initial-scale=1`. |

---

## 2. Recommended Viewport & Meta

- **Viewport** (in root layout or `metadata` / `viewport` export):
  - `width=device-width, initial-scale=1, viewport-fit=cover`
- **Purpose**: Correct scaling on small devices and support for notches/home indicators (`viewport-fit=cover` enables safe-area insets).

---

## 3. Custom Dimensions to Standardize

Use these as single source of truth (constants or CSS vars) so mobile layout stays consistent.

| Token | Value | Usage |
|-------|--------|--------|
| **Navbar height (mobile)** | `3.5rem` (56px) | Sticky header; match `top` for sticky content. |
| **Navbar height (desktop)** | `4rem` (64px) | From `md` up. |
| **Mobile breakpoint (layout)** | `1024px` | Map/list stack vs side‑by‑side; mobile menu vs desktop nav. |
| **Small phone** | `480px` (optional) | Extra compact UI (e.g. logo size, padding) if needed. |
| **Content top offset (search)** | `11.25rem` | Navbar + breadcrumbs + search bar; keep in sync with `CONTENT_TOP_OFFSET_REM`. |
| **Mobile map height** | 25%–65% (default 40%) | Resizable; min height `180px` already in code. |
| **Touch target minimum** | `44px` | Buttons, links, icon buttons. |
| **Bottom FAB (search)** | `bottom: 1.5rem` + `right: 1.5rem` | Position above safe area: e.g. `bottom: max(1.5rem, env(safe-area-inset-bottom))`. |
| **Drawer width (mobile menu)** | `min(20rem, 85vw)` | Current `w-80 max-w-[85vw]` is good; on 320px ≈ 272px. |
| **Bottom sheet** | Full width, `rounded-t-2xl`, `p-6`, `pb: env(safe-area-inset-bottom)` | Already in place; ensure no content under home indicator. |

---

## 4. Mobile-First UX Recommendations

### 4.1 Global

- **Safe area**: Apply `env(safe-area-inset-*)` to:
  - **Navbar**: `padding-top: env(safe-area-inset-top)` when `viewport-fit=cover` (e.g. status bar).
  - **Sticky/fixed bottom UI**: FAB, bottom sheets, footer CTAs → `padding-bottom` or `bottom` using `env(safe-area-inset-bottom)`.
- **Focus**: Keep visible focus rings (you already use `:focus-visible`); ensure modals/drawers trap focus and close on Escape.
- **No zoom on inputs**: Keep `font-size` ≥ 16px on focused inputs where possible to avoid iOS auto-zoom (your `.input` and 44px height already help).

### 4.2 Navbar

- **&lt; 400px**: Consider slightly smaller logo or icon-only logo so “Parkway Spot” + hamburger don’t feel cramped.
- **Height**: Keep 56px (mobile) / 64px (desktop); avoid making the bar taller on small screens so content isn’t pushed down.

### 4.3 Mobile menu (drawer)

- **Width**: `min(20rem, 85vw)` is good; on 320px width, 85vw ≈ 272px — still readable.
- **Links**: Keep large tap targets (e.g. `py-3`); current “Menu” header + close is clear.
- **Scroll**: Ensure long lists (e.g. many nav items + footer block) scroll inside the drawer with overflow visible.

### 4.4 Home & dashboard

- **Hero**: Single column on mobile; CTA buttons full-width or `flex-1 min-w-0` in a row (you already do this).
- **Cards**: Stack on mobile; use consistent vertical spacing (e.g. `gap-4` or `gap-6`).
- **Stats / numbers**: Use a clear hierarchy (e.g. one main number per row on very small screens) so they don’t feel crowded.

### 4.5 Search (mobile)

- **Map vs list**: Resizable split (25–65%, default 40%) is good; keep `min-h-[180px]` so the map never disappears.
- **FAB**: Place with `bottom: max(1.5rem, env(safe-area-inset-bottom))` so it’s never under the home indicator.
- **Bottom sheet**: Keep one primary CTA (“Reserve”); optional “View details” that goes to `/driveway/[id]` and closes the sheet.
- **Filters**: On mobile, consider a full-screen or large bottom sheet for filters instead of a narrow strip, so controls aren’t cramped.

### 4.6 Forms & lists

- **Buttons**: Primary action full-width on small screens (e.g. `w-full` or `flex-1 min-w-0` in a row).
- **List cards**: Thumbnail + text in a single row; tap whole card to open detail (you already use cards as links). Ensure padding and font size keep text readable (e.g. body ≥ 16px).

### 4.7 Footer

- **Grid**: `grid-cols-1 md:grid-cols-4` is good; on mobile single column with clear section headings and adequate spacing between links (tap targets ≥ 44px height).

---

## 5. Breakpoint Strategy (summary)

| Breakpoint | Width | Use |
|------------|--------|-----|
| (default) | &lt; 640px | Single column, compact navbar, drawer menu, stacked cards, full-width CTAs. |
| **sm** | ≥ 640px | Slightly more padding; optional 2-column where it doesn’t crowd (e.g. footer could stay 1-col until md). |
| **md** | ≥ 768px | 2-column grids where appropriate; navbar height 64px. |
| **lg** | ≥ 1024px | **“Desktop” layout**: side-by-side map + list, full nav in header, no mobile drawer. |

Treat **&lt; 1024px** as “mobile” for:
- Search: stacked map + list, FAB, bottom sheet.
- Nav: hamburger + drawer.
- Any layout that switches from horizontal to vertical.

---

## 6. Checklist for New Mobile UI

- [ ] Viewport includes `viewport-fit=cover` if using safe-area insets.
- [ ] Navbar and any fixed top bar use `padding-top: env(safe-area-inset-top)` when applicable.
- [ ] Fixed bottom UI (FAB, sheets, footer CTAs) use `env(safe-area-inset-bottom)`.
- [ ] All interactive elements ≥ 44px touch target.
- [ ] Primary CTAs are full-width or clearly tappable on small screens.
- [ ] No important content hidden by notches or home indicator.
- [ ] Focus order and visible focus rings for keyboard/accessibility.
- [ ] Test on 320px, 375px, 414px widths and on a real device (e.g. iPhone with notch/Dynamic Island).

---

## 7. Files to Touch for Implementation

| Change | File(s) |
|--------|---------|
| Viewport + safe area | `apps/web/src/app/layout.tsx` (viewport in metadata or `viewport` export) |
| Navbar safe-area top | `apps/web/src/components/layout/Navbar.tsx` |
| FAB safe-area bottom | `apps/web/src/app/search/page.tsx` (floating search button) |
| Bottom sheet | Already uses `pb-[env(safe-area-inset-bottom)]` |
| Constants | Optional: `apps/web/src/lib/constants.ts` or similar for layout numbers (navbar height, content offset, breakpoint “mobile” 1024) |

Using this guide, the app can keep a consistent, professional mobile experience across breakpoints and device sizes (including custom dimensions and safe areas).
