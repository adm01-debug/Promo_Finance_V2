import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bitrix24Service, BitrixContact, BitrixCompany, BitrixDeal, BitrixLead } from './service';
import { toast } from 'sonner';

const BITRIX_KEYS = {
  contacts: ['bitrix24', 'contacts'] as const,
  companies: ['bitrix24', 'companies'] as const,
  deals: ['bitrix24', 'deals'] as const,
  leads: ['bitrix24', 'leads'] as const,
};

/**
 * Hook for Bitrix24 integration status
 */
export function useBitrix24Status() {
  return {
    isConfigured: bitrix24Service.isConfigured(),
  };
}

/**
 * Hook for Bitrix24 contacts
 */
export function useBitrix24Contacts() {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: BITRIX_KEYS.contacts,
    queryFn: () => bitrix24Service.getContacts(),
    enabled: bitrix24Service.isConfigured(),
  });

  const createMutation = useMutation({
    mutationFn: (contact: BitrixContact) => bitrix24Service.createContact(contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.contacts });
      toast.success('Contato criado no Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar contato: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BitrixContact> }) =>
      bitrix24Service.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.contacts });
      toast.success('Contato atualizado no Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar contato: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bitrix24Service.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.contacts });
      toast.success('Contato removido do Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover contato: ${error.message}`);
    },
  });

  return {
    contacts,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for Bitrix24 companies
 */
export function useBitrix24Companies() {
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: BITRIX_KEYS.companies,
    queryFn: () => bitrix24Service.getCompanies(),
    enabled: bitrix24Service.isConfigured(),
  });

  const createMutation = useMutation({
    mutationFn: (company: BitrixCompany) => bitrix24Service.createCompany(company),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.companies });
      toast.success('Empresa criada no Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar empresa: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BitrixCompany> }) =>
      bitrix24Service.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.companies });
      toast.success('Empresa atualizada no Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar empresa: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bitrix24Service.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.companies });
      toast.success('Empresa removida do Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover empresa: ${error.message}`);
    },
  });

  return {
    companies,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for Bitrix24 deals
 */
export function useBitrix24Deals() {
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading, error } = useQuery({
    queryKey: BITRIX_KEYS.deals,
    queryFn: () => bitrix24Service.getDeals(),
    enabled: bitrix24Service.isConfigured(),
  });

  const createMutation = useMutation({
    mutationFn: (deal: BitrixDeal) => bitrix24Service.createDeal(deal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.deals });
      toast.success('Negócio criado no Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar negócio: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BitrixDeal> }) =>
      bitrix24Service.updateDeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.deals });
      toast.success('Negócio atualizado no Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar negócio: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bitrix24Service.deleteDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.deals });
      toast.success('Negócio removido do Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover negócio: ${error.message}`);
    },
  });

  return {
    deals,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for Bitrix24 leads
 */
export function useBitrix24Leads() {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: BITRIX_KEYS.leads,
    queryFn: () => bitrix24Service.getLeads(),
    enabled: bitrix24Service.isConfigured(),
  });

  const createMutation = useMutation({
    mutationFn: (lead: BitrixLead) => bitrix24Service.createLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.leads });
      toast.success('Lead criado no Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar lead: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BitrixLead> }) =>
      bitrix24Service.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.leads });
      toast.success('Lead atualizado no Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar lead: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bitrix24Service.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BITRIX_KEYS.leads });
      toast.success('Lead removido do Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover lead: ${error.message}`);
    },
  });

  return {
    leads,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for syncing local data to Bitrix24
 */
export function useBitrix24Sync() {
  const syncClienteMutation = useMutation({
    mutationFn: (cliente: Parameters<typeof bitrix24Service.syncCliente>[0]) =>
      bitrix24Service.syncCliente(cliente),
    onSuccess: () => {
      toast.success('Cliente sincronizado com Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar cliente: ${error.message}`);
    },
  });

  const syncFornecedorMutation = useMutation({
    mutationFn: (fornecedor: Parameters<typeof bitrix24Service.syncFornecedor>[0]) =>
      bitrix24Service.syncFornecedor(fornecedor),
    onSuccess: () => {
      toast.success('Fornecedor sincronizado com Bitrix24!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar fornecedor: ${error.message}`);
    },
  });

  return {
    syncCliente: syncClienteMutation.mutateAsync,
    syncFornecedor: syncFornecedorMutation.mutateAsync,
    isSyncingCliente: syncClienteMutation.isPending,
    isSyncingFornecedor: syncFornecedorMutation.isPending,
  };
}

/**
 * Main hook combining all Bitrix24 functionality
 */
export function useBitrix24() {
  const status = useBitrix24Status();
  const contacts = useBitrix24Contacts();
  const companies = useBitrix24Companies();
  const deals = useBitrix24Deals();
  const leads = useBitrix24Leads();
  const sync = useBitrix24Sync();

  return {
    ...status,
    contacts,
    companies,
    deals,
    leads,
    sync,
  };
}

export default useBitrix24;
