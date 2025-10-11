-- Disable email confirmation requirement for new signups
-- This allows users to sign up and immediately access the application
-- without needing to verify their email address

-- Note: This is a configuration change that should be applied in your Supabase project settings
-- Go to Authentication > Providers > Email and disable "Confirm email"
-- This SQL file serves as documentation of the configuration change needed

-- Alternatively, you can use the Supabase Management API or CLI to update this setting
-- For now, please manually disable email confirmation in your Supabase dashboard:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to Authentication > Providers
-- 3. Click on Email provider
-- 4. Toggle OFF "Confirm email"
-- 5. Save changes
