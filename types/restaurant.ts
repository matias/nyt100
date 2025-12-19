export interface Restaurant {
  rank?: number; // Kept for backward compatibility, but not displayed in UI
  name: string;
  rating?: number;
  review_count?: number;
  price_range?: string;
  cuisine?: string;
  description?: string;
  image_url?: string;
  
  // Source tracking
  sources: string[]; // e.g., ["NYT"], ["NYM"], or ["NYT", "NYM"]
  nyt_rank?: number; // Rank in NYT list (1-100)
  nym_rank?: number; // Rank in NYM list (1-N)
  combined_order: number; // Calculated order for merged display
  
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
  boroughs: string[];
  openForLunch: boolean;
  publications: string[]; // e.g., ["NYT", "NYM"]
}
