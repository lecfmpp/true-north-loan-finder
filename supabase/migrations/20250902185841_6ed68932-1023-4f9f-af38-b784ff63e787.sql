
-- Normalize document_files JSON arrays to storage keys for existing rows
-- This does NOT change schemas or policies. It only rewrites values.

-- Helper comment:
-- For each array item:
-- - If it's a full URL, strip Supabase Storage prefixes and keep the filename
-- - If it's already applications/..., keep as-is
-- - If it's a bare filename or any path, convert to applications/{filename}

-- Canadian applications
UPDATE public.canadian_applications
SET document_files = COALESCE((
  SELECT jsonb_agg(
    (
      WITH v AS (
        SELECT value_txt AS raw
        FROM (
          SELECT value AS value_txt
          FROM jsonb_array_elements_text(document_files::jsonb)
        ) s
      )
      SELECT
        CASE
          WHEN raw ~* '^https?://' THEN
            'applications/' || split_part(raw, '/', array_length(string_to_array(raw, '/'), 1))
          WHEN raw LIKE 'applications/%' THEN
            raw
          WHEN raw LIKE '%/%' THEN
            'applications/' || split_part(raw, '/', array_length(string_to_array(raw, '/'), 1))
          ELSE
            'applications/' || raw
        END
      FROM v
    )
  )
), '[]'::jsonb)::json
WHERE document_files IS NOT NULL
  AND jsonb_typeof(document_files::jsonb) = 'array';

-- USA applications (full form)
UPDATE public.usa_applications
SET document_files = COALESCE((
  SELECT jsonb_agg(
    (
      WITH v AS (
        SELECT value_txt AS raw
        FROM (
          SELECT value AS value_txt
          FROM jsonb_array_elements_text(document_files::jsonb)
        ) s
      )
      SELECT
        CASE
          WHEN raw ~* '^https?://' THEN
            'applications/' || split_part(raw, '/', array_length(string_to_array(raw, '/'), 1))
          WHEN raw LIKE 'applications/%' THEN
            raw
          WHEN raw LIKE '%/%' THEN
            'applications/' || split_part(raw, '/', array_length(string_to_array(raw, '/'), 1))
          ELSE
            'applications/' || raw
        END
      FROM v
    )
  )
), '[]'::jsonb)::json
WHERE document_files IS NOT NULL
  AND jsonb_typeof(document_files::jsonb) = 'array';

-- USA applications (simplified form)
UPDATE public.usa_applications_simplified
SET document_files = COALESCE((
  SELECT jsonb_agg(
    (
      WITH v AS (
        SELECT value_txt AS raw
        FROM (
          SELECT value AS value_txt
          FROM jsonb_array_elements_text(document_files::jsonb)
        ) s
      )
      SELECT
        CASE
          WHEN raw ~* '^https?://' THEN
            'applications/' || split_part(raw, '/', array_length(string_to_array(raw, '/'), 1))
          WHEN raw LIKE 'applications/%' THEN
            raw
          WHEN raw LIKE '%/%' THEN
            'applications/' || split_part(raw, '/', array_length(string_to_array(raw, '/'), 1))
          ELSE
            'applications/' || raw
        END
      FROM v
    )
  )
), '[]'::jsonb)::json
WHERE document_files IS NOT NULL
  AND jsonb_typeof(document_files::jsonb) = 'array';
