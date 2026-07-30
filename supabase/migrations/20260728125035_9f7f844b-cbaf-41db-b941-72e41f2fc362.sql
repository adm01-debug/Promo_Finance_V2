-- 1) MVA/CEST dos NCMs sujeitos a ST sem parâmetro
UPDATE public.ncms SET mva_padrao = v.mva, cest = v.cest, observacoes = coalesce(observacoes, v.obs), updated_at = now()
FROM (VALUES
  ('22011000','03.010.00',0.7000,NULL),
  ('22021000','03.007.00',0.7000,NULL),
  ('22029900','03.011.00',0.7000,NULL),
  ('22030000','03.021.00',1.4000,NULL),
  ('22042100','02.005.00',0.8000,NULL),
  ('27101249','06.001.00',0.0000,'ICMS monofásico ad rem — LC 192/2022; MVA não aplicável'),
  ('27101921','06.007.00',0.0000,'ICMS monofásico ad rem — LC 192/2022; MVA não aplicável'),
  ('27101932','06.006.00',0.0000,'ICMS monofásico ad rem — LC 192/2022; MVA não aplicável'),
  ('27111910','06.009.00',0.0000,'ICMS monofásico ad rem — LC 192/2022; MVA não aplicável'),
  ('22072010','06.003.00',0.0000,'ICMS monofásico ad rem — LC 192/2022; MVA não aplicável')
) AS v(codigo,cest,mva,obs)
WHERE ncms.codigo = v.codigo AND ncms.mva_padrao IS NULL;

-- 2) NCMs faltantes referenciados por protocolos de ST
INSERT INTO public.ncms (codigo, descricao, aliquota_ipi, cest, sujeito_st, mva_padrao)
VALUES
  ('87082999','Partes e acessórios de carroçarias de veículos',0.0500,'01.049.00',true,0.3656),
  ('87083090','Freios e servo-freios e suas partes',0.0500,'01.020.00',true,0.3656),
  ('87081000','Para-choques e suas partes',0.0500,'01.005.00',true,0.3656),
  ('85122029','Faróis e aparelhos de iluminação para veículos',0.0500,'01.070.00',true,0.3656),
  ('40130010','Câmaras de ar de borracha para veículos',0.0500,'01.099.00',true,0.3656),
  ('25232910','Cimento Portland comum',0.0000,'05.001.00',true,0.2000),
  ('25232100','Cimento Portland branco',0.0000,'05.001.00',true,0.2000)
ON CONFLICT (codigo) DO NOTHING;

UPDATE public.protocolos_st_ncms p
   SET ncm_id = n.id, updated_at = now()
  FROM public.ncms n
 WHERE p.ncm_id IS NULL AND n.codigo = p.ncm_codigo;

-- 3) Vínculo automático em inserções futuras
CREATE OR REPLACE FUNCTION public.protocolo_st_ncm_autolink()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $t$
BEGIN
  IF NEW.ncm_id IS NULL THEN
    SELECT n.id INTO NEW.ncm_id FROM public.ncms n WHERE n.codigo = NEW.ncm_codigo;
  END IF;
  RETURN NEW;
END;
$t$;

DROP TRIGGER IF EXISTS trg_protocolo_st_ncm_autolink ON public.protocolos_st_ncms;
CREATE TRIGGER trg_protocolo_st_ncm_autolink
  BEFORE INSERT OR UPDATE OF ncm_codigo ON public.protocolos_st_ncms
  FOR EACH ROW EXECUTE FUNCTION public.protocolo_st_ncm_autolink();

-- 4) Alíquota interna padrão das UFs faltantes (derivada do catálogo de UFs)
INSERT INTO public.aliquotas_internas_uf (uf, categoria_produto, aliquota, aliquota_fcp, base_legal, vigente_de)
SELECT u.sigla, 'padrao', u.aliquota_interna_padrao, u.aliquota_fcp,
       'RICMS ' || u.sigla || ' — alíquota interna geral', DATE '2026-01-01'
  FROM public.ufs u
 WHERE NOT EXISTS (
   SELECT 1 FROM public.aliquotas_internas_uf a
    WHERE a.uf = u.sigla AND a.categoria_produto IN ('GERAL','padrao')
 )
ON CONFLICT (uf, categoria_produto, vigente_de) DO NOTHING;

-- 5) Alíquota geral de ISS de Barueri/SP
INSERT INTO public.aliquotas_iss_municipal (codigo_ibge, municipio, uf, item_lista_id, aliquota, base_legal, vigente_de)
VALUES (3505708,'Barueri','SP',NULL,0.0200,'Lei Complementar Municipal 118/2002 (alíquota geral)',DATE '2024-01-01')
ON CONFLICT DO NOTHING;