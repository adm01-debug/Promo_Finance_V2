-- Migration: Add 'atrasado' to status_pagamento enum and align status column types
--
-- Context: status_pagamento ENUM created by 20251214170739 lacks 'atrasado'.
-- Views in 20260317125441 use 'atrasado'::status_pagamento which would fail.
-- This migration runs after the ENUM is created and before the views.

-- Add missing value to ENUM (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.status_pagamento'::regtype
      AND enumlabel = 'atrasado'
  ) THEN
    ALTER TYPE public.status_pagamento ADD VALUE 'atrasado';
  END IF;
END
$$;

-- Change status column in contas_pagar from VARCHAR to status_pagamento enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contas_pagar'
      AND column_name = 'status'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE public.contas_pagar
      ALTER COLUMN status TYPE public.status_pagamento
        USING status::public.status_pagamento;
  END IF;
END
$$;

-- Change status column in contas_receber from VARCHAR to status_pagamento enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contas_receber'
      AND column_name = 'status'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE public.contas_receber
      ALTER COLUMN status TYPE public.status_pagamento
        USING status::public.status_pagamento;
  END IF;
END
$$;
