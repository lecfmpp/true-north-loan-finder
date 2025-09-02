-- CRITICAL SECURITY FIX: Protect customer contact information from harvesting

-- Drop policies that allow anonymous or overly permissive contact data submissions

-- Quiz Responses - Remove anonymous submission policy
DROP POLICY IF EXISTS "Allow anonymous quiz submissions" ON public.quiz_responses;

-- Call Bookings - Remove anonymous submission policy  
DROP POLICY IF EXISTS "Anonymous users can create validated bookings" ON public.call_bookings;

-- Clients - Remove public submission policies
DROP POLICY IF EXISTS "Anyone can submit client contacts with validation" ON public.clients;
DROP POLICY IF EXISTS "Public can insert broker client data" ON public.clients;

-- Create secure replacement policies that require authentication and proper access control

-- Quiz Responses: Require authentication and email validation
CREATE POLICY "Authenticated users can submit quiz responses" ON public.quiz_responses
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        loan_amount > 0 AND
        name IS NOT NULL AND
        email IS NOT NULL AND
        phone IS NOT NULL AND
        score IS NOT NULL AND
        email = get_current_user_email()
    );

-- Quiz Responses: Allow users to view their own submissions
CREATE POLICY "Users can view their own quiz responses" ON public.quiz_responses
    FOR SELECT TO authenticated
    USING (email = get_current_user_email());

-- Call Bookings: Require authentication for submissions
CREATE POLICY "Authenticated users can create validated bookings" ON public.call_bookings
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_name IS NOT NULL AND
        user_email IS NOT NULL AND
        time_slot_id IS NOT NULL AND
        user_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
        user_email = get_current_user_email() AND
        char_length(user_name) >= 2 AND
        char_length(user_name) <= 100 AND
        (user_phone IS NULL OR (char_length(user_phone) >= 10 AND char_length(user_phone) <= 20))
    );

-- Call Bookings: Allow users to view their own bookings
CREATE POLICY "Users can view their own call bookings" ON public.call_bookings
    FOR SELECT TO authenticated
    USING (user_email = get_current_user_email());

-- Clients: Require authentication for submissions
CREATE POLICY "Authenticated users can submit client contacts" ON public.clients
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        name IS NOT NULL AND
        email IS NOT NULL AND
        email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
        char_length(name) >= 2 AND
        char_length(name) <= 100 AND
        (phone IS NULL OR char_length(phone) >= 10)
    );

-- Enhance the lender_broker_applications policy to be more restrictive
DROP POLICY IF EXISTS "Allow broker application submissions" ON public.lender_broker_applications;

CREATE POLICY "Secure broker application submissions" ON public.lender_broker_applications
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        status = 'pending' AND
        application_type = ANY (ARRAY['lender', 'broker']) AND
        applicant_name IS NOT NULL AND
        applicant_email IS NOT NULL AND
        company_name IS NOT NULL AND
        applicant_email = get_current_user_email() AND
        applicant_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
        char_length(applicant_name) >= 2 AND
        char_length(applicant_name) <= 100 AND
        char_length(company_name) >= 2 AND
        char_length(company_name) <= 200
    );

-- Create enhanced contact data audit table for comprehensive monitoring
CREATE TABLE IF NOT EXISTS public.contact_data_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    contact_data JSONB NOT NULL, -- Store sanitized contact info for audit
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    risk_score INTEGER DEFAULT 0 -- For future abuse detection
);

-- Enable RLS on contact audit table
ALTER TABLE public.contact_data_audit ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view contact audit logs
CREATE POLICY "Superadmin can view contact audit logs" ON public.contact_data_audit
    FOR SELECT TO authenticated
    USING (is_superadmin(auth.uid()));

-- Create audit function for contact data submissions
CREATE OR REPLACE FUNCTION public.audit_contact_data_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Log contact data submission with sanitized information
    INSERT INTO public.contact_data_audit (
        table_name, record_id, user_id, action,
        contact_data, ip_address
    ) VALUES (
        TG_TABLE_NAME,
        NEW.id,
        auth.uid(),
        TG_OP,
        jsonb_build_object(
            'email_domain', split_part(COALESCE(NEW.email, NEW.user_email, NEW.applicant_email), '@', 2),
            'has_phone', CASE WHEN COALESCE(NEW.phone, NEW.user_phone, NEW.applicant_phone) IS NOT NULL THEN true ELSE false END,
            'submission_time', now()
        ),
        inet_client_addr()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add audit triggers to all contact data tables
CREATE TRIGGER audit_quiz_responses_contact_data
    AFTER INSERT ON public.quiz_responses
    FOR EACH ROW EXECUTE FUNCTION public.audit_contact_data_submission();

CREATE TRIGGER audit_call_bookings_contact_data
    AFTER INSERT ON public.call_bookings
    FOR EACH ROW EXECUTE FUNCTION public.audit_contact_data_submission();

CREATE TRIGGER audit_clients_contact_data
    AFTER INSERT ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.audit_contact_data_submission();

CREATE TRIGGER audit_broker_signups_contact_data
    AFTER INSERT ON public.broker_signups
    FOR EACH ROW EXECUTE FUNCTION public.audit_contact_data_submission();

CREATE TRIGGER audit_lender_broker_applications_contact_data
    AFTER INSERT ON public.lender_broker_applications
    FOR EACH ROW EXECUTE FUNCTION public.audit_contact_data_submission();

-- Create function to detect suspicious contact data patterns
CREATE OR REPLACE FUNCTION public.detect_contact_abuse()
RETURNS TRIGGER AS $$
DECLARE
    recent_submissions INTEGER;
    same_email_submissions INTEGER;
    same_ip_submissions INTEGER;
BEGIN
    -- Count recent submissions from same user
    SELECT COUNT(*) INTO recent_submissions
    FROM public.contact_data_audit
    WHERE user_id = auth.uid()
    AND created_at > now() - interval '1 hour';
    
    -- Count submissions with same email domain in last hour
    SELECT COUNT(*) INTO same_email_submissions  
    FROM public.contact_data_audit
    WHERE contact_data->>'email_domain' = split_part(COALESCE(NEW.email, NEW.user_email, NEW.applicant_email), '@', 2)
    AND created_at > now() - interval '1 hour';
    
    -- Count submissions from same IP in last hour
    SELECT COUNT(*) INTO same_ip_submissions
    FROM public.contact_data_audit
    WHERE ip_address = inet_client_addr()
    AND created_at > now() - interval '1 hour';
    
    -- Block if abuse patterns detected
    IF recent_submissions > 10 THEN
        RAISE EXCEPTION 'Too many submissions from this account. Please wait before submitting again.';
    END IF;
    
    IF same_email_submissions > 20 THEN
        RAISE EXCEPTION 'Too many submissions from this email domain. Please contact support if this is legitimate.';
    END IF;
    
    IF same_ip_submissions > 50 THEN
        RAISE EXCEPTION 'Too many submissions from this IP address. Please contact support if this is legitimate.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add abuse detection triggers (run before audit triggers)
CREATE TRIGGER detect_quiz_responses_abuse
    BEFORE INSERT ON public.quiz_responses
    FOR EACH ROW EXECUTE FUNCTION public.detect_contact_abuse();

CREATE TRIGGER detect_call_bookings_abuse
    BEFORE INSERT ON public.call_bookings
    FOR EACH ROW EXECUTE FUNCTION public.detect_contact_abuse();

CREATE TRIGGER detect_clients_abuse
    BEFORE INSERT ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.detect_contact_abuse();

COMMENT ON TABLE public.contact_data_audit IS 'Comprehensive audit log for all customer contact data submissions with abuse detection';
COMMENT ON FUNCTION public.audit_contact_data_submission() IS 'Logs contact data submissions with sanitized information for security monitoring';
COMMENT ON FUNCTION public.detect_contact_abuse() IS 'Detects and prevents suspicious contact data submission patterns';