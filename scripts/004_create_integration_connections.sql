-- Create integration_connections table to track user integration connections
CREATE TABLE IF NOT EXISTS public.integration_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL, -- e.g., 'Paragon', 'Integration App'
  integration TEXT NOT NULL, -- e.g., 'Shopify', 'Zendesk', 'Hubspot'
  connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, service, integration)
);

-- Enable RLS
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own connections
CREATE POLICY "Users can view own integration connections"
  ON public.integration_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own connections
CREATE POLICY "Users can insert own integration connections"
  ON public.integration_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own connections
CREATE POLICY "Users can update own integration connections"
  ON public.integration_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integration_connections_user_service_integration 
  ON public.integration_connections(user_id, service, integration);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_integration_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_integration_connections_updated_at
  BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_integration_connections_updated_at();
