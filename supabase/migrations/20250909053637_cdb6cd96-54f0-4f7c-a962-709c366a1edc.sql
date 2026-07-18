-- Insert default scoring rules that match the existing Quiz.tsx scoring logic
INSERT INTO public.lead_score_rules (rule_name, criteria_field, criteria_operator, criteria_value, score_points, description, is_active) VALUES 
('Exceptional Revenue - $100k+', 'monthly_revenue', 'greater_than', '100000', 40, 'Highest revenue tier - excellent financial stability', true),
('Very High Revenue - $50k-99k', 'monthly_revenue', 'greater_than', '50000', 35, 'Very strong monthly revenue indicating good business health', true),
('Good Revenue - $25k-49k', 'monthly_revenue', 'greater_than', '25000', 30, 'Solid monthly revenue showing business viability', true),
('Minimum Revenue - $10k-24k', 'monthly_revenue', 'greater_than', '10000', 25, 'Meets minimum revenue threshold for qualification', true),

('Business Age 5+ Years', 'time_in_business', 'equals', '5+', 35, 'Well-established business with proven longevity', true),
('Business Age 2-5 Years', 'time_in_business', 'equals', '2-5', 30, 'Mature business with good track record', true),
('Business Age 1-2 Years', 'time_in_business', 'equals', '1-2', 25, 'Established business showing growth', true),
('Business Age 6-12 Months', 'time_in_business', 'equals', '6-12', 20, 'Young but viable business meeting minimum age requirement', true),

('Excellent Credit Score', 'credit_score', 'equals', 'excellent', 25, 'Exceptional credit profile (750+)', true),
('Good Credit Score', 'credit_score', 'equals', 'good', 20, 'Strong credit profile (700-749)', true),
('Fair Credit Score', 'credit_score', 'equals', 'fair', 15, 'Acceptable credit profile (650-699)', true),
('Poor Credit Score', 'credit_score', 'equals', 'poor', 10, 'Minimum acceptable credit profile (600-649)', true);

-- Insert some additional useful scoring rules
INSERT INTO public.lead_score_rules (rule_name, criteria_field, criteria_operator, criteria_value, score_points, description, is_active) VALUES 
('High Loan Amount - $500k+', 'loan_amount', 'greater_than', '500000', 15, 'Large loan requests indicate serious business expansion', true),
('Substantial Loan Amount - $250k+', 'loan_amount', 'greater_than', '250000', 10, 'Significant funding needs showing growth intent', true),
('Moderate Loan Amount - $100k+', 'loan_amount', 'greater_than', '100000', 5, 'Standard business loan amounts', true),
('Equipment Financing', 'use_of_funds', 'contains', 'equipment', 5, 'Equipment purchases indicate business growth', true),
('Inventory Funding', 'use_of_funds', 'contains', 'inventory', 5, 'Inventory investment shows business expansion', true),
('Working Capital', 'use_of_funds', 'contains', 'working capital', 3, 'Working capital needs for business operations', true);