-- Lead Validation Rules Engine
CREATE TABLE public.lead_validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('duplicate_check', 'email_validation', 'phone_validation', 'custom_logic', 'data_quality')),
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 100,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  rule_id UUID REFERENCES public.lead_validation_rules(id) ON DELETE CASCADE,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('passed', 'failed', 'warning')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Advanced Lead Routing System
CREATE TABLE public.lead_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  lead_criteria JSONB NOT NULL DEFAULT '{}',
  routing_type TEXT NOT NULL CHECK (routing_type IN ('exclusive', 'multi_sell', 'weighted', 'ping_post')),
  target_buyers JSONB NOT NULL DEFAULT '[]',
  weights JSONB DEFAULT '{}',
  max_buyers INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 100,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_routing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  rule_id UUID REFERENCES public.lead_routing_rules(id),
  routing_decision JSONB NOT NULL,
  buyers_assigned JSONB NOT NULL DEFAULT '[]',
  routing_type TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supplier Management
CREATE TABLE public.lead_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  api_endpoint TEXT,
  api_key_hash TEXT,
  daily_cap INTEGER DEFAULT NULL,
  weekly_cap INTEGER DEFAULT NULL,
  monthly_cap INTEGER DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  quality_score DECIMAL(3,2) DEFAULT 0.00,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_lead_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.lead_suppliers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  lead_count INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, date, period_type)
);

-- Buyer Management Extensions
CREATE TABLE public.buyer_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.buyer_lead_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  daily_cap INTEGER DEFAULT NULL,
  weekly_cap INTEGER DEFAULT NULL,
  monthly_cap INTEGER DEFAULT NULL,
  current_daily_count INTEGER NOT NULL DEFAULT 0,
  current_weekly_count INTEGER NOT NULL DEFAULT 0,
  current_monthly_count INTEGER NOT NULL DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  last_weekly_reset DATE DEFAULT CURRENT_DATE,
  last_monthly_reset DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(buyer_id)
);

CREATE TABLE public.buyer_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  payment_per_lead INTEGER DEFAULT 0, -- in cents
  requires_prepayment BOOLEAN NOT NULL DEFAULT false,
  hold_duration_hours INTEGER DEFAULT 24,
  stripe_customer_id TEXT,
  auto_charge BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(buyer_id)
);

-- Ping-Post Exchange System
CREATE TABLE public.ping_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  lead_criteria JSONB NOT NULL DEFAULT '{}',
  active_buyers JSONB NOT NULL DEFAULT '[]',
  bid_timeout_seconds INTEGER NOT NULL DEFAULT 5,
  minimum_bid INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ping_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ping_id UUID NOT NULL,
  buyer_id UUID REFERENCES public.partners(id),
  bid_amount INTEGER NOT NULL, -- in cents
  response_time_ms INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('bid', 'pass', 'timeout', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Queue System
CREATE TABLE public.lead_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.quiz_responses(id) ON DELETE CASCADE,
  queue_type TEXT NOT NULL CHECK (queue_type IN ('validation', 'routing', 'payment_hold', 'scheduled_delivery')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  scheduled_delivery TIMESTAMPTZ,
  buyer_id UUID REFERENCES public.partners(id),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Distribution Engine Config
CREATE TABLE public.lead_engine_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.lead_engine_settings (setting_key, setting_value, description) VALUES
('validation_enabled', 'true', 'Enable automatic lead validation'),
('routing_enabled', 'true', 'Enable automatic lead routing'),
('ping_post_enabled', 'false', 'Enable ping-post exchange'),
('default_hold_duration', '24', 'Default payment hold duration in hours'),
('max_ping_timeout', '10', 'Maximum ping timeout in seconds');

-- Enable RLS
ALTER TABLE public.lead_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_routing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_lead_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_lead_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ping_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ping_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_engine_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Superadmin only for engine configuration
CREATE POLICY "Superadmin can manage validation rules" ON public.lead_validation_rules FOR ALL USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can view validation results" ON public.lead_validation_results FOR SELECT USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can manage routing rules" ON public.lead_routing_rules FOR ALL USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can view routing history" ON public.lead_routing_history FOR SELECT USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can manage suppliers" ON public.lead_suppliers FOR ALL USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can view supplier counts" ON public.supplier_lead_counts FOR SELECT USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can manage buyer schedules" ON public.buyer_schedules FOR ALL USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can manage buyer caps" ON public.buyer_lead_caps FOR ALL USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can manage buyer payments" ON public.buyer_payment_settings FOR ALL USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can manage ping campaigns" ON public.ping_campaigns FOR ALL USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can view ping responses" ON public.ping_responses FOR SELECT USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can manage lead queue" ON public.lead_queue FOR ALL USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can manage engine settings" ON public.lead_engine_settings FOR ALL USING (is_superadmin(auth.uid()));

-- Partners can view their own data
CREATE POLICY "Partners can view their schedules" ON public.buyer_schedules FOR SELECT USING (buyer_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "Partners can view their caps" ON public.buyer_lead_caps FOR SELECT USING (buyer_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "Partners can view their payment settings" ON public.buyer_payment_settings FOR SELECT USING (buyer_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- System can insert/update operational data
CREATE POLICY "System can insert validation results" ON public.lead_validation_results FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert routing history" ON public.lead_routing_history FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update supplier counts" ON public.supplier_lead_counts FOR ALL WITH CHECK (true);
CREATE POLICY "System can update buyer caps" ON public.buyer_lead_caps FOR UPDATE USING (true);
CREATE POLICY "System can insert ping responses" ON public.ping_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "System can manage lead queue" ON public.lead_queue FOR ALL WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_lead_validation_results_lead_id ON public.lead_validation_results(lead_id);
CREATE INDEX idx_lead_routing_history_lead_id ON public.lead_routing_history(lead_id);
CREATE INDEX idx_supplier_lead_counts_supplier_date ON public.supplier_lead_counts(supplier_id, date);
CREATE INDEX idx_buyer_schedules_buyer_day ON public.buyer_schedules(buyer_id, day_of_week);
CREATE INDEX idx_lead_queue_status_type ON public.lead_queue(status, queue_type);
CREATE INDEX idx_lead_queue_scheduled_delivery ON public.lead_queue(scheduled_delivery) WHERE scheduled_delivery IS NOT NULL;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_validation_rules_updated_at BEFORE UPDATE ON public.lead_validation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_routing_rules_updated_at BEFORE UPDATE ON public.lead_routing_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_suppliers_updated_at BEFORE UPDATE ON public.lead_suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_payment_settings_updated_at BEFORE UPDATE ON public.buyer_payment_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ping_campaigns_updated_at BEFORE UPDATE ON public.ping_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_queue_updated_at BEFORE UPDATE ON public.lead_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();