-- Create a function to automatically adjust dates by adding 1 day
CREATE OR REPLACE FUNCTION adjust_ad_spend_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Add 1 day to the date field during insert
  NEW.date = NEW.date + INTERVAL '1 day';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger to run the function on every INSERT to ad_spend_records
CREATE TRIGGER adjust_ad_spend_date_trigger
  BEFORE INSERT ON public.ad_spend_records
  FOR EACH ROW
  EXECUTE FUNCTION adjust_ad_spend_date();