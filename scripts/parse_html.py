#!/usr/bin/env python3
"""
Parse HTML dump from Google Maps list to extract restaurant data.
Extracts: rank, name, rating, review count, price range, cuisine, description, image URL
"""

import json
import re
from bs4 import BeautifulSoup
from pathlib import Path


def parse_restaurant_data(html_file_path: str) -> list:
    """Parse HTML file and extract restaurant data."""
    
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    restaurants = []
    
    # Find all restaurant entries - they're in divs with class "m6QErb XiKgde"
    restaurant_divs = soup.find_all('div', class_='m6QErb XiKgde')
    
    print(f"Found {len(restaurant_divs)} restaurant entries")
    
    for div in restaurant_divs:
        try:
            restaurant = extract_restaurant_from_div(div)
            if restaurant:
                restaurants.append(restaurant)
        except Exception as e:
            print(f"Error parsing restaurant div: {e}")
            continue
    
    return restaurants


def extract_restaurant_from_div(div) -> dict:
    """Extract restaurant data from a single div element."""
    
    restaurant = {}
    
    # Extract rank and name from headline
    headline = div.find('div', class_='fontHeadlineSmall rZF81c')
    if headline:
        headline_text = headline.get_text(strip=True)
        # Extract rank number (e.g., "1. Semma" -> rank: 1, name: "Semma")
        rank_match = re.match(r'^(\d+)\.\s*(.+)$', headline_text)
        if rank_match:
            restaurant['rank'] = int(rank_match.group(1))
            restaurant['name'] = rank_match.group(2)
        else:
            restaurant['name'] = headline_text
            restaurant['rank'] = None
    
    # Extract rating and review count
    rating_span = div.find('span', class_='ZkP5Je')
    if rating_span:
        aria_label = rating_span.get('aria-label', '')
        # Parse "4.2 stars 1,431 Reviews"
        rating_match = re.search(r'(\d+\.\d+)\s+stars\s+([\d,]+)\s+Reviews', aria_label)
        if rating_match:
            restaurant['rating'] = float(rating_match.group(1))
            restaurant['review_count'] = int(rating_match.group(2).replace(',', ''))
    
    # Extract price range and cuisine
    # Look for the IIrLbb div that contains price and cuisine (not rating)
    price_cuisine_divs = div.find_all('div', class_='IIrLbb')
    for price_cuisine_div in price_cuisine_divs:
        spans = price_cuisine_div.find_all('span')
        if len(spans) >= 2:
            first_span_text = spans[0].get_text(strip=True)
            # Check if this is the price/cuisine div (starts with $)
            if first_span_text.startswith('$'):
                restaurant['price_range'] = first_span_text
                # Find cuisine text (skip bullet separator)
                if len(spans) >= 2:
                    # The cuisine is in the second span, after the bullet
                    second_span_text = spans[1].get_text(strip=True)
                    # Remove the bullet and clean up whitespace
                    cuisine_text = second_span_text.replace('·', '').strip()
                    if cuisine_text:
                        restaurant['cuisine'] = cuisine_text
                break
    
    # Extract description
    description_div = div.find('div', class_='u5DVOd fontBodyMedium SwaGS')
    if description_div:
        description_span = description_div.find('span')
        if description_span:
            restaurant['description'] = description_span.get_text(strip=True)
    
    # Extract image URL
    img_tag = div.find('img', class_='WkIe8')
    if img_tag:
        restaurant['image_url'] = img_tag.get('src', '')
    
    return restaurant


def main():
    """Main function to parse HTML and save to JSON."""
    
    # Paths
    html_file = Path(__file__).parent.parent / 'data' / 'list-dump.html'
    output_file = Path(__file__).parent.parent / 'data' / 'restaurants_parsed.json'
    
    if not html_file.exists():
        print(f"Error: HTML file not found at {html_file}")
        return
    
    print(f"Parsing HTML file: {html_file}")
    restaurants = parse_restaurant_data(str(html_file))
    
    print(f"Successfully parsed {len(restaurants)} restaurants")
    
    # Sort by rank
    restaurants.sort(key=lambda x: x.get('rank', 999))
    
    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(restaurants, f, indent=2, ensure_ascii=False)
    
    print(f"Saved parsed data to: {output_file}")
    
    # Print sample entries
    print("\nSample entries:")
    for i, restaurant in enumerate(restaurants[:3]):
        print(f"\n{i+1}. {restaurant.get('name', 'Unknown')}")
        print(f"   Rank: {restaurant.get('rank', 'N/A')}")
        print(f"   Rating: {restaurant.get('rating', 'N/A')}")
        print(f"   Price: {restaurant.get('price_range', 'N/A')}")
        print(f"   Cuisine: {restaurant.get('cuisine', 'N/A')}")


if __name__ == '__main__':
    main()
