'use client';

import { useState, useEffect, useMemo } from 'react';
import MapboxMap from '@/components/MapboxMap';
import RestaurantList from '@/components/RestaurantList';
import FilterPanel from '@/components/FilterPanel';
import { Restaurant, FilterState } from '@/types/restaurant';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    priceRanges: [],
    cuisines: [],
    neighborhoods: [],
    nearMe: false,
    openForLunch: false,
  });

  // Initialize dark mode from system preference
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                   (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load restaurant data
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const response = await fetch('/data/restaurants_parsed.json');
        const data = await response.json();
        setRestaurants(data);
      } catch (error) {
        console.error('Failed to load restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  // Filter restaurants based on current filters
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(restaurant =>
        restaurant.name?.toLowerCase().includes(query) ||
        restaurant.cuisine?.toLowerCase().includes(query) ||
        restaurant.description?.toLowerCase().includes(query)
      );
    }

    // Price range filter
    if (filters.priceRanges.length > 0) {
      filtered = filtered.filter(restaurant =>
        filters.priceRanges.includes(restaurant.price_range)
      );
    }

    // Cuisine filter
    if (filters.cuisines.length > 0) {
      filtered = filtered.filter(restaurant =>
        filters.cuisines.includes(restaurant.cuisine)
      );
    }

    // Neighborhood filter
    if (filters.neighborhoods.length > 0) {
      filtered = filtered.filter(restaurant =>
        filters.neighborhoods.some(neighborhood =>
          restaurant.formatted_address?.toLowerCase().includes(neighborhood.toLowerCase())
        )
      );
    }

    // Near me filter
    if (filters.nearMe && filters.userLocation) {
      filtered = filtered
        .filter(restaurant => restaurant.latitude && restaurant.longitude)
        .sort((a, b) => {
          const distanceA = calculateDistance(
            filters.userLocation!.lat,
            filters.userLocation!.lng,
            a.latitude!,
            a.longitude!
          );
          const distanceB = calculateDistance(
            filters.userLocation!.lat,
            filters.userLocation!.lng,
            b.latitude!,
            b.longitude!
          );
          return distanceA - distanceB;
        });
    }

    // Open for lunch filter (12pm-2pm)
    if (filters.openForLunch) {
      filtered = filtered.filter(restaurant => {
        if (!restaurant.opening_hours || !Array.isArray(restaurant.opening_hours)) {
          return false;
        }
        
        // Check if restaurant is open during lunch hours (12pm-2pm) on any day
        return restaurant.opening_hours.some(period => {
          if (!period.open || !period.close) return false;
          
          const openHour = period.open.hour;
          const closeHour = period.close.hour;
          const openMinute = period.open.minute || 0;
          const closeMinute = period.close.minute || 0;
          
          // Convert to minutes for easier comparison
          const openTime = openHour * 60 + openMinute;
          const closeTime = closeHour * 60 + closeMinute;
          const lunchStart = 12 * 60; // 12:00 PM
          const lunchEnd = 14 * 60;   // 2:00 PM
          
          // Check if lunch hours (12pm-2pm) overlap with restaurant hours
          return openTime <= lunchStart && closeTime >= lunchEnd;
        });
      });
    }

    return filtered;
  }, [restaurants, filters]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                NYT Top 100 NYC Restaurants
              </h1>
              <p className="mt-2 text-gray-700 dark:text-gray-300">
                Discover and explore the best restaurants in New York City
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel */}
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              restaurants={restaurants}
            />
          </div>

          {/* Map and List */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Map */}
              <div className="h-96 xl:h-full min-h-[400px]">
                <MapboxMap
                  restaurants={filteredRestaurants}
                  selectedRestaurant={selectedRestaurant}
                  onRestaurantSelect={setSelectedRestaurant}
                />
              </div>

              {/* Restaurant List */}
              <div className="h-96 xl:h-[calc(100vh-200px)] overflow-hidden">
                <RestaurantList
                  restaurants={filteredRestaurants}
                  selectedRestaurant={selectedRestaurant}
                  onRestaurantSelect={setSelectedRestaurant}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}