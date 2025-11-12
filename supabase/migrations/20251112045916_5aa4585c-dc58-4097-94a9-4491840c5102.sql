-- Add ClickUp integration fields to partners table
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS clickup_api_key TEXT,
ADD COLUMN IF NOT EXISTS clickup_list_id TEXT,
ADD COLUMN IF NOT EXISTS clickup_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_send_to_clickup BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.partners.clickup_api_key IS 'Partner ClickUp API key for automatic lead delivery';
COMMENT ON COLUMN public.partners.clickup_list_id IS 'ClickUp List ID where tasks should be created';
COMMENT ON COLUMN public.partners.clickup_enabled IS 'Whether ClickUp integration is enabled for this partner';
COMMENT ON COLUMN public.partners.auto_send_to_clickup IS 'Automatically send assigned leads to ClickUp';