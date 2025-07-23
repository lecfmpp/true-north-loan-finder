-- Fix remaining function security by setting search_path for all functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_management_access(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = user_id_param
      AND role IN ('superadmin', 'lender', 'broker')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = user_id_param
      AND role = 'superadmin'
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_time_slot_booking_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase booking count
    UPDATE public.available_time_slots
    SET current_bookings = current_bookings + 1
    WHERE id = NEW.time_slot_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled' THEN
      -- Decrease booking count when cancelled
      UPDATE public.available_time_slots
      SET current_bookings = current_bookings - 1
      WHERE id = NEW.time_slot_id;
    ELSIF OLD.booking_status = 'cancelled' AND NEW.booking_status != 'cancelled' THEN
      -- Increase booking count when reactivated
      UPDATE public.available_time_slots
      SET current_bookings = current_bookings + 1
      WHERE id = NEW.time_slot_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease booking count when deleted
    IF OLD.booking_status != 'cancelled' THEN
      UPDATE public.available_time_slots
      SET current_bookings = current_bookings - 1
      WHERE id = OLD.time_slot_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;