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
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    boroughs: [],
    openForLunch: false,
  });

  // Deselect restaurant when borough filters change
  useEffect(() => {
    setSelectedRestaurant(null);
  }, [filters.boroughs]);

  // Use system dark mode preference
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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

    // Borough filter (OR logic - show restaurants from any selected borough)
    if (filters.boroughs.length > 0) {
      filtered = filtered.filter(restaurant => {
        if (!restaurant.formatted_address) return false;
        
        // Extract zip code from address
        const match = restaurant.formatted_address.match(/\b\d{5}\b/);
        if (!match) return false;
        
        const zip = match[0];
        const zipNum = parseInt(zip);
        
        // Check if the restaurant's zip code is in any of the selected boroughs
        return filters.boroughs.some(borough => {
          switch (borough) {
            case 'Manhattan':
              return (zipNum >= 10001 && zipNum <= 10048) || 
                     (zipNum >= 10101 && zipNum <= 10199) || 
                     (zipNum >= 10270 && zipNum <= 10282);
            case 'Brooklyn':
              return zipNum >= 11201 && zipNum <= 11256;
            case 'Queens':
              return (zipNum >= 11004 && zipNum <= 11005) ||
                     (zipNum >= 11101 && zipNum <= 11109) ||
                     (zipNum >= 11351 && zipNum <= 11390) ||
                     (zipNum >= 11411 && zipNum <= 11436) ||
                     (zipNum >= 11691 && zipNum <= 11697);
            case 'Bronx':
              return zipNum >= 10451 && zipNum <= 10475;
            case 'Staten Island':
              return zipNum >= 10301 && zipNum <= 10314;
            default:
              return false;
          }
        });
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
      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-50">
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          filteredCount={filteredRestaurants.length}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 100px)' }}>
          {/* Map */}
          <div className="h-full min-h-[400px]">
            <MapboxMap
              restaurants={filteredRestaurants}
              selectedRestaurant={selectedRestaurant}
              onRestaurantSelect={setSelectedRestaurant}
            />
          </div>

          {/* Restaurant List */}
          <div className="h-full overflow-hidden">
            <RestaurantList
              restaurants={filteredRestaurants}
              selectedRestaurant={selectedRestaurant}
              onRestaurantSelect={setSelectedRestaurant}
            />
          </div>
        </div>
      </div>
    </div>
  );
}