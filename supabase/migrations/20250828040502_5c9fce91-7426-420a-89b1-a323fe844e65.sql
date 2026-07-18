-- Add field mappings and attachment settings to make_integration_settings
ALTER TABLE public.make_integration_settings 
ADD COLUMN IF NOT EXISTS field_mappings jsonb DEFAULT '{
  "lead_fields": {
    "id": true,
    "name": true,
    "email": true,
    "phone": true,
    "company_name": true,
    "loan_amount": true,
    "monthly_revenue": false,
    "credit_score": false,
    "time_in_business": false,
    "use_of_funds": false,
    "country": true,
    "city_province": false,
    "website": false,
    "attribution_channel": false,
    "attribution_url": false,
    "bank_account_type": false,
    "homeowner_status": false,
    "score": false,
    "status": true,
    "conversion_status": true,
    "created_at": true
  },
  "partner_fields": {
    "id": false,
    "name": true,
    "email": true,
    "company_name": true
  },
  "application_fields": {
    "include_attachments": true,
    "usa_reference": true,
    "canadian_reference": true
  },
  "metadata_fields": {
    "triggered_by_user_id": false,
    "triggered_by_email": true,
    "triggered_at": true
  }
}'::jsonb;