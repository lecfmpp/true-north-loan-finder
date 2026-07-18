-- First check if the application-documents bucket exists and has proper policies
SELECT name, public FROM storage.buckets WHERE id = 'application-documents';

-- Check existing policies for the bucket
SELECT
    pol.policyname,
    pol.permissive,
    pol.roles,
    pol.cmd,
    pol.qual,
    pol.with_check
FROM pg_policies pol
WHERE pol.tablename = 'objects' 
    AND pol.schemaname = 'storage'
    AND (pol.qual LIKE '%application-documents%' OR pol.with_check LIKE '%application-documents%');

-- Create comprehensive storage policies for application-documents bucket if not exists
-- Policy for SELECT (download/view files)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can view their application documents'
    ) THEN
        CREATE POLICY "Authenticated users can view their application documents"
        ON storage.objects
        FOR SELECT
        USING (
            bucket_id = 'application-documents' 
            AND auth.uid() IS NOT NULL
        );
    END IF;
END $$;

-- Policy for INSERT (upload files)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload application documents'
    ) THEN
        CREATE POLICY "Authenticated users can upload application documents"
        ON storage.objects
        FOR INSERT
        WITH CHECK (
            bucket_id = 'application-documents' 
            AND auth.uid() IS NOT NULL
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy for UPDATE (modify files)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can update their application documents'
    ) THEN
        CREATE POLICY "Authenticated users can update their application documents"
        ON storage.objects
        FOR UPDATE
        USING (
            bucket_id = 'application-documents' 
            AND auth.uid() IS NOT NULL
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy for DELETE (remove files)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can delete their application documents'
    ) THEN
        CREATE POLICY "Authenticated users can delete their application documents"
        ON storage.objects
        FOR DELETE
        USING (
            bucket_id = 'application-documents' 
            AND auth.uid() IS NOT NULL
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Management access policy for all operations
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Management users can manage all application documents'
    ) THEN
        CREATE POLICY "Management users can manage all application documents"
        ON storage.objects
        FOR ALL
        USING (
            bucket_id = 'application-documents' 
            AND has_management_access(auth.uid())
        )
        WITH CHECK (
            bucket_id = 'application-documents' 
            AND has_management_access(auth.uid())
        );
    END IF;
END $$;