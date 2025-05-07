/**
 * Converts a date string in YYYY-MM-DD format to a formatted string with day name and month
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string (e.g., "Monday, Jan 15")
 */
export function dateToName(date) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ]
  const YYYYMMDD_array = date.split("-") // "2023-05-07" => ['2023', '05', '07']
  const dateObject = new Date(...YYYYMMDD_array)

  const dayIndex = dateObject.getDay()
  const justDate = YYYYMMDD_array[2]
  const monthName = months[YYYYMMDD_array[1]-1]
  const dayName = days[dayIndex]
  
  return `${dayName}, ${monthName} ${justDate}`
}

/**
 * Converts a 24-hour time to 12-hour format with AM/PM
 * @param {number} hour - Hour in 24-hour format (0-23)
 * @returns {string} Time in 12-hour format with AM/PM
 */
export function convertToAMPM(hour) {
  if (hour === 0) {
    return '12 am'
  } else if (hour === 12) {
    return '12 pm'
  } else if (hour > 12) {
    return `${hour - 12} pm`
  } else {
    return `${hour} am`
  }
} 