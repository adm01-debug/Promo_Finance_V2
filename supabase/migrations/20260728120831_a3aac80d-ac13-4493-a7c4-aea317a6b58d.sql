-- ============================================================
-- SEED CATÁLOGOS FISCAIS COMPLETOS (idempotente)
-- ============================================================

-- ===== 1. UFs: parâmetros de ICMS =====
UPDATE public.ufs u SET
  aliquota_interna_padrao = v.aliq,
  possui_fcp = v.fcp,
  aliquota_fcp = v.aliq_fcp,
  exige_antecipacao = v.antec,
  difal_base_dupla = v.dupla,
  observacoes = COALESCE(v.obs, u.observacoes),
  updated_at = now()
FROM (VALUES
  ('AC',0.19,FALSE,0.00,FALSE,FALSE,NULL::text),
  ('AL',0.19,TRUE ,0.01,FALSE,TRUE ,'FCP 1% + Prodesin'),
  ('AM',0.20,FALSE,0.00,FALSE,FALSE,'ZFM: isenção para industrializados com PPB'),
  ('AP',0.18,FALSE,0.00,FALSE,FALSE,NULL),
  ('BA',0.205,TRUE,0.02,TRUE ,FALSE,'FECP embutido em alguns produtos'),
  ('CE',0.20,TRUE ,0.02,FALSE,FALSE,'FCP 2%'),
  ('DF',0.18,FALSE,0.00,FALSE,FALSE,NULL),
  ('ES',0.17,FALSE,0.00,FALSE,FALSE,'COMPETE-ES + FUNDAP para importadores'),
  ('GO',0.19,FALSE,0.00,TRUE ,TRUE ,'PRODUZIR-GO'),
  ('MA',0.20,TRUE ,0.02,TRUE ,TRUE ,'FCP 2%'),
  ('MT',0.17,FALSE,0.00,TRUE ,TRUE ,NULL),
  ('MS',0.17,FALSE,0.00,TRUE ,FALSE,'MS Empreendedor'),
  ('MG',0.18,FALSE,0.00,FALSE,FALSE,'Crédito outorgado para embalagens'),
  ('PA',0.19,FALSE,0.00,TRUE ,FALSE,NULL),
  ('PB',0.20,TRUE ,0.02,FALSE,TRUE ,'FCP 2%'),
  ('PR',0.19,FALSE,0.00,FALSE,TRUE ,'Paraná Competitivo'),
  ('PE',0.205,TRUE,0.02,TRUE ,FALSE,'FECP 2% adicional'),
  ('PI',0.21,FALSE,0.00,TRUE ,TRUE ,NULL),
  ('RJ',0.20,TRUE ,0.02,FALSE,TRUE ,'FECP 2% embutido na alíquota padrão'),
  ('RN',0.18,FALSE,0.00,FALSE,FALSE,NULL),
  ('RS',0.18,FALSE,0.00,FALSE,TRUE ,'Exige complemento de ST'),
  ('RO',0.195,FALSE,0.00,FALSE,FALSE,NULL),
  ('RR',0.20,TRUE ,0.02,FALSE,TRUE ,'FCP 2%'),
  ('SC',0.17,FALSE,0.00,FALSE,TRUE ,'TTD 409 para importadores'),
  ('SP',0.18,FALSE,0.00,FALSE,FALSE,NULL),
  ('SE',0.19,TRUE ,0.02,FALSE,TRUE ,'FCP 2%'),
  ('TO',0.18,FALSE,0.00,FALSE,TRUE ,NULL)
) AS v(sigla,aliq,fcp,aliq_fcp,antec,dupla,obs)
WHERE u.sigla::text = v.sigla;

-- ===== 2. Alíquotas internas por categoria de produto =====
INSERT INTO public.aliquotas_internas_uf (uf, categoria_produto, aliquota, base_legal, vigente_de)
SELECT v.uf::uf_brasil, v.cat, v.aliq, v.base, DATE '2026-01-01'
FROM (VALUES
  ('SP','padrao',0.18,'RICMS-SP art. 52'),
  ('SP','automoveis',0.12,'RICMS-SP art. 54 V'),
  ('SP','combustiveis_gasolina',0.25,'RICMS-SP art. 54 II'),
  ('SP','combustiveis_diesel',0.12,'RICMS-SP art. 54'),
  ('SP','energia_eletrica_baixa',0.12,'RICMS-SP art. 54'),
  ('SP','energia_eletrica_alta',0.25,'RICMS-SP art. 54 II'),
  ('SP','telecomunicacoes',0.25,'RICMS-SP art. 54 II'),
  ('SP','bebidas_alcoolicas',0.25,'RICMS-SP art. 54 II'),
  ('SP','cigarros',0.25,'RICMS-SP art. 54 II'),
  ('SP','cosmeticos_perfumaria',0.25,'RICMS-SP art. 54 II'),
  ('SP','armas_municao',0.25,'RICMS-SP art. 54 II'),
  ('SP','cervejas',0.25,'RICMS-SP art. 54 II'),
  ('SP','refrigerantes',0.18,'RICMS-SP art. 52'),
  ('SP','medicamentos_lista_positiva',0.00,'Convênio ICMS 87/2002'),
  ('SP','leite',0.07,'RICMS-SP art. 54 IX'),
  ('SP','produtos_cesta_basica',0.07,'RICMS-SP art. 54'),
  ('SP','horticultura',0.00,'RICMS-SP isenção'),
  ('SP','livros_jornais_revistas',0.00,'CF/88 imunidade'),
  ('SP','brindes_corporativos',0.18,'RICMS-SP art. 52'),
  ('RJ','padrao',0.20,'RICMS-RJ + Lei 4.056/02'),
  ('RJ','automoveis',0.16,'RICMS-RJ'),
  ('RJ','combustiveis_gasolina',0.34,'RICMS-RJ'),
  ('RJ','energia_eletrica',0.32,'RICMS-RJ'),
  ('RJ','telecomunicacoes',0.32,'RICMS-RJ'),
  ('RJ','bebidas_alcoolicas',0.32,'RICMS-RJ'),
  ('RJ','cigarros',0.34,'RICMS-RJ'),
  ('RJ','cosmeticos_perfumaria',0.32,'RICMS-RJ'),
  ('RJ','cervejas',0.32,'RICMS-RJ'),
  ('RJ','medicamentos',0.20,'RICMS-RJ'),
  ('RJ','leite',0.07,'RICMS-RJ'),
  ('RJ','produtos_cesta_basica',0.07,'RICMS-RJ'),
  ('RJ','livros_jornais_revistas',0.00,'CF/88 imunidade'),
  ('MG','padrao',0.18,'RICMS-MG art. 42'),
  ('MG','automoveis',0.12,'RICMS-MG'),
  ('MG','combustiveis_gasolina',0.27,'RICMS-MG'),
  ('MG','energia_eletrica',0.30,'RICMS-MG'),
  ('MG','telecomunicacoes',0.27,'RICMS-MG'),
  ('MG','bebidas_alcoolicas',0.27,'RICMS-MG'),
  ('MG','cervejas',0.27,'RICMS-MG'),
  ('MG','medicamentos',0.18,'RICMS-MG'),
  ('MG','leite',0.07,'RICMS-MG'),
  ('ES','padrao',0.17,'RICMS-ES'),
  ('PR','padrao',0.19,'RICMS-PR'),
  ('SC','padrao',0.17,'RICMS-SC'),
  ('RS','padrao',0.18,'RICMS-RS'),
  ('BA','padrao',0.205,'RICMS-BA + FECP'),
  ('PE','padrao',0.205,'RICMS-PE + FECP'),
  ('GO','padrao',0.19,'RICMS-GO'),
  ('MT','padrao',0.17,'RICMS-MT'),
  ('MS','padrao',0.17,'RICMS-MS'),
  ('AL','padrao',0.19,'RICMS-AL'),
  ('AM','padrao',0.20,'RICMS-AM (ZFM)'),
  ('DF','padrao',0.18,'RICMS-DF'),
  ('AC','padrao',0.19,'RICMS-AC')
) AS v(uf,cat,aliq,base)
ON CONFLICT (uf, categoria_produto, vigente_de) DO NOTHING;

-- ===== 3. CNAEs =====
INSERT INTO public.cnaes (codigo, descricao, anexo_simples, sujeito_fator_r, vedado_simples, presuncao_irpj, presuncao_csll, rat_padrao, atividade)
SELECT v.codigo, v.descricao, v.anexo, v.fator_r, v.vedado, v.irpj, v.csll, v.rat, v.ativ::atividade_economica
FROM (VALUES
  ('32.99-0/99','Fabricação de produtos diversos NCOP','II',FALSE,FALSE,0.08,0.12,0.03,'INDUSTRIA'),
  ('22.21-8/00','Fabricação de embalagens plásticas','II',FALSE,FALSE,0.08,0.12,0.03,'INDUSTRIA'),
  ('17.32-0/00','Fabricação de embalagens de papel','II',FALSE,FALSE,0.08,0.12,0.03,'INDUSTRIA'),
  ('26.21-3/00','Fabricação de equipamentos de informática','II',FALSE,FALSE,0.08,0.12,0.03,'INDUSTRIA'),
  ('28.61-5/00','Fabricação de máquinas para a indústria','II',FALSE,FALSE,0.08,0.12,0.03,'INDUSTRIA'),
  ('30.99-7/00','Fabricação de equipamentos de transporte','II',FALSE,FALSE,0.08,0.12,0.03,'INDUSTRIA'),
  ('32.50-7/01','Fabricação de instrumentos médicos','II',FALSE,FALSE,0.08,0.12,0.03,'INDUSTRIA'),
  ('47.51-2/00','Comércio varejista de informática','I',FALSE,FALSE,0.08,0.12,0.02,'COMERCIO'),
  ('46.49-4/99','Comércio atacadista de produtos diversos','I',FALSE,FALSE,0.08,0.12,0.02,'COMERCIO'),
  ('47.81-4/00','Comércio varejista de vestuário','I',FALSE,FALSE,0.08,0.12,0.02,'COMERCIO'),
  ('47.71-7/01','Comércio varejista de medicamentos','I',FALSE,FALSE,0.08,0.12,0.02,'COMERCIO'),
  ('47.31-8/00','Comércio varejista de combustíveis','I',FALSE,FALSE,0.08,0.12,0.02,'COMERCIO'),
  ('62.01-5/00','Desenvolvimento de software sob encomenda','V',TRUE,FALSE,0.32,0.32,0.01,'SERVICOS'),
  ('62.02-3/00','Desenvolvimento e licenciamento de software','V',TRUE,FALSE,0.32,0.32,0.01,'SERVICOS'),
  ('72.10-0/00','Pesquisa e desenvolvimento experimental','V',TRUE,FALSE,0.32,0.32,0.01,'SERVICOS'),
  ('69.20-6/01','Atividades de contabilidade','III',FALSE,FALSE,0.32,0.32,0.01,'SERVICOS'),
  ('69.11-7/01','Serviços advocatícios','IV',FALSE,FALSE,0.32,0.32,0.01,'SERVICOS'),
  ('71.12-0/00','Serviços de engenharia','III',FALSE,FALSE,0.32,0.32,0.01,'SERVICOS'),
  ('70.20-4/00','Consultoria empresarial','III',FALSE,FALSE,0.32,0.32,0.01,'SERVICOS'),
  ('41.20-4/00','Construção de edifícios','IV',FALSE,FALSE,0.08,0.12,0.03,'SERVICOS'),
  ('86.10-1/01','Atividades de atendimento hospitalar','III',FALSE,FALSE,0.32,0.32,0.02,'SERVICOS'),
  ('49.30-2/01','Transporte rodoviário de carga','III',FALSE,FALSE,0.16,0.12,0.03,'SERVICOS')
) AS v(codigo,descricao,anexo,fator_r,vedado,irpj,csll,rat,ativ)
ON CONFLICT (codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  anexo_simples = EXCLUDED.anexo_simples,
  presuncao_irpj = EXCLUDED.presuncao_irpj,
  presuncao_csll = EXCLUDED.presuncao_csll,
  rat_padrao = EXCLUDED.rat_padrao,
  updated_at = now();

-- ===== 4. NCMs =====
INSERT INTO public.ncms (codigo, descricao, aliquota_ipi, cest, sujeito_st, monofasico_pis_cofins, mva_padrao, observacoes)
SELECT v.codigo, v.descricao, v.ipi, v.cest, v.st, v.mono, v.mva, v.obs
FROM (VALUES
  ('96081000','Canetas esferográficas',0.05,'20.001.00',TRUE,FALSE,0.31,NULL::text),
  ('48201000','Diários e blocos de notas',0.00,NULL,FALSE,FALSE,NULL,NULL),
  ('69120000','Louça e artigos de cerâmica',0.10,NULL,FALSE,FALSE,NULL,NULL),
  ('61091000','Camisetas de algodão',0.00,NULL,FALSE,FALSE,NULL,NULL),
  ('65050000','Chapéus e artefatos similares',0.00,NULL,FALSE,FALSE,NULL,NULL),
  ('42029200','Bolsas e mochilas plásticas',0.15,NULL,FALSE,FALSE,NULL,NULL),
  ('96170010','Garrafas térmicas',0.10,NULL,FALSE,FALSE,NULL,NULL),
  ('83081000','Fechos, fivelas e ganchos',0.05,NULL,FALSE,FALSE,NULL,NULL),
  ('85235110','Cartões de gravação magnética',0.15,'21.063.00',TRUE,FALSE,0.54,NULL),
  ('48239099','Outros artigos de papel',0.00,NULL,FALSE,FALSE,NULL,NULL),
  ('85044030','Conversores estáticos (carregadores)',0.15,NULL,FALSE,FALSE,NULL,NULL),
  ('66011000','Guarda-chuvas',0.05,NULL,FALSE,FALSE,NULL,NULL),
  ('63079010','Cordões e suspensórios',0.00,NULL,FALSE,FALSE,NULL,NULL),
  ('71171900','Bijuterias',0.10,NULL,FALSE,FALSE,NULL,NULL),
  ('49119100','Estampas, gravuras e fotografias',0.00,NULL,FALSE,FALSE,NULL,NULL),
  ('63079090','Outros artigos têxteis',0.00,NULL,FALSE,FALSE,NULL,NULL),
  ('95030099','Brinquedos diversos',0.20,NULL,FALSE,FALSE,NULL,NULL),
  ('84701000','Calculadoras eletrônicas',0.15,NULL,FALSE,FALSE,NULL,NULL),
  ('90251900','Termômetros não líquidos',0.15,NULL,FALSE,FALSE,NULL,NULL),
  ('27101249','Gasolina automotiva',0.00,NULL,TRUE,TRUE,NULL,'Monofásico - combustíveis'),
  ('27101921','Querosene de aviação',0.00,NULL,TRUE,TRUE,NULL,'Monofásico - combustíveis'),
  ('27101932','Óleo diesel',0.00,NULL,TRUE,TRUE,NULL,'Monofásico - combustíveis'),
  ('27111910','GLP (botijão)',0.00,NULL,TRUE,TRUE,NULL,'Monofásico - combustíveis'),
  ('22072010','Etanol anidro combustível',0.00,NULL,TRUE,TRUE,NULL,'Monofásico - combustíveis'),
  ('30041000','Medicamentos com penicilinas',0.00,NULL,TRUE,TRUE,0.42,'Monofásico - medicamentos lista positiva'),
  ('30043100','Insulina',0.00,NULL,TRUE,TRUE,0.42,'Monofásico - medicamentos lista positiva'),
  ('30066000','Contraceptivos',0.00,NULL,TRUE,TRUE,0.42,'Monofásico - medicamentos lista positiva'),
  ('33030010','Perfumes',0.42,'20.063.00',TRUE,TRUE,0.71,'Monofásico - perfumaria e cosméticos'),
  ('33030020','Águas-de-colônia',0.42,NULL,TRUE,TRUE,0.71,'Monofásico - perfumaria e cosméticos'),
  ('33041000','Maquiagem labial',0.22,NULL,TRUE,TRUE,0.71,'Monofásico - perfumaria e cosméticos'),
  ('33042010','Sombras',0.22,NULL,TRUE,TRUE,0.71,'Monofásico - perfumaria e cosméticos'),
  ('33051000','Xampus',0.22,NULL,TRUE,TRUE,0.71,'Monofásico - perfumaria e cosméticos'),
  ('33071000','Desodorantes',0.22,NULL,TRUE,TRUE,0.71,'Monofásico - perfumaria e cosméticos'),
  ('34011190','Sabonetes em barra',0.10,NULL,TRUE,TRUE,0.71,'Monofásico - perfumaria e cosméticos'),
  ('22011000','Águas minerais',0.00,NULL,TRUE,TRUE,NULL,'Monofásico - bebidas frias'),
  ('22021000','Refrigerantes',0.00,NULL,TRUE,TRUE,NULL,'Monofásico - bebidas frias'),
  ('22029900','Isotônicos e energéticos',0.00,NULL,TRUE,TRUE,NULL,'Monofásico - bebidas frias'),
  ('22030000','Cerveja de malte',0.06,NULL,TRUE,TRUE,NULL,'Monofásico - bebidas frias'),
  ('22042100','Vinho em garrafa',0.10,NULL,TRUE,TRUE,NULL,'Monofásico - bebidas frias'),
  ('40111000','Pneus para automóveis',0.15,NULL,TRUE,TRUE,0.71,'Monofásico - pneus e câmaras'),
  ('40112010','Pneus para caminhões',0.15,NULL,TRUE,TRUE,0.71,'Monofásico - pneus e câmaras'),
  ('84073400','Motores',0.10,NULL,TRUE,TRUE,0.71,'Monofásico - autopeças'),
  ('87083010','Freios e suas partes',0.10,NULL,TRUE,TRUE,0.71,'Monofásico - autopeças'),
  ('87089990','Outras peças automotivas',0.10,NULL,TRUE,TRUE,0.71,'Monofásico - autopeças')
) AS v(codigo,descricao,ipi,cest,st,mono,mva,obs)
ON CONFLICT (codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  aliquota_ipi = EXCLUDED.aliquota_ipi,
  cest = COALESCE(EXCLUDED.cest, public.ncms.cest),
  sujeito_st = EXCLUDED.sujeito_st,
  monofasico_pis_cofins = EXCLUDED.monofasico_pis_cofins,
  mva_padrao = COALESCE(EXCLUDED.mva_padrao, public.ncms.mva_padrao),
  updated_at = now();

-- ===== 5. Protocolos ST =====
INSERT INTO public.protocolos_st (codigo, nome, descricao, segmento, base_legal, vigente_de)
SELECT v.codigo, v.nome, v.descricao, v.segmento, v.base, v.de::date
FROM (VALUES
  ('ICMS 33/2011','Protocolo ICMS 33/2011','Material de escritório (canetas, lápis, borrachas)','Material de escritório','Protocolo ICMS 33/2011','2011-08-01'),
  ('ICMS 192/2009','Protocolo ICMS 192/2009','Materiais de informática','Informática','Protocolo ICMS 192/2009','2009-11-01'),
  ('ICMS 142/2018','Convênio ICMS 142/2018','Regras gerais de ST e MVA ajustada','Geral','Convênio ICMS 142/2018','2019-01-01'),
  ('ICMS 110/2007','Convênio ICMS 110/2007','Combustíveis e lubrificantes','Combustíveis','Convênio ICMS 110/2007','2007-10-01'),
  ('ICMS 213/2017','Convênio ICMS 213/2017','Medicamentos (listas positiva e negativa)','Medicamentos','Convênio ICMS 213/2017','2018-01-01'),
  ('ICMS 196/2009','Protocolo ICMS 196/2009','Cosméticos e perfumaria','Cosméticos','Protocolo ICMS 196/2009','2009-12-01')
) AS v(codigo,nome,descricao,segmento,base,de)
ON CONFLICT (codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  segmento = EXCLUDED.segmento,
  base_legal = EXCLUDED.base_legal,
  updated_at = now();

-- ===== 6. Adesões de UFs aos protocolos =====
INSERT INTO public.protocolos_st_ufs (protocolo_id, uf, papel)
SELECT p.id, v.uf::uf_brasil, 'AMBOS'
FROM (VALUES
  ('ICMS 33/2011','SP'),('ICMS 33/2011','MG'),('ICMS 33/2011','RJ'),
  ('ICMS 33/2011','RS'),('ICMS 33/2011','PR'),('ICMS 33/2011','SC'),
  ('ICMS 192/2009','SP'),('ICMS 192/2009','MG'),('ICMS 192/2009','RJ'),
  ('ICMS 192/2009','PR'),('ICMS 192/2009','RS'),('ICMS 192/2009','SC'),
  ('ICMS 192/2009','BA'),('ICMS 192/2009','PE'),('ICMS 192/2009','GO'),
  ('ICMS 213/2017','SP'),('ICMS 213/2017','MG'),('ICMS 213/2017','RJ'),
  ('ICMS 213/2017','PR'),('ICMS 213/2017','RS'),('ICMS 213/2017','SC'),
  ('ICMS 213/2017','BA'),('ICMS 213/2017','PE'),('ICMS 213/2017','GO'),
  ('ICMS 196/2009','SP'),('ICMS 196/2009','MG'),('ICMS 196/2009','RJ'),
  ('ICMS 196/2009','PR'),('ICMS 196/2009','RS'),('ICMS 196/2009','SC')
) AS v(protocolo,uf)
JOIN public.protocolos_st p ON p.codigo = v.protocolo
ON CONFLICT (protocolo_id, uf) DO NOTHING;

-- Convênios gerais: adesão de todas as UFs
INSERT INTO public.protocolos_st_ufs (protocolo_id, uf, papel)
SELECT p.id, u.sigla, 'AMBOS'
FROM public.protocolos_st p
CROSS JOIN public.ufs u
WHERE p.codigo IN ('ICMS 142/2018','ICMS 110/2007')
ON CONFLICT (protocolo_id, uf) DO NOTHING;

-- ===== 7. NCMs por protocolo =====
INSERT INTO public.protocolos_st_ncms (protocolo_id, ncm_id, ncm_codigo, mva_original, cest)
SELECT p.id, n.id, v.ncm, v.mva, n.cest
FROM (VALUES
  ('ICMS 33/2011','96081000',0.31),
  ('ICMS 192/2009','85235110',0.54),
  ('ICMS 41/2008','87083010',0.71),
  ('ICMS 41/2008','87089990',0.71),
  ('ICMS 41/2008','84073400',0.71),
  ('ICMS 41/2008','40111000',0.71),
  ('ICMS 41/2008','40112010',0.71),
  ('ICMS 110/2007','27101249',NULL::numeric),
  ('ICMS 110/2007','27101932',NULL),
  ('ICMS 110/2007','27111910',NULL),
  ('ICMS 213/2017','30041000',0.42),
  ('ICMS 213/2017','30043100',0.42),
  ('ICMS 213/2017','30066000',0.42),
  ('ICMS 196/2009','33030010',0.71),
  ('ICMS 196/2009','33041000',0.71),
  ('ICMS 196/2009','33051000',0.71),
  ('ICMS 196/2009','33071000',0.71)
) AS v(protocolo,ncm,mva)
JOIN public.protocolos_st p ON p.codigo = v.protocolo
JOIN public.ncms n ON n.codigo = v.ncm
ON CONFLICT (protocolo_id, ncm_codigo) DO UPDATE SET
  mva_original = COALESCE(EXCLUDED.mva_original, public.protocolos_st_ncms.mva_original),
  updated_at = now();

-- ===== 8. Benefícios fiscais estaduais =====
INSERT INTO public.beneficios_fiscais (codigo, nome, uf, tipo, descricao, percentual, criterios, base_legal, vigente_de)
SELECT v.codigo, v.nome, v.uf::uf_brasil, v.tipo, v.descricao, v.pct, v.criterios::jsonb, v.base, DATE '2020-01-01'
FROM (VALUES
  ('GO_PRODUZIR','Programa PRODUZIR','GO','FINANCIAMENTO','Financiamento de 73% do ICMS devido por até 15 anos',0.50,'{"regime":"QUALQUER","atividade":"INDUSTRIA","uf_obrigatoria":"GO","risco":"BAIXO"}','Lei 13.591/2000'),
  ('MG_CREDITO_OUTORGADO_EMBALAGENS','Crédito Outorgado Embalagens MG','MG','CREDITO_OUTORGADO','Crédito outorgado de 5% para fabricantes de embalagens',0.28,'{"regime":"QUALQUER","cnae_prefix":"17","uf_obrigatoria":"MG","risco":"BAIXO"}','Decreto 43.080 art. 65'),
  ('SC_TTD_409','TTD 409 - Tratamento Tributário Diferenciado SC','SC','CREDITO_PRESUMIDO','Crédito presumido de 2,5% sobre importação por Santa Catarina',0.85,'{"regime":"QUALQUER","importa":true,"uf_obrigatoria":"SC","risco":"MEDIO"}','TTD 409/2017'),
  ('ES_COMPETE_ES','COMPETE-ES','ES','DIFERIMENTO','Diferimento de ICMS na importação e redução de base de cálculo',0.40,'{"regime":"QUALQUER","importa":true,"uf_obrigatoria":"ES","risco":"MEDIO"}','Lei 10.973/2018'),
  ('SP_PROAIM','PROAIM - Incentivo Municipal SP','SP','INCENTIVO_MUNICIPAL','Incentivos municipais variados no município de São Paulo',0.15,'{"regime":"QUALQUER","municipio":"São Paulo","uf_obrigatoria":"SP","risco":"BAIXO"}','Decreto 62.560/2017'),
  ('PR_PARANA_COMPETITIVO','Paraná Competitivo','PR','DIFERIMENTO','Diferimento de ICMS e isenção de até 80% por 15 anos',0.60,'{"regime":"QUALQUER","atividade":"INDUSTRIA","uf_obrigatoria":"PR","risco":"MEDIO"}','Lei 19.530/2018'),
  ('MS_EMPREENDEDOR','MS Empreendedor','MS','CREDITO_OUTORGADO','Crédito outorgado de 67% do ICMS para indústrias',0.45,'{"regime":"QUALQUER","atividade":"INDUSTRIA","uf_obrigatoria":"MS","risco":"MEDIO"}','Lei 4.049/2010'),
  ('AM_ZFM','Zona Franca de Manaus','AM','ISENCAO','Isenção total para empresas com processo produtivo básico aprovado',0.95,'{"regime":"QUALQUER","tem_zfm_aprovado":true,"uf_obrigatoria":"AM","risco":"ALTO"}','Lei 10.176/2001'),
  ('AL_PRODESIN','Prodesin AL','AL','ISENCAO','Isenção e diferimento de ICMS para novas indústrias',0.70,'{"regime":"QUALQUER","atividade":"INDUSTRIA","uf_obrigatoria":"AL","risco":"MEDIO"}','Lei 5.671/1995')
) AS v(codigo,nome,uf,tipo,descricao,pct,criterios,base)
ON CONFLICT (codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  percentual = EXCLUDED.percentual,
  criterios = EXCLUDED.criterios,
  updated_at = now();

-- ===== 9. Itens da lista de serviços LC 116/2003 =====
INSERT INTO public.itens_lista_iss (codigo, descricao, retem_no_tomador, aliquota_minima, aliquota_maxima)
SELECT v.codigo, v.descricao, v.retem, 0.02, 0.05
FROM (VALUES
  ('1.01','Análise e desenvolvimento de sistemas',FALSE),
  ('1.03','Processamento, armazenamento ou hospedagem de dados',FALSE),
  ('1.04','Elaboração de programas de computador, inclusive de jogos',FALSE),
  ('1.05','Licenciamento ou cessão de direito de uso de software',FALSE),
  ('1.06','Assessoria e consultoria em informática',FALSE),
  ('1.07','Suporte técnico em informática',FALSE),
  ('1.08','Planejamento e elaboração de sistemas',FALSE),
  ('3.02','Cessão de direitos sobre marcas',FALSE),
  ('3.04','Locação de bens móveis',FALSE),
  ('4.01','Medicina e biomedicina',FALSE),
  ('4.02','Análises clínicas e patológicas',FALSE),
  ('4.03','Hospitais, clínicas e laboratórios',FALSE),
  ('4.22','Planos de medicina de grupo',TRUE),
  ('7.01','Engenharia, agronomia, agrimensura e projetos',FALSE),
  ('7.02','Execução de obra de construção civil',TRUE),
  ('7.03','Elaboração de projeto básico e executivo',FALSE),
  ('7.05','Reparação, conservação e reforma',TRUE),
  ('7.10','Limpeza, manutenção e conservação',TRUE),
  ('7.11','Decoração e jardinagem',FALSE),
  ('7.12','Controle e tratamento de efluentes',FALSE),
  ('10.02','Agenciamento e corretagem em geral',FALSE),
  ('10.05','Agenciamento de seguros',FALSE),
  ('11.01','Guarda e estacionamento de veículos',FALSE),
  ('11.02','Vigilância, segurança ou monitoramento',TRUE),
  ('12.07','Shows, óperas, balés e danças',TRUE),
  ('12.13','Produção de eventos e espetáculos',TRUE),
  ('17.01','Assessoria e consultoria em geral',FALSE),
  ('17.06','Propaganda e publicidade',FALSE),
  ('17.13','Advocacia',FALSE),
  ('17.14','Arbitragem',FALSE),
  ('17.19','Contabilidade, auditoria e perícia',FALSE),
  ('17.20','Consultoria em recursos humanos',FALSE),
  ('17.22','Atuária',FALSE)
) AS v(codigo,descricao,retem)
ON CONFLICT (codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  retem_no_tomador = EXCLUDED.retem_no_tomador,
  updated_at = now();

-- ===== 10. Alíquotas de ISS por município =====
INSERT INTO public.aliquotas_iss_municipal (codigo_ibge, municipio, uf, item_lista_id, aliquota, base_legal, vigente_de)
SELECT v.ibge, v.municipio, v.uf::uf_brasil, i.id, v.aliq, v.base, DATE '2020-01-01'
FROM (VALUES
  (3550308,'São Paulo','SP','1.01',0.0290,'Lei 13.701/2003'),
  (3550308,'São Paulo','SP','1.04',0.0290,'Lei 13.701/2003'),
  (3550308,'São Paulo','SP','1.05',0.0290,'Lei 13.701/2003'),
  (3550308,'São Paulo','SP','17.01',0.0500,'Lei 13.701/2003'),
  (3550308,'São Paulo','SP','17.13',0.0500,'Lei 13.701/2003'),
  (3550308,'São Paulo','SP','17.19',0.0500,'Lei 13.701/2003'),
  (3550308,'São Paulo','SP','4.01',0.0200,'Lei 13.701/2003'),
  (3550308,'São Paulo','SP','7.02',0.0500,'Lei 13.701/2003'),
  (3550308,'São Paulo','SP','11.02',0.0500,'Lei 13.701/2003'),
  (3505708,'Barueri','SP','1.01',0.0200,'Lei Municipal de Barueri'),
  (3505708,'Barueri','SP','1.04',0.0200,'Lei Municipal de Barueri'),
  (3505708,'Barueri','SP','1.05',0.0200,'Lei Municipal de Barueri'),
  (3505708,'Barueri','SP','17.01',0.0200,'Lei Municipal de Barueri'),
  (3505708,'Barueri','SP','17.06',0.0200,'Lei Municipal de Barueri'),
  (3304557,'Rio de Janeiro','RJ','1.01',0.0500,'Lei 691/1984'),
  (3304557,'Rio de Janeiro','RJ','1.04',0.0500,'Lei 691/1984'),
  (3304557,'Rio de Janeiro','RJ','1.05',0.0500,'Lei 691/1984'),
  (3304557,'Rio de Janeiro','RJ','17.01',0.0500,'Lei 691/1984'),
  (3304557,'Rio de Janeiro','RJ','17.13',0.0500,'Lei 691/1984'),
  (3106200,'Belo Horizonte','MG','1.01',0.0250,'Lei 8.725/2003'),
  (3106200,'Belo Horizonte','MG','17.01',0.0500,'Lei 8.725/2003'),
  (4106902,'Curitiba','PR','1.01',0.0250,'Lei 1.508/1992'),
  (4106902,'Curitiba','PR','17.01',0.0500,'Lei 1.508/1992'),
  (4314902,'Porto Alegre','RS','1.01',0.0250,'Lei 7.430/1994'),
  (2927408,'Salvador','BA','1.01',0.0250,'Lei 7.186/2006'),
  (5300108,'Brasília','DF','1.01',0.0500,'Lei 657/1994'),
  (4205407,'Florianópolis','SC','1.01',0.0200,'Lei Municipal'),
  (3205309,'Vitória','ES','1.01',0.0250,'Lei Municipal'),
  (2611606,'Recife','PE','1.01',0.0500,'Lei 15.563/1991')
) AS v(ibge,municipio,uf,item,aliq,base)
JOIN public.itens_lista_iss i ON i.codigo = v.item
ON CONFLICT (codigo_ibge, item_lista_id, vigente_de) DO UPDATE SET
  aliquota = EXCLUDED.aliquota,
  base_legal = EXCLUDED.base_legal,
  updated_at = now();

-- ===== 11. Estratégias de elisão fiscal =====
INSERT INTO public.estrategias_elisao (codigo, nome, categoria, descricao, regimes_aplicaveis, economia_estimada_percentual, risco, base_legal, requisitos, ativo)
SELECT v.codigo, v.nome, v.categoria, v.descricao, v.regimes::text[], v.economia, v.risco::nivel_risco, v.base, v.requisitos::jsonb, v.ativo
FROM (VALUES
  ('MS_LC224','Mandado de Segurança contra LC 224/2025','JUDICIAL','LC 224/2025 majora em 10% a presunção de IRPJ/CSLL sobre receita acima de R$ 5 mi. Mandado de segurança preventivo questiona a constitucionalidade.',ARRAY['PRESUMIDO'],0.10,'MEDIO','LC 224/2025 art. 3º + CF/88 art. 145 §1º','{"criterios":{"receita_minima":5000000},"custo_estimado":15000,"prazo_meses":6,"formula":"excesso × perc_presuncao × 10% × (aliq_irpj + aliq_csll)","reforma":"Sem impacto (LC 224 vigora durante a transição)"}',TRUE),
  ('JCP','Juros sobre Capital Próprio','SOCIETARIO','Pagamento de JCP aos sócios. Dedutível de IRPJ/CSLL (34%) com IRRF de 15%. Economia líquida de 19%.',ARRAY['REAL'],0.19,'BAIXO','Lei 9.249/95 art. 9º + STJ REsp 1.086.752/PR','{"criterios":{"patrimonio_liquido_minimo":1},"custo_estimado":0,"prazo_meses":1,"formula":"min(PL × TJLP, lucro × 50%) × (34% - 15%)","reforma":"JCP pode ser extinto pela Reforma - urgência em capturar"}',TRUE),
  ('LEI_BEM','Lei do Bem - Incentivo à Inovação','INCENTIVO','Exclusão de 60% a 80% das despesas com P&D da base de IRPJ/CSLL.',ARRAY['REAL'],0.20,'MEDIO','Lei 11.196/2005','{"criterios":{"cnae_prefixos":["62","72","26","28","30","32","25","27","29","21","22"]},"custo_estimado":8000,"prazo_meses":3,"formula":"despesas_PD × 60% × 34%","reforma":"Sem impacto - lei mantida"}',TRUE),
  ('HOLDING','Holding Patrimonial','SOCIETARIO','Concentração de participações em holding com planejamento de ITCMD e sucessão.',ARRAY['SIMPLES','PRESUMIDO','REAL'],0.05,'BAIXO','CF/88 art. 156 §2º I + STF Tema 796','{"criterios":{"sempre_aplicavel":true},"custo_estimado":25000,"prazo_meses":4,"formula":"max(15000, lucro_distribuido × 5%)","reforma":"Sem impacto direto"}',TRUE),
  ('REINTEGRA','REINTEGRA - Regime de Reintegração','EXPORTACAO','Crédito de 0,1% sobre a receita de exportação.',ARRAY['PRESUMIDO','REAL'],0.001,'BAIXO','Lei 13.043/2014','{"criterios":{"exporta":true,"receita_exportacao_minima":1},"custo_estimado":2000,"prazo_meses":2,"formula":"receita_exportacao × 0.001","reforma":"Mantido durante a transição"}',TRUE),
  ('RECUPERACAO_PIS','Recuperação de PIS/COFINS sobre ICMS','JUDICIAL','Revisão dos últimos 5 anos: o ICMS não compõe a base de PIS/COFINS.',ARRAY['REAL'],0.003,'BAIXO','STF RE 574.706 + STJ Tema 779 + CTN art. 168','{"criterios":{},"custo_estimado":5000,"prazo_meses":8,"formula":"receita_anual × 0.003","reforma":"Urgência - PIS/COFINS serão extintos pela CBS"}',TRUE),
  ('DEPRECIACAO_ACELERADA','Depreciação Acelerada','OPERACIONAL','Depreciação de 100% no ano-calendário para máquinas industriais.',ARRAY['REAL'],0.13,'BAIXO','Lei 11.774/2008 art. 1º','{"criterios":{"atividade":"INDUSTRIA"},"custo_estimado":1000,"prazo_meses":1,"formula":"investimento_ativo × 34% × 40% (VPL)","reforma":"Sem impacto"}',TRUE),
  ('SUDENE_SUDAM','Incentivos Regionais SUDENE/SUDAM','INCENTIVO','Redução de 75% do IRPJ por 10 anos em nova unidade no Norte/Nordeste.',ARRAY['REAL'],0.75,'ALTO','Lei 9.069/95 + MP 2.199-14/2001','{"criterios":{"pode_abrir_filial_NE":true},"custo_estimado":200000,"prazo_meses":18,"formula":"IRPJ_anual × 0.75","reforma":"Mantido até 2033"}',TRUE),
  ('DELIBERACAO_LUCROS','Deliberação Antecipada de Lucros','SOCIETARIO','Janela legal encerrada em 31/12/2025.',ARRAY['SIMPLES','PRESUMIDO','REAL'],0.00,'BAIXO','Lei 15.270/2025 art. 3º §3º II','{"criterios":{"sempre_inaplicavel":true,"motivo":"Prazo expirou em 31/12/2025"},"custo_estimado":0,"prazo_meses":0,"reforma":"Janela fechada"}',FALSE),
  ('COMPENSACAO_PREJUIZOS','Compensação de Prejuízos Fiscais','OPERACIONAL','No Lucro Real, prejuízos são compensáveis até 30% do lucro líquido ajustado.',ARRAY['REAL'],0.10,'BAIXO','Lei 8.981/95 art. 42 + Lei 9.065/95 art. 15','{"criterios":{"tem_prejuizos_acumulados":true},"custo_estimado":0,"prazo_meses":1,"formula":"min(prejuizos, lucro × 30%) × 34%","reforma":"Mantido sem alteração"}',TRUE),
  ('SUBVENCOES_INVESTIMENTO','Subvenções para Investimento','INCENTIVO','Benefícios estaduais de ICMS excluídos da base de IRPJ/CSLL como subvenção.',ARRAY['REAL'],0.34,'MEDIO','Lei 12.973/14 art. 30 + STJ Tema 1.182','{"criterios":{"tem_beneficios_icms":true},"custo_estimado":10000,"prazo_meses":3,"formula":"beneficios_icms_recebidos × 34%","reforma":"Sob revisão - CBS/IBS podem alterar"}',TRUE),
  ('CREDITO_ICMS_ACUMULADO','Crédito Acumulado de ICMS','OPERACIONAL','Exportadores e isentos podem transferir crédito de ICMS a fornecedores ou pedir restituição.',ARRAY['PRESUMIDO','REAL'],0.015,'BAIXO','LC 87/96 art. 25 §1º + RICMS-SP art. 71','{"criterios":{"exporta_ou_isento":true},"custo_estimado":8000,"prazo_meses":12,"formula":"receita_beneficiada × 1.5%","reforma":"Migração para IBS - oportunidade limitada"}',TRUE),
  ('BONIFICACAO_MERCADORIAS','Bonificação em Mercadorias','OPERACIONAL','Bonificação não tributada por ICMS quando documentada corretamente.',ARRAY['PRESUMIDO','REAL'],0.18,'BAIXO','STJ REsp 1.111.156/SP','{"criterios":{"atividade":["COMERCIO","INDUSTRIA"]},"custo_estimado":2000,"prazo_meses":2,"formula":"valor_bonificado × ICMS_medio (18%)","reforma":"Sob análise para CBS/IBS"}',TRUE),
  ('INSUMOS_AMPLOS_PIS_COFINS','Conceito Ampliado de Insumos','JUDICIAL','Revisão de créditos de PIS/COFINS sobre todos os insumos essenciais à atividade.',ARRAY['REAL'],0.005,'BAIXO','STJ REsp 1.221.170/PR Tema 779','{"criterios":{},"custo_estimado":5000,"prazo_meses":6,"formula":"receita_anual × 0.5%","reforma":"Urgência - PIS/COFINS extintos pela CBS"}',TRUE),
  ('PLANEJAMENTO_SUCESSORIO_ITCMD','Planejamento Sucessório (ITCMD)','SOCIETARIO','Doação em vida com usufruto e holding familiar reduz ITCMD e evita inventário.',ARRAY['SIMPLES','PRESUMIDO','REAL'],0.30,'BAIXO','CC art. 1.911 + CTN art. 35 + legislação estadual de ITCMD','{"criterios":{"empresa_familiar_ou_pf":true},"custo_estimado":30000,"prazo_meses":6,"formula":"patrimonio × ITCMD_medio (4.5%) × 30%","reforma":"ITCMD pode aumentar com a Reforma - urgência"}',TRUE),
  ('TRANSACAO_TRIBUTARIA','Transação Tributária','JUDICIAL','Negociação de dívidas tributárias federais com até 70% de desconto.',ARRAY['SIMPLES','PRESUMIDO','REAL'],0.70,'BAIXO','Lei 13.988/2020 + Portaria PGFN 6.757/2022','{"criterios":{"tem_divida_federal":true},"custo_estimado":10000,"prazo_meses":3,"formula":"composição classe C/D: até 86% de desconto total","reforma":"Mantido"}',TRUE),
  ('ISS_BARUERI_MIGRACAO','Migração de domicílio fiscal SP → Barueri','OPERACIONAL','Mudança de domicílio fiscal para Barueri reduz o ISS de 5% (São Paulo) para 2%.',ARRAY['PRESUMIDO','REAL'],0.03,'MEDIO','LC 116/2003 + Lei Municipal de Barueri','{"criterios":{"uf":"SP","municipio_atual":"São Paulo","receita_servicos_minima":100000},"custo_estimado":20000,"prazo_meses":6,"formula":"receita_servicos × 3%","reforma":"CBS/IBS substituirão o ISS - oportunidade limitada"}',TRUE)
) AS v(codigo,nome,categoria,descricao,regimes,economia,risco,base,requisitos,ativo)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  regimes_aplicaveis = EXCLUDED.regimes_aplicaveis,
  economia_estimada_percentual = EXCLUDED.economia_estimada_percentual,
  risco = EXCLUDED.risco,
  base_legal = EXCLUDED.base_legal,
  requisitos = EXCLUDED.requisitos,
  ativo = EXCLUDED.ativo,
  updated_at = now();