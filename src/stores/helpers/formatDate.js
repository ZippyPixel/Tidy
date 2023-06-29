
  export function dateToName (date){
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ]
    const days = [
      'Friday',
      'Saturday',
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
    ]
    const YYYYMMDD_array = date.split("-") // "2023-05-07" => ['2023', '05', '07']
    const dateObject = new Date(...YYYYMMDD_array)

    const dayIndex = dateObject.getDay()
    const justDate = YYYYMMDD_array[2]
    const monthName = months[YYYYMMDD_array[1]-1]
    const dayName = days[dayIndex]
    
    return `${dayName}, ${monthName} ${justDate}`
  }
