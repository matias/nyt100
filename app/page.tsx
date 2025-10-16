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
    priceRanges: [],
    cuisines: [],
    neighborhoods: [],
    nearMe: false,
    openForLunch: false,
  });

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
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.cuisine.toLowerCase().includes(query) ||
        restaurant.description.toLowerCase().includes(query)
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

    // Open for lunch filter (placeholder - will implement after seeing hours data)
    if (filters.openForLunch) {
      // TODO: Implement lunch hours filtering
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            NYT Top 100 NYC Restaurants
          </h1>
          <p className="mt-2 text-gray-600">
            Discover and explore the best restaurants in New York City
          </p>
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
              <div className="h-96 xl:h-full overflow-hidden">
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