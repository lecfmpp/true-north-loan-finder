-- Fix existing document_files to use storage keys instead of URLs
-- This migration converts URLs to normalized storage keys for private bucket access

-- First, let's create a helper function to normalize paths
CREATE OR REPLACE FUNCTION public.normalize_storage_path(input_path text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Handle null/empty input
  IF input_path IS NULL OR input_path = '' THEN
    RETURN input_path;
  END IF;
  
  -- If it's a full Supabase Storage URL, extract the filename
  IF input_path ~* '^https?://.*supabase.*storage.*application-documents' THEN
    -- Extract just the filename from the URL
    input_path := regexp_replace(input_path, '^.*/', '');
    RETURN 'applications/' || input_path;
  END IF;
  
  -- If it already starts with applications/, keep as-is
  IF input_path LIKE 'applications/%' THEN
    RETURN input_path;
  END IF;
  
  -- If it contains slashes but doesn't start with applications/, extract filename
  IF input_path LIKE '%/%' THEN
    input_path := regexp_replace(input_path, '^.*/', '');
  END IF;
  
  -- Default: prepend applications/ to any other path
  RETURN 'applications/' || input_path;
END;
$$;

-- Update Canadian applications
UPDATE public.canadian_applications 
SET document_files = (
  SELECT json_agg(public.normalize_storage_path(file_path::text))
  FROM jsonb_array_elements_text(
    CASE 
      WHEN document_files IS NULL THEN '[]'::jsonb
      WHEN jsonb_typeof(document_files::jsonb) = 'array' THEN document_files::jsonb
      ELSE '[]'::jsonb
    END
  ) AS file_path
)::json
WHERE document_files IS NOT NULL;

-- Update USA applications (full form)
UPDATE public.usa_applications 
SET document_files = (
  SELECT json_agg(public.normalize_storage_path(file_path::text))
  FROM jsonb_array_elements_text(
    CASE 
      WHEN document_files IS NULL THEN '[]'::jsonb
      WHEN jsonb_typeof(document_files::jsonb) = 'array' THEN document_files::jsonb
      ELSE '[]'::jsonb
    END
  ) AS file_path
)::json
WHERE document_files IS NOT NULL;

-- Update USA applications (simplified form) if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usa_applications_simplified') THEN
    UPDATE public.usa_applications_simplified 
    SET document_files = (
      SELECT json_agg(public.normalize_storage_path(file_path::text))
      FROM jsonb_array_elements_text(
        CASE 
          WHEN document_files IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(document_files::jsonb) = 'array' THEN document_files::jsonb
          ELSE '[]'::jsonb
        END
      ) AS file_path
    )::json
    WHERE document_files IS NOT NULL;
  END IF;
END $$;

-- Clean up the helper function
DROP FUNCTION public.normalize_storage_path(text);