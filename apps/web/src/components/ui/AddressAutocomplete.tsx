'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getPrimaryMarket, getMarketBySlug } from '@/lib/market-config';

// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
import { 
  MapPinIcon, 
  ClockIcon, 
  StarIcon, 
  InformationCircleIcon,
  BuildingOfficeIcon,
  HomeIcon,
  BriefcaseIcon,
  MicrophoneIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  distance?: number;
  /** For recent: "5m ago", "2h ago" (SpotHero-style clarity) */
  lastUsedAgo?: string;
  /** Nominatim type (city, town, road, etc.) — for "City" / "Address" label in dropdown */
  placeType?: string;
  /** Nominatim importance (0–1) — prominence-style ranking; cities/landmarks score higher */
  importance?: number;
  isRecent?: boolean;
  isNearby?: boolean;
  isFavorite?: boolean;
  isPOI?: boolean;
  category?: 'address' | 'landmark' | 'recent' | 'favorite' | 'poi';
}

interface SavedAddress {
  address: string;
  lat: number;
  lon: number;
  timestamp: number;
  usageCount: number;
}

interface FavoriteLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  icon?: 'home' | 'work' | 'custom';
  timestamp: number;
}

// Storage keys
const ADDRESS_HISTORY_KEY = 'parkway_address_history';
const FAVORITES_KEY = 'parkway_favorite_locations';
const SEARCH_ANALYTICS_KEY = 'parkway_search_analytics';
const MAX_HISTORY_ITEMS = 10;
const MAX_FAVORITES = 5;

// Fallback when no market config (should not happen if market-config is set up)
const FALLBACK_POPULAR_SEARCHES = ['Downtown', 'Near me', 'Address or landmark'];
const FALLBACK_PLACEHOLDER_TEXTS = ['Search for parking near...', 'Enter an address or landmark'];

// Debounce function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Human-readable label from Nominatim type (city, town, road, etc.)
function getPlaceTypeLabel(type?: string): string {
  if (!type) return 'Address';
  const t = type.toLowerCase();
  if (['city', 'town', 'municipality', 'city_block'].includes(t)) return 'City';
  if (['village', 'suburb', 'neighbourhood', 'quarter', 'hamlet'].includes(t)) return 'Area';
  if (['state', 'county', 'region'].includes(t)) return 'Region';
  if (['road', 'street', 'house', 'building', 'residential'].includes(t)) return 'Address';
  return 'Address';
}

// Format "Xm ago" / "Xh ago" for recent items (SpotHero-style)
function formatLastUsedAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return 'Just now';
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return 'Recently';
}

// Calculate distance (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get saved addresses
function getSavedAddresses(): SavedAddress[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(ADDRESS_HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading address history:', e);
  }
  return [];
}

// Save address to history
function saveAddressToHistory(address: string, lat: number, lon: number) {
  if (typeof window === 'undefined') return;
  try {
    const history = getSavedAddresses();
    const existingIndex = history.findIndex(
      item => item.address.toLowerCase() === address.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      history[existingIndex].usageCount += 1;
      history[existingIndex].timestamp = Date.now();
    } else {
      history.push({
        address,
        lat,
        lon,
        timestamp: Date.now(),
        usageCount: 1,
      });
    }
    
    history.sort((a, b) => {
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
      return b.timestamp - a.timestamp;
    });
    
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(ADDRESS_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (e) {
    console.error('Error saving address history:', e);
  }
}

// Get favorite locations
function getFavoriteLocations(): FavoriteLocation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading favorites:', e);
  }
  return [];
}

// Save favorite location
function saveFavoriteLocation(favorite: FavoriteLocation) {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavoriteLocations();
    const existingIndex = favorites.findIndex(f => f.id === favorite.id);
    
    if (existingIndex >= 0) {
      favorites[existingIndex] = favorite;
    } else {
      if (favorites.length >= MAX_FAVORITES) {
        favorites.shift(); // Remove oldest
      }
      favorites.push(favorite);
    }
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Error saving favorite:', e);
  }
}

// Delete favorite location
function deleteFavoriteLocation(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavoriteLocations().filter(f => f.id !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Error deleting favorite:', e);
  }
}

// Get nearby places via our API (avoids CORS / Nominatim 403 from browser)
async function getNearbyPlaces(lat: number, lon: number): Promise<AddressSuggestion[]> {
  try {
    const response = await fetch(
      `/api/geocode/reverse?lat=${lat}&lon=${lon}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.display_name) {
        return [{
          display_name: data.display_name,
          lat: data.lat,
          lon: data.lon,
          place_id: Date.now(),
          isNearby: true,
          category: 'address' as const,
        }];
      }
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
  return [];
}

// Search POIs (Points of Interest). viewboxParam: market slug or raw bbox for scoped results.
async function searchPOIs(
  query: string,
  userLocation: { lat: number; lon: number } | null,
  viewboxParam?: string
): Promise<AddressSuggestion[]> {
  try {
    const poiKeywords = ['near', 'airport', 'stadium', 'mall', 'hospital', 'university', 'park', 'beach'];
    const isPOISearch = poiKeywords.some(keyword => query.toLowerCase().includes(keyword));
    if (!isPOISearch && !query.toLowerCase().includes('near')) return [];
    let searchQuery = query;
    if (query.toLowerCase().startsWith('near ')) searchQuery = query.substring(5);
    const params = new URLSearchParams({ q: searchQuery, limit: '5', bounded: '0' });
    if (viewboxParam) params.set('viewbox', viewboxParam);
    const response = await fetch(`/api/geocode/search?${params.toString()}`);
    if (response.ok) {
      const data: AddressSuggestion[] = await response.json();
      return data.map(item => ({
        ...item,
        isPOI: true,
        category: 'poi' as const,
        distance: userLocation
          ? calculateDistance(userLocation.lat, userLocation.lon, parseFloat(item.lat), parseFloat(item.lon))
          : undefined,
      }));
    }
  } catch (error) {
    console.error('POI search error:', error);
  }
  return [];
}

// Escape special regex characters in query for safe highlighting
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight matching text
function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  try {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
  } catch {
    return text;
  }
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;
  
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[len2][len1];
}

// Fuzzy search - find closest match
function findFuzzyMatch(query: string, suggestions: AddressSuggestion[]): string | null {
  if (!query || query.length < 3) return null;
  
  const queryLower = query.toLowerCase();
  let bestMatch: { suggestion: AddressSuggestion; distance: number } | null = null;
  const maxDistance = Math.max(2, Math.floor(query.length * 0.3)); // Allow 30% typos
  
  for (const suggestion of suggestions) {
    const nameLower = suggestion.display_name.toLowerCase();
    const distance = levenshteinDistance(queryLower, nameLower.substring(0, queryLower.length + 5));
    
    if (distance <= maxDistance && (!bestMatch || distance < bestMatch.distance)) {
      bestMatch = { suggestion, distance };
    }
  }
  
  return bestMatch && bestMatch.distance <= maxDistance ? bestMatch.suggestion.display_name : null;
}

// Get time-based context
function getTimeBasedContext(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// Get time-based suggestions
function getTimeBasedSuggestions(favorites: FavoriteLocation[]): AddressSuggestion[] {
  const timeContext = getTimeBasedContext();
  const suggestions: AddressSuggestion[] = [];
  
  // Morning (5am-12pm): Suggest work locations
  if (timeContext === 'morning') {
    const workFavorites = favorites.filter(f => f.icon === 'work');
    if (workFavorites.length > 0) {
      suggestions.push({
        display_name: `Parking near ${workFavorites[0].name}`,
        lat: String(workFavorites[0].lat),
        lon: String(workFavorites[0].lon),
        place_id: workFavorites[0].timestamp,
        isFavorite: true,
        category: 'favorite' as const,
      });
    }
  }
  
  // Evening (5pm-10pm): Suggest home locations
  if (timeContext === 'evening') {
    const homeFavorites = favorites.filter(f => f.icon === 'home');
    if (homeFavorites.length > 0) {
      suggestions.push({
        display_name: `Parking near ${homeFavorites[0].name}`,
        lat: String(homeFavorites[0].lat),
        lon: String(homeFavorites[0].lon),
        place_id: homeFavorites[0].timestamp,
        isFavorite: true,
        category: 'favorite' as const,
      });
    }
  }
  
  return suggestions;
}

// Search analytics interface
interface SearchAnalytics {
  searchHistory: Array<{
    query: string;
    timestamp: number;
    selected?: boolean;
  }>;
  preferences: {
    preferredPriceRange?: { min: number; max: number };
    preferredAmenities?: string[];
    commonLocations?: string[];
  };
}

// Get search analytics
function getSearchAnalytics(): SearchAnalytics {
  if (typeof window === 'undefined') {
    return { searchHistory: [], preferences: {} };
  }
  try {
    const stored = localStorage.getItem(SEARCH_ANALYTICS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading search analytics:', e);
  }
  return { searchHistory: [], preferences: {} };
}

// Save search to analytics
function saveSearchToAnalytics(query: string, selected: boolean = false) {
  if (typeof window === 'undefined') return;
  try {
    const analytics = getSearchAnalytics();
    analytics.searchHistory.push({
      query,
      timestamp: Date.now(),
      selected,
    });
    
    // Keep last 50 searches
    if (analytics.searchHistory.length > 50) {
      analytics.searchHistory = analytics.searchHistory.slice(-50);
    }
    
    // Update common locations
    if (selected) {
      if (!analytics.preferences.commonLocations) {
        analytics.preferences.commonLocations = [];
      }
      if (!analytics.preferences.commonLocations.includes(query)) {
        analytics.preferences.commonLocations.push(query);
        if (analytics.preferences.commonLocations.length > 10) {
          analytics.preferences.commonLocations.shift();
        }
      }
    }
    
    localStorage.setItem(SEARCH_ANALYTICS_KEY, JSON.stringify(analytics));
  } catch (e) {
    console.error('Error saving search analytics:', e);
  }
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onLocationSelect?: (lat: number, lon: number) => void;
  onSubmit?: () => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  minimal?: boolean;
  /** Hero style: softer border, rounded-xl, more padding (e.g. homepage search block) */
  variant?: 'default' | 'hero';
  userLocationProp?: { lat: number; lon: number };
  /** Market slug from market-config (e.g. "jersey"). Defaults to primary market. Scopes search and copy to that market. */
  marketSlug?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onLocationSelect,
  onSubmit,
  placeholder,
  label,
  required = false,
  disabled = false,
  className = '',
  minimal = false,
  variant = 'default',
  userLocationProp,
  marketSlug,
}: AddressAutocompleteProps) {
  const listboxId = useId();
  const statusId = useId();
  const market = useMemo(
    () => getMarketBySlug(marketSlug ?? getPrimaryMarket().slug) ?? getPrimaryMarket(),
    [marketSlug]
  );
  const viewboxParam = market?.slug ?? undefined;
  const popularSearches = market?.popularSearches ?? FALLBACK_POPULAR_SEARCHES;
  const placeholderTexts = market?.placeholderHints ?? FALLBACK_PLACEHOLDER_TEXTS;
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<AddressSuggestion[]>([]);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cachedResults, setCachedResults] = useState<AddressSuggestion[]>([]);
  const cachedResultsRef = useRef<AddressSuggestion[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [listeningStartTime, setListeningStartTime] = useState<number | null>(null);
  const listeningStartTimeRef = useRef<number | null>(null);
  const [fuzzySuggestion, setFuzzySuggestion] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const retryCountRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  /** Dropdown position when rendered in portal (so it escapes parent z-index and appears above navbar) */
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  
  // Position dropdown for portal (above navbar / other sticky UI). Update on open, scroll, resize.
  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current || typeof document === 'undefined') return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Keep dropdown anchored to input on scroll/resize (SpotHero-style: dropdown tracks the field, does not close)
  useLayoutEffect(() => {
    if (!showSuggestions) {
      setDropdownPosition(null);
      return;
    }
    updateDropdownPosition();
    let rafId: number | null = null;
    const scheduleUpdate = (e?: Event) => {
      if (e?.type === 'scroll') {
        const target = e.target as Node;
        const dropdownEl = typeof document !== 'undefined' ? document.getElementById(listboxId) : null;
        if (dropdownEl?.contains(target)) return;
      }
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateDropdownPosition();
      });
    };
    window.addEventListener('scroll', scheduleUpdate as EventListener, true);
    document.addEventListener('scroll', scheduleUpdate as EventListener, true);
    window.addEventListener('resize', scheduleUpdate as EventListener);
    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleUpdate as EventListener, true);
      document.removeEventListener('scroll', scheduleUpdate as EventListener, true);
      window.removeEventListener('resize', scheduleUpdate as EventListener);
    };
  }, [showSuggestions, updateDropdownPosition, listboxId]);

  // Rotate placeholder text
  useEffect(() => {
    if (!placeholder) {
      const interval = setInterval(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholderTexts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [placeholder, placeholderTexts.length]);
  
  // Load favorites
  useEffect(() => {
    setFavorites(getFavoriteLocations());
  }, []);
  
  // Store latest fetchSuggestions in a ref for voice recognition (initialized as null, will be set after fetchSuggestions is defined)
  const fetchSuggestionsRef = useRef<((query: string) => Promise<void>) | null>(null);
  const onChangeRef = useRef(onChange);
  
  // Update onChange ref when it changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  // Initialize voice recognition (only once on mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && !recognitionRef.current) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true; // Enable to see partial results
          recognition.lang = 'en-US';
          recognition.maxAlternatives = 1;
          
          recognition.onresult = (event: SpeechRecognitionEvent) => {
            console.log('Voice recognition result event:', event);
            console.log('Results length:', event.results?.length);
            
            try {
              if (event.results && event.results.length > 0) {
                // Get the last result (most recent)
                const result = event.results[event.results.length - 1];
                console.log('Last result:', result);
                
                if (result && result.length > 0) {
                  const transcript = result[0].transcript.trim();
                  const isFinal = result.isFinal; // isFinal is on the result, not the alternative
                  
                  console.log('Transcript:', transcript, 'Is final:', isFinal);
                  
                  // Process final results immediately
                  if (isFinal && transcript) {
                    console.log('Processing final transcript:', transcript);
                    setIsListening(false);
                    // Use ref to get latest onChange
                    onChangeRef.current(transcript);
                    
                    // Trigger search after a small delay to ensure state is updated
                    setTimeout(() => {
                      if (fetchSuggestionsRef.current) {
                        console.log('Triggering search with transcript:', transcript);
                        fetchSuggestionsRef.current(transcript);
                      } else {
                        console.error('fetchSuggestionsRef.current is null');
                      }
                    }, 200);
                  } else if (!isFinal && transcript) {
                    console.log('Interim result (not final yet):', transcript);
                    // Store interim result - we'll use it if recognition ends without final result
                    // Update input with interim result so user can see what's being recognized
                    onChangeRef.current(transcript);
                  } else {
                    console.warn('Empty transcript received');
                    setIsListening(false);
                  }
                } else {
                  console.warn('No transcript in result');
                  setIsListening(false);
                }
              } else {
                console.warn('No results in voice recognition event');
                setIsListening(false);
              }
            } catch (error) {
              console.error('Error processing voice recognition result:', error);
              setIsListening(false);
              setError('Unable to process voice input. Please try speaking again or type your search.');
            }
          };
          
          recognition.onerror = (event: any) => {
            console.error('Voice recognition error:', event);
            const startTime = listeningStartTimeRef.current;
            const duration = startTime ? Date.now() - startTime : 0;
            console.error('Error details:', {
              error: event.error,
              message: event.message,
              timeStamp: event.timeStamp,
              listeningDuration: duration + 'ms'
            });
            setIsListening(false);
            
            // Don't show error for 'no-speech' if user manually stopped or if it happened too quickly
            if (event.error === 'no-speech') {
              console.warn('No speech detected - duration was:', duration, 'ms');
              // If it happened very quickly (< 2 seconds), it might be a browser quirk - try restarting once
              if (duration > 0 && duration < 2000 && retryCountRef.current < 1) {
                console.warn('No-speech error happened too quickly - might be browser issue, will retry once');
                retryCountRef.current += 1;
                // Retry after a short delay
                setTimeout(() => {
                  if (recognitionRef.current && !isListening) {
                    console.log('Retrying voice recognition...');
                    try {
                      recognitionRef.current.start();
                    } catch (retryError) {
                      console.error('Retry failed:', retryError);
                      retryCountRef.current = 0;
                    }
                  }
                }, 500);
                return; // Don't set isListening to false yet
              } else if (duration >= 5000) {
                // After 5 seconds, show helpful message
                setError('No speech detected. Please speak clearly after clicking the microphone.');
                setTimeout(() => setError(null), 4000);
                retryCountRef.current = 0; // Reset retry count
              } else {
                retryCountRef.current = 0; // Reset retry count
              }
            } else {
              const errorMessage = event.error === 'audio-capture'
                ? 'No microphone found. Please check your microphone.'
                : event.error === 'not-allowed'
                ? 'Microphone permission denied. Please allow microphone access.'
                : event.error === 'aborted'
                ? 'Voice recognition was aborted.'
                : `Voice recognition error: ${event.error || 'Unknown error'}`;
              setError(errorMessage);
            }
            // Don't reset listeningStartTime here - let onend handle it
          };
          
          recognition.onend = () => {
            console.log('Voice recognition ended');
            console.log('isListening state:', isListening);
            // Use ref to get the actual start time (not state which might be stale)
            const startTime = listeningStartTimeRef.current;
            const listeningDuration = startTime ? Date.now() - startTime : 0;
            console.log('Total listening duration:', listeningDuration, 'ms');
            console.log('Start time from ref:', startTime);
            
            // Check if we have any results (even if not final)
            // This handles the case where user stops manually but we have interim results
            if (recognitionRef.current) {
              // Try to get the last result from the recognition object
              // Note: This might not work in all browsers, but worth trying
              console.log('Checking for any captured speech...');
            }
            
            // If recognition ended but we never got a result, it might be due to silence
            // Don't show error if user manually stopped it
            if (isListening) {
              console.warn('Recognition ended without final result - might be due to silence, timeout, or manual stop');
              // Check if input has any value (from interim results)
              if (inputRef.current && inputRef.current.value.trim().length > 0) {
                console.log('Found interim result in input, triggering search:', inputRef.current.value);
                // Use the value from input (which might have interim results)
                const interimValue = inputRef.current.value.trim();
                if (interimValue.length >= 2 && fetchSuggestionsRef.current) {
                  setTimeout(() => {
                    fetchSuggestionsRef.current?.(interimValue);
                  }, 100);
                }
              } else if (listeningDuration > 0 && listeningDuration < 2000) {
                console.warn('Recognition ended too quickly - user may have stopped before speaking');
                setError('Please speak clearly after clicking the microphone. Wait at least 2 seconds.');
                setTimeout(() => setError(null), 4000);
              } else if (listeningDuration === 0) {
                console.warn('Listening duration is 0 - start time was not captured properly');
              }
            }
            setIsListening(false);
            setListeningStartTime(null);
            listeningStartTimeRef.current = null; // Reset ref too
          };
          
          recognition.onstart = () => {
            console.log('Voice recognition started');
            const startTime = Date.now();
            setIsListening(true);
            setListeningStartTime(startTime);
            listeningStartTimeRef.current = startTime; // Store in ref too
            console.log('Listening start time recorded:', startTime);
            // Reset retry count on successful start
            if (retryCountRef.current > 0) {
              console.log('Voice recognition restarted successfully after retry');
              retryCountRef.current = 0;
            }
          };
          
          recognitionRef.current = recognition;
          setVoiceSupported(true);
        } catch (error) {
          console.error('Voice recognition initialization failed:', error);
          setVoiceSupported(false);
        }
      } else {
        setVoiceSupported(false);
      }
    }
  }, []); // Empty dependency array - only initialize once
  
  // Get user location
  useEffect(() => {
    // Use passed location prop first (from parent), then auto-detect
    if (userLocationProp) {
      setUserLocation(userLocationProp);
      return;
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          
          const nearby = await getNearbyPlaces(latitude, longitude);
          setNearbyPlaces(nearby);
        },
        () => {
          // Silently fail
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 300000,
        }
      );
    }
  }, [userLocationProp]);
  
  // Fetch suggestions with abort support, viewbox, and clear error handling
  const fetchSuggestions = useCallback(async (query: string) => {
    saveSearchToAnalytics(query, false);

    if (!query || query.length < 2) {
      const recentAddresses = getSavedAddresses()
        .slice(0, 3)
        .map(addr => ({
          display_name: addr.address,
          lat: String(addr.lat),
          lon: String(addr.lon),
          place_id: addr.timestamp,
          isRecent: true,
          lastUsedAgo: formatLastUsedAgo(addr.timestamp),
          category: 'recent' as const,
          distance: userLocation
            ? calculateDistance(userLocation.lat, userLocation.lon, addr.lat, addr.lon)
            : undefined,
        }));
      const favoriteSuggestions = favorites.map(fav => ({
        display_name: fav.address,
        lat: String(fav.lat),
        lon: String(fav.lon),
        place_id: fav.timestamp,
        isFavorite: true,
        category: 'favorite' as const,
        distance: userLocation
          ? calculateDistance(userLocation.lat, userLocation.lon, fav.lat, fav.lon)
          : undefined,
      }));
      const timeBasedSuggestions = getTimeBasedSuggestions(favorites);
      const allSuggestions: AddressSuggestion[] = [...timeBasedSuggestions, ...favoriteSuggestions, ...recentAddresses, ...nearbyPlaces];
      if (allSuggestions.length > 0) {
        setSuggestions(allSuggestions);
        setShowSuggestions(true);
        setError(null);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      return;
    }

    abortControllerRef.current?.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;
    const signal = ac.signal;
    setLoading(true);
    setError(null);

    try {
      const poiResults = await searchPOIs(query, userLocation, viewboxParam);
      const params = new URLSearchParams({ q: query, limit: '10', bounded: '1' });
      if (viewboxParam) params.set('viewbox', viewboxParam);
      const response = await fetch(`/api/geocode/search?${params.toString()}`, { signal });

      if (response.ok) {
        const data: AddressSuggestion[] = await response.json();
        cachedResultsRef.current = data;
        setCachedResults(data);

        const savedAddresses = getSavedAddresses();
        const favoriteAddresses = favorites;
        const marketName = market.displayName.toLowerCase();
        const enhancedSuggestions = data.map((suggestion: AddressSuggestion & { type?: string; importance?: number }) => {
          const lat = parseFloat(suggestion.lat);
          const lon = parseFloat(suggestion.lon);
          const savedMatch = savedAddresses.find(s => Math.abs(s.lat - lat) < 0.001 && Math.abs(s.lon - lon) < 0.001);
          const favoriteMatch = favoriteAddresses.find(f => Math.abs(f.lat - lat) < 0.001 && Math.abs(f.lon - lon) < 0.001);
          let distance: number | undefined;
          if (userLocation) distance = calculateDistance(userLocation.lat, userLocation.lon, lat, lon);
          const raw = suggestion as unknown as { type?: string; importance?: number };
          return {
            ...suggestion,
            placeType: raw.type ?? suggestion.placeType,
            importance: typeof raw.importance === 'number' ? raw.importance : suggestion.importance,
            distance,
            isRecent: !!savedMatch,
            isFavorite: !!favoriteMatch,
            category: (favoriteMatch ? 'favorite' : savedMatch ? 'recent' : 'address') as 'favorite' | 'recent' | 'address',
          };
        });
        const allResults: AddressSuggestion[] = [...poiResults, ...enhancedSuggestions];
        const rankedSuggestions = allResults.sort((a, b) => {
          let scoreA = 0, scoreB = 0;
          if (a.distance !== undefined && b.distance !== undefined) {
            scoreA += Math.max(0, 100 - a.distance * 15);
            scoreB += Math.max(0, 100 - b.distance * 15);
          } else if (a.distance !== undefined) scoreA += 100;
          else if (b.distance !== undefined) scoreB += 100;
          if (a.isFavorite) scoreA += 120;
          if (b.isFavorite) scoreB += 120;
          if (a.isRecent) scoreA += 80;
          if (b.isRecent) scoreB += 80;
          if (a.isPOI) scoreA += 30;
          if (b.isPOI) scoreB += 30;
          if (a.display_name.toLowerCase().includes(marketName)) scoreA += 50;
          if (b.display_name.toLowerCase().includes(marketName)) scoreB += 50;
          const ql = query.toLowerCase();
          if (a.display_name.toLowerCase().startsWith(ql)) scoreA += 10;
          if (b.display_name.toLowerCase().startsWith(ql)) scoreB += 10;
          if (typeof a.importance === 'number') scoreA += Math.round(a.importance * 40);
          if (typeof b.importance === 'number') scoreB += Math.round(b.importance * 40);
          return scoreB - scoreA;
        });
        const topSuggestions = rankedSuggestions.slice(0, 8);
        setSuggestions(topSuggestions);
        setShowSuggestions(topSuggestions.length > 0);
        const cache = cachedResultsRef.current;
        if (topSuggestions.length === 0 || (topSuggestions.length < 3 && query.length >= 3)) {
          setFuzzySuggestion(findFuzzyMatch(query, cache.length > 0 ? cache : topSuggestions));
        } else {
          setFuzzySuggestion(null);
        }
      } else {
        const body = await response.json().catch(() => ({}));
        const message = typeof body?.error === 'string' ? body.error : 'Search failed. Please try again.';
        const cached = cachedResultsRef.current;
        if (cached.length > 0) {
          setSuggestions(cached.slice(0, 5));
          setShowSuggestions(true);
          setError('Showing cached results. ' + message);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
          setError(message);
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('Address autocomplete error:', err);
      const cached = cachedResultsRef.current;
      if (cached.length > 0) {
        setSuggestions(cached.slice(0, 5));
        setShowSuggestions(true);
        setError('Showing cached results. Check your connection.');
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setError('Search is temporarily unavailable. Please try again.');
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [userLocation, nearbyPlaces, favorites, viewboxParam, market]);
  
  // Update ref with latest fetchSuggestions
  useEffect(() => {
    fetchSuggestionsRef.current = fetchSuggestions;
  }, [fetchSuggestions]);
  
  const debouncedFetch = useRef(
    debounce((query: string) => {
      fetchSuggestions(query);
    }, 500)
  ).current;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
    setError(null);
    
    if (newValue.length >= 2) {
      debouncedFetch(newValue);
    } else if (newValue.length === 0 || newValue.length === 1) {
      debouncedFetch(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const address = suggestion.display_name;
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    saveAddressToHistory(address, lat, lon);
    saveSearchToAnalytics(address, true); // Track selected search
    
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    setFuzzySuggestion(null);
    
    onChange(address);
    
    if (onLocationSelect) {
      onLocationSelect(lat, lon);
    }
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }, 50);
  };
  
  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      setError('Voice search is not supported in your browser.');
      return;
    }
    
    if (isListening) {
      // Check if minimum listening time has passed (2 seconds)
      const minListeningTime = 2000; // 2 seconds
      // Use ref to get accurate time (state might be stale)
      const startTime = listeningStartTimeRef.current;
      const timeSinceStart = startTime ? Date.now() - startTime : 0;
      
      if (timeSinceStart < minListeningTime) {
        const remainingTime = Math.ceil((minListeningTime - timeSinceStart) / 1000);
        console.log(`Please wait ${remainingTime} more second(s) before stopping. Keep speaking...`);
        setError(`Please keep speaking for ${remainingTime} more second(s)...`);
        // Clear error after a moment
        setTimeout(() => setError(null), 2000);
        return; // Don't stop yet
      }
      
      console.log('Stopping voice recognition (user clicked stop)');
      console.log('Was listening for:', timeSinceStart, 'ms');
      try {
        // Before stopping, check if we have any interim results
        if (inputRef.current && inputRef.current.value.trim().length > 0) {
          const interimValue = inputRef.current.value.trim();
          console.log('Stopping with interim result:', interimValue);
          // Process the interim result as final since user is stopping
          if (interimValue.length >= 2 && fetchSuggestionsRef.current) {
            setTimeout(() => {
              fetchSuggestionsRef.current?.(interimValue);
            }, 100);
          }
        } else {
          console.warn('No speech captured before stopping');
          setError('No speech detected. Please try again and speak clearly.');
          setTimeout(() => setError(null), 3000);
        }
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      setIsListening(false);
      setListeningStartTime(null);
      listeningStartTimeRef.current = null;
    } else {
      try {
        console.log('Starting voice recognition');
        setError(null);
        setListeningStartTime(null);
        listeningStartTimeRef.current = null;
        retryCountRef.current = 0; // Reset retry count when manually starting
        // Check if already started
        if (recognitionRef.current) {
          recognitionRef.current.start();
          // Don't set isListening here - let onstart handler do it
        }
      } catch (error: any) {
        console.error('Error starting voice recognition:', error);
        setIsListening(false);
        setListeningStartTime(null);
        listeningStartTimeRef.current = null;
        const errorMsg = error?.message?.includes('already started') || error?.message?.includes('started')
          ? 'Voice recognition is already active.'
          : `Voice search failed: ${error?.message || 'Please try again.'}`;
        setError(errorMsg);
      }
    }
  };
  
  const handleFavoriteClick = (favorite: FavoriteLocation) => {
    onChange(favorite.address);
    if (onLocationSelect) {
      onLocationSelect(favorite.lat, favorite.lon);
    }
  };
  
  const handleAddFavorite = () => {
    if (value && onLocationSelect) {
      // This would need coordinates - for now just show a message
      // In a real implementation, you'd get coordinates from the selected suggestion
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0 && selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (minimal && onSubmit) {
          onSubmit();
        }
        return;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        return;
    }
    if (!showSuggestions || suggestions.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
    }
  };
  
  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const category = suggestion.category || 'address';
    if (!acc[category]) acc[category] = [];
    acc[category].push(suggestion);
    return acc;
  }, {} as Record<string, AddressSuggestion[]>);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inDropdown = document.getElementById(listboxId)?.contains(target);
      if (!inContainer && !inDropdown) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [listboxId]);
  
  useEffect(() => {
    if (selectedIndex >= 0 && showSuggestions) {
      const listbox = document.getElementById(listboxId);
      const selectedElement = listbox?.querySelector(
        `[data-suggestion-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showSuggestions, listboxId]);
  
  const displayPlaceholder = placeholder || placeholderTexts[currentPlaceholder];
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Favorites Bar */}
      {favorites.length > 0 && !value && (
        <div className="mb-2 flex flex-wrap gap-2">
          {favorites.map((fav) => {
            const Icon = fav.icon === 'home' ? HomeIcon : fav.icon === 'work' ? BriefcaseIcon : MapPinIcon;
            return (
              <button
                key={fav.id}
                type="button"
                onClick={() => handleFavoriteClick(fav)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Icon className="w-3 h-3 text-primary-600" />
                <span>{fav.name}</span>
              </button>
            );
          })}
        </div>
      )}
      
      {/* Screen reader status for loading and result count */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {loading && 'Searching…'}
        {!loading && showSuggestions && suggestions.length > 0 && `${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''}`}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-describedby={label ? undefined : statusId}
          aria-activedescendant={
            showSuggestions && suggestions.length > 0 && selectedIndex >= 0 && selectedIndex < suggestions.length
              ? `${listboxId}-option-${selectedIndex}`
              : undefined
          }
          onFocus={() => {
            if (value.length < 2) {
              const recentAddresses = getSavedAddresses()
                .slice(0, 3)
                .map(addr => ({
                  display_name: addr.address,
                  lat: String(addr.lat),
                  lon: String(addr.lon),
                  place_id: addr.timestamp,
                  isRecent: true,
                  lastUsedAgo: formatLastUsedAgo(addr.timestamp),
                  category: 'recent' as const,
                  distance: userLocation
                    ? calculateDistance(userLocation.lat, userLocation.lon, addr.lat, addr.lon)
                    : undefined,
                }));
              
              const favoriteSuggestions = favorites.map(fav => ({
                display_name: fav.address,
                lat: String(fav.lat),
                lon: String(fav.lon),
                place_id: fav.timestamp,
                isFavorite: true,
                category: 'favorite' as const,
                distance: userLocation
                  ? calculateDistance(userLocation.lat, userLocation.lon, fav.lat, fav.lon)
                  : undefined,
              }));
              
              const allSuggestions: AddressSuggestion[] = [...favoriteSuggestions, ...recentAddresses, ...nearbyPlaces];
              if (allSuggestions.length > 0) {
                setSuggestions(allSuggestions);
                setShowSuggestions(true);
              }
            } else if (suggestions.length > 0) {
              setShowSuggestions(true);
            } else if (value.length >= 2) {
              debouncedFetch(value);
            }
          }}
          placeholder={displayPlaceholder}
          required={required}
          disabled={disabled}
          className={`w-full text-sm bg-white text-gray-900 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${minimal ? 'pl-10 pr-12' : 'pl-10 pr-14'} ${
            variant === 'hero'
              ? 'py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300'
              : 'py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent'
          }`}
        />
        <MapPinIcon className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${variant === 'hero' ? 'left-3.5' : 'left-3'}`} />
        
        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 ${variant === 'hero' ? 'right-3' : 'right-2'}`}>
          {loading && (
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          {minimal && onSubmit ? (
            <button
              type="button"
              onClick={onSubmit}
              className="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
              title="Search"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          ) : !minimal && (
            <button
              type="button"
              onClick={handleVoiceSearch}
              disabled={!voiceSupported}
              className={`p-1 transition-colors ${
                isListening 
                  ? 'text-red-600 animate-pulse' 
                  : voiceSupported
                  ? 'text-gray-400 hover:text-primary-600'
                  : 'text-gray-300 cursor-not-allowed opacity-50'
              }`}
              title={
                isListening 
                  ? 'Listening... Click to stop' 
                  : voiceSupported 
                  ? 'Voice search' 
                  : 'Voice search not supported in this browser'
              }
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Listening indicator */}
      {isListening && (
        <div className="mt-1 text-sm text-blue-700 flex items-center gap-2 bg-blue-50 p-3 rounded-lg border-2 border-blue-300 shadow-sm">
          <div className="relative">
            <MicrophoneIcon className="w-5 h-5 text-red-600 animate-pulse" />
            <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900">Listening...</p>
            <p className="text-xs text-blue-600 mt-0.5">
              {listeningStartTime && Date.now() - listeningStartTime < 2000 
                ? 'Wait 2 seconds, then speak your search query clearly...'
                : 'Speak your search query clearly. Click the mic again to stop.'}
            </p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-1 text-xs text-amber-600 flex items-center gap-1 bg-white p-2 rounded border border-amber-200">
          <InformationCircleIcon className="w-4 h-4 text-amber-600" />
          <span className="text-amber-600">{error}</span>
        </div>
      )}
      
      {/* Fuzzy suggestion */}
      {fuzzySuggestion && (
        <div className="mt-1 text-xs text-blue-600 flex items-center gap-1 bg-white p-2 rounded border border-blue-200">
          <InformationCircleIcon className="w-4 h-4 text-blue-600" />
          <span className="text-blue-600">Did you mean: </span>
          <button
            type="button"
            onClick={() => {
              onChange(fuzzySuggestion);
              fetchSuggestions(fuzzySuggestion);
            }}
            className="underline font-medium text-blue-700 hover:text-blue-800"
          >
            {fuzzySuggestion}
          </button>
        </div>
      )}
      
      {/* Suggestions Dropdown: portaled so z-index is above navbar (sticky z-20/z-30) */}
      {showSuggestions && (suggestions.length > 0 || (!value && popularSearches.length > 0)) && dropdownPosition && typeof document !== 'undefined' && createPortal(
        <div
          id={listboxId}
          role="listbox"
          aria-label="Address suggestions"
          className="w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 55, // z-dropdown: above navbar (50), below backdrops
          }}
        >
          {/* Use current location — SpotHero-style, at top when we have user location */}
          {userLocation && onLocationSelect && (
            <button
              type="button"
              role="option"
              onClick={() => {
                const displayName = nearbyPlaces[0]?.display_name ?? 'Current location';
                onChange(displayName);
                onLocationSelect(userLocation.lat, userLocation.lon);
                setShowSuggestions(false);
                setSuggestions([]);
                saveAddressToHistory(displayName, userLocation.lat, userLocation.lon);
              }}
              className="w-full text-left px-4 py-3 hover:bg-primary-50 focus:bg-primary-50 focus:outline-none transition-colors flex items-center gap-2 border-b border-gray-100"
            >
              <MapPinIcon className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span className="text-sm font-medium text-primary-700">Use current location</span>
            </button>
          )}
          {/* Recent / Favorites / Landmarks / Addresses — clear section hierarchy */}
          {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => (
            <div key={category}>
              {Object.keys(groupedSuggestions).length > 1 && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {category === 'favorite' ? 'Favorites' : 
                     category === 'recent' ? 'Recent' : 
                     category === 'poi' ? 'Landmarks' : 'Addresses'}
                  </span>
                </div>
              )}
              {categorySuggestions.map((suggestion, index) => {
                const globalIndex = suggestions.indexOf(suggestion);
                const isRecent = suggestion.isRecent;
                const isNearby = suggestion.isNearby;
                const isFavorite = suggestion.isFavorite;
                const isPOI = suggestion.isPOI;
                const distance = suggestion.distance;
                const lastUsedAgo = suggestion.lastUsedAgo;
                const placeTypeLabel = getPlaceTypeLabel(suggestion.placeType);
                const highlightedName = highlightMatch(suggestion.display_name, value);
                
                return (
                  <button
                    key={`${suggestion.place_id}-${index}`}
                    type="button"
                    role="option"
                    id={`${listboxId}-option-${globalIndex}`}
                    aria-selected={globalIndex === selectedIndex}
                    data-suggestion-index={globalIndex}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                      globalIndex === selectedIndex ? 'bg-primary-50' : ''
                    } ${index !== categorySuggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {isFavorite ? (
                        <StarIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0 fill-current" />
                      ) : isRecent ? (
                        <ClockIcon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      ) : isPOI ? (
                        <BuildingOfficeIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span 
                          className="text-sm text-gray-900 block truncate"
                          dangerouslySetInnerHTML={{ __html: highlightedName }}
                        />
                        {(isRecent || isNearby || isFavorite || isPOI || distance !== undefined || lastUsedAgo || placeTypeLabel !== 'Address') && (
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {isFavorite && (
                              <span className="text-xs text-yellow-600 font-medium">Favorite</span>
                            )}
                            {isRecent && lastUsedAgo && (
                              <span className="text-xs text-orange-600 font-medium">{lastUsedAgo}</span>
                            )}
                            {isRecent && !lastUsedAgo && (
                              <span className="text-xs text-orange-600 font-medium">Recent</span>
                            )}
                            {isPOI && (
                              <span className="text-xs text-blue-600 font-medium">Landmark</span>
                            )}
                            {isNearby && (
                              <span className="text-xs text-blue-600 font-medium">Nearby</span>
                            )}
                            {!isFavorite && !isRecent && !isPOI && placeTypeLabel !== 'Address' && (
                              <span className="text-xs text-gray-500 font-medium">{placeTypeLabel}</span>
                            )}
                            {!isRecent && distance !== undefined && distance < 50 && (
                              <span className="text-xs text-gray-500">
                                {distance < 1 
                                  ? `~${Math.round(distance * 1000)}m from you` 
                                  : `~${distance.toFixed(1)}km from you`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
          {/* Park near [venue] — SpotHero-style landmark shortcuts when input is empty */}
          {!value && (market.popularVenues ?? popularSearches).length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="px-2 py-1 mb-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Park near</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(market.popularVenues ?? popularSearches).slice(0, 5).map((venue, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="option"
                    onClick={() => {
                      onChange(venue);
                      debouncedFetch(venue);
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium bg-primary-50 hover:bg-primary-100 text-primary-800 rounded-lg border border-primary-200 transition-colors"
                  >
                    {venue}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
      
    </div>
  );
}
