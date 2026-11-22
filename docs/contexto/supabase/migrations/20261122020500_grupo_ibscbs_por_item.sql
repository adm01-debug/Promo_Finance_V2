alter table public.notas_fiscais_itens
  add column cst_ibscbs character(3),
  add column cclasstrib character(6),
  add column v_bc_ibscbs numeric(15,2),
  add column p_ibs_uf numeric(5,4),
  add column v_ibs_uf numeric(15,2),
  add column p_ibs_mun numeric(5,4),
  add column v_ibs_mun numeric(15,2),
  add column p_cbs numeric(5,4),
  add column v_cbs numeric(15,2),
  add column v_ibs numeric(15,2),
  add column p_red_aliq numeric(5,4),
  add column p_aliq_efet numeric(5,4),
  add constraint notas_fiscais_itens_v_ibs_soma_ck check (
    v_ibs is null
    or (v_ibs_uf is not null and v_ibs_mun is not null and v_ibs = v_ibs_uf + v_ibs_mun)
  );
