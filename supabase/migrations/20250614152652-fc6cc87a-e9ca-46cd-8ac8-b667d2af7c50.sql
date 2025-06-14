
-- Only create policies that don't already exist
-- First, let's try to create missing policies for tables that might not have them yet

-- Check if profiles table needs RLS policies (this table might not have policies yet)
DO $$ 
BEGIN
    -- Enable RLS on profiles if not already enabled
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

-- Create policies for profiles table if they don't exist
DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to read all profiles" ON public.profiles
        FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to insert profiles" ON public.profiles
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to update profiles" ON public.profiles
        FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to delete profiles" ON public.profiles
        FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;
