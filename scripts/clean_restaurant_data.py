#!/usr/bin/env python3
"""
Clean and prepare restaurant data for the Next.js app.
This script cleans up the parsed data and adds basic improvements without requiring external APIs.
"""

import json
import re
from pathlib import Path
from typing import Dict, List


def clean_price_range(price_range: str) -> str:
    """Clean and standardize price range formatting."""
    if not price_range:
        return "Price not available"
    
    # Remove extra spaces and normalize
    cleaned = price_range.strip()
    
    # Standardize common variations
    cleaned = cleaned.replace("$$", "$20–30")
    cleaned = cleaned.replace("$", "$")
    
    return cleaned


def clean_cuisine(cuisine: str) -> str:
    """Clean and standardize cuisine names."""
    if not cuisine:
        return "Restaurant"
    
    # Remove extra whitespace and normalize
    cleaned = cuisine.strip()
    
    # Handle common variations
    cuisine_mappings = {
        "Restaurant": "American",
        "udon noodles": "Japanese",
        "Middle Eastern": "Middle Eastern",
        "Azerbaijani restaurant": "Azerbaijani",
    }
    
    return cuisine_mappings.get(cleaned, cleaned)


def clean_description(description: str) -> str:
    """Clean restaurant descriptions."""
    if not description:
        return ""
    
    # Remove literal \n characters and extra whitespace
    cleaned = description.replace('\\n', ' ').replace('\n', ' ')
    
    # Remove extra whitespace and normalize
    cleaned = re.sub(r'\s+', ' ', cleaned.strip())
    
    # Remove trailing periods and add if missing
    if cleaned and not cleaned.endswith('.'):
        cleaned += '.'
    
    return cleaned


def extract_neighborhood_from_description(description: str) -> str:
    """Try to extract neighborhood from description."""
    if not description:
        return ""
    
    # Common NYC neighborhoods mentioned in descriptions
    neighborhoods = [
        "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island",
        "West Village", "East Village", "Greenwich Village", "SoHo", "NoMad",
        "Midtown", "Downtown", "Upper West Side", "Upper East Side",
        "Chinatown", "Little Italy", "Koreatown", "Harlem", "Chelsea",
        "Greenpoint", "Williamsburg", "Fort Greene", "Prospect Heights",
        "Bushwick", "Red Hook", "Sunset Park", "Bensonhurst", "Flushing",
        "Jackson Heights", "Elmhurst", "Astoria", "Long Island City",
        "Bedford-Stuyvesant", "Crown Heights", "Park Slope", "Bay Ridge",
        "Sheepshead Bay", "JFK", "Times Square", "Financial District"
    ]
    
    description_lower = description.lower()
    for neighborhood in neighborhoods:
        if neighborhood.lower() in description_lower:
            return neighborhood
    
    return ""


def clean_restaurant_data(restaurant: Dict) -> Dict:
    """Clean and enhance a single restaurant's data."""
    
    # Clean basic fields
    restaurant['price_range'] = clean_price_range(restaurant.get('price_range', ''))
    restaurant['cuisine'] = clean_cuisine(restaurant.get('cuisine', ''))
    restaurant['description'] = clean_description(restaurant.get('description', ''))
    
    # Extract neighborhood from description if not already present
    if not restaurant.get('neighborhood'):
        neighborhood = extract_neighborhood_from_description(restaurant['description'])
        if neighborhood:
            restaurant['neighborhood'] = neighborhood
    
    # Ensure all required fields exist
    restaurant.setdefault('place_id', None)
    restaurant.setdefault('google_rating', None)
    restaurant.setdefault('google_review_count', None)
    restaurant.setdefault('formatted_address', None)
    restaurant.setdefault('latitude', None)
    restaurant.setdefault('longitude', None)
    restaurant.setdefault('opening_hours', None)
    restaurant.setdefault('is_open_now', None)
    restaurant.setdefault('website', None)
    restaurant.setdefault('phone', None)
    restaurant.setdefault('google_maps_url', None)
    restaurant.setdefault('last_updated', None)
    
    return restaurant


def main():
    """Main function to clean restaurant data."""
    
    # Paths
    input_file = Path(__file__).parent.parent / 'data' / 'restaurants_parsed.json'
    output_file = Path(__file__).parent.parent / 'data' / 'restaurants_cleaned.json'
    app_data_file = Path(__file__).parent.parent / 'app' / 'public' / 'data' / 'restaurants_parsed.json'
    
    if not input_file.exists():
        print(f"Error: Input file not found at {input_file}")
        return
    
    # Load parsed restaurants
    with open(input_file, 'r', encoding='utf-8') as f:
        restaurants = json.load(f)
    
    print(f"Cleaning {len(restaurants)} restaurants...")
    
    # Clean each restaurant
    cleaned_restaurants = []
    for i, restaurant in enumerate(restaurants):
        print(f"Cleaning: {restaurant.get('name', 'Unknown')}")
        cleaned_restaurant = clean_restaurant_data(restaurant)
        cleaned_restaurants.append(cleaned_restaurant)
    
    # Save cleaned data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(cleaned_restaurants, f, indent=2, ensure_ascii=False)
    
    # Also copy to app public directory
    with open(app_data_file, 'w', encoding='utf-8') as f:
        json.dump(cleaned_restaurants, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved cleaned data to: {output_file}")
    print(f"Copied to app directory: {app_data_file}")
    
    # Print summary
    cuisines = set(r['cuisine'] for r in cleaned_restaurants)
    price_ranges = set(r['price_range'] for r in cleaned_restaurants)
    neighborhoods = set(r.get('neighborhood', '') for r in cleaned_restaurants if r.get('neighborhood'))
    
    print(f"\nData Summary:")
    print(f"- Total restaurants: {len(cleaned_restaurants)}")
    print(f"- Unique cuisines: {len(cuisines)}")
    print(f"- Price ranges: {sorted(price_ranges)}")
    print(f"- Neighborhoods found: {len(neighborhoods)}")
    
    print(f"\nSample cleaned restaurant:")
    sample = cleaned_restaurants[0]
    print(f"- Name: {sample['name']}")
    print(f"- Cuisine: {sample['cuisine']}")
    print(f"- Price: {sample['price_range']}")
    print(f"- Neighborhood: {sample.get('neighborhood', 'Not found')}")


if __name__ == '__main__':
    main()
