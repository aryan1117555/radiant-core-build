
-- Ensure all tables have proper structure and relationships

-- Update users table structure if needed
ALTER TABLE public.users 
  ALTER COLUMN role SET DEFAULT 'viewer',
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN "assignedPGs" SET DEFAULT '[]'::json;

-- Update pgs table structure
ALTER TABLE public.pgs 
  ALTER COLUMN pg_type SET DEFAULT 'unisex',
  ALTER COLUMN total_rooms SET DEFAULT 0,
  ALTER COLUMN occupied_rooms SET DEFAULT 0,
  ALTER COLUMN revenue SET DEFAULT 0,
  ALTER COLUMN monthly_rent SET DEFAULT 0;

-- Update rooms table structure
ALTER TABLE public.rooms 
  ALTER COLUMN capacity SET DEFAULT 1,
  ALTER COLUMN status SET DEFAULT 'available',
  ALTER COLUMN rent SET DEFAULT 0;

-- Update students table structure
ALTER TABLE public.students 
  ALTER COLUMN total_fees SET DEFAULT 0,
  ALTER COLUMN deposit SET DEFAULT 0;

-- Update payments table structure
ALTER TABLE public.payments 
  ALTER COLUMN mode SET DEFAULT 'Cash',
  ALTER COLUMN approval_status SET DEFAULT 'pending';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_pgs_manager_id ON public.pgs(manager_id);
CREATE INDEX IF NOT EXISTS idx_rooms_pg_id ON public.rooms(pg_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_students_pg_id ON public.students(pg_id);
CREATE INDEX IF NOT EXISTS idx_students_room_id ON public.students(room_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_approval_status ON public.payments(approval_status);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables that have updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pgs_updated_at ON public.pgs;
CREATE TRIGGER update_pgs_updated_at 
    BEFORE UPDATE ON public.pgs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON public.rooms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure valid room statuses
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_status_check 
  CHECK (status IN ('available', 'occupied', 'maintenance', 'vacant', 'partial', 'full'));

-- Add constraint to ensure valid PG types
ALTER TABLE public.pgs DROP CONSTRAINT IF EXISTS pgs_pg_type_check;
ALTER TABLE public.pgs ADD CONSTRAINT pgs_pg_type_check 
  CHECK (pg_type IN ('male', 'female', 'unisex'));

-- Add constraint to ensure valid user roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'manager', 'accountant', 'viewer'));

-- Add constraint to ensure valid payment modes
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_mode_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_mode_check 
  CHECK (mode IN ('Cash', 'UPI', 'Bank Transfer'));

-- Add constraint to ensure valid payment approval statuses
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_approval_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_approval_status_check 
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));
