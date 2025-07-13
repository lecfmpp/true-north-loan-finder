-- Create RLS policy to allow admins to view all quiz responses
CREATE POLICY "Admins can view all quiz responses" 
ON public.quiz_responses 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create RLS policy to allow admins to update quiz responses
CREATE POLICY "Admins can update quiz responses" 
ON public.quiz_responses 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create RLS policy to allow admins to delete quiz responses
CREATE POLICY "Admins can delete quiz responses" 
ON public.quiz_responses 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);