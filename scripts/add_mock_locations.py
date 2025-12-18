#!/usr/bin/env python3
"""
Add mock location data to restaurants for testing the map functionality.
This provides approximate coordinates for NYC neighborhoods mentioned in descriptions.
"""

import json
import random
from pathlib import Path
from typing import Dict, List


# Approximate coordinates for NYC neighborhoods
NEIGHBORHOOD_COORDS = {
    "Manhattan": (40.7831, -73.9712),
    "Brooklyn": (40.6782, -73.9442),
    "Queens": (40.7282, -73.7949),
    "Bronx": (40.8448, -73.8648),
    "Staten Island": (40.5795, -74.1502),
    "West Village": (40.7358, -74.0036),
    "East Village": (40.7282, -73.9857),
    "Greenwich Village": (40.7336, -74.0027),
    "SoHo": (40.7231, -74.0026),
    "NoMad": (40.7484, -73.9857),
    "Midtown": (40.7549, -73.9840),
    "Downtown": (40.7074, -74.0113),
    "Upper West Side": (40.7870, -73.9754),
    "Upper East Side": (40.7736, -73.9566),
    "Chinatown": (40.7158, -73.9970),
    "Little Italy": (40.7189, -73.9969),
    "Koreatown": (40.7505, -73.9934),
    "Harlem": (40.8075, -73.9626),
    "Chelsea": (40.7505, -74.0018),
    "Greenpoint": (40.7336, -73.9507),
    "Williamsburg": (40.7081, -73.9571),
    "Fort Greene": (40.6892, -73.9742),
    "Prospect Heights": (40.6746, -73.9708),
    "Bushwick": (40.6944, -73.9212),
    "Red Hook": (40.6754, -74.0077),
    "Sunset Park": (40.6455, -74.0124),
    "Bensonhurst": (40.6018, -73.9944),
    "Flushing": (40.7675, -73.8331),
    "Jackson Heights": (40.7556, -73.8854),
    "Elmhurst": (40.7365, -73.8776),
    "Astoria": (40.7698, -73.9215),
    "Long Island City": (40.7448, -73.9485),
    "Bedford-Stuyvesant": (40.6834, -73.9389),
    "Crown Heights": (40.6681, -73.9448),
    "Park Slope": (40.6612, -73.9986),
    "Bay Ridge": (40.6254, -74.0304),
    "Sheepshead Bay": (40.5868, -73.9543),
    "JFK": (40.6413, -73.7781),
    "Times Square": (40.7580, -73.9855),
    "Financial District": (40.7074, -74.0113),
}


def get_coordinates_for_restaurant(restaurant: Dict) -> tuple:
    """Get approximate coordinates for a restaurant based on its description."""
    
    description = restaurant.get('description', '').lower()
    name = restaurant.get('name', '').lower()
    
    # Check for specific neighborhood mentions
    for neighborhood, coords in NEIGHBORHOOD_COORDS.items():
        if neighborhood.lower() in description or neighborhood.lower() in name:
            # Add some random variation to avoid clustering
            lat_offset = random.uniform(-0.01, 0.01)
            lng_offset = random.uniform(-0.01, 0.01)
            return (coords[0] + lat_offset, coords[1] + lng_offset)
    
    # Check for borough mentions
    if 'manhattan' in description or 'manhattan' in name:
        base_coords = NEIGHBORHOOD_COORDS['Manhattan']
    elif 'brooklyn' in description or 'brooklyn' in name:
        base_coords = NEIGHBORHOOD_COORDS['Brooklyn']
    elif 'queens' in description or 'queens' in name:
        base_coords = NEIGHBORHOOD_COORDS['Queens']
    elif 'bronx' in description or 'bronx' in name:
        base_coords = NEIGHBORHOOD_COORDS['Bronx']
    elif 'staten island' in description or 'staten island' in name:
        base_coords = NEIGHBORHOOD_COORDS['Staten Island']
    else:
        # Default to Manhattan center with random variation
        base_coords = NEIGHBORHOOD_COORDS['Manhattan']
    
    # Add random variation
    lat_offset = random.uniform(-0.02, 0.02)
    lng_offset = random.uniform(-0.02, 0.02)
    return (base_coords[0] + lat_offset, base_coords[1] + lng_offset)


def add_mock_locations(restaurants: List[Dict]) -> List[Dict]:
    """Add mock location data to restaurants."""
    
    for restaurant in restaurants:
        if not restaurant.get('latitude') and not restaurant.get('longitude'):
            lat, lng = get_coordinates_for_restaurant(restaurant)
            restaurant['latitude'] = round(lat, 6)
            restaurant['longitude'] = round(lng, 6)
            
            # Add a mock formatted address
            if not restaurant.get('formatted_address'):
                # Extract neighborhood from description or use Manhattan
                neighborhood = "Manhattan"
                for n in NEIGHBORHOOD_COORDS.keys():
                    if n.lower() in restaurant.get('description', '').lower():
                        neighborhood = n
                        break
                
                restaurant['formatted_address'] = f"{restaurant['name']}, {neighborhood}, New York, NY"
            
            # Add mock place_id
            if not restaurant.get('place_id'):
                restaurant['place_id'] = f"mock_{restaurant['rank']:03d}"
    
    return restaurants


def main():
    """Main function to add mock locations."""
    
    # Paths
    input_file = Path(__file__).parent.parent / 'data' / 'restaurants_cleaned.json'
    output_file = Path(__file__).parent.parent / 'data' / 'restaurants_with_locations.json'
    app_data_file = Path(__file__).parent.parent / 'app' / 'public' / 'data' / 'restaurants_parsed.json'
    
    if not input_file.exists():
        print(f"Error: Input file not found at {input_file}")
        return
    
    # Load cleaned restaurants
    with open(input_file, 'r', encoding='utf-8') as f:
        restaurants = json.load(f)
    
    print(f"Adding mock locations to {len(restaurants)} restaurants...")
    
    # Add mock locations
    restaurants_with_locations = add_mock_locations(restaurants)
    
    # Save data with locations
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(restaurants_with_locations, f, indent=2, ensure_ascii=False)
    
    # Copy to app directory
    with open(app_data_file, 'w', encoding='utf-8') as f:
        json.dump(restaurants_with_locations, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved data with locations to: {output_file}")
    print(f"Copied to app directory: {app_data_file}")
    
    # Print summary
    with_locations = sum(1 for r in restaurants_with_locations if r.get('latitude'))
    print(f"\nRestaurants with location data: {with_locations}/{len(restaurants_with_locations)}")
    
    print(f"\nSample restaurant with location:")
    sample = restaurants_with_locations[0]
    print(f"- Name: {sample['name']}")
    print(f"- Address: {sample.get('formatted_address', 'N/A')}")
    print(f"- Coordinates: {sample.get('latitude', 'N/A')}, {sample.get('longitude', 'N/A')}")


if __name__ == '__main__':
    main()
