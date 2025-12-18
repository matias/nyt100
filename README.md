# NYT Top 100 NYC Restaurants

A React/Next.js application for exploring and filtering the New York Times' top 100 restaurants in New York City, featuring an interactive map and comprehensive filtering options.

## Features

- **Interactive Map**: View restaurants on a Mapbox-powered map with markers color-coded by price range
- **Comprehensive Filtering**: Filter by search query, price range, cuisine type, neighborhood, proximity, and opening hours
- **Restaurant List**: Browse restaurants with detailed information including ratings, reviews, and descriptions
- **Responsive Design**: Works on desktop and mobile devices
- **Data Enrichment**: Python scripts to parse HTML data and enrich with Google Places API

## Project Structure

```
nyt100/
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
│   ├── parse_html.py           # Parse HTML dump to JSON
│   ├── enrich_with_places_api.py # Enrich with Google Places API
│   └── update_restaurant_data.py # Update data script
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

## Data Processing

### Parse HTML Data (Already Complete)
The HTML dump has been parsed into `data/restaurants_parsed.json` with the following information:
- Rank, name, rating, review count
- Price range, cuisine type, description
- Image URL

### Enrich with Google Places API (Optional)
To add location data, opening hours, and contact information:

```bash
python scripts/enrich_with_places_api.py
```

This will create `data/restaurants_enriched.json` with additional data:
- Place ID, coordinates, formatted address
- Opening hours, website, phone number
- Google Maps URL

**Note:** This requires a Google Places API key and may incur costs based on API usage.

## Usage

### Filtering Restaurants
- **Search**: Type restaurant names, cuisines, or descriptions
- **Price Range**: Select one or more price ranges ($1–10, $10–20, etc.)
- **Cuisine**: Filter by cuisine type (Italian, Korean, etc.)
- **Neighborhood**: Filter by NYC neighborhoods
- **Near Me**: Sort by distance from your location (requires location permission)
- **Open for Lunch**: Filter by lunch hours (requires enriched data)

### Map Interaction
- **Markers**: Color-coded by price range (red=$100+, orange=$50-100, green=$25-50, blue=other)
- **Click Markers**: View restaurant details in popup
- **Select Restaurant**: Click on list items to highlight on map
- **Auto-fit**: Map automatically adjusts to show all filtered results

## Development

### Adding New Features
1. Update TypeScript types in `types/restaurant.ts`
2. Modify components in `components/`
3. Update filtering logic in `app/page.tsx`

### Data Updates
1. Update `data/list-dump.html` with new restaurant data
2. Run `python scripts/parse_html.py` to parse new data
3. Optionally run `python scripts/enrich_with_places_api.py` for enrichment
4. Copy updated JSON to `app/public/data/`

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Mapping**: Mapbox GL JS, react-map-gl
- **Data Processing**: Python, BeautifulSoup, Google Places API
- **Deployment**: Vercel-ready

## License

This project is for educational purposes. Restaurant data is sourced from the New York Times.
