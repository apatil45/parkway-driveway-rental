/**
 * Primary market / region config for search scope and copy.
 * Change NEXT_PUBLIC_PRIMARY_MARKET to switch the default city (e.g. "jersey" | "nyc").
 * Add entries to MARKETS to support new cities.
 */

export interface Market {
  slug: string;
  displayName: string;
  /** Nominatim viewbox: minlon,minlat,maxlon,maxlat */
  viewbox: string;
  popularSearches: string[];
  /** Venue/landmark suggestions (SpotHero-style: park near airport, transit, etc.) */
  popularVenues?: string[];
  placeholderHints: string[];
}

const MARKETS: Record<string, Market> = {
  jersey: {
    slug: 'jersey',
    displayName: 'Jersey City',
    viewbox: '-74.10,40.70,-74.02,40.77',
    popularSearches: [
      'Newport PATH',
      'Downtown Jersey City',
      'Grove Street',
      'Exchange Place',
      'Liberty State Park',
    ],
    popularVenues: [
      'Newport PATH',
      'Exchange Place',
      'Grove Street',
      'Liberty State Park',
      'Journal Square',
    ],
    placeholderHints: [
      'Address, landmark, or transit stop',
      'e.g. Newport PATH, Grove St, Exchange Place',
      'Where are you going?',
      'Park near airport, stadium, or address',
    ],
  },
  // Example: add more markets later
  // nyc: { slug: 'nyc', displayName: 'New York City', viewbox: '-74.26,40.48,-73.70,40.92', ... },
};

const PRIMARY_MARKET_ENV = 'NEXT_PUBLIC_PRIMARY_MARKET';
const DEFAULT_SLUG = 'jersey';

/**
 * Primary market for this deployment (from env, default jersey).
 * Safe to use on client and server.
 */
export function getPrimaryMarket(): Market {
  const slug =
    (typeof process !== 'undefined' && process.env[PRIMARY_MARKET_ENV]) ||
    DEFAULT_SLUG;
  return getMarketBySlug(slug) ?? MARKETS[DEFAULT_SLUG]!;
}

/**
 * Get market by slug. Returns undefined if slug is unknown.
 */
export function getMarketBySlug(slug: string): Market | undefined {
  if (!slug) return undefined;
  return MARKETS[slug.toLowerCase()];
}

/**
 * Resolve viewbox: if slug is a known market, return its viewbox; otherwise treat as raw "minlon,minlat,maxlon,maxlat".
 */
export function resolveViewbox(slugOrRaw: string): string | undefined {
  if (!slugOrRaw) return undefined;
  const market = getMarketBySlug(slugOrRaw);
  if (market) return market.viewbox;
  // Raw bbox (e.g. "minlon,minlat,maxlon,maxlat")
  if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(slugOrRaw))
    return slugOrRaw;
  return undefined;
}
