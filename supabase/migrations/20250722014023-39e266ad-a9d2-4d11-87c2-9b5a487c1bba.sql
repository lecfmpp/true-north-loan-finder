-- Add excluded_routes column to social_proof_widget_config table
ALTER TABLE public.social_proof_widget_config 
ADD COLUMN excluded_routes TEXT[] DEFAULT '{}';

-- Add a comment to describe the column
COMMENT ON COLUMN public.social_proof_widget_config.excluded_routes IS 'Array of route paths where social proof notifications should not be displayed';