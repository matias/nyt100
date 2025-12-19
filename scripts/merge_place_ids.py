#!/usr/bin/env python3
"""
Merge place_ids from original enriched data into merged restaurant data.
This ensures all NYT restaurants have their place_ids preserved.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional


def normalize_name(name: str) -> str:
    """Normalize restaurant name for matching."""
    if not name:
        return ""
    normalized = name.lower().strip()
    normalized = name.replace("'", "'").replace("'", "'")  # Handle different apostrophes
    normalized = name.replace("&", "and")
    # Remove common punctuation
    normalized = normalized.replace(".", "").replace(",", "")
    # Remove extra whitespace
    normalized = " ".join(normalized.split())
    return normalized


def find_matching_restaurant(restaurant: Dict, enriched_restaurants: List[Dict]) -> Optional[Dict]:
    """Find matching restaurant in enriched data by name and address."""
    
    name = normalize_name(restaurant.get('name', ''))
    address = restaurant.get('formatted_address', '')
    
    if not name:
        return None
    
    # Try exact name match first
    for enriched in enriched_restaurants:
        enriched_name = normalize_name(enriched.get('name', ''))
        if name == enriched_name:
            return enriched
    
    # Try partial match
    for enriched in enriched_restaurants:
        enriched_name = normalize_name(enriched.get('name', ''))
        if name in enriched_name or enriched_name in name:
            # Also check address if available
            if address and enriched.get('formatted_address'):
                if address.lower() in enriched.get('formatted_address', '').lower() or \
                   enriched.get('formatted_address', '').lower() in address.lower():
                    return enriched
            else:
                return enriched
    
    return None


def merge_place_ids(merged_file: Path, enriched_file: Path, output_file: Path):
    """Merge place_ids from enriched data into merged data."""
    
    # Load merged restaurants
    with open(merged_file, 'r', encoding='utf-8') as f:
        merged_restaurants = json.load(f)
    
    # Load original enriched restaurants
    with open(enriched_file, 'r', encoding='utf-8') as f:
        enriched_restaurants = json.load(f)
    
    print(f"Loaded {len(merged_restaurants)} merged restaurants")
    print(f"Loaded {len(enriched_restaurants)} enriched restaurants")
    
    # Create a lookup by name for faster matching
    enriched_lookup = {}
    for enriched in enriched_restaurants:
        name = normalize_name(enriched.get('name', ''))
        if name:
            if name not in enriched_lookup:
                enriched_lookup[name] = []
            enriched_lookup[name].append(enriched)
    
    updated_count = 0
    missing_count = 0
    
    # Update merged restaurants with place_ids from enriched data
    for restaurant in merged_restaurants:
        # Skip if already has place_id
        if restaurant.get('place_id'):
            continue
        
        # Only update NYT restaurants (they should have place_ids from original data)
        if 'NYT' not in restaurant.get('sources', []):
            continue
        
        # Find matching enriched restaurant
        match = find_matching_restaurant(restaurant, enriched_restaurants)
        
        if match and match.get('place_id'):
            # Copy place_id and other enriched fields if missing
            restaurant['place_id'] = match.get('place_id')
            
            if not restaurant.get('google_rating') and match.get('google_rating'):
                restaurant['google_rating'] = match.get('google_rating')
                restaurant['rating'] = match.get('google_rating')
            
            if not restaurant.get('google_review_count') and match.get('google_review_count'):
                restaurant['google_review_count'] = match.get('google_review_count')
                restaurant['review_count'] = match.get('google_review_count')
            
            if not restaurant.get('latitude') and match.get('latitude'):
                restaurant['latitude'] = match.get('latitude')
                restaurant['longitude'] = match.get('longitude')
            
            if not restaurant.get('opening_hours') and match.get('opening_hours'):
                restaurant['opening_hours'] = match.get('opening_hours')
            
            if not restaurant.get('website') and match.get('website'):
                restaurant['website'] = match.get('website')
            
            if not restaurant.get('phone') and match.get('phone'):
                restaurant['phone'] = match.get('phone')
            
            if not restaurant.get('google_maps_url') and match.get('google_maps_url'):
                restaurant['google_maps_url'] = match.get('google_maps_url')
            
            updated_count += 1
        else:
            missing_count += 1
            print(f"  ⚠️  No place_id found for: {restaurant.get('name')} (NYT restaurant)")
    
    print(f"\n✅ Updated {updated_count} restaurants with place_ids")
    if missing_count > 0:
        print(f"⚠️  {missing_count} NYT restaurants still missing place_ids")
    
    # Save updated data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged_restaurants, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Saved updated data to: {output_file}")


def main():
    """Main function to merge place_ids."""
    
    # Paths
    merged_file = Path(__file__).parent.parent / 'data' / 'restaurants_enriched_nym.json'
    enriched_file = Path(__file__).parent.parent / 'public' / 'data' / 'restaurants_parsed.json'
    output_file = Path(__file__).parent.parent / 'data' / 'restaurants_enriched_nym.json'
    
    if not merged_file.exists():
        print(f"Error: Merged file not found at {merged_file}")
        print("Run merge_restaurant_lists.py and enrich_nym_restaurants.py first")
        return
    
    if not enriched_file.exists():
        print(f"Error: Enriched file not found at {enriched_file}")
        return
    
    merge_place_ids(merged_file, enriched_file, output_file)


if __name__ == '__main__':
    main()

