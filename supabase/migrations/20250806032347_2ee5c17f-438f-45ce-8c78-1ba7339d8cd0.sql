-- Check if ad_spend_records table exists and has RLS enabled
DO $$
BEGIN
  -- Create ad_spend_records table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ad_spend_records') THEN
    CREATE TABLE public.ad_spend_records (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      date DATE NOT NULL,
      channel TEXT NOT NULL,
      amount INTEGER NOT NULL, -- Amount in cents
      campaign_name TEXT,
      clicks INTEGER DEFAULT 0,
      ctr NUMERIC(5,2) DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.ad_spend_records ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for authenticated users (admin access)
    CREATE POLICY "Admin users can view ad spend records" 
    ON public.ad_spend_records 
    FOR SELECT 
    USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Admin users can insert ad spend records" 
    ON public.ad_spend_records 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Admin users can update ad spend records" 
    ON public.ad_spend_records 
    FOR UPDATE 
    USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Admin users can delete ad spend records" 
    ON public.ad_spend_records 
    FOR DELETE 
    USING (auth.role() = 'authenticated');
    
    -- Add trigger for updated_at
    CREATE TRIGGER update_ad_spend_records_updated_at
    BEFORE UPDATE ON public.ad_spend_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
    
    -- Add indexes for better performance
    CREATE INDEX idx_ad_spend_records_date ON public.ad_spend_records(date);
    CREATE INDEX idx_ad_spend_records_channel ON public.ad_spend_records(channel);
    
  ELSE
    -- Table exists, check if RLS is enabled and policies exist
    
    -- Enable RLS if not already enabled
    ALTER TABLE public.ad_spend_records ENABLE ROW LEVEL SECURITY;
    
    -- Create policies if they don't exist (will be ignored if they already exist)
    DO $policy$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ad_spend_records' 
        AND policyname = 'Admin users can view ad spend records'
      ) THEN
        CREATE POLICY "Admin users can view ad spend records" 
        ON public.ad_spend_records 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ad_spend_records' 
        AND policyname = 'Admin users can insert ad spend records'
      ) THEN
        CREATE POLICY "Admin users can insert ad spend records" 
        ON public.ad_spend_records 
        FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ad_spend_records' 
        AND policyname = 'Admin users can update ad spend records'
      ) THEN
        CREATE POLICY "Admin users can update ad spend records" 
        ON public.ad_spend_records 
        FOR UPDATE 
        USING (auth.role() = 'authenticated');
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ad_spend_records' 
        AND policyname = 'Admin users can delete ad spend records'
      ) THEN
        CREATE POLICY "Admin users can delete ad spend records" 
        ON public.ad_spend_records 
        FOR DELETE 
        USING (auth.role() = 'authenticated');
      END IF;
    END $policy$;
    
  END IF;
END $$;