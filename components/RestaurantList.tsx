'use client';

import { useState, useRef, useEffect } from 'react';
import { Restaurant } from '@/types/restaurant';

interface RestaurantListProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant | null) => void;
}

// Helper function to format opening hours
const formatOpeningHours = (openingHours: { open: { day: number; hour: number; minute: number }; close: { day: number; hour: number; minute: number } }[]) => {
  if (!openingHours || !Array.isArray(openingHours)) return null;
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return openingHours.map(period => {
    if (!period.open || !period.close) return null;
    
    const openDay = dayNames[period.open.day];
    const openTime = formatTime(period.open.hour, period.open.minute);
    const closeTime = formatTime(period.close.hour, period.close.minute);
    
    return `${openDay}: ${openTime}-${closeTime}`;
  }).filter(Boolean);
};

const formatTime = (hour: number, minute: number = 0) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
};

export default function RestaurantList({ restaurants, selectedRestaurant, onRestaurantSelect }: RestaurantListProps) {
  const [expandedHours, setExpandedHours] = useState<Set<number>>(new Set());
  const restaurantRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const listContainerRef = useRef<HTMLDivElement>(null);
  
  const toggleHours = (rank: number) => {
    const newExpanded = new Set(expandedHours);
    if (newExpanded.has(rank)) {
      newExpanded.delete(rank);
    } else {
      newExpanded.add(rank);
    }
    setExpandedHours(newExpanded);
  };

  // Scroll to selected restaurant when selection changes
  useEffect(() => {
    if (selectedRestaurant && listContainerRef.current) {
      const restaurantElement = restaurantRefs.current.get(selectedRestaurant.rank);
      if (restaurantElement) {
        // Scroll the restaurant into view with smooth behavior
        restaurantElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [selectedRestaurant]);

  if (restaurants.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg">No restaurants found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
      {/* List */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.rank}
              ref={(el) => {
                if (el) {
                  restaurantRefs.current.set(restaurant.rank, el);
                } else {
                  restaurantRefs.current.delete(restaurant.rank);
                }
              }}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedRestaurant?.rank === restaurant.rank ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => {
                // If clicking the same restaurant that's already selected, deselect it
                if (selectedRestaurant?.rank === restaurant.rank) {
                  onRestaurantSelect(null);
                } else {
                  onRestaurantSelect(restaurant);
                }
              }}
            >
              <div className="flex items-start space-x-3">
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    {restaurant.rank}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name and Rating */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        {restaurant.website && (
                          <>
                            <span>·</span>
                            <a
                              href={restaurant.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Website
                            </a>
                          </>
                        )}
                        {(restaurant.google_maps_url || restaurant.latitude) && (
                          <>
                            <span>·</span>
                            <a
                              href={
                                restaurant.google_maps_url || 
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  restaurant.latitude && restaurant.longitude
                                    ? `${restaurant.latitude},${restaurant.longitude}`
                                    : restaurant.name + ' ' + (restaurant.formatted_address || '')
                                )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Maps
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {restaurant.rating}
                      </span>
                      {/* <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({restaurant.review_count.toLocaleString()})
                      </span> */}
                    </div>
                  </div>

                  {/* Condensed Info Line: Open/Closed, Cuisine, Price, Address */}
                  <div className="mt-1 flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {/* Open/Closed */}
                    {restaurant.is_open_now !== undefined && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded ${
                        restaurant.is_open_now 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {restaurant.is_open_now ? 'Open' : 'Closed'}
                      </span>
                    )}
                    
                    {/* Cuisine */}
                    <span>{restaurant.cuisine}</span>
                    
                    {/* Separator */}
                    <span>•</span>
                    
                    {/* Price Range */}
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {restaurant.price_range}
                    </span>
                    
                    {/* Address */}
                    {restaurant.formatted_address && (
                      <>
                        <span>•</span>
                        <span className="truncate">
                          {restaurant.formatted_address.split(',').slice(0, 2).join(',')}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                    {restaurant.description}
                  </p>

                  {/* Opening Hours (Collapsible) */}
                  {restaurant.opening_hours && restaurant.opening_hours.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHours(restaurant.rank);
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                      >
                        {expandedHours.has(restaurant.rank) ? '▼' : '▶'} Hours
                      </button>
                      {expandedHours.has(restaurant.rank) && (
                        <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                          {formatOpeningHours(restaurant.opening_hours)?.map((hours, index) => (
                            <div key={index}>{hours}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
