# WeatherAPI.com Forecast Response Reference

Reference for the weather API response shape consumed by this app (WeatherAPI.com
`forecast.json` endpoint, with AQI and alerts enabled). Captured 2026-07-15 for
Chhota Magbazar, Bangladesh. All temperatures come in both `_c` and `_f` variants.

## Top-level structure

```json
{
  "location": { ... },
  "current": { ... },
  "forecast": { "forecastday": [ { ... }, { ... }, { ... } ] },
  "alerts": { "alert": [] }
}
```

- `forecast.forecastday` — one entry per day (3 days here). Each entry has
  `date`, `date_epoch`, `day` (daily aggregates), `astro`, and `hour`
  (24 hourly entries, all sharing the same shape — see sample below).

## `location`

```json
{
  "name": "Chhota Magbazar",
  "region": "",
  "country": "Bangladesh",
  "lat": 23.783,
  "lon": 90.4,
  "tz_id": "Asia/Dhaka",
  "localtime_epoch": 1784109179,
  "localtime": "2026-07-15 15:52"
}
```

## `current`

```json
{
  "last_updated_epoch": 1784107800,
  "last_updated": "2026-07-15 15:30",
  "temp_c": 31.1,
  "temp_f": 88,
  "is_day": 1,
  "condition": {
    "text": "Patchy rain nearby",
    "icon": "//cdn.weatherapi.com/weather/64x64/day/176.png",
    "code": 1063
  },
  "wind_mph": 11.4,
  "wind_kph": 18.4,
  "wind_degree": 148,
  "wind_dir": "SSE",
  "pressure_mb": 1000,
  "pressure_in": 29.54,
  "precip_mm": 0.01,
  "precip_in": 0,
  "humidity": 69,
  "cloud": 67,
  "feelslike_c": 37.5,
  "feelslike_f": 99.5,
  "windchill_c": 31.1,
  "windchill_f": 88,
  "heatindex_c": 37.4,
  "heatindex_f": 99.2,
  "dewpoint_c": 24.7,
  "dewpoint_f": 76.5,
  "vis_km": 10,
  "vis_miles": 6,
  "uv": 3.7,
  "gust_mph": 14,
  "gust_kph": 22.6,
  "will_it_rain": 0,
  "chance_of_rain": 12,
  "will_it_snow": 0,
  "chance_of_snow": 0,
  "air_quality": {
    "co": 302,
    "no2": 10.5,
    "o3": 97,
    "so2": 4.8,
    "pm2_5": 11.1,
    "pm10": 11.8,
    "us-epa-index": 1,
    "gb-defra-index": 1
  }
}
```

Notes:
- `condition.icon` is protocol-relative (`//cdn.weatherapi.com/...`).
- `air_quality["us-epa-index"]` is 1 (Good) … 6 (Hazardous).

## `forecast.forecastday[n].day` (daily aggregates)

Day 1 (2026-07-15) shown; days differ only in values:

```json
{
  "maxtemp_c": 31.3, "maxtemp_f": 88.4,
  "mintemp_c": 26.8, "mintemp_f": 80.3,
  "avgtemp_c": 28.9, "avgtemp_f": 84,
  "maxwind_mph": 13, "maxwind_kph": 20.9,
  "totalprecip_mm": 0.66, "totalprecip_in": 0.03,
  "totalsnow_cm": 0,
  "avgvis_km": 10, "avgvis_miles": 6,
  "avghumidity": 80,
  "daily_will_it_rain": 0,
  "daily_chance_of_rain": 49,
  "daily_will_it_snow": 0,
  "daily_chance_of_snow": 0,
  "condition": {
    "text": "Patchy rain nearby",
    "icon": "//cdn.weatherapi.com/weather/64x64/day/176.png",
    "code": 1063
  },
  "uv": 7.8
}
```

Captured values for the other two days:

| date       | maxtemp_c | mintemp_c | avgtemp_c | daily_chance_of_rain | condition          |
| ---------- | --------- | --------- | --------- | -------------------- | ------------------ |
| 2026-07-15 | 31.3      | 26.8      | 28.9      | 49                   | Patchy rain nearby |
| 2026-07-16 | 31.2      | 26.5      | 28.7      | 83                   | Light rain shower  |
| 2026-07-17 | 31.8      | 26.3      | 28.5      | 85                   | Patchy rain nearby |

## `forecast.forecastday[n].astro`

```json
{
  "sunrise": "05:20 AM",
  "sunset": "06:48 PM",
  "moonrise": "05:41 AM",
  "moonset": "07:37 PM",
  "moon_phase": "New Moon",
  "moon_illumination": 3,
  "is_moon_up": 1,
  "is_sun_up": 1
}
```

Times are 12-hour strings with AM/PM. `moon_phase` is a label
(e.g. "New Moon", "Waxing Crescent"); `moon_illumination` is 0–100.

## `forecast.forecastday[n].hour[m]` (hourly — 24 per day)

All hourly entries have this exact shape; only values vary:

```json
{
  "time_epoch": 1784052000,
  "time": "2026-07-15 00:00",
  "temp_c": 27.4,
  "temp_f": 81.4,
  "is_day": 0,
  "condition": {
    "text": "Partly Cloudy",
    "icon": "//cdn.weatherapi.com/weather/64x64/night/116.png",
    "code": 1003
  },
  "wind_mph": 9.4,
  "wind_kph": 15.1,
  "wind_degree": 154,
  "wind_dir": "SSE",
  "pressure_mb": 1001,
  "pressure_in": 29.57,
  "precip_mm": 0,
  "precip_in": 0,
  "snow_cm": 0,
  "humidity": 88,
  "cloud": 37,
  "feelslike_c": 32,
  "feelslike_f": 89.6,
  "windchill_c": 27.4,
  "windchill_f": 81.4,
  "heatindex_c": 32.4,
  "heatindex_f": 90.2,
  "dewpoint_c": 25.3,
  "dewpoint_f": 77.6,
  "will_it_rain": 0,
  "chance_of_rain": 16,
  "will_it_snow": 0,
  "chance_of_snow": 0,
  "vis_km": 10,
  "vis_miles": 6,
  "gust_mph": 13.8,
  "gust_kph": 22.2,
  "uv": 0
}
```

Differences from the daily `day` object: hourly has `time`/`time_epoch`,
`is_day`, `snow_cm`, and per-hour `chance_of_rain`; no `avg*`/`max*`/`total*`
aggregate fields.

## `alerts`

```json
{ "alert": [] }
```

Empty array when there are no active weather alerts.

## How the app consumes this (src/stores/weather.js `setValues`)

- **location** → `"${location.name}, ${location.country}"`.
- **date/day** → parsed from `current.last_updated` (`"2026-07-15 15:30"` → date part).
- **condition** → `current.condition.text`.
- **chanceOfRain** → `forecast.forecastday[0].day.daily_chance_of_rain`
  (NOT `current.chance_of_rain`).
- **rawTemperature** → `current.temp_c/f`, `current.feelslike_c/f`, plus
  `forecastday[0].day.maxtemp_c/f` and `mintemp_c/f`; C/F selection happens
  in the `temperature` getter via the unit store.
- **astro** → `forecastday[0].astro` sunrise/sunset/moonrise/moonset
  (PlanetaryInfo). `moon_phase`/`moon_illumination` are unused.
- **basicWeatherInfo** → `current.humidity`, `vis_km`, `pressure_mb`,
  `uv` (mapped to Low/Moderate/High/Very High/Extreme), and
  `air_quality["us-epa-index"]` (mapped to Good/Moderate/Unhealthy/…).
- **dailySummary** (DailyChart) → per `forecastday[n].date`:
  `{ hours, tempDataC, tempDataF }` from `hour[]` — hour labels are generated
  from the array index via `formatTime(index)`, not from the API `time` field.
- **forecast** (WeatherForecast) → raw `forecastday[]`; selecting a day
  (`setSelectedForecastDate`) re-derives condition, chanceOfRain, max/min
  temps, and astro from that day's entry.
- Wind, pressure_in, dewpoint, gust, cloud, alerts, and all `will_it_*`
  fields are currently unused by the app.

## Condition codes (from https://www.weatherapi.com/docs/)

Machine-readable source: https://www.weatherapi.com/docs/weather_conditions.json
(also available as `.csv` and `.xml`). 60 conditions total.

Key facts for mapping:

- **Map by `condition.code`, never by `condition.text`** — the live API text can
  differ from the docs list (e.g. code 1063 returns "Patchy rain nearby" but the
  docs list it as "Patchy rain possible"), and text is localized by the `lang`
  parameter. Codes are stable.
- Icon URL pattern: `//cdn.weatherapi.com/weather/64x64/{day|night}/{icon}.png`
  where the folder is picked by the `is_day` field of the same object.
- Day and night text are identical for every code except **1000**
  (day "Sunny" / night "Clear").

### Full code table

| Code | Text (day)                               | Icon # |
| ---- | ---------------------------------------- | ------ |
| 1000 | Sunny (night: Clear)                     | 113    |
| 1003 | Partly cloudy                            | 116    |
| 1006 | Cloudy                                   | 119    |
| 1009 | Overcast                                 | 122    |
| 1012 | Haze                                     | 125    |
| 1015 | Dust haze                                | 128    |
| 1018 | Blowing dust                             | 131    |
| 1021 | Dust storm                               | 134    |
| 1024 | Sandstorm                                | 137    |
| 1027 | Severe sandstorm                         | 140    |
| 1030 | Mist                                     | 143    |
| 1033 | Smoke                                    | 146    |
| 1036 | Smoky haze                               | 149    |
| 1039 | Smog                                     | 152    |
| 1042 | Severe smog                              | 155    |
| 1045 | Saharan dust                             | 158    |
| 1048 | Dust                                     | 161    |
| 1063 | Patchy rain possible                     | 176    |
| 1066 | Patchy snow possible                     | 179    |
| 1069 | Patchy sleet possible                    | 182    |
| 1072 | Patchy freezing drizzle possible         | 185    |
| 1087 | Thundery outbreaks possible              | 200    |
| 1114 | Blowing snow                             | 227    |
| 1117 | Blizzard                                 | 230    |
| 1135 | Fog                                      | 248    |
| 1147 | Freezing fog                             | 260    |
| 1150 | Patchy light drizzle                     | 263    |
| 1153 | Light drizzle                            | 266    |
| 1168 | Freezing drizzle                         | 281    |
| 1171 | Heavy freezing drizzle                   | 284    |
| 1180 | Patchy light rain                        | 293    |
| 1183 | Light rain                               | 296    |
| 1186 | Moderate rain at times                   | 299    |
| 1189 | Moderate rain                            | 302    |
| 1192 | Heavy rain at times                      | 305    |
| 1195 | Heavy rain                               | 308    |
| 1198 | Light freezing rain                      | 311    |
| 1201 | Moderate or heavy freezing rain          | 314    |
| 1204 | Light sleet                              | 317    |
| 1207 | Moderate or heavy sleet                  | 320    |
| 1210 | Patchy light snow                        | 323    |
| 1213 | Light snow                               | 326    |
| 1216 | Patchy moderate snow                     | 329    |
| 1219 | Moderate snow                            | 332    |
| 1222 | Patchy heavy snow                        | 335    |
| 1225 | Heavy snow                               | 338    |
| 1237 | Ice pellets                              | 350    |
| 1240 | Light rain shower                        | 353    |
| 1243 | Moderate or heavy rain shower            | 356    |
| 1246 | Torrential rain shower                   | 359    |
| 1249 | Light sleet showers                      | 362    |
| 1252 | Moderate or heavy sleet showers          | 365    |
| 1255 | Light snow showers                       | 368    |
| 1258 | Moderate or heavy snow showers           | 371    |
| 1261 | Light showers of ice pellets             | 374    |
| 1264 | Moderate or heavy showers of ice pellets | 377    |
| 1273 | Patchy light rain with thunder           | 386    |
| 1276 | Moderate or heavy rain with thunder      | 389    |
| 1279 | Patchy light snow with thunder           | 392    |
| 1282 | Moderate or heavy snow with thunder      | 395    |

### Suggested grouping for short titles / icons / themes

The 60 codes collapse into ~10 visual groups. Lucide icon suggestions use the
day/night split from `is_day` where a variant exists (AppIcon.vue registry
would need these icons added).

| Group        | Codes                                                    | Short title | Lucide icon (day / night)   | Theme hint          |
| ------------ | -------------------------------------------------------- | ----------- | --------------------------- | ------------------- |
| Clear        | 1000                                                     | Clear       | `sun` / `moon`              | bright / warm       |
| Partly cloudy| 1003                                                     | Partly Cloudy | `cloud-sun` / `cloud-moon` | soft blue           |
| Cloudy       | 1006, 1009                                               | Cloudy      | `cloud` / `cloudy`          | muted gray-blue     |
| Fog & haze   | 1012, 1030, 1033, 1036, 1039, 1042, 1135, 1147           | Foggy       | `cloud-fog` / `haze`        | desaturated gray    |
| Dust & sand  | 1015, 1018, 1021, 1024, 1027, 1045, 1048                 | Dusty       | `wind` / `haze`             | sandy/amber         |
| Drizzle      | 1063, 1072, 1150, 1153, 1168, 1171                       | Drizzle     | `cloud-drizzle`             | light blue-gray     |
| Rain         | 1180, 1183, 1186, 1189, 1240                             | Rain        | `cloud-rain`                | blue-gray           |
| Heavy rain   | 1192, 1195, 1198, 1201, 1243, 1246                       | Heavy Rain  | `cloud-rain-wind`           | dark blue-gray      |
| Snow & sleet | 1066, 1069, 1114, 1204, 1207, 1210–1225, 1249–1258       | Snow        | `cloud-snow` / `snowflake`  | cool white/ice blue |
| Blizzard/ice | 1117, 1237, 1261, 1264                                   | Ice         | `cloud-hail`                | icy steel blue      |
| Thunder      | 1087, 1273, 1276, 1279, 1282                             | Thunderstorm | `cloud-lightning` / `zap`  | dark/stormy purple  |

Implemented: `src/constants/weatherIcons.js` maps all 60 codes to the SVGs in
`src/assets/weather-icons/` via `getWeatherIcon(code, isDay)` (day/night
variants for clear/partly cloudy/mist/showers; partly-cloudy fallback for
unknown codes). The weather store saves `conditionCode` and `isDay` from
`current`, and `setSelectedForecastDate` re-derives them from the selected
day. Consumed by BasicWeatherInfo (current condition) and WeatherForecast
(per-day icons, always day variant). Icon inventory: 8030067 sun, 8030068 moon,
8030069 cloud, 8030070 cloud+wind, 8030071 fog, 8030072/73 sun/moon mist,
8030074 heavy rain, 8030075 thunderstorm, 8030076/77 partly cloudy day/night,
8030080/81 sun/moon rain shower, 8030082 snow, 8030087 light rain, 8030088
sleet/mixed, 8030089 heavy snow. Unused spares: 8030078/79 (sun/moon cloud
wind), 8030083–8030086 (sun/moon with small cloud).
