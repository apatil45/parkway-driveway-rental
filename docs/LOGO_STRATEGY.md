# Parkway Spot Logo Strategy

A single reference for how the Parkway Spot logo should be conceived, designed, and used across all touchpoints.

---

## 1. Viewpoints

### 1.1 Brand & business

| Goal | Strategy |
|------|----------|
| **What we are** | Driveway/parking rental — find and book spots; list and earn. |
| **What the logo should signal** | Trust, clarity, simplicity, modern (optionally “smart” if AI is part of the product). |
| **Name** | **Parkway Spot** — one canonical spelling everywhere (not “Parkway AI” or “ParkwayAI” in copy). |
| **Icon meaning** | Either: (a) stylized “P” for Parkway, or (b) an abstract symbol (path, driveway, pin) so the wordmark carries the name and the icon is a recognisable mark. |

**Recommendation:** Decide once: letter “P” vs symbol. If you keep the P, use one consistent form (e.g. open-loop P). If you switch to a symbol, keep it simple and scalable.

---

### 1.2 User & UX

| Concern | Strategy |
|---------|----------|
| **Recognition** | Same mark and wordmark everywhere (web, app, emails, social). |
| **Readability** | Minimum size for full logo (icon + wordmark): ~24px height in UI; icon-only can go smaller (e.g. 20px) for favicon / compact nav. |
| **Scalability** | Logo is vector (SVG) so it scales without quality loss. |
| **Accessibility** | Logo link has `aria-label="Parkway Spot home"`; icon is `aria-hidden` so screen readers get the wordmark/label only. |
| **Context** | On dark backgrounds use a light version (icon + wordmark in white/light). On light backgrounds use primary blue icon + dark wordmark. |

**Recommendation:** Define a single “minimum size” for full lockup and for icon-only (e.g. full ≥24px, icon-only ≥20px) and document it in usage rules.

---

### 1.3 Technical & implementation

| Concern | Strategy |
|---------|----------|
| **Format** | Prefer **SVG** in code (inline or component) for sharp rendering and theming (e.g. `currentColor`). |
| **Favicon** | Use the same icon (no wordmark) in `favicon.svg` (and optional `favicon.ico` for older browsers). |
| **Where the logo appears** | Navbar (full), Footer (full, dark variant), mobile menu (full or icon to avoid clutter), emails (linked image or text+link), social (square/rounded avatar = icon only). |
| **Responsive** | On very small viewports, consider icon-only in the navbar and “full” in drawer/footer. |
| **Theme** | Support light UI (default) and dark UI (e.g. footer, dark mode) via a `dark` prop or equivalent. |

**Recommendation:** One React `<Logo />` component with props: `variant` (icon | full), `size`, `dark`, `href`, `asLink`. All app usage goes through this component; static assets (favicon, social) export from the same source of truth (same SVG path).

---

### 1.4 Legal & trademark

| Concern | Strategy |
|---------|----------|
| **Distinctiveness** | “Parkway Spot” is more distinctive than “Parkway” alone — better for registration and enforcement. |
| **Clearance** | Before finalising and scaling use, run a **trademark search** (and ideally an opinion) from a lawyer in each key jurisdiction. |
| **Usage** | Use the same spelling and style (Parkway Spot) in legal copy, footer, and terms so the mark is used consistently in commerce. |

**Recommendation:** Do not rely on “looks fine” or “no one else uses it” — get a proper search and legal sign-off before investing heavily in the mark.

**Uniqueness (icon):** The path + slot mark (two curved paths + rectangle at apex) is a clear execution; the *concept* of "path/road to parking space" exists in stock icons and parking branding. No exact same mark was found for a parking/driveway brand. **Parkway Corporation** (US parking operator) uses the word "Parkway" in text only. To reduce risk: (1) run a proper trademark search for the composite mark (wordmark + icon) in your classes and jurisdictions; (2) consider one small unique detail in the icon so the mark is more than a generic "path to box."

---

### 1.5 Production & assets

| Asset | Purpose | Spec |
|-------|---------|------|
| **Logo component (SVG)** | All in-app usage (nav, footer, modals). | Single React component; icon from shared SVG path. |
| **Favicon** | Browser tab, bookmarks. | Same icon as in component; SVG (and optional ICO). |
| **Social / OG** | Previews (e.g. Open Graph). | Square or rounded image (e.g. 512×512) — icon only or icon+wordmark; PNG. |
| **Email** | Header in transactional emails. | Linked image (hosted PNG or SVG URL) or text “Parkway Spot” + link. |
| **Print / PDF** | Invoices, contracts. | Vector (SVG/PDF) or high-res PNG (e.g. 2× for retina). |

**Recommendation:** Export a small set of static files from the same icon (and optional full lockup): favicon.svg, favicon.ico, og-logo.png (512×512). Keep the component as the source of truth for the mark.

---

## 2. Strategy summary

1. **One name:** Parkway Spot everywhere (product, legal, meta, emails).
2. **One component:** `<Logo variant size dark href asLink />` for all in-app use; same SVG mark for favicon and exports.
3. **Two variants:** **icon-only** (favicon, compact nav, social avatar) and **full** (icon + “Parkway Spot” wordmark for header/footer).
4. **Two contexts:** **Light** (primary blue icon, dark wordmark) and **dark** (white/light icon and wordmark).
5. **Minimum sizes:** Define once (e.g. full lockup ≥24px height, icon-only ≥20px) and stick to them in UI and docs.
6. **Legal:** Trademark search and advice before locking the final mark and scaling usage.

---

## 3. Usage rules (do’s and don’ts)

**Do:**

- Use the Logo component in the app instead of hardcoded text or images.
- Use the same icon in favicon and social assets.
- Use the dark variant on dark backgrounds (e.g. footer).
- Keep clear space around the logo (e.g. at least the height of the “P” or icon on each side).

**Don’t:**

- Stretch or change the aspect ratio of the icon or wordmark.
- Use a different blue or typeface for the wordmark than the one defined in the component.
- Add effects (e.g. drop shadow, 3D) unless a formal “alternate” version is defined.
- Use “Parkway” alone in product UI when the official name is Parkway Spot (exception: legal/formal copy if advised).

---

## 4. Current implementation (reference)

- **Component:** `apps/web/src/components/ui/Logo.tsx`
- **Props:** `variant` (icon | full), `size` (sm | md | lg), `dark`, `href`, `asLink`, `className`
- **Favicon:** `apps/web/public/favicon.svg` (same “P” mark)
- **Used in:** Navbar (full, md), Footer (full, md, dark)

This strategy can be updated when the icon or wordmark is redesigned or when new touchpoints (e.g. app icon, merch) are added.
