# PawMap

Lost & found платформа для потерянных, найденных и бездомных животных в Актобе, Казахстан.

## Стек

- React + Vite
- Tailwind CSS
- Supabase (Auth + Database + Storage) — напрямую из фронтенда
- React Router v6
- Leaflet + clustering

## Запуск

1. Установите зависимости:

```bash
npm i
```

2. Заполните переменные окружения в `.env.local`:

```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. Запустите dev-сервер:

```bash
npm run dev
```

## Supabase

### Таблица `animals`

Поля:

- `id` uuid (PK)
- `type` enum: `lost` | `found` | `stray`
- `status` enum: `active` | `resolved`
- `species` text: `dog` | `cat` | `other`
- `breed` text nullable
- `color` text
- `description` text
- `lat` float8
- `lng` float8
- `address` text
- `photo_url` text
- `contact_phone` text
- `contact_name` text
- `user_id` uuid (references `auth.users`, nullable)
- `created_at` timestamptz
- `views` integer default 0

### RLS (Row Level Security)

Рекомендованные политики под UX приложения:

- Public SELECT: только `status = 'active'`
- Authenticated INSERT: любой авторизованный может вставлять
- UPDATE/DELETE: только владелец (`user_id = auth.uid()`)

Примечание: если вы хотите, чтобы пользователь видел свои `resolved` посты на странице `/my`,
добавьте отдельную политику SELECT для владельца.

### Storage

- Bucket: `animal-photos`
- Public
- Лимит файла: 5MB

### Опционально: атомарное увеличение `views`

Фронтенд пытается вызвать RPC `increment_animal_views`, а если его нет — делает best-effort update.
Чтобы сделать увеличение просмотров атомарным, добавьте функцию:

```sql
create or replace function increment_animal_views(animal_id uuid)
returns void
language sql
security definer
as $$
  update animals
  set views = coalesce(views, 0) + 1
  where id = animal_id;
$$;
```

## Страницы

- `/` — главная + CTA + свежие объявления
- `/feed` — лента с фильтрами и пагинацией
- `/map` — карта Актобе с фильтрами и кластерами
- `/post` — пошаговая форма (требует вход)
- `/animal/:id` — детальная карточка + карта + похожие рядом
- `/auth` — вход без письма (анонимный)
- `/my` — мои посты (требует вход)

## Auth (без писем)

Приложение использует анонимный вход Supabase (без email). Включите в Supabase Dashboard:

- Authentication → Providers → Anonymous sign-ins
