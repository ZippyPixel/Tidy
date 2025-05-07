/**
 * Converts air quality index to descriptive text
 * @param {number} index - Air quality index (1-6)
 * @returns {string} Descriptive text for air quality
 */
export function airQualityIndex(index) {
  if (index == 1) {
    return 'Good'
  }
  if (index == 2) {
    return 'Moderate'
  }
  if (index == 3 || index == 4) {
    return 'Unhealthy'
  }
  if (index == 5) {
    return 'Very Unhealthy'
  }
  if (index == 6) {
    return 'Hazardous'
  }
}

/**
 * Converts UV index to descriptive text
 * @param {number} index - UV index value
 * @returns {string} Descriptive text for UV index
 */
export function uvIndex(index) {
  if (index >= 1 && index <= 2) {
    return 'Low'
  }
  if (index >= 3 && index <= 5) {
    return 'Moderate'
  }
  if (index >= 6 && index <= 7) {
    return 'High'
  }
  if (index >= 8 && index <= 10) {
    return 'Very High'
  }
  if (index >= 11) {
    return 'Extreme'
  }
}

/**
 * Formats temperature with degree symbol
 * @param {number} temp - Temperature value
 * @returns {string} Formatted temperature with degree symbol
 */
export function formatTemperature(temp) {
  return `${Math.ceil(temp)}°`
}

/**
 * Formats chance of rain with percentage symbol
 * @param {number} chance - Chance of rain value
 * @returns {string} Formatted chance of rain with percentage symbol
 */
export function formatChanceOfRain(chance) {
  return `${chance}%`
} 