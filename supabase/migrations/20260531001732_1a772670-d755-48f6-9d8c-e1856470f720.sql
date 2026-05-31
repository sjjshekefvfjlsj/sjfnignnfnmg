CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name text NOT NULL DEFAULT 'ديليفري',
  app_password text NOT NULL DEFAULT '1185',
  max_attempts integer NOT NULL DEFAULT 10,
  lock_hours integer NOT NULL DEFAULT 3,
  currency text NOT NULL DEFAULT 'ج.م',
  rep_name text,
  rep_phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Public can insert app_settings" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update app_settings" ON public.app_settings FOR UPDATE USING (true);
CREATE POLICY "Public can delete app_settings" ON public.app_settings FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (site_name, app_password, max_attempts, lock_hours, currency)
VALUES ('ديليفري', '1185', 10, 3, 'ج.م');