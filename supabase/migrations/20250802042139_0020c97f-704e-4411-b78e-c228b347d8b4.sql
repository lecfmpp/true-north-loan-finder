-- Enable real-time updates for quiz_responses table
ALTER TABLE public.quiz_responses REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_responses;