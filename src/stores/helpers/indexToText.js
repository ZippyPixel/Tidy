export function airQualityIndex(index){
  if (index == 1){
    return 'Good'
  }
  if (index == 2){
    return 'Moderate'
  }
  if (index == 3 || index == 4){
    return 'Unhealthy'
  }
  if (index == 5){
    return 'Very Unhealthy'
  }
  if (index == 6){
    return 'Hazardous'
  }
}

export function uvIndex(index){
  if (index >= 1 && index <= 2){
    return 'Low'
  }
  if (index >= 3 && index <= 5){
    return 'Moderate'
  }
  if (index >= 6 && index <= 7){
    return 'High'
  }
  if (index >= 8 && index <= 10 ){
    return 'Very High'
  }
  if (index >= 11){
    return 'Extreme'
  }
}