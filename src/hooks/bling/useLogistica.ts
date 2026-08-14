import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { blingAction } from './client';

export function useBlingLogisticas() {
  return useQuery({
    queryKey: ['bling-logisticas'],
    queryFn: () => blingAction('listar_logisticas'),
    enabled: false,
  });
}

export function useBlingServicosLogistica() {
  return useQuery({
    queryKey: ['bling-servicos-logistica'],
    queryFn: () => blingAction('listar_servicos_logistica'),
    enabled: false,
  });
}

export function useBlingRemessas(filtros?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['bling-remessas', filtros],
    queryFn: () => blingAction('listar_remessas', { filtros }),
    enabled: false,
  });
}

export function useBlingObjetos(filtros?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['bling-objetos', filtros],
    queryFn: () => blingAction('listar_objetos', { filtros }),
    enabled: false,
  });
}

export function useBlingLogisticaMutations() {
  const queryClient = useQueryClient();

  const criarRemessa = useMutation({
    mutationFn: (data: Record<string, unknown>) => blingAction('criar_remessa', { data }),
    onSuccess: () => { toast.success('Remessa criada'); queryClient.invalidateQueries({ queryKey: ['bling-remessas'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const gerarEtiqueta = useMutation({
    mutationFn: (data: Record<string, unknown>) => blingAction('gerar_etiqueta', { data }),
    onSuccess: () => toast.success('Etiqueta gerada'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const rastrearObjeto = useMutation({
    mutationFn: (codigo: string) => blingAction('rastrear_objeto', { codigo }),
    onSuccess: () => toast.success('Rastreamento atualizado'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarRemessa, gerarEtiqueta, rastrearObjeto };
}
