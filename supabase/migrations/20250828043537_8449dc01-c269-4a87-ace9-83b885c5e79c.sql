-- Update Make.com integration settings to remove application_submitted and add bundling options
UPDATE make_integration_settings 
SET event_toggles = jsonb_set(
  jsonb_set(
    event_toggles,
    '{application_submitted}', 
    'null'::jsonb
  ),
  '{auto_send_on_assignment}',
  'true'::jsonb
),
field_mappings = jsonb_set(
  jsonb_set(
    jsonb_set(
      field_mappings,
      '{application_fields,bundle_application}',
      'true'::jsonb
    ),
    '{application_fields,include_bundle_file}',
    'false'::jsonb
  ),
  '{application_fields,bundle_as_json}',
  'true'::jsonb
);