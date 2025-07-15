-- Add time slots for Toronto EST timezone
-- 8:00 AM to 8:30 AM (15 minute slots): 8:00, 8:15
-- 4:30 PM to 5:00 PM (15 minute slots): 4:30, 4:45

DO $$
DECLARE
    current_date DATE;
    end_date DATE;
BEGIN
    current_date := CURRENT_DATE;
    end_date := CURRENT_DATE + INTERVAL '60 days';
    
    WHILE current_date <= end_date LOOP
        -- Skip weekends (Saturday = 6, Sunday = 0)
        IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            -- Morning slots: 8:00 AM and 8:15 AM
            INSERT INTO public.available_time_slots (date, time, duration_minutes, is_available, max_bookings, current_bookings)
            VALUES 
                (current_date, '08:00:00', 15, true, 1, 0),
                (current_date, '08:15:00', 15, true, 1, 0);
            
            -- Afternoon slots: 4:30 PM and 4:45 PM
            INSERT INTO public.available_time_slots (date, time, duration_minutes, is_available, max_bookings, current_bookings)
            VALUES 
                (current_date, '16:30:00', 15, true, 1, 0),
                (current_date, '16:45:00', 15, true, 1, 0);
        END IF;
        
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
END $$;