-- Add spreadsheet format option to Make.com integration settings
ALTER TABLE make_integration_settings 
ADD COLUMN IF NOT EXISTS spreadsheet_format boolean DEFAULT false;