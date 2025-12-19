#!/usr/bin/env python3
"""
Parse NYM restaurant list from text file.
Extracts restaurant name, address, and website from the formatted text.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional


def extract_restaurant_name(title_line: str) -> Optional[str]:
    """Extract restaurant name from title line (e.g., 'Thai Diner Is a Sexy Mess' -> 'Thai Diner')."""
    # Common patterns: "X Is Y", "X's Y", "X Has Y", "X Adds Y", etc.
    # Split on common verbs that come after the restaurant name
    patterns = [
        r'^(.+?)\s+Is\s+',
        r'^(.+?)\'s\s+',
        r'^(.+?)\s+Has\s+',
        r'^(.+?)\s+Deserves\s+',
        r'^(.+?)\s+Adds\s+',
        r'^(.+?)\s+Brought\s+',
        r'^(.+?)\s+Overcomes\s+',
        r'^(.+?)\s+Feels\s+',
        r'^(.+?)\s+Leads\s+',
        r'^(.+?)\s+Is\s+',
        r'^(.+?)\s+Sits\s+',
        r'^(.+?)\s+Makes\s+',
        r'^(.+?)\s+Just\s+',
    ]
    
    for pattern in patterns:
        match = re.match(pattern, title_line, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            # Clean up common prefixes/suffixes
            name = name.replace("'s", "").strip()
            return name
    
    # Fallback: return the whole line if no pattern matches
    return title_line.strip()


def extract_address_and_website(text: str) -> tuple[Optional[str], Optional[str]]:
    """Extract address and website from the end of a paragraph."""
    # Pattern: address ends with semicolon, then website or phone
    # Examples:
    # "129 E. 60th St.; lvdnyc.com"
    # "186 Mott St.; thaidiner.com"
    # "Multiple locations; maxisnoodle.com"
    # "24-19 Steinway St., Astoria; 718-274-3474"
    
    # Look for the pattern: address; website at the very end
    # The address should be the last thing before the semicolon
    # We need to find text that ends with a street pattern, then semicolon, then website
    
    # First, try to find semicolon near the end
    semicolon_pos = text.rfind(';')
    if semicolon_pos == -1:
        return None, None
    
    # Extract everything after the semicolon (website/phone)
    after_semicolon = text[semicolon_pos + 1:].strip()
    if not after_semicolon:
        return None, None
    
    # Extract everything before the semicolon
    before_semicolon = text[:semicolon_pos].strip()
    
    # Now find the address pattern in the text before the semicolon
    # Address patterns: number + street name + optional neighborhood
    # Address should start with a number followed by space/letter (not $ or other punctuation)
    # and end with St/Ave/etc.
    address_patterns = [
        r'(\d+\s+[A-Z][\w\s\.,\-\']*St\.?[^;]*)$',  # Street - starts with number, space, then capital letter
        r'(\d+\s+[A-Z][\w\s\.,\-\']*Ave\.?[^;]*)$',  # Avenue
        r'(\d+\s+[A-Z][\w\s\.,\-\']*Blvd\.?[^;]*)$',  # Boulevard
        r'(\d+\s+[A-Z][\w\s\.,\-\']*Pl\.?[^;]*)$',  # Place
        r'(\d+\s+[A-Z][\w\s\.,\-\']*Rd\.?[^;]*)$',  # Road
        r'(\d+\s+[A-Z][\w\s\.,\-\']*Dr\.?[^;]*)$',  # Drive
        r'(\d+\s+[A-Z][\w\s\.,\-\']*Way[^;]*)$',  # Way
        r'(\d+-\d+\s+[\w\s\.,\-\']+St\.?[^;]*)$',  # Street with dash in number (e.g., "24-19")
        r'(\d+-\d+\s+[\w\s\.,\-\']+Ave\.?[^;]*)$',  # Avenue with dash
        r'(Multiple locations)$',  # Multiple locations
    ]
    
    # Find the address at the end of the before_semicolon text
    # We want the address pattern that's closest to the semicolon
    best_match = None
    best_match_end = -1
    
    for pattern in address_patterns:
        # Find all matches and take the one closest to the semicolon
        for match in re.finditer(pattern, before_semicolon):
            match_end = match.end()
            match_text = match.group(1).strip()
            # Verify it's a valid address (starts with number or "Multiple", contains street type)
            if (match_text.startswith(('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Multiple')) and
                ('St' in match_text or 'Ave' in match_text or 'Blvd' in match_text or 
                 'Pl' in match_text or 'Rd' in match_text or 'Dr' in match_text or 
                 'Way' in match_text or match_text.startswith('Multiple'))):
                if match_end > best_match_end:
                    best_match_end = match_end
                    best_match = match_text
    
    if best_match:
        address = best_match.strip()
        address = re.sub(r'\s+', ' ', address)  # Normalize whitespace
        
        # Check if website_or_phone is a phone number
        if re.match(r'^\d+[-.\s]?\d+[-.\s]?\d+', after_semicolon):
            return address, None
        else:
            # It's a website
            website = after_semicolon
            if not website.startswith('http'):
                if '.' in website:
                    website = 'https://' + website
            return address, website
    
    return None, None


def parse_nym_list(file_path: str) -> List[Dict]:
    """Parse NYM list text file and extract restaurant data."""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    restaurants = []
    current_restaurant = None
    nym_rank = 0
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines
        if not line:
            i += 1
            continue
        
        # Check if this is a title line (restaurant name with descriptor)
        # Title lines are typically short and don't start with common sentence starters
        if (len(line) < 100 and 
            not line[0].islower() and 
            ('Is ' in line or "'s " in line or 'Has ' in line or 
             'Deserves' in line or 'Adds' in line or 'Brought' in line or
             'Overcomes' in line or 'Feels' in line or 'Leads' in line or
             'Sits' in line or 'Makes' in line or 'Just' in line)):
            
            # Extract restaurant name
            name = extract_restaurant_name(line)
            
            # Start new restaurant entry
            if current_restaurant:
                restaurants.append(current_restaurant)
            
            nym_rank += 1
            current_restaurant = {
                'nym_rank': nym_rank,
                'name': name,
                'title_line': line,
                'description': '',
                'address': None,
                'website': None
            }
            
            # Look ahead for description and address/website
            description_lines = []
            i += 1
            full_text = ''
            
            # Collect description lines until we find address/website pattern
            while i < len(lines):
                next_line = lines[i].strip()
                if not next_line:
                    i += 1
                    continue
                
                full_text += ' ' + next_line
                
                # Check if this line (or accumulated text) contains address pattern
                address, website = extract_address_and_website(full_text.strip())
                if address:
                    current_restaurant['address'] = address
                    current_restaurant['website'] = website
                    # Remove address and website from description
                    # Find where the address starts in the text - look for the pattern before semicolon
                    # We need to find the position where the address pattern begins
                    # Try to find the last occurrence of a pattern that matches our address
                    address_match = re.search(r'(' + re.escape(address.split(',')[0].strip()) + r'[^;]*);', full_text)
                    if address_match:
                        description_text = full_text[:address_match.start()].strip()
                        if description_text:
                            description_lines = [description_text]
                    else:
                        # Fallback: just remove the address from the end
                        address_pos = full_text.rfind(address.split(',')[0].strip())
                        if address_pos >= 0:
                            description_text = full_text[:address_pos].strip()
                            if description_text:
                                description_lines = [description_text]
                    break
                
                description_lines.append(next_line)
                i += 1
            
            # Join description lines
            if description_lines:
                current_restaurant['description'] = ' '.join(description_lines)
        
        i += 1
    
    # Don't forget the last restaurant
    if current_restaurant:
        restaurants.append(current_restaurant)
    
    return restaurants


def main():
    """Main function to parse NYM list and save to JSON."""
    
    input_file = Path(__file__).parent.parent / 'data' / 'nym-list.txt'
    output_file = Path(__file__).parent.parent / 'data' / 'nym_restaurants_raw.json'
    
    if not input_file.exists():
        print(f"Error: Input file not found at {input_file}")
        return
    
    print(f"Parsing NYM list from: {input_file}")
    restaurants = parse_nym_list(str(input_file))
    
    print(f"Successfully parsed {len(restaurants)} restaurants")
    
    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(restaurants, f, indent=2, ensure_ascii=False)
    
    print(f"Saved parsed data to: {output_file}")
    
    # Print sample entries for verification
    print("\nSample entries:")
    for i, restaurant in enumerate(restaurants[:5]):
        print(f"\n{i+1}. {restaurant['name']}")
        print(f"   Rank: {restaurant['nym_rank']}")
        print(f"   Address: {restaurant.get('address', 'N/A')}")
        print(f"   Website: {restaurant.get('website', 'N/A')}")
        print(f"   Description preview: {restaurant['description'][:100]}...")


if __name__ == '__main__':
    main()

