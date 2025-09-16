-- Remove Lead Engine tables while preserving Lead Marketplace pricing tables
-- Keep: lead_tier_pricing, lead_price_decay_rules (and calculate_lead_price_with_decay function)

-- Drop Lead Engine specific tables
DROP TABLE IF EXISTS lead_validation_results CASCADE;
DROP TABLE IF EXISTS lead_validation_rules CASCADE;
DROP TABLE IF EXISTS lead_routing_history CASCADE;
DROP TABLE IF EXISTS lead_routing_rules CASCADE;
DROP TABLE IF EXISTS lead_queue CASCADE;
DROP TABLE IF EXISTS supplier_lead_counts CASCADE;
DROP TABLE IF EXISTS lead_suppliers CASCADE;
DROP TABLE IF EXISTS ping_responses CASCADE;
DROP TABLE IF EXISTS ping_campaigns CASCADE;
DROP TABLE IF EXISTS bidding_campaigns CASCADE;
DROP TABLE IF EXISTS lead_engine_settings CASCADE;

-- Note: We're keeping buyer_schedules, buyer_lead_caps, buyer_payment_settings 
-- as they might be used by the Lead Marketplace for buyer management

-- Clean up any sequences that might have been created for these tables
DROP SEQUENCE IF EXISTS lead_validation_rules_id_seq CASCADE;
DROP SEQUENCE IF EXISTS lead_routing_rules_id_seq CASCADE;
DROP SEQUENCE IF EXISTS lead_queue_id_seq CASCADE;
DROP SEQUENCE IF EXISTS ping_campaigns_id_seq CASCADE;
DROP SEQUENCE IF EXISTS bidding_campaigns_id_seq CASCADE;