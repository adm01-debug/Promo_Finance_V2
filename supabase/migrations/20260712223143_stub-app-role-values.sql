-- Shim: adiciona valores manager/operator/viewer ao enum app_role que existem em
-- produção mas nunca foram adicionados por migration. Necessário para o replay do Preview.
-- Em produção o IF NOT EXISTS garante que é no-op.
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operator'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
