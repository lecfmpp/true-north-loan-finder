-- Create partner confirmation tokens table
CREATE TABLE IF NOT EXISTS partner_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_partner_confirmation_tokens_token ON partner_confirmation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_partner_confirmation_tokens_email ON partner_confirmation_tokens(email);

-- Add RLS
ALTER TABLE partner_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert tokens (for the edge function)
CREATE POLICY "Anyone can insert confirmation tokens" ON partner_confirmation_tokens
FOR INSERT WITH CHECK (true);

-- Only system can read/update tokens
CREATE POLICY "System can manage confirmation tokens" ON partner_confirmation_tokens
FOR ALL USING (true);