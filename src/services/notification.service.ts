import { toast, ExternalToast } from 'sonner';

export interface NotificationOptions extends ExternalToast {
  title?: string;
  description?: string;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  dismissible?: boolean;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export interface PromiseMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: Error) => string);
}

class NotificationService {
  private defaultOptions: Partial<NotificationOptions> = {
    position: 'top-right',
    duration: 4000,
    dismissible: true,
  };

  private mergeOptions(options?: NotificationOptions): ExternalToast {
    const merged = { ...this.defaultOptions, ...options };
    
    // Map our options to sonner's expected format
    if (merged.title) {
      merged.description = merged.title;
      delete merged.title;
    }

    return merged as ExternalToast;
  }

  success(message: string, options?: NotificationOptions): string | number {
    return toast.success(message, this.mergeOptions(options));
  }

  error(message: string, options?: NotificationOptions): string | number {
    return toast.error(message, this.mergeOptions({
      duration: 6000, // Longer duration for errors
      ...options,
    }));
  }

  warning(message: string, options?: NotificationOptions): string | number {
    return toast.warning(message, this.mergeOptions(options));
  }

  info(message: string, options?: NotificationOptions): string | number {
    return toast.info(message, this.mergeOptions(options));
  }

  loading(message: string, options?: NotificationOptions): string | number {
    return toast.loading(message, this.mergeOptions({
      duration: Infinity, // Loading toasts don't auto-dismiss
      ...options,
    }));
  }

  promise<T>(
    promise: Promise<T>,
    messages: PromiseMessages<T>,
    options?: NotificationOptions
  ): Promise<T> {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...this.mergeOptions(options),
    });
  }

  dismiss(toastId?: string | number): void {
    toast.dismiss(toastId);
  }

  dismissAll(): void {
    toast.dismiss();
  }

  custom(render: (t: string | number) => React.ReactNode, options?: NotificationOptions): string | number {
    return toast.custom(render, this.mergeOptions(options));
  }

  // Shorthand methods for common operations
  saved(itemName?: string): string | number {
    return this.success(itemName ? `${itemName} salvo com sucesso!` : 'Registro salvo com sucesso!');
  }

  deleted(itemName?: string): string | number {
    return this.success(itemName ? `${itemName} excluído com sucesso!` : 'Registro excluído com sucesso!');
  }

  updated(itemName?: string): string | number {
    return this.success(itemName ? `${itemName} atualizado com sucesso!` : 'Registro atualizado com sucesso!');
  }

  created(itemName?: string): string | number {
    return this.success(itemName ? `${itemName} criado com sucesso!` : 'Registro criado com sucesso!');
  }

  // Error shorthand methods
  saveError(details?: string): string | number {
    return this.error(details ? `Erro ao salvar: ${details}` : 'Erro ao salvar registro');
  }

  loadError(details?: string): string | number {
    return this.error(details ? `Erro ao carregar: ${details}` : 'Erro ao carregar dados');
  }

  deleteError(details?: string): string | number {
    return this.error(details ? `Erro ao excluir: ${details}` : 'Erro ao excluir registro');
  }

  updateError(details?: string): string | number {
    return this.error(details ? `Erro ao atualizar: ${details}` : 'Erro ao atualizar registro');
  }

  networkError(): string | number {
    return this.error('Erro de conexão. Verifique sua internet e tente novamente.');
  }

  serverError(): string | number {
    return this.error('Erro no servidor. Tente novamente mais tarde.');
  }

  validationError(message?: string): string | number {
    return this.warning(message || 'Por favor, verifique os campos do formulário.');
  }

  unauthorized(): string | number {
    return this.error('Sessão expirada. Por favor, faça login novamente.');
  }

  forbidden(): string | number {
    return this.error('Você não tem permissão para realizar esta ação.');
  }

  notFound(item?: string): string | number {
    return this.error(item ? `${item} não encontrado.` : 'Registro não encontrado.');
  }

  // Async operation helpers
  async withLoading<T>(
    operation: () => Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ): Promise<T> {
    const {
      loading = 'Processando...',
      success = 'Operação concluída!',
      error = 'Erro na operação',
    } = messages;

    const toastId = this.loading(loading);

    try {
      const result = await operation();
      this.dismiss(toastId);
      this.success(success);
      return result;
    } catch (err) {
      this.dismiss(toastId);
      this.error(err instanceof Error ? err.message : error);
      throw err;
    }
  }

  // Bulk operation helpers
  bulkSuccess(count: number, action: 'criados' | 'atualizados' | 'excluídos'): string | number {
    return this.success(`${count} registro${count > 1 ? 's' : ''} ${action} com sucesso!`);
  }

  bulkError(count: number, action: 'criar' | 'atualizar' | 'excluir'): string | number {
    return this.error(`Erro ao ${action} ${count} registro${count > 1 ? 's' : ''}.`);
  }

  // Confirmation notifications
  confirmDelete(onConfirm: () => void, itemName?: string): string | number {
    return this.warning(
      itemName ? `Deseja excluir ${itemName}?` : 'Deseja excluir este registro?',
      {
        action: {
          label: 'Excluir',
          onClick: onConfirm,
        },
        duration: 10000,
      }
    );
  }

  // File operations
  uploadSuccess(fileName?: string): string | number {
    return this.success(fileName ? `${fileName} enviado com sucesso!` : 'Arquivo enviado com sucesso!');
  }

  uploadError(fileName?: string): string | number {
    return this.error(fileName ? `Erro ao enviar ${fileName}` : 'Erro ao enviar arquivo');
  }

  downloadStarted(fileName?: string): string | number {
    return this.info(fileName ? `Baixando ${fileName}...` : 'Download iniciado...');
  }

  exportSuccess(format?: string): string | number {
    return this.success(format ? `Dados exportados para ${format}!` : 'Dados exportados com sucesso!');
  }

  exportError(): string | number {
    return this.error('Erro ao exportar dados');
  }

  importSuccess(count?: number): string | number {
    return this.success(
      count ? `${count} registro${count > 1 ? 's' : ''} importado${count > 1 ? 's' : ''}!` : 'Dados importados com sucesso!'
    );
  }

  importError(): string | number {
    return this.error('Erro ao importar dados');
  }

  // Payment/Financial specific
  paymentSuccess(amount?: string): string | number {
    return this.success(amount ? `Pagamento de ${amount} registrado!` : 'Pagamento registrado com sucesso!');
  }

  paymentError(): string | number {
    return this.error('Erro ao processar pagamento');
  }

  receiptSuccess(amount?: string): string | number {
    return this.success(amount ? `Recebimento de ${amount} registrado!` : 'Recebimento registrado com sucesso!');
  }

  overdueWarning(count: number): string | number {
    return this.warning(
      `Você tem ${count} conta${count > 1 ? 's' : ''} em atraso.`,
      { duration: 8000 }
    );
  }

  dueTodayInfo(count: number): string | number {
    return this.info(
      `${count} conta${count > 1 ? 's' : ''} vence${count > 1 ? 'm' : ''} hoje.`,
      { duration: 8000 }
    );
  }
}

export const notificationService = new NotificationService();
