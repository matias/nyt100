'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Restaurant } from '@/types/restaurant';

interface MapboxMapProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
}

export default function MapboxMap({ restaurants, selectedRestaurant, onRestaurantSelect }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Set your Mapbox access token
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken || mapboxToken === 'your_mapbox_token_here') {
      console.error('Mapbox token not configured. Please set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local');
      return;
    }
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.006, 40.7128], // NYC center
      zoom: 11,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when restaurants change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for restaurants with coordinates
    restaurants.forEach(restaurant => {
      if (restaurant.latitude && restaurant.longitude) {
        const marker = new mapboxgl.Marker({
          color: getMarkerColor(restaurant),
          scale: selectedRestaurant?.place_id === restaurant.place_id ? 1.2 : 1,
        })
          .setLngLat([restaurant.longitude, restaurant.latitude])
          .addTo(map.current!);

        // Add click handler
        marker.getElement().addEventListener('click', () => {
          onRestaurantSelect(restaurant);
        });

        // Add popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
        }).setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${restaurant.name}</h3>
            <p class="text-xs text-gray-600">${restaurant.cuisine}</p>
            <p class="text-xs text-gray-600">${restaurant.price_range}</p>
            <div class="flex items-center mt-1">
              <span class="text-xs text-yellow-600">★ ${restaurant.rating}</span>
              <span class="text-xs text-gray-500 ml-1">(${restaurant.review_count})</span>
            </div>
          </div>
        `);

        marker.setPopup(popup);
        markers.current.push(marker);
      }
    });

    // Fit map to show all markers
    if (restaurants.length > 0 && restaurants.some(r => r.latitude && r.longitude)) {
      const bounds = new mapboxgl.LngLatBounds();
      restaurants.forEach(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
          bounds.extend([restaurant.longitude, restaurant.latitude]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [restaurants, mapLoaded, selectedRestaurant, onRestaurantSelect]);

  // Get marker color based on price range
  const getMarkerColor = (restaurant: Restaurant): string => {
    const priceRange = restaurant.price_range;
    if (priceRange.includes('$100+')) return '#dc2626'; // red
    if (priceRange.includes('$50–100')) return '#ea580c'; // orange
    if (priceRange.includes('$25–50')) return '#16a34a'; // green
    return '#2563eb'; // blue (default)
  };

  // Check if Mapbox token is configured
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const isTokenConfigured = mapboxToken && mapboxToken !== 'your_mapbox_token_here';

  if (!isTokenConfigured) {
    return (
      <div className="w-full h-full rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Not Available</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please configure your Mapbox access token to view the interactive map.
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p>1. Get a free token from <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mapbox.com</a></p>
            <p>2. Create a <code className="bg-gray-200 px-1 rounded">.env.local</code> file in the app directory</p>
            <p>3. Add: <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here</code></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
