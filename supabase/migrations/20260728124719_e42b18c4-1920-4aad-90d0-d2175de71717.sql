-- Repartição LC 123/2006 (redação LC 155/2016) — percentuais por faixa
CREATE TEMP TABLE _rep(anexo text, faixa smallint, rep jsonb) ON COMMIT DROP;
INSERT INTO _rep VALUES
('I',1,'{"irpj":5.50,"csll":3.50,"cofins":12.74,"pis":2.76,"cpp":41.50,"icms":34.00}'),
('I',2,'{"irpj":5.50,"csll":3.50,"cofins":12.74,"pis":2.76,"cpp":41.50,"icms":34.00}'),
('I',3,'{"irpj":5.50,"csll":3.50,"cofins":12.74,"pis":2.76,"cpp":42.00,"icms":33.50}'),
('I',4,'{"irpj":5.50,"csll":3.50,"cofins":12.74,"pis":2.76,"cpp":42.00,"icms":33.50}'),
('I',5,'{"irpj":5.50,"csll":3.50,"cofins":12.74,"pis":2.76,"cpp":42.00,"icms":33.50}'),
('I',6,'{"irpj":13.50,"csll":10.00,"cofins":28.27,"pis":6.13,"cpp":42.10}'),
('II',1,'{"irpj":5.50,"csll":3.50,"cofins":11.51,"pis":2.49,"cpp":37.50,"ipi":7.50,"icms":32.00}'),
('II',2,'{"irpj":5.50,"csll":3.50,"cofins":11.51,"pis":2.49,"cpp":37.50,"ipi":7.50,"icms":32.00}'),
('II',3,'{"irpj":5.50,"csll":3.50,"cofins":11.51,"pis":2.49,"cpp":37.50,"ipi":7.50,"icms":32.00}'),
('II',4,'{"irpj":5.50,"csll":3.50,"cofins":11.51,"pis":2.49,"cpp":37.50,"ipi":7.50,"icms":32.00}'),
('II',5,'{"irpj":5.50,"csll":3.50,"cofins":11.51,"pis":2.49,"cpp":37.50,"ipi":7.50,"icms":32.00}'),
('II',6,'{"irpj":8.50,"csll":7.50,"cofins":20.96,"pis":4.54,"cpp":23.50,"ipi":35.00}'),
('III',1,'{"irpj":4.00,"csll":3.50,"cofins":12.82,"pis":2.78,"cpp":43.40,"iss":33.50}'),
('III',2,'{"irpj":4.00,"csll":3.50,"cofins":14.05,"pis":3.05,"cpp":43.40,"iss":32.00}'),
('III',3,'{"irpj":4.00,"csll":3.50,"cofins":13.64,"pis":2.96,"cpp":43.40,"iss":32.50}'),
('III',4,'{"irpj":4.00,"csll":3.50,"cofins":13.64,"pis":2.96,"cpp":43.40,"iss":32.50}'),
('III',5,'{"irpj":4.00,"csll":3.50,"cofins":12.82,"pis":2.78,"cpp":43.40,"iss":33.50}'),
('III',6,'{"irpj":35.00,"csll":15.00,"cofins":16.03,"pis":3.47,"cpp":30.50}'),
('IV',1,'{"irpj":18.80,"csll":15.20,"cofins":17.67,"pis":3.83,"iss":44.50}'),
('IV',2,'{"irpj":19.80,"csll":15.20,"cofins":20.55,"pis":4.45,"iss":40.00}'),
('IV',3,'{"irpj":20.80,"csll":15.20,"cofins":19.73,"pis":4.27,"iss":40.00}'),
('IV',4,'{"irpj":17.80,"csll":19.20,"cofins":18.90,"pis":4.10,"iss":40.00}'),
('IV',5,'{"irpj":18.80,"csll":19.20,"cofins":18.08,"pis":3.92,"iss":40.00}'),
('IV',6,'{"irpj":53.50,"csll":21.50,"cofins":20.55,"pis":4.45}'),
('V',1,'{"irpj":25.00,"csll":15.00,"cofins":14.10,"pis":3.05,"cpp":28.85,"iss":14.00}'),
('V',2,'{"irpj":23.00,"csll":15.00,"cofins":14.10,"pis":3.05,"cpp":27.85,"iss":17.00}'),
('V',3,'{"irpj":24.00,"csll":15.00,"cofins":14.92,"pis":3.23,"cpp":23.85,"iss":19.00}'),
('V',4,'{"irpj":21.00,"csll":15.00,"cofins":15.74,"pis":3.41,"cpp":23.85,"iss":21.00}'),
('V',5,'{"irpj":23.00,"csll":12.50,"cofins":14.10,"pis":3.05,"cpp":23.85,"iss":23.50}'),
('V',6,'{"irpj":35.00,"csll":15.50,"cofins":16.44,"pis":3.56,"cpp":29.50}');

UPDATE public.faixas_simples_nacional f
   SET reparticao = r.rep, updated_at = now()
  FROM _rep r
 WHERE f.anexo = r.anexo AND f.faixa = r.faixa
   AND (f.reparticao = '{}'::jsonb OR f.reparticao IS NULL);

-- Invariante: soma dos percentuais deve fechar 100% (tolerância 0,01 p.p.)
CREATE OR REPLACE FUNCTION public.faixa_simples_reparticao_valida(_rep jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT _rep = '{}'::jsonb
      OR abs(100 - coalesce((SELECT sum((value)::numeric) FROM jsonb_each_text(_rep)), 0)) <= 0.01;
$$;

ALTER TABLE public.faixas_simples_nacional
  ADD CONSTRAINT faixas_simples_reparticao_soma_chk
  CHECK (public.faixa_simples_reparticao_valida(reparticao)) NOT VALID;

ALTER TABLE public.faixas_simples_nacional VALIDATE CONSTRAINT faixas_simples_reparticao_soma_chk;