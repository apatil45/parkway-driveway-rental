# Parkway Spot AI Strategy

**Purpose:** Define where and how AI delivers product value, technical feasibility, and business impact so the "Ai" in Parkway Spot is real and defensible.  
**Audience:** Product, engineering, and pre–Series A narrative.  
**Status:** Strategy (implementation follows in phases).

---

## 1. Strategic rationale

| Lens | Why AI matters for Parkway Spot |
|------|------------------------------|
| **Product** | Search "relevance" is undefined; verification is heuristic-only; no personalization. AI can make discovery, trust, and host tools meaningfully better. |
| **Conversion** | Assessment says 30–50% conversion leak at decision layer. Smart ranking, review highlights, and better verification directly address that. |
| **Pitch** | "Parkway Spot" today has no AI. Investors and partners will ask. A clear, phased AI plan turns the name into a moat instead of a liability. |
| **Unit economics** | AI should improve LTV (repeat bookings, host retention) and reduce cost (support, manual verification). Avoid AI for its own sake. |

**Principles:**
- Every AI feature must map to a measurable outcome (conversion, retention, trust, or cost). No "AI theater."
- **Users must feel the smartness.** AI cannot live only behind the scenes. Direct, visible AI moments defend the product name and build trust that "Parkway Spot" is real.

---

## 2. User-visible AI: Making smartness feel real

To defend "our product contains AI," users need to **see and experience** smart behavior in the UI—not only benefit from it in the background. Below: where to surface AI, what to call it, and how to make it obvious without feeling gimmicky.

### 2.1 Visibility rule

| If we do this… | …we must show this to the user |
|----------------|----------------------------------|
| AI ranks or recommends results | A clear "Recommended for you" or "Best match" section/label; optional "Why this order?" tooltip. |
| AI summarizes reviews | A dedicated line or badge: **"AI summary"** or "What guests say" with the summary; not buried in fine print. |
| AI parses natural-language search | Search bar placeholder or chip: "Try: 'near the airport for 2 hours'" and show parsed intent back: "Searching for: Airport area · ~2 hrs". |
| AI suggests price to host | "Suggested by Parkway Spot: $X/hr" with short reason: "Based on similar spots nearby." |
| AI answers support questions | Visible assistant entry point: "Ask Parkway Spot" or "AI assistant"; answers cite source. |
| Verification uses AI | Host sees "Verifying with AI…" then "Verified by Parkway Spot" (not only "Verified"). |

**Principle:** Every AI touchpoint should have a **visible moment**—a label, a section title, or a microcopy that makes the smartness explicit.

### 2.2 Concrete UI patterns (by feature)

| Feature | Where it appears | What the user sees (copy / UI) |
|---------|------------------|----------------------------------|
| **Review highlights** | Search cards + listing detail | Card: one line summary. Detail: section **"What guests say (AI summary)"** with the summary + "Based on X reviews." |
| **Smart ranking** | Search results | Sort option: **"Recommended"** (default) with tooltip: "Parkway Spot orders by best match: distance, rating & availability." List section title: "Recommended for this search." |
| **Natural-language search** | Search bar | Placeholder: "Where and when? e.g. 'near stadium Saturday 2pm'" After submit: "Found spots for: [Stadium area] · Saturday ~2pm" so the user sees we understood. |
| **Host price suggestion** | Create/edit listing | Block: "Parkway Spot suggests **$X/hr** for this area (from similar spots)." Pre-fill with option to edit. |
| **AI assistant** | Global (header/footer) or help page | Button: "Ask Parkway Spot" or "AI help." Chat UI with short disclaimer: "Answers powered by Parkway Spot." |
| **Verification (host)** | Verification flow | Step: "Parkway Spot will verify your document in seconds." Success: "Verified by Parkway Spot" with checkmark. |
| **Personalization** | Search / home | Section: **"Picked for you"** or "Recommended for you" with 3–5 listings; subtext: "Based on your past bookings and preferences." |

### 2.3 Do's and don'ts for visible AI

| Do | Don't |
|----|--------|
| Use "Parkway Spot" or "AI" in the label when the feature is AI-driven ("AI summary," "Suggested by Parkway Spot"). | Hide that AI was involved; generic "Summary" or "Suggested price" with no attribution. |
| Make the smart result obvious (e.g. show parsed query, or "Why recommended"). | Rely only on better order or better text with no explanation. |
| Prioritize 1–2 high-impact, obvious AI moments in Phase 1 (e.g. review summary + "Recommended" sort). | Ship only backend AI (e.g. verification) with no user-facing AI in the first release. |
| Keep copy short and scannable ("AI summary," "Recommended for you"). | Over-explain ("Our artificial intelligence has analyzed…"). |

### 2.4 Minimum viable "feel" (Phase 1)

By the end of Phase 1, a user should be able to **point to at least two places** where the product clearly feels "smart because of AI":

1. **Search / listing:** "What guests say" or "AI summary" on cards or detail so they see AI distilled reviews.
2. **Search:** "Recommended" as the default sort with a clear label that Parkway Spot is choosing the order (and optionally why).

Optional third: **Host verification** — host sees "Verifying with Parkway Spot…" and "Verified by Parkway Spot" so the name is tied to a concrete AI moment.

---

## 3. AI pillars and feature map

### Pillar A — Smarter discovery (driver)

| Feature | What it does | Data / model | Impact |
|--------|----------------|-------------|--------|
| **AI-powered relevance** | Replace opaque "relevance" sort with a ranking score: distance + rating + availability + (optional) personalization from past behavior. | Existing: lat/lon, rating, `isAvailable`, favorites, bookings. Optional: embeddings of listing + query. | Fewer dead-end clicks, higher Search → Detail → Book. |
| **Review highlights** | One-line summary per listing: "Guests love: easy access, clean spot." Optional: sentiment + key phrases. | `Review.comment`; LLM summarization (batch or on-demand). | Trust on cards without reading 50 reviews; better cards. |
| **Natural-language search (Phase 2)** | Query like "parking near the airport for 3 hours tomorrow" → structured search (location, duration, time). | LLM to parse intent → existing search API. | Lower friction for first-time and mobile users. |

### Pillar B — Trust and verification (host + platform)

| Feature | What it does | Data / model | Impact |
|--------|----------------|-------------|--------|
| **LLM document extraction** | From verification docs (PDF/images): extract address and account-holder name; optional doc-type classification (utility, lease, deed). | Current pipeline: pdf-parse + heuristics. Add: LLM call with structured output (e.g. OpenAI/Anthropic function calling). | Higher auto-verify accuracy; fewer false rejections; clearer rejection reasons. |
| **Keep hybrid** | Auto-verify only when confidence is high; manual queue for borderline. LLM improves extraction, not replacement of human review. | Same as today; LLM augments `VerificationService`. | Trust + scalability without over-relying on AI. |

### Pillar C — Smarter pricing and supply (host + platform)

| Feature | What it does | Data / model | Impact |
|--------|----------------|-------------|--------|
| **Price suggestions for hosts** | On create/edit listing: "Suggested $X/hr based on this area and similar spots." | Similar listings (geo + amenities), historical bookings, time of day/week. Start with rules (median/percentiles), then simple ML if data allows. | Better fill and host satisfaction; less underpricing. |
| **Demand-aware surge** | Today: `PricingService` uses fixed rules (time of day, day of week) + optional demand multiplier. Evolve: use booking history by area/time to predict demand and suggest or apply surge. | Aggregated bookings by (area, hour, day of week); simple forecast or regression. | Revenue and yield; clearer "why this price" for users. |

### Pillar D — Engagement and support (both sides)

| Feature | What it does | Data / model | Impact |
|--------|----------------|-------------|--------|
| **In-app AI assistant (Phase 2)** | Answer FAQs: "How do I list?", "When do I get paid?", "What's your cancellation policy?" — with links to help or booking. | RAG over help content + policy; or fine-tuned small model. | Lower support load; higher conversion for hesitant users. |
| **Personalization (Phase 2)** | For logged-in users: "Recommended for you" using favorites, past bookings, and filters (e.g. EV, covered). | Collaborative filtering or embedding-based similarity. | Repeat rate; session depth. |

---

## 4. Prioritized roadmap

### Phase 1 — Foundation (0–3 months): Make "Ai" real and visible to users

| # | Initiative | Pillar | User-visible? | Effort | Outcome |
|---|------------|--------|----------------|--------|---------|
| 1 | **LLM-augmented verification** | B | Yes (host): "Verifying with Parkway Spot…" / "Verified by Parkway Spot" | 2–3 w | Better extraction; host sees AI in the flow. |
| 2 | **Review highlights** | A | **Yes:** "What guests say (AI summary)" on cards + detail; "Based on X reviews." | 1–2 w | Trust on cards; user sees AI summarization. |
| 3 | **Defined relevance + "Recommended"** | A | **Yes:** Default sort = "Recommended"; label: "Parkway Spot orders by best match." | 1–2 w | User sees that results are smart-ordered; relevance no longer a black box. |

**Success metrics:** Auto-verify accuracy and manual queue size; card CTR and conversion; **user can name at least 2 places where the product feels smart (AI summary + Recommended).**

### Phase 2 — Growth (3–6 months): Discovery and host tools (more visible AI)

| # | Initiative | Pillar | User-visible? | Effort | Outcome |
|---|------------|--------|----------------|--------|---------|
| 4 | **ML or embedding-based ranking** | A | Yes: same "Recommended" label; optional "Why this order?" | 2–3 w | Smarter order; user still sees it as Parkway Spot recommendation. |
| 5 | **Host price suggestions** | C | **Yes:** "Suggested by Parkway Spot: $X/hr (from similar spots nearby)." | 2 w | Host sees AI helping them price. |
| 6 | **Natural-language search** | A | **Yes:** Placeholder + "Found spots for: [parsed intent]" so user sees we understood. | 2 w | Obvious AI moment in search. |

**Success metrics:** Search → booking conversion; host listing completion; **users experience NL search and host sees AI price suggestion.**

### Phase 3 — Scale and differentiation (6–12 months)

| # | Initiative | Pillar | User-visible? | Effort | Outcome |
|---|------------|--------|----------------|--------|---------|
| 7 | **Demand-aware pricing** | C | Yes: "High demand — Parkway Spot pricing" or "Suggested price for this time." | 2–3 w | User sees dynamic, smart pricing. |
| 8 | **In-app AI assistant** | D | **Yes:** "Ask Parkway Spot" button; chat UI with "Powered by Parkway Spot." | 3–4 w | Direct, obvious AI interaction. |
| 9 | **Personalized "For you"** | D | **Yes:** Section "Picked for you" / "Recommended for you" with short explanation. | 2–3 w | User sees AI personalization. |

**Success metrics:** Support ticket volume; repeat booking rate; **users associate Parkway Spot with assistant and personalized picks.**

---

## 5. Technical approach

### 5.1 When to use what

| Use case | Preferred approach | Rationale |
|----------|--------------------|-----------|
| Verification extraction | LLM with structured output (e.g. JSON/function calling) | Variable document layouts; need address + name + optional type; heuristics stay as fallback. |
| Review summarization | LLM (batch or on-demand), cache by `drivewayId` | Short text; one summary per listing; cache invalidated when new review added. |
| Ranking | Start: rules (distance, rating, availability). Later: learning-to-rank or embeddings. | Need interpretability and fast iteration; add ML when engagement data is sufficient. |
| NL search | LLM to map query → structured params | Small number of fields; existing API; no need for real-time training. |
| Price suggestions | Rules (median/percentile by area/amenities) first; simple ML when data is enough | Transparency for hosts; avoid overfitting early. |
| Assistant | RAG over docs + policies, or hosted small model | Accuracy and consistency matter; citations build trust. |

### 5.2 Stack and safety

- **APIs:** Prefer one primary provider (e.g. OpenAI or Anthropic) for verification and review summarization; use structured outputs and rate limits.
- **Verification:** Never send PII beyond what’s already in the doc (address, name). Prefer server-side only; no logging of raw docs in LLM provider by default; check provider DPA.
- **Cost:** Verification and review summary are bounded (one call per doc or per listing refresh). Use caching and batch where possible.
- **Fallbacks:** If LLM fails or is unavailable, verification falls back to current heuristic pipeline; ranking falls back to sort by distance or rating.

### 5.3 Data and privacy

- **Training:** Do not train external models on user content without clear consent and policy. Use APIs in stateless way for verification and summarization.
- **Personalization:** Use only first-party engagement (clicks, bookings, favorites) and aggregate or anonymized patterns where possible.

---

## 6. Business and pitch narrative

### 6.1 One-liners for "What AI does in Parkway Spot"

- **Today (after Phase 1):** "We use AI to verify host documents in seconds and to summarize reviews so drivers see what matters at a glance."
- **Phase 2:** "AI powers our search—from natural-language queries to smarter ranking—and helps hosts set the right price."
- **Phase 3:** "From verification to discovery to support, AI is built into the loop to improve trust, conversion, and retention."

### 6.2 How this supports the product strategy

- **Conversion:** Relevance + review highlights + better verification → fewer wasted clicks and higher trust at decision point.
- **Retention:** Personalization and assistant → more repeat bookings and lower support load.
- **Host side:** Price suggestions and demand signals → better yield and satisfaction.
- **Pitch:** "Parkway Spot" is justified by concrete AI features that map to metrics, not buzzwords.
- **Defending the name:** Users must **feel** the smartness. Visible AI moments (e.g. "What guests say" AI summary, "Recommended" sort, "Ask Parkway Spot," suggested price) make the product defensible in direct experience, not only in the backend.

---

## 7. Summary

| Pillar | Phase 1 | Phase 2 | Phase 3 |
|--------|--------|--------|--------|
| **Discovery** | Relevance (rules), Review highlights | NL search, ML ranking | Personalization |
| **Trust** | LLM verification extraction | — | — |
| **Pricing / supply** | — | Host price suggestions | Demand-aware pricing |
| **Engagement** | — | — | AI assistant |

Implement Phase 1 so that the name Parkway Spot is accurate and **users can point to at least two visible AI moments** (e.g. "What guests say" AI summary and "Recommended" sort). Then layer in NL search, host price suggestions, assistant, and personalization so the product defends "contains AI" in both backend and direct user experience.

---

## Appendix A — Implementation hooks (codebase)

| Feature | Where it fits |
|---------|----------------|
| **LLM verification** | `apps/web/src/services/VerificationService.ts`: after `extractPdfText()`, call LLM with raw text; use result to set `extractedAddress` / `extractedName` (and optional doc type); keep existing similarity scoring. |
| **Review highlights** | New API or cron: aggregate `Review.comment` by `drivewayId`, call LLM, store summary (e.g. new column `Driveway.reviewSummary` or separate table). Search/detail pages read and display. |
| **Relevance ranking** | `apps/web/src/app/api/driveways/route.ts`: today `orderBy` is price/createdAt/rating. Add a score = f(distance, rating, isAvailable) and sort by it when `sort=relevance`. |
| **Price suggestions** | New endpoint or in driveway create/edit API: query similar listings (geo + amenities), return suggested `pricePerHour` (e.g. median). |
| **User-visible labels** | Search cards: show review summary with "What guests say (AI summary)". Sort dropdown: default "Recommended" + tooltip. Detail page: section "What guests say" with AI summary. Verification (host): "Verifying with Parkway Spot…" / "Verified by Parkway Spot." |

---

## Appendix B — Example LLM verification prompt (structured output)

Use a system + user prompt and request JSON so the pipeline stays deterministic:

- **Input:** Extracted text from verification document (utility bill, lease, etc.).
- **Output (JSON):** `{ "address": string | null, "accountHolderName": string | null, "documentType": "utility" | "lease" | "deed" | "other" | null }`
- **Fallback:** If LLM returns null or errors, use existing heuristics in `VerificationService.ts`.

This keeps a single source of truth (similarity vs listing address + owner name) while improving extraction quality.

---

## Appendix C — User-visible AI checklist (for frontend)

When shipping an AI feature, ensure the user can see that it's smart:

- [ ] **Attribution:** Is "Parkway Spot" or "AI" mentioned in the label or microcopy? (e.g. "AI summary," "Suggested by Parkway Spot")
- [ ] **Obvious moment:** Does the user get a clear "this was done by AI" moment? (e.g. parsed query shown after NL search, "Recommended" as default sort)
- [ ] **No stealth AI:** Avoid shipping AI that only improves something in the background with zero UI change; add at least a small visible cue.

---

*Document version: 1.1. Last updated: March 2026.*
