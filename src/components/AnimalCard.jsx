import { Link } from 'react-router-dom'
import { Badge } from './ui/Badge'
import { daysAgo, getDistrict, speciesIcon } from '../lib/format'

export function AnimalCard({ animal }) {
  const district = getDistrict(animal.address)

  return (
    <Link
      to={`/animal/${animal.id}`}
      className="card group mb-4 block break-inside-avoid overflow-hidden transition hover:-translate-y-1 hover:shadow"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
        {animal.photo_url ? (
          <img
            src={animal.photo_url}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl">🐾</div>
        )}
        <div className="absolute left-3 top-3">
          <Badge kind={animal.type} />
        </div>
      </div>

      <div className="p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-extrabold">
            <span className="mr-2">{speciesIcon(animal.species)}</span>
            {animal.species === 'dog' ? 'Собака' : animal.species === 'cat' ? 'Кошка' : 'Другое'}
          </div>
          <div className="text-xs text-black/60">{daysAgo(animal.created_at)}</div>
        </div>

        <div className="mt-1 text-xs text-black/60">
          {district ? `${district} • ` : ''}{animal.color}
        </div>

        <div className="mt-2 max-h-11 overflow-hidden text-sm text-black/80">{animal.description}</div>

        <div className="mt-3 flex items-center justify-between text-xs text-black/60">
          <div>{district || 'Актобе'}</div>
          <div>👁 {animal.views ?? 0}</div>
        </div>
      </div>
    </Link>
  )
}
