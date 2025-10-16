'use client';

import { useState, useEffect } from 'react';
import { Restaurant, FilterState } from '@/types/restaurant';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  restaurants: Restaurant[];
}

export default function FilterPanel({ filters, onFiltersChange, restaurants }: FilterPanelProps) {
  const [isNearMeSupported, setIsNearMeSupported] = useState(false);

  // Check if geolocation is supported
  useEffect(() => {
    setIsNearMeSupported('geolocation' in navigator);
  }, []);

  // Get unique values for filter options
  const priceRanges = [...new Set(restaurants.map(r => r.price_range))].sort();
  const cuisines = [...new Set(restaurants.map(r => r.cuisine))].sort();
  const neighborhoods = [...new Set(
    restaurants
      .filter(r => r.formatted_address)
      .map(r => {
        const parts = r.formatted_address!.split(',');
        return parts[parts.length - 2]?.trim(); // Get neighborhood from address
      })
      .filter(Boolean)
  )].sort();

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handlePriceRangeToggle = (priceRange: string) => {
    const newPriceRanges = filters.priceRanges.includes(priceRange)
      ? filters.priceRanges.filter(p => p !== priceRange)
      : [...filters.priceRanges, priceRange];
    onFiltersChange({ ...filters, priceRanges: newPriceRanges });
  };

  const handleCuisineToggle = (cuisine: string) => {
    const newCuisines = filters.cuisines.includes(cuisine)
      ? filters.cuisines.filter(c => c !== cuisine)
      : [...filters.cuisines, cuisine];
    onFiltersChange({ ...filters, cuisines: newCuisines });
  };

  const handleNeighborhoodToggle = (neighborhood: string) => {
    const newNeighborhoods = filters.neighborhoods.includes(neighborhood)
      ? filters.neighborhoods.filter(n => n !== neighborhood)
      : [...filters.neighborhoods, neighborhood];
    onFiltersChange({ ...filters, neighborhoods: newNeighborhoods });
  };

  const handleNearMeToggle = () => {
    if (!filters.nearMe && isNearMeSupported) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onFiltersChange({
            ...filters,
            nearMe: true,
            userLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          onFiltersChange({ ...filters, nearMe: false });
        }
      );
    } else {
      onFiltersChange({ ...filters, nearMe: false, userLocation: undefined });
    }
  };

  const handleOpenForLunchToggle = () => {
    onFiltersChange({ ...filters, openForLunch: !filters.openForLunch });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: '',
      priceRanges: [],
      cuisines: [],
      neighborhoods: [],
      nearMe: false,
      openForLunch: false,
      userLocation: undefined,
    });
  };

  const hasActiveFilters = filters.searchQuery || 
    filters.priceRanges.length > 0 || 
    filters.cuisines.length > 0 || 
    filters.neighborhoods.length > 0 || 
    filters.nearMe || 
    filters.openForLunch;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search restaurants..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price Range
          </label>
          <div className="space-y-2">
            {priceRanges.map((priceRange, index) => (
              <label key={`price-${index}-${priceRange}`} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.priceRanges.includes(priceRange)}
                  onChange={() => handlePriceRangeToggle(priceRange)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{priceRange}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Cuisine */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cuisine
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {cuisines.map((cuisine, index) => (
              <label key={`cuisine-${index}-${cuisine}`} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.cuisines.includes(cuisine)}
                  onChange={() => handleCuisineToggle(cuisine)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{cuisine}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Neighborhood */}
        {neighborhoods.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Neighborhood
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {neighborhoods.map((neighborhood, index) => (
                <label key={`neighborhood-${index}-${neighborhood}`} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.neighborhoods.includes(neighborhood)}
                    onChange={() => handleNeighborhoodToggle(neighborhood)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{neighborhood}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Near Me */}
        {isNearMeSupported && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.nearMe}
                onChange={handleNearMeToggle}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Near Me</span>
            </label>
            {filters.nearMe && filters.userLocation && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Location: {filters.userLocation.lat.toFixed(4)}, {filters.userLocation.lng.toFixed(4)}
              </p>
            )}
          </div>
        )}

        {/* Open for Lunch */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.openForLunch}
              onChange={handleOpenForLunchToggle}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Open for Lunch</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            (Open 12pm-2pm)
          </p>
        </div>
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2">Active Filters:</p>
            <ul className="space-y-1">
              {filters.searchQuery && (
                <li key="search">• Search: "{filters.searchQuery}"</li>
              )}
              {filters.priceRanges.length > 0 && (
                <li key="price">• Price: {filters.priceRanges.join(', ')}</li>
              )}
              {filters.cuisines.length > 0 && (
                <li key="cuisine">• Cuisine: {filters.cuisines.join(', ')}</li>
              )}
              {filters.neighborhoods.length > 0 && (
                <li key="neighborhood">• Neighborhood: {filters.neighborhoods.join(', ')}</li>
              )}
              {filters.nearMe && <li key="nearme">• Near Me</li>}
              {filters.openForLunch && <li key="lunch">• Open for Lunch</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
