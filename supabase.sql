-- Табылды (Tabyldy) — Supabase SQL setup
-- Включает: enum'ы, таблицу animals, индексы, RLS-политики,
-- Storage bucket animal-photos + политики storage.objects,
-- опциональную функцию increment_animal_views.
--
-- Запускать в Supabase SQL editor.

-- gen_random_uuid() requires pgcrypto. Supabase обычно включает его, но на всякий случай:
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping CREATE EXTENSION pgcrypto (insufficient privilege).';
  END;
END
$$;

begin;

-- 1) ENUM types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'animal_type') THEN
    CREATE TYPE public.animal_type AS ENUM ('lost', 'found', 'stray');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'animal_status') THEN
    CREATE TYPE public.animal_status AS ENUM ('active', 'resolved');
  END IF;
END
$$;

-- 2) Table: animals
CREATE TABLE IF NOT EXISTS public.animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.animal_type NOT NULL,
  status public.animal_status NOT NULL DEFAULT 'active',
  species text NOT NULL,
  breed text NULL,
  color text NOT NULL,
  description text NOT NULL,
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  address text NOT NULL,
  photo_url text NOT NULL,
  contact_phone text NOT NULL,
  contact_name text NOT NULL,
  user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  views integer NOT NULL DEFAULT 0,

  CONSTRAINT animals_species_check CHECK (species IN ('dog', 'cat', 'other')),
  CONSTRAINT animals_lat_check CHECK (lat >= -90 AND lat <= 90),
  CONSTRAINT animals_lng_check CHECK (lng >= -180 AND lng <= 180),
  CONSTRAINT animals_views_check CHECK (views >= 0)
);

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS animals_status_created_at_idx ON public.animals (status, created_at DESC);
CREATE INDEX IF NOT EXISTS animals_type_idx ON public.animals (type);
CREATE INDEX IF NOT EXISTS animals_species_idx ON public.animals (species);
CREATE INDEX IF NOT EXISTS animals_views_idx ON public.animals (views DESC);
CREATE INDEX IF NOT EXISTS animals_user_id_idx ON public.animals (user_id);
CREATE INDEX IF NOT EXISTS animals_lat_lng_idx ON public.animals (lat, lng);

-- 4) Row Level Security
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

-- Clean re-create policies (safe to re-run)
DO $$
BEGIN
  -- SELECT active for everyone
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='animals' AND policyname='animals_select_active_public') THEN
    DROP POLICY "animals_select_active_public" ON public.animals;
  END IF;

  -- INSERT authenticated
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='animals' AND policyname='animals_insert_authenticated') THEN
    DROP POLICY "animals_insert_authenticated" ON public.animals;
  END IF;

  -- UPDATE own
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='animals' AND policyname='animals_update_own') THEN
    DROP POLICY "animals_update_own" ON public.animals;
  END IF;

  -- DELETE own
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='animals' AND policyname='animals_delete_own') THEN
    DROP POLICY "animals_delete_own" ON public.animals;
  END IF;

  -- OPTIONAL: SELECT own (including resolved)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='animals' AND policyname='animals_select_own_authenticated') THEN
    DROP POLICY "animals_select_own_authenticated" ON public.animals;
  END IF;
END
$$;

-- Anyone can SELECT only active
CREATE POLICY "animals_select_active_public"
ON public.animals
FOR SELECT
TO public
USING (status = 'active');

-- Authenticated users can INSERT
-- We enforce user_id = auth.uid() so ownership is consistent for UPDATE/DELETE.
CREATE POLICY "animals_insert_authenticated"
ON public.animals
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can UPDATE their own rows
CREATE POLICY "animals_update_own"
ON public.animals
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can DELETE their own rows
CREATE POLICY "animals_delete_own"
ON public.animals
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- OPTIONAL (recommended for /my page): user can SELECT their own rows (including resolved)
-- Uncomment if you want /my to show resolved posts too.
-- CREATE POLICY "animals_select_own_authenticated"
-- ON public.animals
-- FOR SELECT
-- TO authenticated
-- USING (user_id = auth.uid());

-- 5) Storage bucket: animal-photos (public, 5MB)
-- If you prefer using UI, you can skip this block.
DO $$
BEGIN
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'animal-photos') THEN
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'animal-photos',
        'animal-photos',
        true,
        5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/gif']
      );
    ELSE
      UPDATE storage.buckets
      SET public = true,
          file_size_limit = 5242880,
          allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
      WHERE id = 'animal-photos';
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping storage.buckets setup (insufficient privilege). Create bucket via Dashboard > Storage instead.';
  END;
END
$$;

-- Policies for storage.objects
-- В некоторых проектах Supabase не позволяет менять storage.* из SQL Editor (ошибка 42501: must be owner of table objects).
-- Поэтому этот блок сделан "best-effort": если нет прав — скрипт не упадёт, а вы настроите политики через Dashboard.
DO $$
BEGIN
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "animal_photos_public_read" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "animal_photos_authenticated_upload" ON storage.objects';

    EXECUTE '
      CREATE POLICY "animal_photos_public_read"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = ''animal-photos'')
    ';

    EXECUTE '
      CREATE POLICY "animal_photos_authenticated_upload"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = ''animal-photos'')
    ';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping storage.objects policies (insufficient privilege). Configure in Dashboard > Storage > Policies.';
  END;
END
$$;

-- Optional: allow authenticated to update/delete their own uploaded files.
-- (storage.objects has an "owner" column that is set to auth.uid() on upload)
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='animal_photos_owner_update') THEN
--     DROP POLICY "animal_photos_owner_update" ON storage.objects;
--   END IF;
--   IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='animal_photos_owner_delete') THEN
--     DROP POLICY "animal_photos_owner_delete" ON storage.objects;
--   END IF;
-- END
-- $$;
--
-- CREATE POLICY "animal_photos_owner_update"
-- ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'animal-photos' AND owner = auth.uid())
-- WITH CHECK (bucket_id = 'animal-photos' AND owner = auth.uid());
--
-- CREATE POLICY "animal_photos_owner_delete"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'animal-photos' AND owner = auth.uid());

-- 6) Optional RPC: atomic increment of views
-- The frontend calls it if it exists.
CREATE OR REPLACE FUNCTION public.increment_animal_views(animal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.animals
  SET views = COALESCE(views, 0) + 1
  WHERE id = animal_id;
END;
$$;

-- Allow calling RPC for everyone (views increment is not sensitive)
REVOKE ALL ON FUNCTION public.increment_animal_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_animal_views(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_animal_views(uuid) TO authenticated;

commit;
