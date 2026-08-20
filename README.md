# Tidy Weather App

A modern, responsive weather application built with Nuxt 4, providing real-time weather information and forecasts with a beautiful user interface.

## Features

- 🌍 **Location-based Weather**: Automatically detects user location for instant weather updates
- 📅 **7-Day Forecast**: View detailed weather forecasts for the upcoming week
- 🌡️ **Temperature Tracking**: Monitor current, maximum, and minimum temperatures
- 🌤️ **Weather Conditions**: Real-time weather conditions with descriptive icons
- 🌅 **Planetary Information**: Track sunrise, sunset, moonrise, and moonset times
- 📊 **Weather Charts**: Visual representation of temperature trends
- 💧 **Precipitation Data**: Chance of rain and humidity information
- 🌫️ **Air Quality**: Current air quality index and UV index
- 🎨 **Modern UI**: Clean, responsive design with smooth animations
- ⚡ **Loading States**: Elegant loading animations with shimmer effects
- 🔄 **Real-time Updates**: Dynamic data updates with smooth transitions

## Tech Stack

- Nuxt 4 (Vue 3, SSR) with a Nitro server layer
- Pinia
- vue-i18n (English / Bangla)
- Tailwind CSS + shadcn-vue (reka-ui)
- unovis charts
- WeatherAPI.com integration, proxied server-side

## Prerequisites

- Node.js 22.19+ or 24+ (Nuxt 4 requirement — see `.nvmrc`)
- npm or yarn
- Git
- WeatherAPI.com account and API key

## Getting Started

### 1. Get Your Weather API Key

1. Visit [WeatherAPI.com](https://www.weatherapi.com/)
2. Click on "Sign Up" to create a free account
3. After signing up, you'll be redirected to your dashboard
4. Your API key will be displayed on the dashboard

### 2. Project Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tidy-weather.git
cd tidy-weather
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy the `example.env` file to create a new `.env` file:
   ```bash
   cp example.env .env
   ```
   - Open the `.env` file and set `NUXT_WEATHER_API_KEY` to your WeatherAPI.com key
   - `NUXT_WEATHER_API_BASE` is optional — it defaults to the WeatherAPI v1 URL and
     only needs setting to point at a mock or a proxy

   These are read only by the Nitro routes in `server/api/` and are never sent to
   the browser. The client talks to `/api/forecast` and `/api/search` instead.

4. Start the development server (http://localhost:3000):
```bash
npm run dev
```

5. Build and run for production:
```bash
npm run build
npm run preview
```

`npm run build` produces a Node server in `.output/`. Because the API key is read at
runtime, the deploy target must supply `NUXT_WEATHER_API_KEY` as an environment
variable. `npm run generate` (fully static) will not work — the `/api/*` routes need
a running server.

## Project Structure

```
server/
├── api/             # Nitro routes that proxy WeatherAPI (hold the API key)
└── utils/           # Shared server helpers
src/
├── assets/          # Static assets (icons, images) and global CSS
├── components/      # Vue components
│   ├── common/      # Shared components
│   ├── layout/      # Layout components
│   ├── ui/          # Generated shadcn-vue components
│   └── weather/     # Weather-specific components
├── constants/       # Application constants
├── i18n/            # vue-i18n setup and en/bn message catalogues
├── layouts/         # Nuxt layouts
├── mixins/          # Intl-based formatting helpers
├── pages/           # Nuxt file-based routes
├── plugins/         # Nuxt plugins (theme + locale bootstrap)
├── stores/          # Pinia stores
├── utils/           # Utility functions
└── app.vue          # Root component
```

Nuxt's `srcDir` points at `src/`, so the `@`/`~` aliases resolve there.

## Component Overview

- `AppHeader`: Location search and navigation
- `WeatherForecast`: 7-day weather forecast display
- `BasicWeatherInfo`: Current weather conditions and metrics
- `PlanetaryInfo`: Sunrise, sunset, and moon phase information
- `DailyChart`: Temperature trend visualization
- `LoadingOverlay`: Global loading state management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

