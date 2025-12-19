#!/usr/bin/env python3
"""
Deduplicate restaurants by place_id.
When duplicates are found, merge their data intelligently.
"""

import json
from pathlib import Path
from typing import Dict, List, Set
from collections import defaultdict


def merge_restaurant_data(restaurants: List[Dict]) -> Dict:
    """Merge multiple restaurant entries into one, combining sources and data."""
    
    if not restaurants:
        return {}
    
    if len(restaurants) == 1:
        return restaurants[0].copy()
    
    # Start with the first restaurant as base
    merged = restaurants[0].copy()
    
    # Combine sources from all entries
    all_sources = set()
    for r in restaurants:
        sources = r.get('sources', [])
        if isinstance(sources, list):
            all_sources.update(sources)
        elif sources:
            all_sources.add(sources)
    merged['sources'] = sorted(list(all_sources))
    
    # Keep the best rank values
    nyt_ranks = [r.get('nyt_rank') for r in restaurants if r.get('nyt_rank')]
    nym_ranks = [r.get('nym_rank') for r in restaurants if r.get('nym_rank')]
    
    if nyt_ranks:
        merged['nyt_rank'] = min(nyt_ranks)  # Keep the best (lowest) rank
    if nym_ranks:
        merged['nym_rank'] = min(nym_ranks)
    
    # Calculate combined_order based on best rank
    if merged.get('nyt_rank'):
        merged['combined_order'] = merged['nyt_rank']
    elif merged.get('nym_rank'):
        merged['combined_order'] = 100 + merged['nym_rank']
    else:
        merged['combined_order'] = 999
    
    # Merge other fields - prefer non-null values, and prefer more complete data
    for r in restaurants[1:]:
        # Prefer entries with more complete data
        for field in ['name', 'description', 'formatted_address', 'website', 'phone', 
                     'google_maps_url', 'cuisine', 'price_range', 'image_url']:
            if not merged.get(field) and r.get(field):
                merged[field] = r[field]
        
        # Prefer higher ratings
        if r.get('rating') and (not merged.get('rating') or r.get('rating') > merged.get('rating')):
            merged['rating'] = r['rating']
            merged['google_rating'] = r.get('google_rating', r['rating'])
        
        # Prefer higher review counts
        if r.get('review_count') and (not merged.get('review_count') or r.get('review_count') > merged.get('review_count')):
            merged['review_count'] = r['review_count']
            merged['google_review_count'] = r.get('google_review_count', r['review_count'])
        
        # Merge coordinates if missing
        if not merged.get('latitude') and r.get('latitude'):
            merged['latitude'] = r['latitude']
            merged['longitude'] = r['longitude']
        
        # Merge opening hours if missing
        if not merged.get('opening_hours') and r.get('opening_hours'):
            merged['opening_hours'] = r['opening_hours']
            merged['is_open_now'] = r.get('is_open_now')
        
        # Keep the most recent last_updated
        if r.get('last_updated') and (not merged.get('last_updated') or r.get('last_updated') > merged.get('last_updated')):
            merged['last_updated'] = r['last_updated']
    
    return merged


def deduplicate_restaurants(restaurants: List[Dict]) -> List[Dict]:
    """Deduplicate restaurants by place_id."""
    
    # Group restaurants by place_id
    by_place_id = defaultdict(list)
    no_place_id = []
    
    for restaurant in restaurants:
        place_id = restaurant.get('place_id')
        if place_id:
            by_place_id[place_id].append(restaurant)
        else:
            # For restaurants without place_id, use name+address as key
            name = restaurant.get('name', '').lower().strip()
            address = restaurant.get('formatted_address', '').lower().strip()
            key = f"{name}::{address}" if name and address else f"no-place-id-{len(no_place_id)}"
            by_place_id[key].append(restaurant)
    
    # Merge duplicates
    deduplicated = []
    duplicates_found = []
    
    for place_id, group in by_place_id.items():
        if len(group) > 1:
            duplicates_found.append({
                'place_id': place_id,
                'count': len(group),
                'names': [r.get('name') for r in group]
            })
            merged = merge_restaurant_data(group)
            deduplicated.append(merged)
        else:
            deduplicated.append(group[0].copy())
    
    # Sort by combined_order
    deduplicated.sort(key=lambda x: x.get('combined_order', 999))
    
    return deduplicated, duplicates_found


def main():
    """Main function to deduplicate restaurants."""
    
    input_file = Path(__file__).parent.parent / 'data' / 'restaurants_enriched_nym.json'
    output_file = Path(__file__).parent.parent / 'public' / 'data' / 'restaurants.json'
    
    if not input_file.exists():
        print(f"Error: Input file not found at {input_file}")
        return
    
    # Load restaurants
    print(f"Loading restaurants from: {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        restaurants = json.load(f)
    
    print(f"Loaded {len(restaurants)} restaurants")
    
    # Deduplicate
    deduplicated, duplicates = deduplicate_restaurants(restaurants)
    
    print(f"\n✅ Deduplicated to {len(deduplicated)} restaurants")
    
    if duplicates:
        print(f"\n⚠️  Found {len(duplicates)} groups of duplicates:")
        for dup in duplicates[:10]:  # Show first 10
            print(f"  - {dup['place_id']}: {dup['count']} entries")
            for name in dup['names']:
                print(f"    • {name}")
        if len(duplicates) > 10:
            print(f"  ... and {len(duplicates) - 10} more")
    else:
        print("\n✅ No duplicates found")
    
    # Save deduplicated data
    print(f"\n💾 Saving to: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(deduplicated, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(deduplicated)} restaurants to {output_file}")


if __name__ == '__main__':
    main()

