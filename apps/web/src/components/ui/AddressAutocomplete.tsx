'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
  MapIcon,
  InformationCircleIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  HomeIcon,
  BriefcaseIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';
import MapPickerModal from './MapPickerModal';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  distance?: number;
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

// Popular search suggestions
const POPULAR_SEARCHES = [
  'Airport parking',
  'Downtown parking',
  'Event parking',
  'Stadium parking',
  'Shopping mall parking',
  'Hospital parking',
  'University parking',
];

// Dynamic placeholder texts
const PLACEHOLDER_TEXTS = [
  'Search for parking near...',
  'Try "airport parking" or "downtown"',
  'Enter an address or landmark',
  'Search by location name',
  'Find parking near your destination',
];

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

// Get nearby places
async function getNearbyPlaces(lat: number, lon: number): Promise<AddressSuggestion[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1&countrycodes=us`,
      {
        headers: {
          'User-Agent': 'Parkway Driveway Rental Platform',
        },
      }
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

// Search POIs (Points of Interest)
async function searchPOIs(query: string, userLocation: { lat: number; lon: number } | null): Promise<AddressSuggestion[]> {
  try {
    // Check if query looks like a POI search
    const poiKeywords = ['near', 'airport', 'stadium', 'mall', 'hospital', 'university', 'park', 'beach'];
    const isPOISearch = poiKeywords.some(keyword => query.toLowerCase().includes(keyword));
    
    if (!isPOISearch && !query.toLowerCase().includes('near')) {
      return [];
    }
    
    let searchQuery = query;
    if (query.toLowerCase().startsWith('near ')) {
      searchQuery = query.substring(5);
    }
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&countrycodes=us`,
      {
        headers: {
          'User-Agent': 'Parkway Driveway Rental Platform',
        },
      }
    );
    
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

// Highlight matching text
function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
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
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder,
  label,
  required = false,
  disabled = false,
  className = '',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<AddressSuggestion[]>([]);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cachedResults, setCachedResults] = useState<AddressSuggestion[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [fuzzySuggestion, setFuzzySuggestion] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Rotate placeholder text
  useEffect(() => {
    if (!placeholder) {
      const interval = setInterval(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [placeholder]);
  
  // Load favorites
  useEffect(() => {
    setFavorites(getFavoriteLocations());
  }, []);
  
  // Store latest fetchSuggestions in a ref for voice recognition
  const fetchSuggestionsRef = useRef(fetchSuggestions);
  useEffect(() => {
    fetchSuggestionsRef.current = fetchSuggestions;
  }, [fetchSuggestions]);
  
  // Initialize voice recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          
          recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript.trim();
            setIsListening(false);
            onChange(transcript);
            // Trigger search after a small delay to ensure state is updated
            setTimeout(() => {
              if (transcript.length >= 2) {
                fetchSuggestionsRef.current(transcript);
              } else if (transcript.length === 0 || transcript.length === 1) {
                fetchSuggestionsRef.current(transcript);
              }
            }, 100);
          };
          
          recognition.onerror = (event: any) => {
            setIsListening(false);
            const errorMessage = event.error === 'no-speech' 
              ? 'No speech detected. Please try again.' 
              : event.error === 'audio-capture'
              ? 'No microphone found. Please check your microphone.'
              : 'Voice recognition failed. Please try again.';
            setError(errorMessage);
          };
          
          recognition.onend = () => {
            setIsListening(false);
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
  }, [onChange]);
  
  // Get user location
  useEffect(() => {
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
  }, []);
  
  // Fetch suggestions with error handling and caching
  const fetchSuggestions = useCallback(async (query: string) => {
    // Track search in analytics
    saveSearchToAnalytics(query, false);
    
    // Show favorites, recent, nearby, and time-based suggestions when query is short
    if (!query || query.length < 2) {
      const recentAddresses = getSavedAddresses()
        .slice(0, 3)
        .map(addr => ({
          display_name: addr.address,
          lat: String(addr.lat),
          lon: String(addr.lon),
          place_id: addr.timestamp,
          isRecent: true,
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
      
      // Add time-based smart suggestions
      const timeBasedSuggestions = getTimeBasedSuggestions(favorites);
      
      // Add common locations from analytics
      const analytics = getSearchAnalytics();
      const commonLocationSuggestions: AddressSuggestion[] = [];
      if (analytics.preferences.commonLocations && analytics.preferences.commonLocations.length > 0) {
        // These would need to be geocoded, but for now we'll just show them as text suggestions
      }
      
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
    
    setLoading(true);
    setError(null);
    
    try {
      // Try POI search first if applicable
      const poiResults = await searchPOIs(query, userLocation);
      
      // Regular address search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&bounded=1&countrycodes=us`,
        {
          headers: {
            'User-Agent': 'Parkway Driveway Rental Platform',
          },
        }
      );
      
      if (response.ok) {
        const data: AddressSuggestion[] = await response.json();
        
        // Cache results for fallback
        setCachedResults(data);
        
        const savedAddresses = getSavedAddresses();
        const favoriteAddresses = favorites;
        
        // Enhance suggestions
        const enhancedSuggestions = data.map(suggestion => {
          const lat = parseFloat(suggestion.lat);
          const lon = parseFloat(suggestion.lon);
          
          const savedMatch = savedAddresses.find(
            saved => Math.abs(saved.lat - lat) < 0.001 && Math.abs(saved.lon - lon) < 0.001
          );
          
          const favoriteMatch = favoriteAddresses.find(
            fav => Math.abs(fav.lat - lat) < 0.001 && Math.abs(fav.lon - lon) < 0.001
          );
          
          let distance: number | undefined;
          if (userLocation) {
            distance = calculateDistance(userLocation.lat, userLocation.lon, lat, lon);
          }
          
          return {
            ...suggestion,
            distance,
            isRecent: !!savedMatch,
            isFavorite: !!favoriteMatch,
            category: (favoriteMatch ? 'favorite' : savedMatch ? 'recent' : 'address') as 'favorite' | 'recent' | 'address',
          };
        });
        
        // Combine POI and address results
        const allResults: AddressSuggestion[] = [...poiResults, ...enhancedSuggestions];
        
        // Smart ranking
        const rankedSuggestions = allResults.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          
          if (a.isFavorite) scoreA += 150;
          if (b.isFavorite) scoreB += 150;
          if (a.isRecent) scoreA += 100;
          if (b.isRecent) scoreB += 100;
          if (a.isPOI) scoreA += 30;
          if (b.isPOI) scoreB += 30;
          
          if (a.distance !== undefined && b.distance !== undefined) {
            scoreA += Math.max(0, 50 - a.distance);
            scoreB += Math.max(0, 50 - b.distance);
          } else if (a.distance !== undefined) scoreA += 25;
          else if (b.distance !== undefined) scoreB += 25;
          
          const queryLower = query.toLowerCase();
          if (a.display_name.toLowerCase().startsWith(queryLower)) scoreA += 10;
          if (b.display_name.toLowerCase().startsWith(queryLower)) scoreB += 10;
          
          return scoreB - scoreA;
        });
        
        const topSuggestions = rankedSuggestions.slice(0, 8);
        setSuggestions(topSuggestions);
        setShowSuggestions(topSuggestions.length > 0);
        
        // Check for fuzzy matches if no exact results
        if (topSuggestions.length === 0 || (topSuggestions.length < 3 && query.length >= 3)) {
          const fuzzyMatch = findFuzzyMatch(query, cachedResults.length > 0 ? cachedResults : topSuggestions);
          setFuzzySuggestion(fuzzyMatch);
        } else {
          setFuzzySuggestion(null);
        }
      } else {
        // Use cached results on error
        if (cachedResults.length > 0) {
          setSuggestions(cachedResults.slice(0, 5));
          setShowSuggestions(true);
          setError('Showing cached results. Check your connection.');
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
          setError('Unable to search. Please check your connection.');
        }
      }
    } catch (error) {
      console.error('Address autocomplete error:', error);
      // Use cached results on error
      if (cachedResults.length > 0) {
        setSuggestions(cachedResults.slice(0, 5));
        setShowSuggestions(true);
        setError('Showing cached results. Check your connection.');
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setError('Search unavailable. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [userLocation, nearbyPlaces, favorites, cachedResults]);
  
  const debouncedFetch = useRef(
    debounce((query: string) => {
      fetchSuggestions(query);
    }, 300)
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
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (error) {
        setIsListening(false);
        setError('Voice search failed. Please try again.');
      }
    }
  };
  
  const handleMapPickerSelect = (lat: number, lon: number, address: string) => {
    onChange(address);
    if (onLocationSelect) {
      onLocationSelect(lat, lon);
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
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
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
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (selectedIndex >= 0 && showSuggestions) {
      const selectedElement = containerRef.current?.querySelector(
        `[data-suggestion-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showSuggestions]);
  
  const displayPlaceholder = placeholder || PLACEHOLDER_TEXTS[currentPlaceholder];
  
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
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
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
          className="w-full pl-10 pr-24 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          )}
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
          <button
            type="button"
            onClick={() => setShowMapPicker(true)}
            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            title="Pick on map"
          >
            <MapIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            title="Search tips"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
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
      
      {/* Search Tips Tooltip */}
      {showTips && (
        <div className="absolute z-50 mt-1 p-3 bg-white border border-gray-200 rounded-md shadow-lg max-w-xs">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Search Tips</h3>
            <button
              onClick={() => setShowTips(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Search by address or landmark name</li>
            <li>• Try "near [landmark]" for POI search</li>
            <li>• Use favorites for quick access</li>
            <li>• Click map icon to pick location visually</li>
            {recognitionRef.current && <li>• Use microphone for voice search</li>}
            <li>• Smart suggestions based on time of day</li>
          </ul>
        </div>
      )}
      
      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || (!value && POPULAR_SEARCHES.length > 0)) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Popular Searches (when input is empty) */}
          {!value && POPULAR_SEARCHES.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <div className="px-2 py-1 mb-1">
                <span className="text-xs font-medium text-gray-500">Popular Searches</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {POPULAR_SEARCHES.slice(0, 4).map((search, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChange(search);
                      debouncedFetch(search);
                    }}
                    className="px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Grouped Suggestions */}
          {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => (
            <div key={category}>
              {Object.keys(groupedSuggestions).length > 1 && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase">
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
                const highlightedName = highlightMatch(suggestion.display_name, value);
                
                return (
                  <button
                    key={`${suggestion.place_id}-${index}`}
                    type="button"
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
                        {(isRecent || isNearby || isFavorite || isPOI || distance !== undefined) && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {isFavorite && (
                              <span className="text-xs text-yellow-600 font-medium">Favorite</span>
                            )}
                            {isRecent && (
                              <span className="text-xs text-orange-600 font-medium">Recent</span>
                            )}
                            {isPOI && (
                              <span className="text-xs text-blue-600 font-medium">Landmark</span>
                            )}
                            {isNearby && (
                              <span className="text-xs text-blue-600 font-medium">Nearby</span>
                            )}
                            {distance !== undefined && distance < 50 && (
                              <span className="text-xs text-gray-500">
                                {distance < 1 
                                  ? `${Math.round(distance * 1000)}m away` 
                                  : `${distance.toFixed(1)}km away`}
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
        </div>
      )}
      
      {/* Map Picker Modal */}
      {showMapPicker && (
        <MapPickerModal
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onLocationSelect={handleMapPickerSelect}
          initialCenter={userLocation ? [userLocation.lat, userLocation.lon] : undefined}
        />
      )}
    </div>
  );
}
