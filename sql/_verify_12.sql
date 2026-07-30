SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'nfe_xml','kpis_operacionais','organizacoes','pagamentos_recorrentes',
    'api_keys','resumos_executivos_semanais','retencoes_fonte',
    'regimes_simulados','scim_setup_checklist','user_active_filters',
    'user_filter_presets','sped_contabil_arquivos','incentivos_fiscais'
  )
ORDER BY table_name;
