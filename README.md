# NYT 100 Best Restaurants

![Status](https://img.shields.io/badge/status-maintenance%20mode-orange)

A simple way to visualize and filter the New York Times' 100 best restaurants list in a dedicated web app. Explore restaurants on an interactive map, filter by cuisine, price range, neighborhood, and more.

This app is deployed at https://nyt100.vercel.app, feel free to use it there!

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Mapbox API key (required)
- Google Places API key (optional, for data enrichment scripts)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the `app` directory (see `.env.example` for reference):

```bash
# Required: Mapbox API token for the interactive map
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Optional: Google Places API key (for data enrichment scripts)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

### Obtaining API Keys

#### Mapbox API Key (Required)

1. Sign up for a free account at [mapbox.com](https://account.mapbox.com/)
2. Navigate to [Access Tokens](https://account.mapbox.com/access-tokens/)
3. Create a new access token or use the default public token
4. Copy the token and add it to your `.env.local` file as `NEXT_PUBLIC_MAPBOX_TOKEN`

#### Google Places API Key (Optional)

The Google Places API key is only needed if you plan to run the data enrichment scripts. The app itself works with pre-processed data.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the [Places API (New)](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)
4. Go to [Credentials](https://console.cloud.google.com/apis/credentials) and create an API key
5. (Recommended) Restrict the API key to only the Places API
6. Add the key to your `.env.local` file as `GOOGLE_PLACES_API_KEY`

**Note:** Google Places API usage may incur costs. Check the [pricing page](https://developers.google.com/maps/documentation/places/web-service/pricing) for details.

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Features

- **Interactive Map**: View all restaurants on a Mapbox-powered map with clickable markers
- **Advanced Filtering**: Filter by search query, price range, cuisine type, neighborhood, and more
- **Restaurant Details**: View ratings, reviews, descriptions, and location information
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Project Structure

- `components/` - React components (MapboxMap, RestaurantList, FilterPanel)
- `types/` - TypeScript type definitions
- `public/data/` - Restaurant data JSON files
- `app/` - Next.js app router pages and layout

## Build for Production

```bash
npm run build
npm start
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
