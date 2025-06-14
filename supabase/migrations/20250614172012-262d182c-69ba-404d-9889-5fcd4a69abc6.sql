
-- Enable RLS on pgs table if not already enabled
ALTER TABLE public.pgs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pgs table using DO blocks to avoid duplicates
DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to view PGs" ON public.pgs
        FOR SELECT 
        TO authenticated 
        USING (true);
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to create PGs" ON public.pgs
        FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to update PGs" ON public.pgs
        FOR UPDATE 
        TO authenticated 
        USING (true);
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to delete PGs" ON public.pgs
        FOR DELETE 
        TO authenticated 
        USING (true);
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

-- Enable RLS on other tables safely
DO $$ 
BEGIN
    ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

-- Create policies safely for rooms
DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to manage rooms" ON public.rooms
        FOR ALL 
        TO authenticated 
        USING (true);
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

-- Create policies safely for students
DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to manage students" ON public.students
        FOR ALL 
        TO authenticated 
        USING (true);
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

-- Create policies safely for payments
DO $$ 
BEGIN
    CREATE POLICY "Allow authenticated users to manage payments" ON public.payments
        FOR ALL 
        TO authenticated 
        USING (true);
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;
