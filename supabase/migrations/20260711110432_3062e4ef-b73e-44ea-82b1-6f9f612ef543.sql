
-- Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ MEMBERS ============
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  designation TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  default_start_time TIME NOT NULL DEFAULT '18:00',
  default_end_time TIME NOT NULL DEFAULT '20:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, employee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their members"
  ON public.members FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER members_set_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX members_owner_active_idx ON public.members (owner_id, is_active);

-- ============ OT RECORDS ============
CREATE TABLE public.ot_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  work_description TEXT NOT NULL DEFAULT '',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ot_records TO authenticated;
GRANT ALL ON public.ot_records TO service_role;

ALTER TABLE public.ot_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their OT records"
  ON public.ot_records FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX ot_records_owner_date_idx ON public.ot_records (owner_id, work_date DESC);
CREATE INDEX ot_records_member_idx ON public.ot_records (member_id);

-- Auto-calculate total_hours (supports overnight sessions)
CREATE OR REPLACE FUNCTION public.calc_ot_total_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  minutes INT;
BEGIN
  minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  IF minutes < 0 THEN
    minutes := minutes + 24 * 60; -- wrap past midnight
  END IF;
  NEW.total_hours := ROUND((minutes::NUMERIC) / 60.0, 2);
  RETURN NEW;
END;
$$;

CREATE TRIGGER ot_records_calc_hours
  BEFORE INSERT OR UPDATE OF start_time, end_time ON public.ot_records
  FOR EACH ROW EXECUTE FUNCTION public.calc_ot_total_hours();

CREATE TRIGGER ot_records_set_updated_at
  BEFORE UPDATE ON public.ot_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
