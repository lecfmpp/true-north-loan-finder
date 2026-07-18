-- Fix the audit functions to handle different table schemas properly
-- The functions were trying to access 'user_email' field which doesn't exist in quiz_responses table

CREATE OR REPLACE FUNCTION public.audit_contact_data_submission()
RETURNS TRIGGER AS $$
DECLARE
    email_field TEXT;
    phone_field TEXT;
BEGIN
    -- Determine the correct email field based on the table
    CASE TG_TABLE_NAME
        WHEN 'quiz_responses' THEN
            email_field := NEW.email;
            phone_field := NEW.phone;
        WHEN 'call_bookings' THEN
            email_field := NEW.user_email;
            phone_field := NEW.user_phone;
        WHEN 'broker_signups' THEN
            email_field := NEW.applicant_email;
            phone_field := NEW.applicant_phone;
        WHEN 'canadian_applications', 'usa_applications' THEN
            email_field := NEW.email_address;
            phone_field := COALESCE(NEW.cell_phone, NEW.business_phone);
        WHEN 'clients' THEN
            email_field := NEW.email;
            phone_field := NEW.phone;
        ELSE
            -- Fallback for other tables
            email_field := COALESCE(NEW.email, NEW.user_email, NEW.applicant_email, NEW.email_address);
            phone_field := COALESCE(NEW.phone, NEW.user_phone, NEW.applicant_phone, NEW.cell_phone);
    END CASE;

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
            'email_domain', CASE WHEN email_field IS NOT NULL THEN split_part(email_field, '@', 2) ELSE NULL END,
            'has_phone', CASE WHEN phone_field IS NOT NULL THEN true ELSE false END,
            'submission_time', now()
        ),
        inet_client_addr()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.detect_contact_abuse()
RETURNS TRIGGER AS $$
DECLARE
    recent_submissions INTEGER;
    same_email_submissions INTEGER;
    same_ip_submissions INTEGER;
    email_field TEXT;
BEGIN
    -- Determine the correct email field based on the table
    CASE TG_TABLE_NAME
        WHEN 'quiz_responses' THEN
            email_field := NEW.email;
        WHEN 'call_bookings' THEN
            email_field := NEW.user_email;
        WHEN 'broker_signups' THEN
            email_field := NEW.applicant_email;
        WHEN 'canadian_applications', 'usa_applications' THEN
            email_field := NEW.email_address;
        WHEN 'clients' THEN
            email_field := NEW.email;
        ELSE
            -- Fallback for other tables
            email_field := COALESCE(NEW.email, NEW.user_email, NEW.applicant_email, NEW.email_address);
    END CASE;

    -- Count recent submissions from same user
    SELECT COUNT(*) INTO recent_submissions
    FROM public.contact_data_audit
    WHERE user_id = auth.uid()
    AND created_at > now() - interval '1 hour';
    
    -- Count submissions with same email domain in last hour
    IF email_field IS NOT NULL THEN
        SELECT COUNT(*) INTO same_email_submissions  
        FROM public.contact_data_audit
        WHERE contact_data->>'email_domain' = split_part(email_field, '@', 2)
        AND created_at > now() - interval '1 hour';
    ELSE
        same_email_submissions := 0;
    END IF;
    
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