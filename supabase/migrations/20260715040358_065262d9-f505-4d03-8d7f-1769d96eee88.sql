
-- Drop old table
DROP TABLE IF EXISTS public.ot_records;

-- Departments
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their departments"
  ON public.departments
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER departments_set_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- OT day entries: one row per day+department entry, 10 employee slots
CREATE TABLE public.ot_day_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  work_date date NOT NULL,
  department text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  session_start time NOT NULL DEFAULT '16:00',
  session_end time NOT NULL DEFAULT '18:00',
  emp1_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  emp1_selected   boolean NOT NULL DEFAULT false,
  emp1_start_time time,
  emp1_end_time   time,
  emp1_total_hours numeric NOT NULL DEFAULT 0,
  emp2_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  emp2_selected   boolean NOT NULL DEFAULT false,
  emp2_start_time time,
  emp2_end_time   time,
  emp2_total_hours numeric NOT NULL DEFAULT 0,
  emp3_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  emp3_selected   boolean NOT NULL DEFAULT false,
  emp3_start_time time,
  emp3_end_time   time,
  emp3_total_hours numeric NOT NULL DEFAULT 0,
  emp4_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  emp4_selected   boolean NOT NULL DEFAULT false,
  emp4_start_time time,
  emp4_end_time   time,
  emp4_total_hours numeric NOT NULL DEFAULT 0,
  emp5_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  emp5_selected   boolean NOT NULL DEFAULT false,
  emp5_start_time time,
  emp5_end_time   time,
  emp5_total_hours numeric NOT NULL DEFAULT 0,
  emp6_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  emp6_selected   boolean NOT NULL DEFAULT false,
  emp6_start_time time,
  emp6_end_time   time,
  emp6_total_hours numeric NOT NULL DEFAULT 0,
  emp7_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  emp7_selected   boolean NOT NULL DEFAULT false,
  emp7_start_time time,
  emp7_end_time   time,
  emp7_total_hours numeric NOT NULL DEFAULT 0,
  emp8_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  emp8_selected   boolean NOT NULL DEFAULT false,
  emp8_start_time time,
  emp8_end_time   time,
  emp8_total_hours numeric NOT NULL DEFAULT 0,
  emp9_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  emp9_selected   boolean NOT NULL DEFAULT false,
  emp9_start_time time,
  emp9_end_time   time,
  emp9_total_hours numeric NOT NULL DEFAULT 0,
  emp10_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  emp10_selected   boolean NOT NULL DEFAULT false,
  emp10_start_time time,
  emp10_end_time   time,
  emp10_total_hours numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ot_day_entries TO authenticated;
GRANT ALL ON public.ot_day_entries TO service_role;

ALTER TABLE public.ot_day_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their day entries"
  ON public.ot_day_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX ot_day_entries_owner_date_idx
  ON public.ot_day_entries (owner_id, work_date);

CREATE TRIGGER ot_day_entries_set_updated_at
  BEFORE UPDATE ON public.ot_day_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-calc per-slot total hours
CREATE OR REPLACE FUNCTION public.calc_ot_day_entry_hours()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  i INT;
  s TIME;
  e TIME;
  m INT;
  sel BOOLEAN;
BEGIN
  FOR i IN 1..10 LOOP
    EXECUTE format(
      'SELECT ($1).emp%1$s_selected, ($1).emp%1$s_start_time, ($1).emp%1$s_end_time',
      i
    ) INTO sel, s, e USING NEW;

    IF sel AND s IS NOT NULL AND e IS NOT NULL THEN
      m := EXTRACT(EPOCH FROM (e - s)) / 60;
      IF m < 0 THEN
        m := m + 24 * 60;
      END IF;
      EXECUTE format(
        'SELECT ($1 #= hstore(%L, %L))::public.ot_day_entries',
        'emp' || i || '_total_hours',
        ROUND((m::NUMERIC) / 60.0, 2)::text
      ) INTO NEW USING NEW;
    ELSE
      EXECUTE format(
        'SELECT ($1 #= hstore(%L, %L))::public.ot_day_entries',
        'emp' || i || '_total_hours',
        '0'
      ) INTO NEW USING NEW;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE EXTENSION IF NOT EXISTS hstore;

CREATE TRIGGER ot_day_entries_calc_hours
  BEFORE INSERT OR UPDATE ON public.ot_day_entries
  FOR EACH ROW EXECUTE FUNCTION public.calc_ot_day_entry_hours();
