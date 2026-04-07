# Driveway Owner Address Proof – Design Contemplation

## 1. Goal

Give owners a way to **prove they have a right to list** a given address (owner, tenant, or authorized manager). We do this in-house: they upload proof, we review it, we mark the listing as verified (or reject with reason). No third-party verification vendor required.

---

## 2. What “address proof” means

- **Accepted documents (examples):**  
  Deed, lease/rental agreement, utility bill (gas/electric/council tax), insurance doc, or similar that **clearly shows**:
  - The **listing address** (matches the driveway’s address), and  
  - The **person’s name** (matches or is clearly the account holder / lessee / owner).
- **We do not:** Verify the document is un-forged or run it through a government API. We do a **reasonable human check**: “Does this doc show this person and this address?”
- **Outcome:** Binary for now – **verified** (show badge) or **rejected** (owner can re-submit or leave unverified).

---

## 3. Who does what

| Actor | Action |
|-------|--------|
| **Owner** | Requests verification for a listing → uploads 1–2 files (PDF/image) → sees status: Pending / Verified / Rejected (with reason). |
| **Platform (admin)** | Sees queue of pending verifications → opens document + listing details → Approve or Reject (optional short reason). |
| **Drivers / public** | See “Verified” badge on listings when `verification_status === 'verified'`. |

---

## 4. Flow (high level)

```
Owner: My Driveways → [Listing] → "Verify this listing"
  → Policy text: "Upload a document that shows your name and this address (e.g. deed, lease, utility bill)."
  → Upload 1–2 files (max size e.g. 5 MB each, types: PDF, JPG, PNG)
  → Submit → status: PENDING

Backend: Store files in private storage (e.g. Supabase Storage), save metadata + status.

Admin: Dashboard / Verifications queue
  → List: pending verifications (listing title, address, owner name, uploaded at)
  → Open document (signed URL) + compare to listing address/owner
  → Approve → status: VERIFIED, verified_at = now
  → Reject → status: REJECTED, rejection_reason = "…" (e.g. "Address on document doesn’t match listing")

Owner: Sees status; if rejected, can upload again (new submission).
```

---

## 5. Data model (contemplation)

**Option A – Columns on `driveways`**

- `verification_status`: `'none' | 'pending' | 'verified' | 'rejected'`
- `verified_at`: DateTime? (when approved)
- `verification_rejected_at`: DateTime?
- `verification_rejection_reason`: string? (for owner to see)
- `verification_submitted_at`: DateTime? (when owner last submitted)

Documents: store in Supabase Storage under a path like `verifications/{drivewayId}/{filename}`; in DB store only the path or a single “current submission” URL (or JSON array of URLs). Simpler: one “current” submission; on re-submit, overwrite or new row.

**Option B – Separate table `driveway_verifications`**

- `id`, `drivewayId`, `ownerId`, `status`, `document_urls` (array or JSON), `submitted_at`, `reviewed_at`, `reviewed_by` (admin user id if you have one), `rejection_reason`.
- Allows history (e.g. “rejected once, then resubmitted and approved”) and keeps `driveways` lean.

**Recommendation:** Start with **Option A** on `driveways` plus one “current” document URL (or two). If you later want full history, add Option B and migrate.

---

## 6. Storage & security

- **Bucket:** Private (e.g. Supabase Storage `verification-documents`). No public read.
- **Access:** Only your backend (and admin UI) can generate short-lived signed URLs to view the file. Owner can “view what I uploaded” via an API that checks ownership and returns a signed URL.
- **Retention:** Define policy (e.g. delete 90 days after verification or after listing deletion; or keep for dispute resolution). Document in privacy/terms.

---

## 7. UX copy (contemplation)

- **Owner-facing:**  
  “Verify this listing so renters see a Verified badge. Upload a document that shows your name and this address (e.g. deed, lease, or utility bill). We’ll review it within 1–2 business days.”
- **Rejection:**  
  “We couldn’t verify this listing. Reason: [rejection_reason]. You can upload a different document and try again.”
- **Badge (public):**  
  “Verified” with a small checkmark or shield; tooltip: “This listing’s address was verified by Parkway Spot.”

---

## 8. Edge cases

- **One listing, multiple submissions:** If rejected, owner can re-submit; new upload replaces or adds to “current” submission; status goes back to PENDING.
- **Listing edited (address change):** Consider resetting `verification_status` to `none` when address changes, so verification clearly applies to the current address.
- **Admin not available:** Status stays PENDING until someone reviews; show owner “Usually reviewed within 1–2 days.”

---

## 9. Scope for v1 (minimal)

- Add fields to `driveways`: `verification_status`, `verified_at`, `verification_rejection_reason`, `verification_document_url` (or two URLs).
- Owner: one “Verify this listing” page – policy text, file upload (1–2 files), submit → API stores file(s) in Supabase, sets status PENDING.
- Admin: one “Verifications” queue page – list pending, open doc (signed URL), approve/reject with optional reason.
- Listing card/detail: show “Verified” badge when `verification_status === 'verified'`.
- No email notifications in v1 (optional later).

---

## 10. Out of scope (for now)

- Automated fraud detection or doc authenticity.
- Integration with land registry or government APIs.
- Mandatory verification (remain optional for owners).
- KYC/ID verification (separate future step if needed).

---

## 11. Alternative: In-house automated verification

If we **don’t** want manual review or a third-party vendor, we can build our own **automated** pipeline. It won’t prove the document is genuine (no crypto or government API), but it can:

- Extract text from the upload (OCR for images, text for PDFs).
- Find **address** and **name** in that text.
- Compare them to the **listing address** and **account owner name** (with normalization).
- Assign a **confidence score** and either auto-verify, send to manual, or auto-reject.

### 11.1 High-level pipeline

```
Upload (PDF/image)
  → Document processing: extract raw text (OCR / PDF text)
  → NER / heuristics: detect "address" and "person name" in text
  → Normalize: address (e.g. "123 Main St" ↔ "123 Main Street"), name (e.g. "J. Smith" ↔ "John Smith")
  → Match: similarity vs listing address + owner name
  → Decision: confidence HIGH → verified, MEDIUM → pending manual, LOW → rejected (with reason)
```

### 11.2 Tech choices (contemplation)

| Step | Options | Notes |
|------|---------|--------|
| **Text extraction** | Tesseract (OCR), pdf-parse / pdfjs (PDF), or cloud (Google Document AI, AWS Textract) | In-house: Tesseract + pdf-parse. Cloud: better accuracy, cost per doc. |
| **Address/name extraction** | Regex + heuristics, or NER (spaCy, etc.), or LLM (e.g. “extract address and account holder name from this text”) | Heuristics cheap but brittle; LLM flexible, needs prompt + safety. |
| **Normalization** | Address: libpostal, custom rules (abbrevs, case). Name: lowercase, trim, maybe fuzzy (Levenshtein) | libpostal is strong for addresses; names are trickier (middle names, initials). |
| **Similarity / scoring** | String similarity (Levenshtein, Jaro-Winkler), or semantic (embeddings) for “same address” | Start with normalized string match + fuzzy threshold. |

### 11.3 Decision thresholds

- **Auto-verify:** Address match score & name match score both above threshold (e.g. ≥ 0.9). Optional: doc type in allowed list (utility, lease, deed).
- **Auto-reject:** Address or name clearly absent or below low threshold (e.g. &lt; 0.5), or extraction failed.
- **Send to manual:** In between (e.g. 0.5–0.9), or ambiguous (multiple addresses/names in doc).

We’d store **confidence scores** and **extracted snippets** in DB for debugging and for optional manual override.

### 11.4 Data model addition (for automated path)

- `verification_confidence`: float? (0–1)
- `verification_auto_result`: `'verified' | 'rejected' | 'manual_review'`?
- `verification_extracted_address`: string? (what we parsed)
- `verification_extracted_name`: string? (what we parsed)

So we can show “We couldn’t find a matching address” or “Name on document didn’t match” as rejection reasons.

### 11.5 Flow with automation

```
Owner submits doc
  → Backend: store file, run pipeline (async job or inline)
  → If auto-verify: set status VERIFIED, verified_at = now
  → If auto-reject: set status REJECTED, rejection_reason = e.g. "Address on document didn’t match listing"
  → If manual_review: set status PENDING → same admin queue as before
```

Owner UX can stay the same; we only change what happens after upload (automated vs always PENDING).

### 11.6 Risks and limitations

- **False positives:** A doctored or irrelevant doc might parse as “matching” (e.g. same street name elsewhere). Mitigation: conservative thresholds; optional manual audit of auto-verified.
- **False negatives:** Legit docs with weird formatting or spelling get rejected. Mitigation: send to manual when confidence in middle band; clear rejection reasons so owner can re-submit a clearer doc.
- **No authenticity:** We still don’t verify the document isn’t forged. Automated only checks “content consistency,” not “is this a real deed?”
- **Cost:** If we use cloud OCR/LLM, cost per verification. In-house (Tesseract + heuristics) is cheaper but more engineering and tuning.

### 11.7 Hybrid (recommended if we go automated)

- **Auto-verify** only when confidence is **high** and maybe doc type is in a safe list.
- **Auto-reject** when clearly no match or unreadable.
- **Everything else → manual queue.** That keeps quality and lets us tune thresholds over time.

---

## 12. Comparison: manual vs automated vs third-party

| Aspect | Manual (v1) | In-house automated | Third-party (e.g. Onfido, Jumio) |
|--------|-------------|--------------------|-----------------------------------|
| **Build** | Upload + admin UI | + OCR, extraction, matching, thresholds | Integrate API, pay per check |
| **Authenticity** | Human judgment | Content match only | Often ID + liveness + doc checks |
| **Speed** | 1–2 days | Seconds (or async job) | Usually minutes |
| **Cost** | Staff time | Dev + compute/API | Per-verification fee |
| **Fraud** | Hard to scale fake docs | Doctored docs can pass if they match | Stronger, vendor-dependent |

So: **in-house automated** = faster and scalable, but still “trust the content,” not “trust the document.” Good middle ground if we don’t want full manual queue and don’t want to pay a vendor yet.

---

## Next step

- **Manual:** Implement minimal v1 (schema, upload, storage, admin queue, badge).
- **Automated:** Same base, plus pipeline (extract → match → score) and thresholds; keep manual queue for borderline cases.
- **Third-party:** Define requirements (ID only? ID + address?) then evaluate vendors and integrate.

---

## Implementation status (hybrid)

Implemented in codebase:

- **Schema:** `VerificationStatus` enum and fields on `driveways` (including `verificationProvider`, `verificationExternalId` for future third-party).
- **Storage:** Verification documents uploaded via `POST /api/upload/verification-document` (Cloudinary folder `driveway-rental/verifications`).
- **Owner flow:** `POST /api/driveways/[id]/verify` with `documentUrls`; runs in-house pipeline (PDF text extraction, address/name matching); auto-verify / auto-reject or PENDING for manual.
- **Admin:** `GET /api/admin/verifications`, `PATCH /api/admin/verifications/[drivewayId]` (approve/reject); dashboard link and `/admin/verifications` page for ADMIN role.
- **UI:** Owner: “Verify listing” page at `/driveways/[id]/verify`; Verified badge on listing card and detail; address change on PATCH resets verification to NONE.

To add a **third-party** provider later: set `verificationProvider = 'third_party'` and `verificationExternalId` when using an external API; keep same `verificationStatus` and badge behaviour.
