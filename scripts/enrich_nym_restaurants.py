#!/usr/bin/env python3
"""
Enrich NYM restaurants with Google Places API data.
For restaurants that don't have place_id, search and fetch details.
"""

import json
import os
import time
from pathlib import Path
from typing import Dict, List, Optional
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')
load_dotenv()

# Google Places API (New) configuration
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
BASE_URL = 'https://places.googleapis.com/v1'

# NYC bounds for filtering results
NYC_BOUNDS = {
    'north': 40.9176,
    'south': 40.4774,
    'east': -73.7004,
    'west': -74.2591
}


def search_place_by_name_and_address(name: str, address: str = None) -> Optional[Dict]:
    """Search for a restaurant using Google Places Text Search API (New)."""
    
    if not GOOGLE_PLACES_API_KEY:
        print("Error: GOOGLE_PLACES_API_KEY not found in environment variables")
        return None
    
    # Construct search query
    if address:
        query = f"{name} {address} New York City"
    else:
        query = f"{name} restaurant New York City"
    
    # Request body for the new API
    request_body = {
        "textQuery": query,
        "maxResultCount": 5,
        "locationBias": {
            "circle": {
                "center": {
                    "latitude": 40.7128,  # NYC center
                    "longitude": -74.0060
                },
                "radius": 50000  # 50km radius
            }
        }
    }
    
    # Field mask for the new API
    field_mask = "places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.location,places.types"
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': field_mask
    }
    
    try:
        response = requests.post(f"{BASE_URL}/places:searchText", 
                              json=request_body, 
                              headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        if 'places' not in data or not data['places']:
            print(f"No results found for '{name}'")
            return None
        
        results = data['places']
        
        # Filter results to NYC area and find best match
        nyc_results = []
        for result in results:
            location = result.get('location', {})
            lat = location.get('latitude')
            lng = location.get('longitude')
            
            if lat and lng and is_in_nyc_bounds(lat, lng):
                nyc_results.append(result)
        
        if not nyc_results:
            print(f"No NYC results found for '{name}'")
            return None
        
        # Return the highest rated result in NYC
        def get_rating_value(result):
            rating = result.get('rating', {})
            if isinstance(rating, dict):
                return rating.get('value', 0)
            elif isinstance(rating, (int, float)):
                return rating
            else:
                return 0
        
        best_result = max(nyc_results, key=get_rating_value)
        return best_result
        
    except requests.RequestException as e:
        print(f"Request error for '{name}': {e}")
        return None


def get_place_details(place_id: str) -> Optional[Dict]:
    """Get detailed information for a place using Place Details API (New)."""
    
    if not GOOGLE_PLACES_API_KEY:
        return None
    
    # Field mask for place details (New API format) - include editorialSummary
    field_mask = "id,displayName,formattedAddress,location,regularOpeningHours,websiteUri,googleMapsUri,nationalPhoneNumber,rating,userRatingCount,editorialSummary"
    
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
        print(f"Place Details request error: {e}")
        return None


def is_in_nyc_bounds(lat: float, lng: float) -> bool:
    """Check if coordinates are within NYC bounds."""
    return (NYC_BOUNDS['south'] <= lat <= NYC_BOUNDS['north'] and 
            NYC_BOUNDS['west'] <= lng <= NYC_BOUNDS['east'])


def enrich_nym_restaurant(restaurant: Dict) -> Dict:
    """Enrich a single NYM restaurant with Google Places data."""
    
    name = restaurant.get('name', 'Unknown')
    print(f"\n🔍 Enriching: {name}")
    
    # Skip if already has place_id
    if restaurant.get('place_id'):
        print(f"   ✅ Already has place_id: {restaurant['place_id']}")
        return restaurant
    
    # Search for the restaurant
    address = restaurant.get('formatted_address') or restaurant.get('address')
    search_result = search_place_by_name_and_address(name, address)
    
    if not search_result:
        print(f"   ❌ Failed to find: {name}")
        return restaurant
    
    place_id = search_result.get('id')
    if not place_id:
        print(f"   ❌ No place_id for: {name}")
        return restaurant
    
    print(f"   ✅ Found place_id: {place_id}")
    
    # Get detailed information
    details = get_place_details(place_id)
    if not details:
        print(f"   ❌ Failed to get details for: {name}")
        return restaurant
    
    # Add enriched data
    restaurant['place_id'] = place_id
    
    # Handle rating extraction safely
    rating = details.get('rating', {})
    if isinstance(rating, dict):
        restaurant['google_rating'] = rating.get('value')
        restaurant['rating'] = rating.get('value')  # Also set main rating field
    elif isinstance(rating, (int, float)):
        restaurant['google_rating'] = rating
        restaurant['rating'] = rating
    
    restaurant['google_review_count'] = details.get('userRatingCount')
    restaurant['review_count'] = details.get('userRatingCount')
    
    # Update address if we got a better one
    if details.get('formattedAddress'):
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
    if details.get('websiteUri'):
        restaurant['website'] = details.get('websiteUri')
    restaurant['phone'] = details.get('nationalPhoneNumber')
    restaurant['google_maps_url'] = details.get('googleMapsUri')
    
    # Description from editorialSummary
    editorial_summary = details.get('editorialSummary', {})
    if isinstance(editorial_summary, dict):
        description_text = editorial_summary.get('text') or editorial_summary.get('overview')
        if description_text:
            restaurant['description'] = description_text
    
    # Timestamp
    restaurant['last_updated'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"   ✅ Successfully enriched: {name}")
    print(f"   📍 Address: {restaurant.get('formatted_address', 'N/A')}")
    print(f"   🌟 Google Rating: {restaurant.get('google_rating', 'N/A')}")
    
    return restaurant


def main():
    """Main function to enrich NYM restaurants."""
    
    if not GOOGLE_PLACES_API_KEY:
        print("Error: Please set GOOGLE_PLACES_API_KEY in your environment or .env file")
        print("Get your API key from: https://console.cloud.google.com/apis/credentials")
        return
    
    # Paths
    input_file = Path(__file__).parent.parent / 'data' / 'restaurants_merged.json'
    output_file = Path(__file__).parent.parent / 'data' / 'restaurants_enriched_nym.json'
    
    if not input_file.exists():
        print(f"Error: Input file not found at {input_file}")
        print("Run merge_restaurant_lists.py first to create restaurants_merged.json")
        return
    
    # Load merged restaurants
    with open(input_file, 'r', encoding='utf-8') as f:
        restaurants = json.load(f)
    
    # Filter to only NYM restaurants that need enrichment
    nym_restaurants = [r for r in restaurants if 'NYM' in r.get('sources', [])]
    restaurants_to_enrich = [r for r in nym_restaurants if not r.get('place_id')]
    
    print(f"Found {len(restaurants_to_enrich)} NYM restaurants without place_id")
    print(f"Enriching {len(restaurants_to_enrich)} restaurants...")
    
    enriched_restaurants = []
    all_restaurants_dict = {i: r for i, r in enumerate(restaurants)}
    enriched_indices = set()
    
    for i, restaurant in enumerate(restaurants_to_enrich):
        print(f"\n📊 Progress: {i+1}/{len(restaurants_to_enrich)}")
        
        enriched_restaurant = enrich_nym_restaurant(restaurant)
        
        # Find the index in the full list and update it
        for idx, r in enumerate(restaurants):
            if (r.get('name') == enriched_restaurant.get('name') and 
                'NYM' in r.get('sources', [])):
                restaurants[idx] = enriched_restaurant
                enriched_indices.add(idx)
                break
        
        # Rate limiting - Google Places API has quotas
        time.sleep(0.2)  # 200ms delay between requests
    
    # Save enriched data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(restaurants, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved enriched data to: {output_file}")
    
    # Print summary
    successful = sum(1 for r in restaurants if 'NYM' in r.get('sources', []) and r.get('place_id'))
    print(f"Successfully enriched: {successful}/{len(nym_restaurants)} NYM restaurants")


if __name__ == '__main__':
    main()

