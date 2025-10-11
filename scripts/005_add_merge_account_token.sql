-- Add merge_token column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS merge_token text;
