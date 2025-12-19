#!/usr/bin/env python3
"""
Merge NYT and NYM restaurant lists.
Matches restaurants by name and address, adds source tags, and calculates combined_order.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional


def normalize_name(name: str) -> str:
    """Normalize restaurant name for matching."""
    if not name:
        return ""
    # Convert to lowercase, remove extra spaces, remove common punctuation
    normalized = name.lower().strip()
    # Remove common punctuation that might differ
    normalized = re.sub(r'[^\w\s]', '', normalized)
    # Remove extra whitespace
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized


def normalize_address(address: str) -> str:
    """Normalize address for matching."""
    if not address:
        return ""
    # Convert to lowercase, remove extra spaces
    normalized = address.lower().strip()
    # Standardize common abbreviations
    normalized = re.sub(r'\bstreet\b', 'st', normalized)
    normalized = re.sub(r'\bavenue\b', 'ave', normalized)
    normalized = re.sub(r'\bboulevard\b', 'blvd', normalized)
    normalized = re.sub(r'\bplace\b', 'pl', normalized)
    normalized = re.sub(r'\broad\b', 'rd', normalized)
    normalized = re.sub(r'\bdrive\b', 'dr', normalized)
    # Remove common punctuation
    normalized = re.sub(r'[^\w\s]', '', normalized)
    # Remove extra whitespace
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized


def find_matching_restaurant(nym_restaurant: Dict, nyt_restaurants: List[Dict]) -> Optional[int]:
    """Find matching NYT restaurant by name and address. Returns index if found."""
    
    nym_name = normalize_name(nym_restaurant.get('name', ''))
    nym_address = normalize_address(nym_restaurant.get('address', ''))
    
    if not nym_name:
        return None
    
    best_match_idx = None
    best_match_score = 0
    
    for idx, nyt_restaurant in enumerate(nyt_restaurants):
        nyt_name = normalize_name(nyt_restaurant.get('name', ''))
        nyt_address = normalize_address(nyt_restaurant.get('formatted_address', ''))
        
        # Name match (exact or fuzzy)
        name_match = False
        if nym_name == nyt_name:
            name_match = True
        elif nym_name in nyt_name or nyt_name in nym_name:
            # Partial match
            name_match = True
        
        if not name_match:
            continue
        
        # Address match (if both have addresses)
        address_match = False
        if nym_address and nyt_address:
            # Check if addresses are similar
            if nym_address == nyt_address:
                address_match = True
            elif nym_address in nyt_address or nyt_address in nym_address:
                # Partial match
                address_match = True
            # Extract street number and name for better matching
            nym_street_match = re.search(r'(\d+)\s+([\w\s]+)', nym_address)
            nyt_street_match = re.search(r'(\d+)\s+([\w\s]+)', nyt_address)
            if nym_street_match and nyt_street_match:
                if (nym_street_match.group(1) == nyt_street_match.group(1) and
                    nym_street_match.group(2).strip()[:10] == nyt_street_match.group(2).strip()[:10]):
                    address_match = True
        elif not nym_address or not nyt_address:
            # If one doesn't have address, still consider it a match if name matches well
            address_match = True
        
        # Calculate match score
        score = 0
        if name_match:
            score += 10
            if nym_name == nyt_name:
                score += 5  # Exact name match
        if address_match:
            score += 10
            if nym_address == nyt_address:
                score += 5  # Exact address match
        
        if score > best_match_score:
            best_match_score = score
            best_match_idx = idx
    
    # Require at least name match
    if best_match_score >= 10:
        return best_match_idx
    
    return None


def merge_restaurant_lists(nyt_restaurants: List[Dict], nym_restaurants: List[Dict]) -> List[Dict]:
    """Merge NYT and NYM restaurant lists."""
    
    merged = []
    matched_nym_indices = set()
    
    # First, process all NYT restaurants and add NYT source
    for nyt_restaurant in nyt_restaurants:
        restaurant = nyt_restaurant.copy()
        restaurant['sources'] = ['NYT']
        restaurant['nyt_rank'] = restaurant.get('rank')
        # Keep rank for backward compatibility
        merged.append(restaurant)
    
    # Then, try to match NYM restaurants with existing ones
    for nym_restaurant in nym_restaurants:
        match_idx = find_matching_restaurant(nym_restaurant, merged)
        
        if match_idx is not None:
            # Found a match - add NYM source to existing restaurant
            merged[match_idx]['sources'].append('NYM')
            merged[match_idx]['nym_rank'] = nym_restaurant.get('nym_rank')
            # Update address if NYM has one and NYT doesn't
            if not merged[match_idx].get('formatted_address') and nym_restaurant.get('address'):
                merged[match_idx]['formatted_address'] = nym_restaurant['address']
            # Update website if NYM has one and NYT doesn't
            if not merged[match_idx].get('website') and nym_restaurant.get('website'):
                merged[match_idx]['website'] = nym_restaurant['website']
        else:
            # No match - create new restaurant entry
            new_restaurant = {
                'name': nym_restaurant.get('name'),
                'sources': ['NYM'],
                'nym_rank': nym_restaurant.get('nym_rank'),
                'formatted_address': nym_restaurant.get('address'),
                'website': nym_restaurant.get('website'),
                'description': nym_restaurant.get('description', ''),
                # Set defaults for other fields
                'rank': None,  # Will be set by combined_order
                'rating': None,
                'review_count': None,
                'price_range': None,
                'cuisine': None,
                'image_url': None,
            }
            merged.append(new_restaurant)
    
    # Calculate combined_order for all restaurants
    for restaurant in merged:
        if 'NYT' in restaurant.get('sources', []):
            # NYT restaurants use their NYT rank
            restaurant['combined_order'] = restaurant.get('nyt_rank', 999)
        elif 'NYM' in restaurant.get('sources', []):
            # NYM-only restaurants use 100 + their NYM rank
            restaurant['combined_order'] = 100 + restaurant.get('nym_rank', 999)
        else:
            # Fallback (shouldn't happen)
            restaurant['combined_order'] = 999
    
    # Sort by combined_order
    merged.sort(key=lambda x: x.get('combined_order', 999))
    
    return merged


def main():
    """Main function to merge restaurant lists."""
    
    nyt_file = Path(__file__).parent.parent / 'data' / 'restaurants_parsed.json'
    nym_file = Path(__file__).parent.parent / 'data' / 'nym_restaurants_raw.json'
    output_file = Path(__file__).parent.parent / 'data' / 'restaurants_merged.json'
    
    if not nyt_file.exists():
        print(f"Error: NYT file not found at {nyt_file}")
        print("Run parse_html.py first to create restaurants_parsed.json")
        return
    
    if not nym_file.exists():
        print(f"Error: NYM file not found at {nym_file}")
        print("Run parse_nym_list.py first to create nym_restaurants_raw.json")
        return
    
    # Load NYT restaurants
    with open(nyt_file, 'r', encoding='utf-8') as f:
        nyt_restaurants = json.load(f)
    
    # Load NYM restaurants
    with open(nym_file, 'r', encoding='utf-8') as f:
        nym_restaurants = json.load(f)
    
    print(f"Loaded {len(nyt_restaurants)} NYT restaurants")
    print(f"Loaded {len(nym_restaurants)} NYM restaurants")
    
    # Merge lists
    merged_restaurants = merge_restaurant_lists(nyt_restaurants, nym_restaurants)
    
    print(f"\nMerged into {len(merged_restaurants)} total restaurants")
    
    # Count statistics
    nyt_only = sum(1 for r in merged_restaurants if r.get('sources') == ['NYT'])
    nym_only = sum(1 for r in merged_restaurants if r.get('sources') == ['NYM'])
    both = sum(1 for r in merged_restaurants if len(r.get('sources', [])) == 2)
    
    print(f"  NYT only: {nyt_only}")
    print(f"  NYM only: {nym_only}")
    print(f"  Both: {both}")
    
    # Save merged data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged_restaurants, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved merged data to: {output_file}")
    
    # Print sample matches
    print("\nSample matches:")
    both_restaurants = [r for r in merged_restaurants if len(r.get('sources', [])) == 2]
    for i, restaurant in enumerate(both_restaurants[:5]):
        print(f"{i+1}. {restaurant['name']} - Sources: {restaurant['sources']}")


if __name__ == '__main__':
    main()

