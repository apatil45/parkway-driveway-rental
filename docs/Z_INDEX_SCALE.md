# Z-Index Scale

Single source of truth for stacking order across the app. Use Tailwind classes or the numeric values below.

| Layer | Tailwind | Value | Use for |
|-------|----------|-------|--------|
| Base | (default) | 0 | Page content, map |
| Content overlay | `z-content-overlay` | 10 | In-content overlays (e.g. map loading, list loading) |
| Sticky bar | `z-sticky-bar` | 20 | Search bar, filters panel (sticky below navbar) |
| Navbar | `z-navbar` | 50 | Main header — **highest** of layout so it always stays on top |
| Dropdown | `z-dropdown` | 55 | Address autocomplete, user menu (just above navbar so menus are visible) |
| Backdrop | `z-backdrop` | 60 | Dim overlay behind modals/sheets (mobile menu, toast dismiss, pin detail, FAB backdrop) |
| Overlay content | `z-overlay-content` | 70 | Mobile menu drawer, toasts, pin detail sheet, FAB, slide-out panels |
| Modal | `z-modal` | 80 | Confirm dialogs, admin modals |
| A11y | `z-a11y` | 90 | Skip link when focused |

**Rules:**
- Navbar (50) is the highest layout layer so it is never covered by sticky bars or page content.
- Dropdowns (55) sit just above navbar so autocomplete and user menu remain visible when open.
- Backdrops (60) and overlay content (70) sit above navbar for modals/sheets.
- Modals (80) and skip link (90) stay on top for critical UI and accessibility.

Defined in `apps/web/tailwind.config.js` under `theme.extend.zIndex`.
