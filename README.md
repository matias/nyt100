# Top NYC Restaurants

A React/Next.js application for exploring and filtering the New York Times's and New York Magazine's best restaurants in New York City, featuring an interactive map and comprehensive filtering options.

## Features

- **Interactive Map**: View restaurants on a Mapbox-powered map with markers color-coded by price range
- **Comprehensive Filtering**: Filter by search query, borough, opening hours, and publication source (NYT/NYM)
- **Dual Source Support**: Combines restaurants from both New York Times and New York Magazine lists
- **Restaurant List**: Browse restaurants with detailed information including ratings, reviews, and descriptions
- **Source Indicators**: Visual icons show which publication(s) featured each restaurant
- **Responsive Design**: Works on desktop and mobile devices
- **Data Enrichment**: Python scripts to parse and merge data from multiple sources and enrich with Google Places API

## Project Structure

```
root/
├── app/                          # Next.js application
│   ├── components/              # React components
│   │   ├── MapboxMap.tsx        # Interactive map component
│   │   ├── RestaurantList.tsx   # Restaurant list display
│   │   └── FilterPanel.tsx     # Filtering controls
│   ├── types/                   # TypeScript type definitions
│   │   └── restaurant.ts        # Restaurant data types
│   ├── public/data/             # Restaurant data files
│   └── ...
├── scripts/                     # Python data processing scripts
│   ├── parse_html.py           # Parse NYT HTML dump to JSON
│   ├── parse_nym_list.py       # Parse NYM text file to JSON
│   ├── merge_restaurant_lists.py # Merge NYT and NYM lists
│   ├── enrich_with_places_api.py # Enrich NYT restaurants with Places API
│   ├── enrich_nym_restaurants.py # Enrich NYM restaurants with Places API
│   ├── merge_place_ids.py      # Merge place_ids from original data
│   ├── update_restaurant_data.py # Update all restaurant data from Places API
│   └── deduplicate_restaurants.py # Deduplicate by place_id and create final data
├── data/                       # Raw and processed data
│   ├── list-dump.html          # HTML dump from Google Maps
│   └── restaurants_parsed.json # Parsed restaurant data
└── requirements.txt            # Python dependencies
```

## Setup Instructions

### 1. Install Dependencies

**For the Next.js app:**
```bash
cd app
npm install
```

**For Python scripts:**
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `app` directory:

```bash
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Google Places API Configuration (optional, for data enrichment)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

**Get your Mapbox token:**
1. Sign up at [mapbox.com](https://account.mapbox.com/access-tokens/)
2. Create a new access token
3. Add it to your `.env.local` file

**Get your Google Places API key (optional):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable the Places API (New)
3. Create an API key
4. Add it to your `.env.local` file

### 3. Run the Application

```bash
cd app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Data Processing Scripts

### Script Overview

The project includes several Python scripts for processing restaurant data:

#### Parsing Scripts
- **`parse_html.py`** - Parses HTML dump from Google Maps list to extract NYT restaurant data (rank, name, rating, price, cuisine, description, image URL). Outputs to `data/restaurants_parsed.json`.

- **`parse_nym_list.py`** - Parses the New York Magazine restaurant list text file (`data/nym-list.txt`) to extract restaurant names and addresses. Outputs to `data/nym_restaurants_raw.json` for verification.

#### Merging Scripts
- **`merge_restaurant_lists.py`** - Merges NYT and NYM restaurant lists by matching restaurants by name and address. Adds source tags (`sources: ["NYT"]`, `["NYM"]`, or `["NYT", "NYM"]`) and calculates `combined_order`. Outputs to `data/restaurants_merged.json`.

- **`merge_place_ids.py`** - Merges place_ids from original enriched NYT data into merged restaurant data. Ensures all NYT restaurants have their place_ids preserved. Updates `data/restaurants_enriched_nym.json`.

#### Enrichment Scripts
- **`enrich_with_places_api.py`** - Enriches NYT restaurants with Google Places API data (place_id, coordinates, hours, website, phone). Outputs to `data/restaurants_enriched.json`.

- **`enrich_nym_restaurants.py`** - Enriches NYM-only restaurants (those without place_ids) with Google Places API data. Outputs to `data/restaurants_enriched_nym.json`.

- **`update_restaurant_data.py`** - Updates all restaurant data using stored place_ids. Refreshes dynamic data (hours, phone, website, rating) and updates descriptions from Google Places API `editorialSummary`. Reads from `data/restaurants_enriched_nym.json` if available, otherwise `data/restaurants_enriched.json`.

#### Cleanup Scripts
- **`deduplicate_restaurants.py`** - Deduplicates restaurants by `place_id`, merging duplicate entries intelligently (combines sources, keeps best ranks, merges fields). Outputs final data to `public/data/restaurants.json`.

- **`clean_restaurant_data.py`** - Legacy script for cleaning restaurant data (may not be needed with current workflow).

- **`add_mock_locations.py`** - Legacy script for adding mock location data (may not be needed with current workflow).

### Data Processing Workflow

#### Initial Setup (First Time)
1. **Parse NYT data:**
   ```bash
   python scripts/parse_html.py
   ```
   Creates: `data/restaurants_parsed.json`

2. **Enrich NYT restaurants:**
   ```bash
   python scripts/enrich_with_places_api.py
   ```
   Creates: `data/restaurants_enriched.json`

3. **Parse NYM data:**
   ```bash
   python scripts/parse_nym_list.py
   ```
   Creates: `data/nym_restaurants_raw.json` (verify this looks correct)

4. **Merge NYT and NYM lists:**
   ```bash
   python scripts/merge_restaurant_lists.py
   ```
   Creates: `data/restaurants_merged.json`

5. **Enrich NYM restaurants:**
   ```bash
   python scripts/enrich_nym_restaurants.py
   ```
   Updates: `data/restaurants_enriched_nym.json`

6. **Merge place_ids from original data:**
   ```bash
   python scripts/merge_place_ids.py
   ```
   Updates: `data/restaurants_enriched_nym.json`

7. **Update all descriptions from Places API:**
   ```bash
   python scripts/update_restaurant_data.py
   ```
   Updates: `data/restaurants_enriched_nym.json`

8. **Deduplicate and create final data:**
   ```bash
   python scripts/deduplicate_restaurants.py
   ```
   Creates: `public/data/restaurants.json` (this is what the app uses)

#### When Input Files Are Updated

**If `data/nym-list.txt` is updated:**
```bash
python scripts/parse_nym_list.py
python scripts/merge_restaurant_lists.py
python scripts/enrich_nym_restaurants.py
python scripts/merge_place_ids.py
python scripts/update_restaurant_data.py
python scripts/deduplicate_restaurants.py
```

**If `data/list-dump.html` (NYT data) is updated:**
```bash
python scripts/parse_html.py
python scripts/enrich_with_places_api.py
python scripts/merge_restaurant_lists.py
python scripts/enrich_nym_restaurants.py
python scripts/merge_place_ids.py
python scripts/update_restaurant_data.py
python scripts/deduplicate_restaurants.py
```

**To refresh all data from Places API (update descriptions, hours, etc.):**
```bash
python scripts/update_restaurant_data.py
python scripts/deduplicate_restaurants.py
```

**Note:** All scripts require a Google Places API key in `.env.local` (except parsing scripts). The API may incur costs based on usage.

## Usage

### Filtering Restaurants
- **Search**: Type restaurant names, cuisines, or descriptions
- **Publication Source**: Filter by NYT, NYM, or both (default: both)
- **Borough**: Filter by NYC boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- **Open for Lunch**: Filter restaurants open during lunch hours (12pm-2pm)

### Map Interaction
- **Markers**: Click markers to view restaurant details
- **Select Restaurant**: Click on list items to highlight on map
- **Auto-fit**: Map automatically adjusts to show all filtered results

### Restaurant List
- **Source Icons**: Icons next to restaurant names indicate publication source (NYT/NYM)
- **Opening Hours**: Click "Hours" to expand/collapse opening hours
- **Links**: Direct links to restaurant websites and Google Maps

## Development

### Adding New Features
1. Update TypeScript types in `types/restaurant.ts`
2. Modify components in `components/`
3. Update filtering logic in `app/page.tsx`

### Data Updates
See the "Data Processing Workflow" section above for detailed instructions on updating data when input files change.

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Mapping**: Mapbox GL JS, react-map-gl
- **Data Processing**: Python, BeautifulSoup, Google Places API
- **Deployment**: Vercel-ready

## License

See LICENSE file.
Restaurant names and rankings are sourced from the New York Times and New York Magazine; details and descriptions from the Google Places API.
