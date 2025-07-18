
-- Add Google Calendar and Meet integration fields to call_bookings table
ALTER TABLE public.call_bookings 
ADD COLUMN google_calendar_event_id TEXT,
ADD COLUMN google_meet_link TEXT,
ADD COLUMN calendar_sync_status TEXT DEFAULT 'pending' CHECK (calendar_sync_status IN ('pending', 'synced', 'failed', 'cancelled'));

-- Update the meeting_link field to store Google Meet links
COMMENT ON COLUMN public.call_bookings.google_calendar_event_id IS 'Google Calendar event ID for two-way sync';
COMMENT ON COLUMN public.call_bookings.google_meet_link IS 'Google Meet link generated for the booking';
COMMENT ON COLUMN public.call_bookings.calendar_sync_status IS 'Status of calendar synchronization: pending, synced, failed, cancelled';
