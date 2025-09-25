import React, { useState, useEffect, useRef, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import './SmartSearch.css';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'location' | 'recent' | 'popular';
  icon?: string;
}

interface SmartSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SmartSearch: React.FC<SmartSearchProps> = ({ 
  onSearch, 
  placeholder = "Search for driveways...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Popular locations and recent searches
  const popularLocations: SearchSuggestion[] = [
    { id: 'downtown', text: 'Downtown Area', type: 'popular', icon: '🏙️' },
    { id: 'airport', text: 'Near Airport', type: 'popular', icon: '✈️' },
    { id: 'university', text: 'University District', type: 'popular', icon: '🎓' },
    { id: 'hospital', text: 'Hospital Area', type: 'popular', icon: '🏥' },
    { id: 'shopping', text: 'Shopping Centers', type: 'popular', icon: '🛍️' },
    { id: 'beach', text: 'Beach Area', type: 'popular', icon: '🏖️' }
  ];

  const getRecentSearches = (): SearchSuggestion[] => {
    const recent = localStorage.getItem('recent-searches');
    if (!recent) return [];
    
    try {
      const searches = JSON.parse(recent);
      return searches.slice(0, 5).map((search: string, index: number) => ({
        id: `recent-${index}`,
        text: search,
        type: 'recent' as const,
        icon: '🕒'
      }));
    } catch {
      return [];
    }
  };

  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const recent = localStorage.getItem('recent-searches');
    let searches: string[] = [];
    
    if (recent) {
      try {
        searches = JSON.parse(recent);
      } catch {
        searches = [];
      }
    }
    
    // Remove if already exists and add to beginning
    searches = searches.filter(s => s.toLowerCase() !== searchQuery.toLowerCase());
    searches.unshift(searchQuery);
    
    // Keep only last 10 searches
    searches = searches.slice(0, 10);
    
    localStorage.setItem('recent-searches', JSON.stringify(searches));
  }, []);

  const generateSuggestions = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      // Show popular locations and recent searches when empty
      const recentSearches = getRecentSearches();
      setSuggestions([...popularLocations, ...recentSearches]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filteredSuggestions: SearchSuggestion[] = [];

    // Filter popular locations
    const matchingPopular = popularLocations.filter(location =>
      location.text.toLowerCase().includes(query)
    );

    // Filter recent searches
    const recentSearches = getRecentSearches();
    const matchingRecent = recentSearches.filter(search =>
      search.text.toLowerCase().includes(query)
    );

    // Add location-based suggestions
    const locationSuggestions: SearchSuggestion[] = [
      { id: 'near-me', text: 'Near my location', type: 'location', icon: '📍' },
      { id: 'walking-distance', text: 'Within walking distance', type: 'location', icon: '🚶' },
      { id: 'cheap', text: 'Budget-friendly options', type: 'location', icon: '💰' },
      { id: 'available-now', text: 'Available right now', type: 'location', icon: '⚡' }
    ].filter(suggestion => 
      suggestion.text.toLowerCase().includes(query)
    );

    setSuggestions([...matchingPopular, ...matchingRecent, ...locationSuggestions]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      setIsLoading(true);
      // Simulate API delay for better UX
      setTimeout(() => {
        generateSuggestions(value);
        setIsLoading(false);
      }, 150);
    } else {
      generateSuggestions('');
    }
    
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    saveRecentSearch(suggestion.text);
    onSearch(suggestion.text);
    
    // Show contextual notification
    if (suggestion.type === 'recent') {
      notificationService.showNotification({
        type: 'info',
        title: 'Recent Search',
        message: 'Searching your recent query',
        context: 'search'
      });
    }
  };

  const handleSearch = () => {
    if (!query.trim()) {
      notificationService.showNotification({
        type: 'warning',
        title: 'Empty Search',
        message: 'Please enter a location or search term',
        context: 'search'
      });
      return;
    }

    setShowSuggestions(false);
    saveRecentSearch(query);
    onSearch(query);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Load initial suggestions
  useEffect(() => {
    generateSuggestions('');
  }, [generateSuggestions]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`smart-search ${className}`}>
      <div className="search-input-container">
        <div className="search-icon">
          {isLoading ? (
            <div className="loading-spinner" />
          ) : (
            <span>🔍</span>
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="search-input"
          autoComplete="off"
        />
        
        {query && (
          <button
            className="clear-button"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
        
        <button
          className="search-button"
          onClick={handleSearch}
          disabled={!query.trim()}
        >
          Search
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="suggestion-icon">{suggestion.icon}</span>
              <span className="suggestion-text">{suggestion.text}</span>
              <span className="suggestion-type">{suggestion.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
