-- Sync approved applications to partners table
DO $$
DECLARE
    app_record RECORD;
BEGIN
    -- Loop through all approved applications that don't have partner records
    FOR app_record IN 
        SELECT DISTINCT ON (la.user_id) la.*
        FROM lender_broker_applications la
        LEFT JOIN partners p ON la.user_id = p.user_id
        WHERE la.status = 'approved' 
        AND p.user_id IS NULL
        AND la.user_id IS NOT NULL
    LOOP
        -- Create partner record for each approved application
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
        );
        
        -- Also assign the appropriate user role if it doesn't exist
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
        
        RAISE NOTICE 'Created partner record for user % (%)', app_record.applicant_name, app_record.user_id;
    END LOOP;
END $$;