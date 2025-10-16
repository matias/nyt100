'use client';

import { Restaurant } from '@/types/restaurant';

interface RestaurantListProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
}

export default function RestaurantList({ restaurants, selectedRestaurant, onRestaurantSelect }: RestaurantListProps) {
  if (restaurants.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-lg">
        <div className="text-center text-gray-500">
          <p className="text-lg">No restaurants found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">
          Restaurants ({restaurants.length})
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.rank}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedRestaurant?.rank === restaurant.rank ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => onRestaurantSelect(restaurant)}
            >
              <div className="flex items-start space-x-3">
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                    {restaurant.rank}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {restaurant.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {restaurant.cuisine}
                      </p>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-1 ml-2">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium text-gray-900">
                        {restaurant.rating}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({restaurant.review_count.toLocaleString()})
                      </span>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600">
                      {restaurant.price_range}
                    </span>
                    
                    {/* Address (if available) */}
                    {restaurant.formatted_address && (
                      <span className="text-xs text-gray-500 truncate ml-2">
                        {restaurant.formatted_address.split(',')[0]}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
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
                      <span className="text-xs text-gray-500">
                        Google: {restaurant.google_rating}★
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
