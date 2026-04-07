# Parkway Spot — Naming alternatives (replacing "Ai")

If you prefer not to lean on "AI" in the product name, here are alternatives that stay on-brand (parking, driveway, ease, smart) without claiming AI.

---

## Strong alternatives (equivalently good)

| Name | Why it works |
|------|----------------------|
| **Parkway** | Clean, simple, already your root. "Parkway" alone reads as premium and category-owning (the way to park). No tech buzzword. |
| **Parkway+** | Suggests "more" — more options, better experience, premium. Common pattern (Disney+, Duo+). |
| **Parkway Go** | Implies speed, ease, "go park." Good for mobile-first. |
| **Parkway Spot** | Literal (find a spot) + memorable. "Spot" is parking-native. |
| **Parkway One** | One place for parking, one tap, one app. Premium, simple. |
| **Parkway Now** | Urgency and convenience — park now, book now. |
| **Parkway Hub** | Central place for parking; works for both drivers and hosts. |

---

## Slightly different direction (still on-theme)

| Name | Why it works |
|------|----------------------|
| **Parkway** (standalone) | Already covered above; often the strongest choice when you don’t need a suffix. |
| **Driveway** | Direct category name. You already use "driveway rental" in copy; could own "Driveway" as the brand (e.g. "Driveway — rent a spot"). Risk: more generic. |
| **Parkway Lane** | "Lane" = path, route, spot. Soft, easy to say. |
| **Parkway Place** | "Your place to park" / "A place for your car." Friendly, clear. |

---

## Recommendation

- **Primary pick:** **Parkway** (no suffix). Simple, ownable, no AI claim, works in every context (legal, app store, wordmark).
- **If you want a suffix:** **Parkway+** or **Parkway Spot** — both feel modern and positive without "Ai."

---

## If you rename

The product name **Parkway Spot** appears in:

- `apps/web/src/components/ui/Logo.tsx` — wordmark and a11y text
- `apps/web/src/components/layout/Footer.tsx`
- `apps/web/src/app/layout.tsx` — meta title/description
- `apps/web/src/app/page.tsx`, `about/page.tsx`, `pricing/page.tsx`, `terms/page.tsx`, `host-guide/page.tsx`, `bookings/.../confirmation/page.tsx`
- `apps/web/src/components/ui/VerifiedBadge.tsx`
- Docs under `docs/` (multiple files)
- Tests (e.g. `Footer.test.tsx`)

Use project-wide find-and-replace for the chosen name (and update logo assets if the wordmark changes).  
**Display name** and **aria-label / meta** should stay consistent (e.g. "Parkway" everywhere, not "Parkway - Driveway Rental" in some places and "Parkway+" in others).

---

*Short doc for product/marketing. Last updated: March 2026.*
