
-- Primeiro adicionar 'atrasado' ao enum status_pagamento
ALTER TYPE public.status_pagamento ADD VALUE IF NOT EXISTS 'atrasado';
