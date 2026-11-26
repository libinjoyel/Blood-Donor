CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  blood_group TEXT CHECK (blood_group IS NULL OR blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'donor' CHECK (role IN ('donor', 'admin')),
  admin_role TEXT NOT NULL DEFAULT '',
  address TEXT,
  donation_count INTEGER NOT NULL DEFAULT 0 CHECK (donation_count >= 0),
  is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  last_donation_date TIMESTAMPTZ,
  next_appointment TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_donor_blood_group_chk CHECK (role <> 'donor' OR blood_group IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blood_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  services TEXT[] NOT NULL DEFAULT '{}',
  working_hours TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blood_banks_city ON blood_banks (city);

CREATE TABLE IF NOT EXISTS blood_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_group TEXT NOT NULL UNIQUE CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units INTEGER NOT NULL DEFAULT 0 CHECK (units >= 0),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS blood_unit_seq START 1;

CREATE TABLE IF NOT EXISTS blood_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id TEXT NOT NULL UNIQUE,
  donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  component TEXT NOT NULL CHECK (component IN ('Whole Blood', 'Red Blood Cells', 'Plasma', 'Platelets')),
  donation_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'Issued', 'Expired', 'Discarded')),
  storage_location TEXT DEFAULT '',
  barcode TEXT NOT NULL UNIQUE,
  remarks TEXT DEFAULT '',
  reserved_for TEXT,
  reserved_at TIMESTAMPTZ,
  issued_to JSONB,
  issued_at TIMESTAMPTZ,
  discarded_at TIMESTAMPTZ,
  discarded_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blood_units_donor ON blood_units (donor_id);
CREATE INDEX IF NOT EXISTS idx_blood_units_group_status ON blood_units (blood_group, status);
CREATE INDEX IF NOT EXISTS idx_blood_units_expiry_status ON blood_units (expiry_date, status);
CREATE INDEX IF NOT EXISTS idx_blood_units_storage ON blood_units (storage_location);
CREATE INDEX IF NOT EXISTS idx_blood_units_donation_date ON blood_units (donation_date);

CREATE TABLE IF NOT EXISTS blood_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_unit_id UUID NOT NULL,
  unit_id TEXT,
  blood_group TEXT,
  action TEXT NOT NULL CHECK (action IN ('Created', 'Reserved', 'Issued', 'Discarded', 'Expired', 'Updated')),
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name TEXT,
  notes TEXT DEFAULT '',
  action_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blood_tx_unit_date ON blood_transactions (blood_unit_id, action_date DESC);
CREATE INDEX IF NOT EXISTS idx_blood_tx_action_date ON blood_transactions (action_date DESC);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blood_bank_id UUID NOT NULL REFERENCES blood_banks(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments (user_id, date DESC);

CREATE TABLE IF NOT EXISTS donation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blood_bank_id UUID NOT NULL REFERENCES blood_banks(id) ON DELETE CASCADE,
  donation_date TIMESTAMPTZ NOT NULL,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units INTEGER NOT NULL DEFAULT 1 CHECK (units >= 1),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donation_history_user_date ON donation_history (user_id, donation_date DESC);

CREATE TABLE IF NOT EXISTS urgent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital TEXT NOT NULL,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units INTEGER NOT NULL CHECK (units >= 1),
  city TEXT NOT NULL,
  contact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'urgent' CHECK (status IN ('urgent', 'fulfilled', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_urgent_requests_city ON urgent_requests (city);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_status ON urgent_requests (status);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_created ON urgent_requests (created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('appointment_reminder', 'donation_completed', 'eligibility', 'system')),
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blood_bank_id UUID NOT NULL REFERENCES blood_banks(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
