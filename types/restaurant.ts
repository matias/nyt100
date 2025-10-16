export interface Restaurant {
  rank: number;
  name: string;
  rating: number;
  review_count: number;
  price_range: string;
  cuisine: string;
  description: string;
  image_url: string;
  
  // Enriched data from Google Places API
  place_id?: string;
  google_rating?: number;
  google_review_count?: number;
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: OpeningHoursPeriod[];
  is_open_now?: boolean;
  website?: string;
  phone?: string;
  google_maps_url?: string;
  last_updated?: string;
}

export interface OpeningHoursPeriod {
  open: {
    day: number; // 0 = Sunday, 1 = Monday, etc.
    hour: number;
    minute: number;
  };
  close: {
    day: number;
    hour: number;
    minute: number;
  };
}

export interface FilterState {
  searchQuery: string;
  priceRanges: string[];
  cuisines: string[];
  neighborhoods: string[];
  nearMe: boolean;
  openForLunch: boolean;
  userLocation?: {
    lat: number;
    lng: number;
  };
}
