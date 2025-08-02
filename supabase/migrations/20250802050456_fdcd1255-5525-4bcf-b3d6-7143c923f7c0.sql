-- Fix partner data sync issue - create unique partners for each application
DO $$
DECLARE
    app_record RECORD;
BEGIN
    -- Delete all existing partner records to start fresh
    DELETE FROM partners WHERE application_type IN ('broker', 'lender');
    
    -- Loop through each approved application and create unique partner records
    FOR app_record IN 
        SELECT DISTINCT la.*
        FROM lender_broker_applications la
        WHERE la.status = 'approved' 
        AND la.user_id IS NOT NULL
        ORDER BY la.created_at
    LOOP
        -- Create unique partner record for each application
        INSERT INTO partners (
            user_id,
            name,
            email,
            company_name,
            phone,
            application_type,
            status
        ) VALUES (
            app_record.user_id,
            app_record.applicant_name,
            app_record.applicant_email,
            app_record.company_name,
            app_record.applicant_phone,
            app_record.application_type,
            'active'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            company_name = EXCLUDED.company_name,
            phone = EXCLUDED.phone,
            application_type = EXCLUDED.application_type,
            status = EXCLUDED.status,
            updated_at = now();
        
        -- Ensure user role exists
        INSERT INTO user_roles (
            user_id,
            role,
            assigned_by
        ) 
        SELECT 
            app_record.user_id,
            CASE 
                WHEN app_record.application_type = 'broker' THEN 'broker'::app_role
                ELSE 'lender'::app_role
            END,
            app_record.user_id
        WHERE NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = app_record.user_id 
            AND ur.role = CASE 
                WHEN app_record.application_type = 'broker' THEN 'broker'::app_role
                ELSE 'lender'::app_role
            END
        );
        
        RAISE NOTICE 'Synced partner: % (%) - %', app_record.applicant_name, app_record.application_type, app_record.user_id;
    END LOOP;
END $$;