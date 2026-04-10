import L from 'leaflet'

export function markerColor(type) {
  if (type === 'lost') return '#E85D26'
  if (type === 'found') return '#2D6A4F'
  return '#F4A261'
}

export function animalDivIcon(type) {
  const color = markerColor(type)

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background: ${color};
        border: 3px solid rgba(255,255,255,0.95);
        box-shadow: 0 10px 18px -12px rgba(26,26,26,0.35);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}
