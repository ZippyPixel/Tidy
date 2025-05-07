# Tidy Weather App

A modern, responsive weather application built with Vue 3, providing real-time weather information and forecasts with a beautiful user interface.

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

- Vue 3
- Vuex (Pinia)
- Vue Router
- Tailwind CSS
- Chart.js
- Weather API Integration

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## Project Setup

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

3. Create a `.env` file in the root directory and add your Weather API key:
```env
VITE_WEATHER_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Build for production:
```bash
npm run build
# or
yarn build
```

## Project Structure

```
src/
├── assets/          # Static assets (icons, images)
├── components/      # Vue components
│   ├── common/      # Shared components
│   ├── layout/      # Layout components
│   └── weather/     # Weather-specific components
├── constants/       # Application constants
├── stores/          # Pinia stores
├── utils/           # Utility functions
└── App.vue          # Root component
```

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

