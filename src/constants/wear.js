// What to wear icons (24 × 24 stroke paths from design/TidyWearCard), by reason kind and by
// the id of a thing to carry.
export const WEAR_ICONS = {
  rain: 'M12 3c3.5 4.2 6 7.4 6 10.5a6 6 0 0 1-12 0C6 10.4 8.5 7.2 12 3z',
  snow: 'M12 2v20 M4.9 6l14.2 12 M19.1 6 4.9 18',
  temp: 'M14 14.76V4a2 2 0 1 0-4 0v10.76a4 4 0 1 0 4 0z',
  wind: 'M3 8h11a3 3 0 1 0-3-3 M3 12h15a3 3 0 1 1-3 3 M3 16h7',
  uv: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  swing: 'M8 3v18 M5 6l3-3 3 3 M16 21V3 M13 18l3 3 3-3',
  umbrella: 'M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z M12 12v6.5a2 2 0 0 0 4 0',
  layer: 'M8.5 3 3 6l2 4.5 3-1.2V21h8V9.3l3 1.2L21 6l-5.5-3a3.5 3.5 0 0 1-7 0z',
  water: 'M10 2.5h4 M10 5h4v2l2 3v10.5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10l2-3z',
  sunscreen: 'M9.5 2.5h5v4h-5z M8 6.5h8l1 15H7z M10 12h4',
  // the hanger beside the card title
  hanger:
    'M12 7.5a2 2 0 1 1 2-2c0 1.2-2 1.6-2 3.1 M12 8.6 3 15.4a1.2 1.2 0 0 0 .7 2.1h16.6a1.2 1.2 0 0 0 .7-2.1L12 8.6z'
}

export const wearIcon = (k) => WEAR_ICONS[k] || WEAR_ICONS.temp

// a window's sky reads as grey: the street gets more cloud
export const CLOUDY_KINDS = ['cloudy', 'rain', 'storm', 'snow', 'fog']
