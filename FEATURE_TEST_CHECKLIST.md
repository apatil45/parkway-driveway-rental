# Address Search Feature Test Checklist

## Test Environment
- Browser: Chrome/Edge (for best Web Speech API support)
- Location: USA (required for country filter)
- Local Storage: Should be cleared for fresh tests

---

## ✅ Feature Tests

### 1. Basic Address Autocomplete
- [ ] Type "New York" → Should show USA addresses only
- [ ] Type "Los Angeles" → Should show suggestions
- [ ] Type "123 Main St" → Should show street addresses
- [ ] Verify all results are from USA (check display names)
- [ ] Check that API calls include `&countrycodes=us`

### 2. Recent Searches
- [ ] Search for an address and select it
- [ ] Clear input field
- [ ] Click in search box again
- [ ] Should see recent search in suggestions with clock icon
- [ ] Recent searches should appear at top
- [ ] Maximum 10 recent searches should be stored
- [ ] Oldest searches should be removed when limit exceeded

### 3. Favorite Locations
- [ ] Search for an address
- [ ] Select an address
- [ ] Should see option to save as favorite (if implemented)
- [ ] Check favorites bar appears when input is empty
- [ ] Click favorite → Should fill input and trigger search
- [ ] Favorites should show with icons (home/work/custom)
- [ ] Maximum 5 favorites should be allowed

### 4. Map Picker
- [ ] Click map icon button
- [ ] Map modal should open
- [ ] Click on map → Should show address for clicked location
- [ ] Select location → Should fill input field
- [ ] Verify reverse geocoding works (lat/lon → address)
- [ ] Check that map picker only shows USA locations

### 5. POI/Landmark Search
- [ ] Type "airport near me"
- [ ] Type "stadium parking"
- [ ] Type "mall near downtown"
- [ ] Should show POI results with special icon
- [ ] POI results should show distance if location available
- [ ] Verify POI category is marked correctly

### 6. Popular Search Suggestions
- [ ] Click in empty search box
- [ ] Should see popular searches (Airport, Downtown, Event, etc.)
- [ ] Click popular search → Should trigger search
- [ ] Popular searches should appear when no input

### 7. Time-Based Smart Suggestions
- [ ] Check suggestions change based on time of day
- [ ] Morning → Should prioritize work locations
- [ ] Evening → Should prioritize home locations
- [ ] Verify smart ranking algorithm works

### 8. Fuzzy Search / Typo Tolerance
- [ ] Type "New Yrok" (typo) → Should suggest "New York"
- [ ] Type "Los Angelees" → Should suggest "Los Angeles"
- [ ] Should show "Did you mean?" suggestion
- [ ] Click fuzzy suggestion → Should use corrected query

### 9. Keyboard Navigation
- [ ] Type query → Arrow down → Should highlight first suggestion
- [ ] Arrow up/down → Should navigate through suggestions
- [ ] Enter → Should select highlighted suggestion
- [ ] Escape → Should close suggestions
- [ ] Tab → Should work normally

### 10. Debouncing
- [ ] Type quickly: "New York City"
- [ ] Check network tab → Should not make API call for each keystroke
- [ ] Should wait ~300ms after typing stops
- [ ] Verify only one API call per search query

### 11. Dynamic Placeholder
- [ ] Watch placeholder text
- [ ] Should rotate every 3 seconds
- [ ] Should show different search hints
- [ ] Custom placeholder should override rotation

### 12. Search Analytics
- [ ] Perform multiple searches
- [ ] Check localStorage for `parkway_search_analytics`
- [ ] Verify searches are being tracked
- [ ] Check that analytics influence suggestions

### 13. Nearby Places
- [ ] Allow location access
- [ ] Should show nearby places when available
- [ ] Nearby places should show distance
- [ ] Should appear in suggestions list

### 14. Error Handling
- [ ] Disconnect internet → Should show error message
- [ ] Invalid query → Should handle gracefully
- [ ] API timeout → Should show appropriate error
- [ ] Error should clear on new search

### 15. Visual Feedback
- [ ] Loading spinner appears during search
- [ ] Suggestions dropdown appears/disappears correctly
- [ ] Icons show correctly (clock, star, map, etc.)
- [ ] Highlighted text in suggestions works
- [ ] Distance display works for nearby places

---

## ❌ Known Issues
- Voice search: Not working (browser compatibility/permission issues)

---

## Test Results
Date: ___________
Tester: ___________

### Passed: ___ / 15
### Failed: ___ / 15
### Notes:

