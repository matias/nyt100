'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Restaurant } from '@/types/restaurant';

interface RestaurantListProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant | null) => void;
}

// Check if restaurant is currently open based on opening hours (Eastern Time)
const isRestaurantOpen = (openingHours: { open: { day: number; hour: number; minute: number }; close: { day: number; hour: number; minute: number } }[] | undefined) => {
  if (!openingHours || !Array.isArray(openingHours) || openingHours.length === 0) {
    return undefined; // Unknown
  }

  // Get current time in Eastern Time
  const now = new Date();
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const etDate = new Date(etString);
  
  const currentDay = etDate.getDay(); // 0 = Sunday, 6 = Saturday
  const currentHour = etDate.getHours();
  const currentMinute = etDate.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Check if current time falls within any opening period
  for (const period of openingHours) {
    if (!period.open || !period.close) continue;

    const openDay = period.open.day;
    const closeDay = period.close.day;
    const openTime = period.open.hour * 60 + (period.open.minute || 0);
    const closeTime = period.close.hour * 60 + (period.close.minute || 0);

    // Check if the period spans across midnight (close time is on a different day)
    if (closeDay !== openDay) {
      // Period spans midnight
      if (currentDay === openDay && currentTimeInMinutes >= openTime) {
        return true; // We're on the opening day after opening time
      }
      if (currentDay === closeDay && currentTimeInMinutes < closeTime) {
        return true; // We're on the closing day before closing time
      }
    } else {
      // Period is within the same day
      if (currentDay === openDay && currentTimeInMinutes >= openTime && currentTimeInMinutes < closeTime) {
        return true;
      }
    }
  }

  return false;
};

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
  const [expandedHours, setExpandedHours] = useState<Set<string>>(new Set());
  const restaurantRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const listContainerRef = useRef<HTMLDivElement>(null);
  
  const toggleHours = (key: string) => {
    const newExpanded = new Set(expandedHours);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedHours(newExpanded);
  };

  // Scroll to selected restaurant when selection changes
  useEffect(() => {
    if (selectedRestaurant && listContainerRef.current) {
      // Use place_id as key (fallback to combined_order if no place_id)
      const key = selectedRestaurant.place_id ?? `restaurant-${selectedRestaurant.combined_order ?? selectedRestaurant.rank ?? 0}`;
      const restaurantElement = restaurantRefs.current.get(key);
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
          {restaurants.map((restaurant) => {
            // Use place_id as key (fallback to combined_order if no place_id)
            const key = restaurant.place_id ?? `restaurant-${restaurant.combined_order ?? restaurant.rank ?? 0}`;
            return (
            <div
              key={key}
              ref={(el) => {
                if (el) {
                  restaurantRefs.current.set(key, el);
                } else {
                  restaurantRefs.current.delete(key);
                }
              }}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedRestaurant?.place_id === restaurant.place_id ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => {
                // If clicking the same restaurant that's already selected, deselect it
                if (selectedRestaurant?.place_id === restaurant.place_id) {
                  onRestaurantSelect(null);
                } else {
                  onRestaurantSelect(restaurant);
                }
              }}
            >
              <div className="flex items-start space-x-3">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name and Rating */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {restaurant.name}
                      </h3>
                      {/* Source Icons */}
                      <div className="flex items-center gap-1">
                        {restaurant.sources?.includes('NYT') && (
                          <Image 
                            src="/favicons/nyt.ico" 
                            alt="NYT" 
                            width={12}
                            height={12}
                            className="w-3 h-3 mr-1"
                            title="New York Times"
                            style={{ background: 'white' }}
                            unoptimized
                          />
                        )}
                        {restaurant.sources?.includes('NYM') && (
                          <Image 
                            src="/favicons/nym.ico" 
                            alt="NYM" 
                            width={12}
                            height={12}
                            className="w-3 h-3 mr-1"
                            title="New York Magazine"
                            unoptimized
                          />
                        )}
                      </div>
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
                    {(() => {
                      const isOpen = isRestaurantOpen(restaurant.opening_hours);
                      return isOpen !== undefined && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded ${
                          isOpen 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                      );
                    })()}
                    
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
                          toggleHours(key);
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                      >
                        {expandedHours.has(key) ? '▼' : '▶'} Hours
                      </button>
                      {expandedHours.has(key) && (
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
