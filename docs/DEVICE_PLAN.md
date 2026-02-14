# Device & Responsive Plan

How Parkway should look and behave across **mobile**, **tablet**, and **desktop** so the experience is professional and user-friendly on every device.

---

## 1. Breakpoints (Tailwind)

| Device   | Breakpoint | Width      | Use for                          |
|----------|------------|------------|-----------------------------------|
| Mobile   | default    | &lt; 640px  | Single column, stacked, large tap targets |
| Tablet   | `sm:`      | ≥ 640px    | Some 2-col grids, more inline    |
| Desktop  | `md:`      | ≥ 768px    | Side-by-side, denser layout      |
| Large    | `lg:`      | ≥ 1024px   | Full dashboard layout, max-width container |

Use **mobile-first** classes: base = mobile, then `sm:`, `md:`, `lg:` for larger screens.

---

## 2. My Bookings page – by device

### Mobile (&lt; 640px)

- **Header:** "My Bookings" full width; filter in a row below (full-width select or pill tabs).
- **Cards:**
  - Single column, full width.
  - **Top:** Thumbnail (if present) or placeholder; driveway title; one-line date/time; price.
  - **Status:** Single human label (e.g. "Confirmed · Paid") or one pill.
  - **Address:** One truncated line; tap to expand or "View driveway" for full.
  - **Host:** "Host: Name" + tap-to-call (tel:) button.
  - **Alerts:** Compact (one line + one primary button, e.g. "Complete payment").
  - **Details:** Collapsed by default; "Show details" reveals times, vehicle, special requests, booking ID.
  - **Actions:** Full-width or stacked buttons; order: primary (Pay / Get directions) → View driveway → Cancel. Min touch target 44px height.
- **Pagination:** Large prev/next or numbered dots; no tiny links.

### Tablet (640px – 1023px)

- **Header:** Same row: title left, filter right.
- **Cards:**
  - Optional: small thumbnail left, content right (2-col within card).
  - Date/time can stay one line; address can show a bit more.
  - Actions: inline (wrap if needed); still button-style for primary actions.
  - Details: can be always visible or still collapsible to keep list scannable.

### Desktop (≥ 1024px)

- **Container:** `max-w-5xl` or `max-w-6xl` + `mx-auto` so content doesn’t stretch too wide.
- **Cards:**
  - Full layout: thumbnail (if used), title, date, price, status, address, host, time grid, vehicle, requests, review block, actions.
  - Actions in one row (View driveway, Get directions, Pay, Cancel, Review).
  - Booking ID: small text or in expandable "Details".

---

## 3. Global patterns (all pages)

| Element           | Mobile                    | Tablet / Desktop              |
|------------------|---------------------------|--------------------------------|
| Navbar           | Hamburger menu            | Full nav links                 |
| Buttons          | Min 44px height, full-width where primary | Inline, normal width   |
| Forms            | Full-width inputs, stacked labels | Inline or grid where it fits |
| Modals / sheets  | Full-screen or bottom sheet | Centered modal, max-width    |
| Tables           | Card per row or horizontal scroll with sticky first column | Normal table |
| Map (search)     | Full width; list as overlay/sheet | List panel side; map fills rest |

---

## 4. Touch & input

- **Touch targets:** Minimum 44×44px for buttons and links used on mobile.
- **Spacing:** Enough gap between actions so taps don’t hit the wrong button.
- **Forms:** Use `inputmode` and `type` (e.g. `tel`, `email`) so mobile keyboards are appropriate.
- **Avoid:** Hover-only actions for critical flows; provide a tap target for everything important.

---

## 5. Performance by device

- **Images:** Responsive images (e.g. `srcset` or Next `Image`) so mobile doesn’t load huge assets.
- **Map (Leaflet):** Already used on search; same approach on navigate – load tiles appropriate to viewport.
- **Lazy load:** Below-the-fold content (e.g. later booking cards) can be lazy-loaded if the list gets long.

---

## 6. Testing checklist

- [ ] My Bookings: filter, cards, and actions at 320px, 375px, 414px (mobile).
- [ ] My Bookings: at 768px and 1024px (tablet/desktop); no horizontal scroll.
- [ ] Search: map + list overlay on mobile; list panel on desktop.
- [ ] Navigate: map and buttons usable on small screens.
- [ ] Checkout / payment: form and buttons work on mobile.
- [ ] Tap targets: all primary actions ≥ 44px on mobile.

Use Chrome DevTools device toolbar (or real devices) for quick checks at each breakpoint.

---

## 7. Optional: PWA / installable

- **Later:** Add a web app manifest and service worker so the app can be “installed” on phones and used like an app (icon on home screen, standalone window). Not required for the device plan above but fits a “works on every device” goal.

---

**Summary:** Design mobile-first (stacked, big taps, truncated text, collapsible details), then add `sm:`/`md:`/`lg:` for tablet and desktop so My Bookings and the rest of the app feel consistent and professional on every device.
