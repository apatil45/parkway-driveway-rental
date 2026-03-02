/**
 * Address-proof verification pipeline (hybrid: auto + manual).
 * Extracts text from uploaded documents (PDF), normalizes and matches address/name
 * against listing and owner. Used for in-house verification; design allows
 * future third-party provider (verificationProvider / verificationExternalId).
 */

const ADDRESS_ABBREVS: [string, string][] = [
  [' street', ' st'],
  [' avenue', ' ave'],
  [' road', ' rd'],
  [' drive', ' dr'],
  [' lane', ' ln'],
  [' boulevard', ' blvd'],
  [' court', ' ct'],
  [' place', ' pl'],
  [' way', ' way'],
  [' circle', ' cir'],
];

function normalizeForMatch(s: string): string {
  let t = s.toLowerCase().trim().replace(/\s+/g, ' ');
  ADDRESS_ABBREVS.forEach(([long, short]) => {
    t = t.replace(new RegExp(long.replace(/\s/g, '\\s') + '(?=\\s|$)', 'gi'), short);
  });
  return t;
}

/** Simple similarity: how much of the expected string appears in the found string (or vice versa). */
function stringSimilarity(a: string, b: string): number {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na || !nb) return 0;
  const naWords = na.split(/\s+/).filter(Boolean);
  const nbWords = nb.split(/\s+/).filter(Boolean);
  let matches = 0;
  for (const w of naWords) {
    if (nb.includes(w) || nbWords.some((bw) => bw.includes(w) || w.includes(bw))) matches++;
  }
  const scoreA = naWords.length ? matches / naWords.length : 0;
  matches = 0;
  for (const w of nbWords) {
    if (na.includes(w) || naWords.some((aw) => aw.includes(w) || w.includes(aw))) matches++;
  }
  const scoreB = nbWords.length ? matches / nbWords.length : 0;
  return Math.max(scoreA, scoreB);
}

/** Heuristic: find a line or segment that looks like an address (contains number + street-like token). */
function extractAddressFromText(text: string): string | null {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const numberFirst = /^\d+[\d\s,-]*[a-z]/i;
  const hasStreetType = /\d+[\d\s,-]*(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|way|ct|place|pkwy|highway|hwy)/i;
  for (const line of lines) {
    if (line.length < 8 || line.length > 250) continue;
    if (numberFirst.test(line) || hasStreetType.test(line)) {
      return line;
    }
  }
  const merged = text.replace(/\s+/g, ' ');
  const addrLike = merged.match(/\d+[\d\s,-]*(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|way|ct|place|pkwy)[^.]*/i);
  return addrLike ? addrLike[0].trim() : null;
}

/** Check if listing address appears anywhere in document text (e.g. utility bill service address). */
function addressAppearsInText(listingAddress: string, documentText: string): number {
  const normListing = normalizeForMatch(listingAddress);
  const normDoc = normalizeForMatch(documentText);
  if (normDoc.includes(normListing)) return 1;
  const listingWords = normListing.split(/\s+/).filter(Boolean);
  let matchCount = 0;
  for (const w of listingWords) {
    if (w.length >= 2 && normDoc.includes(w)) matchCount++;
  }
  return listingWords.length ? matchCount / listingWords.length : 0;
}

/** Heuristic: find a line that looks like a name (title case, ALL CAPS, or "Last, First"). */
function extractNameFromText(text: string): string | null {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const nameLikeTitle = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/;
  const nameLikeCaps = /^[A-Z][A-Z\s]{2,50}$/; // e.g. "JOHN SMITH"
  const nameLikeLastFirst = /^[A-Z][a-z]+,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$/; // "Smith, John"
  for (const line of lines) {
    if (line.length < 4 || line.length > 80 || /\d{5}/.test(line)) continue; // skip lines with zip
    if (nameLikeTitle.test(line) || (nameLikeCaps.test(line) && line.split(/\s+/).length >= 2 && line.split(/\s+/).length <= 5)) {
      return line;
    }
    if (nameLikeLastFirst.test(line)) {
      const [last, first] = line.split(',').map((s) => s.trim());
      return first && last ? `${first} ${last}` : line;
    }
  }
  return null;
}

/** Check if owner name appears anywhere in document (e.g. "Account Holder" section). */
function nameAppearsInText(ownerName: string, documentText: string): number {
  const normDoc = normalizeForMatch(documentText);
  const nameParts = ownerName.split(/\s+/).filter(Boolean).map((p) => p.toLowerCase());
  if (nameParts.length === 0) return 0;
  let matchCount = 0;
  for (const part of nameParts) {
    if (part.length >= 2 && normDoc.includes(part)) matchCount++;
  }
  return matchCount / nameParts.length;
}

export interface VerificationPipelineInput {
  documentUrls: string[];
  listingAddress: string;
  ownerName: string;
}

export interface VerificationPipelineResult {
  result: 'verified' | 'rejected' | 'manual_review';
  confidence: number;
  extractedAddress: string | null;
  extractedName: string | null;
  rejectionReason?: string;
}

const HIGH_CONFIDENCE = 0.72;
const LOW_CONFIDENCE = 0.35;

/** Fetch buffer from URL (for PDF). */
async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch document: ${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

/** Extract text from PDF buffer using pdf-parse. */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const mod = await import('pdf-parse');
  const pdfParse = typeof (mod as any).default === 'function' ? (mod as any).default : (mod as any);
  const data = await pdfParse(buffer);
  return data?.text?.trim() ?? '';
}

export async function runVerificationPipeline(
  input: VerificationPipelineInput
): Promise<VerificationPipelineResult> {
  const { documentUrls, listingAddress, ownerName } = input;
  let fullText = '';

  for (const url of documentUrls) {
    const isPdf = /\.pdf$/i.test(url) || url.includes('/raw/') || url.includes('pdf');
    try {
      const buffer = await fetchBuffer(url);
      if (isPdf) {
        fullText = await extractPdfText(buffer);
        if (fullText) break;
      }
    } catch {
      continue;
    }
  }

  if (!fullText || fullText.length < 20) {
    return {
      result: 'manual_review',
      confidence: 0,
      extractedAddress: null,
      extractedName: null,
      rejectionReason: 'Could not extract text from document. A staff member will review it.',
    };
  }

  const extractedAddress = extractAddressFromText(fullText);
  const extractedName = extractNameFromText(fullText);

  let addressScore = extractedAddress
    ? stringSimilarity(listingAddress, extractedAddress)
    : 0;
  let nameScore = extractedName
    ? stringSimilarity(ownerName, extractedName)
    : 0;

  // Fallback: if listing address or owner name appears anywhere in doc (e.g. utility bill), use that
  if (addressScore < HIGH_CONFIDENCE) {
    const inTextScore = addressAppearsInText(listingAddress, fullText);
    addressScore = Math.max(addressScore, inTextScore * 0.95);
  }
  if (nameScore < HIGH_CONFIDENCE) {
    const inTextScore = nameAppearsInText(ownerName, fullText);
    nameScore = Math.max(nameScore, inTextScore * 0.95);
  }

  const confidence = (addressScore + nameScore) / 2;
  if (addressScore >= HIGH_CONFIDENCE && nameScore >= HIGH_CONFIDENCE) {
    return {
      result: 'verified',
      confidence,
      extractedAddress,
      extractedName,
    };
  }
  if (addressScore < LOW_CONFIDENCE || nameScore < LOW_CONFIDENCE) {
    const reasons: string[] = [];
    if (addressScore < LOW_CONFIDENCE) reasons.push('Address on document did not clearly match the listing address.');
    if (nameScore < LOW_CONFIDENCE) reasons.push('Name on document did not clearly match the account holder.');
    return {
      result: 'rejected',
      confidence,
      extractedAddress,
      extractedName,
      rejectionReason: reasons.join(' '),
    };
  }
  return {
    result: 'manual_review',
    confidence,
    extractedAddress,
    extractedName,
    rejectionReason: 'Document needs manual review.',
  };
}
