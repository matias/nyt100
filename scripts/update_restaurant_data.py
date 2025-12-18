#!/usr/bin/env python3
"""
Update restaurant data using stored place_ids.
This script refreshes dynamic data (hours, phone, website, rating) using the new Places API.
"""

import json
import os
import time
from pathlib import Path
from typing import Dict, List, Optional
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Google Places API (New) configuration
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
BASE_URL = 'https://places.googleapis.com/v1'


def get_place_details(place_id: str) -> Optional[Dict]:
    """Get detailed information for a place using Place Details API (New)."""
    
    if not GOOGLE_PLACES_API_KEY:
        return None
    
    # Field mask for place details (New API format)
    field_mask = "id,displayName,formattedAddress,location,regularOpeningHours,websiteUri,googleMapsUri,nationalPhoneNumber,rating,userRatingCount"
    
    headers = {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': field_mask
    }
    
    try:
        response = requests.get(f"{BASE_URL}/places/{place_id}", headers=headers)
        response.raise_for_status()
        
        data = response.json()
        return data
        
    except requests.RequestException as e:
        print(f"Place Details request error for {place_id}: {e}")
        return None


def update_restaurant_data(restaurant: Dict) -> Dict:
    """Update a single restaurant with fresh Google Places data."""
    
    place_id = restaurant.get('place_id')
    if not place_id:
        print(f"No place_id found for: {restaurant['name']}")
        return restaurant
    
    print(f"Updating: {restaurant['name']}")
    
    # Get fresh data from Places API
    details = get_place_details(place_id)
    if not details:
        print(f"  Failed to get updated details for: {restaurant['name']}")
        return restaurant
    
    # Update dynamic fields only (keep static data from original parse)
    restaurant['google_rating'] = details.get('rating', {}).get('value')
    restaurant['google_review_count'] = details.get('userRatingCount')
    restaurant['formatted_address'] = details.get('formattedAddress')
    
    # Coordinates
    location = details.get('location', {})
    if location:
        restaurant['latitude'] = location.get('latitude')
        restaurant['longitude'] = location.get('longitude')
    
    # Hours
    opening_hours = details.get('regularOpeningHours', {})
    if opening_hours:
        restaurant['opening_hours'] = opening_hours.get('periods', [])
        restaurant['is_open_now'] = opening_hours.get('openNow')
    
    # Contact info
    restaurant['website'] = details.get('websiteUri')
    restaurant['phone'] = details.get('nationalPhoneNumber')
    restaurant['google_maps_url'] = details.get('googleMapsUri')
    
    # Update timestamp
    restaurant['last_updated'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"  Successfully updated: {restaurant['name']}")
    return restaurant


def main():
    """Main function to update restaurant data."""
    
    if not GOOGLE_PLACES_API_KEY:
        print("Error: Please set GOOGLE_PLACES_API_KEY in your environment or .env file")
        print("Get your API key from: https://console.cloud.google.com/apis/credentials")
        return
    
    # Paths
    input_file = Path(__file__).parent.parent / 'data' / 'restaurants_enriched.json'
    output_file = Path(__file__).parent.parent / 'data' / 'restaurants_enriched.json'
    
    if not input_file.exists():
        print(f"Error: Input file not found at {input_file}")
        print("Run enrich_with_places_api.py first to create the initial enriched data")
        return
    
    # Load existing enriched restaurants
    with open(input_file, 'r', encoding='utf-8') as f:
        restaurants = json.load(f)
    
    print(f"Updating {len(restaurants)} restaurants...")
    
    updated_restaurants = []
    for i, restaurant in enumerate(restaurants):
        print(f"\nProgress: {i+1}/{len(restaurants)}")
        
        updated_restaurant = update_restaurant_data(restaurant)
        updated_restaurants.append(updated_restaurant)
        
        # Rate limiting - Google Places API has quotas
        time.sleep(0.1)  # 100ms delay between requests
    
    # Save updated data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(updated_restaurants, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved updated data to: {output_file}")
    
    # Print summary
    successful = sum(1 for r in updated_restaurants if r.get('place_id'))
    print(f"Successfully updated: {successful}/{len(restaurants)} restaurants")


if __name__ == '__main__':
    main()
