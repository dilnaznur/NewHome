import { Marker, useMapEvents } from 'react-leaflet'
import { animalDivIcon } from './markers'

export function ClickToSetMarker({ value, onChange, type }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  if (!value?.lat || !value?.lng) return null

  return <Marker position={[value.lat, value.lng]} icon={animalDivIcon(type)} />
}
