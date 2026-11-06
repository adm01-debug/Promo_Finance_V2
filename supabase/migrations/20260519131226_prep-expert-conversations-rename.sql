-- Shim: expert_conversations foi criada em 20251215011104 já com colunas titulo/resumo;
-- 20260519131227 espera title e context_summary para fazer RENAME (42703)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_conversations' AND column_name = 'titulo'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_conversations' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.expert_conversations RENAME COLUMN titulo TO title;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_conversations' AND column_name = 'resumo'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_conversations' AND column_name = 'context_summary'
  ) THEN
    ALTER TABLE public.expert_conversations RENAME COLUMN resumo TO context_summary;
  END IF;
END $$;
