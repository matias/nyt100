'use client';

import { useState } from 'react';
import { Restaurant } from '@/types/restaurant';

interface RestaurantListProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
}

// Helper function to format opening hours
const formatOpeningHours = (openingHours: any[]) => {
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
  
  const toggleHours = (rank: number) => {
    const newExpanded = new Set(expandedHours);
    if (newExpanded.has(rank)) {
      newExpanded.delete(rank);
    } else {
      newExpanded.add(rank);
    }
    setExpandedHours(newExpanded);
  };
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
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Restaurants ({restaurants.length})
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.rank}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedRestaurant?.rank === restaurant.rank ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => onRestaurantSelect(restaurant)}
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {restaurant.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {restaurant.cuisine}
                      </p>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-1 ml-2">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {restaurant.rating}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({restaurant.review_count.toLocaleString()})
                      </span>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {restaurant.price_range}
                    </span>
                    
                    {/* Address (if available) */}
                    {restaurant.formatted_address && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate ml-2">
                        {restaurant.formatted_address.split(',')[0]}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                    {restaurant.description}
                  </p>

                  {/* Status indicators */}
                  <div className="mt-2 flex items-center space-x-2">
                    {restaurant.is_open_now !== undefined && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        restaurant.is_open_now 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {restaurant.is_open_now ? 'Open Now' : 'Closed'}
                      </span>
                    )}
                    
                    {restaurant.google_rating && restaurant.google_rating !== restaurant.rating && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Google: {restaurant.google_rating}★
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  {(restaurant.website || restaurant.phone) && (
                    <div className="mt-2 flex items-center space-x-3 text-xs">
                      {restaurant.website && (
                        <a
                          href={restaurant.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                        >
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                          </svg>
                          Website
                        </a>
                      )}
                      {restaurant.phone && (
                        <a
                          href={`tel:${restaurant.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-800 hover:underline flex items-center"
                        >
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          {restaurant.phone}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Opening Hours */}
                  {restaurant.opening_hours && restaurant.opening_hours.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHours(restaurant.rank);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
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
