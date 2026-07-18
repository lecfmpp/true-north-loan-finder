-- Create available time slots table
CREATE TABLE public.available_time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  is_available BOOLEAN NOT NULL DEFAULT true,
  max_bookings INTEGER NOT NULL DEFAULT 1,
  current_bookings INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, time)
);

-- Create bookings table
CREATE TABLE public.call_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_slot_id UUID NOT NULL REFERENCES public.available_time_slots(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  quiz_response_id UUID REFERENCES public.quiz_responses(id),
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.available_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for available_time_slots
CREATE POLICY "Anyone can view available time slots"
ON public.available_time_slots
FOR SELECT
USING (is_available = true AND current_bookings < max_bookings);

CREATE POLICY "Admins can manage time slots"
ON public.available_time_slots
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

-- RLS Policies for call_bookings
CREATE POLICY "Anyone can create bookings"
ON public.call_bookings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all bookings"
ON public.call_bookings
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Admins can manage bookings"
ON public.call_bookings
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

-- Add triggers for updated_at
CREATE TRIGGER update_available_time_slots_updated_at
  BEFORE UPDATE ON public.available_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_call_bookings_updated_at
  BEFORE UPDATE ON public.call_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update booking count when booking is created/cancelled
CREATE OR REPLACE FUNCTION update_time_slot_booking_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for booking count updates
CREATE TRIGGER update_booking_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.call_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_time_slot_booking_count();