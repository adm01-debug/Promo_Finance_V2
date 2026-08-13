
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid;
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read profiles" ON public.profiles;
DROP POLICY IF EXISTS "users manage own profile" ON public.profiles;
CREATE POLICY "auth read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users manage own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
