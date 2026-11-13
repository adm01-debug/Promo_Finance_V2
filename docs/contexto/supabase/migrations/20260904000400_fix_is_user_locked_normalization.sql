CREATE OR REPLACE FUNCTION public.is_user_locked — normaliza email com lower(btrim) antes de chamar get_lockout_details
