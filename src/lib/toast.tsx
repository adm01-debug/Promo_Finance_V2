import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

// Toaster Provider Component
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        className: 'dark:bg-gray-800 dark:text-white',
        duration: 4000,
      }}
    />
  );
}

// Toast API
interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

export const toast = {
  // Success toast
  success(message: string, options?: ToastOptions) {
    return sonnerToast.success(message, {
      ...options,
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    });
  },

  // Error toast
  error(message: string, options?: ToastOptions) {
    return sonnerToast.error(message, {
      ...options,
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      duration: options?.duration || 5000, // Errors stay longer
    });
  },

  // Warning toast
  warning(message: string, options?: ToastOptions) {
    return sonnerToast.warning(message, {
      ...options,
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    });
  },

  // Info toast
  info(message: string, options?: ToastOptions) {
    return sonnerToast.info(message, {
      ...options,
      icon: <Info className="h-5 w-5 text-blue-500" />,
    });
  },

  // Loading toast (returns dismiss function)
  loading(message: string, options?: Omit<ToastOptions, 'action' | 'cancel'>) {
    return sonnerToast.loading(message, {
      ...options,
      icon: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
      duration: Infinity, // Loading toasts don't auto-dismiss
    });
  },

  // Promise toast (shows loading, then success/error)
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: ToastOptions
  ) {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...options,
    });
  },

  // Custom toast
  custom(content: React.ReactNode, options?: ToastOptions) {
    return sonnerToast.custom(() => content, options);
  },

  // Dismiss specific toast
  dismiss(toastId?: string | number) {
    sonnerToast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll() {
    sonnerToast.dismiss();
  },
};

// Preset toast functions for common scenarios
export const showToast = {
  // CRUD operations
  created(entity: string) {
    toast.success(`${entity} criado com sucesso!`);
  },

  updated(entity: string) {
    toast.success(`${entity} atualizado com sucesso!`);
  },

  deleted(entity: string) {
    toast.success(`${entity} excluído com sucesso!`);
  },

  saved(entity: string) {
    toast.success(`${entity} salvo com sucesso!`);
  },

  // Error scenarios
  errorCreating(entity: string, error?: string) {
    toast.error(`Erro ao criar ${entity}`, {
      description: error || 'Tente novamente mais tarde.',
    });
  },

  errorUpdating(entity: string, error?: string) {
    toast.error(`Erro ao atualizar ${entity}`, {
      description: error || 'Tente novamente mais tarde.',
    });
  },

  errorDeleting(entity: string, error?: string) {
    toast.error(`Erro ao excluir ${entity}`, {
      description: error || 'Tente novamente mais tarde.',
    });
  },

  errorLoading(entity: string, error?: string) {
    toast.error(`Erro ao carregar ${entity}`, {
      description: error || 'Tente novamente mais tarde.',
    });
  },

  // Auth scenarios
  loginSuccess() {
    toast.success('Login realizado com sucesso!', {
      description: 'Bem-vindo de volta!',
    });
  },

  loginError(error?: string) {
    toast.error('Erro ao fazer login', {
      description: error || 'Verifique suas credenciais e tente novamente.',
    });
  },

  logoutSuccess() {
    toast.info('Você foi desconectado.');
  },

  sessionExpired() {
    toast.warning('Sua sessão expirou', {
      description: 'Por favor, faça login novamente.',
    });
  },

  // Validation
  validationError(message?: string) {
    toast.error('Erro de validação', {
      description: message || 'Verifique os campos e tente novamente.',
    });
  },

  requiredFields() {
    toast.warning('Preencha todos os campos obrigatórios');
  },

  // Network
  networkError() {
    toast.error('Erro de conexão', {
      description: 'Verifique sua conexão com a internet.',
    });
  },

  serverError() {
    toast.error('Erro no servidor', {
      description: 'Tente novamente mais tarde.',
    });
  },

  // File operations
  fileUploaded(filename?: string) {
    toast.success('Arquivo enviado com sucesso', {
      description: filename,
    });
  },

  fileUploadError(error?: string) {
    toast.error('Erro ao enviar arquivo', {
      description: error || 'Verifique o arquivo e tente novamente.',
    });
  },

  fileDownloaded(filename?: string) {
    toast.success('Download iniciado', {
      description: filename,
    });
  },

  // Copy
  copied(what?: string) {
    toast.success(`${what || 'Conteúdo'} copiado!`);
  },

  // Export/Import
  exportStarted() {
    return toast.loading('Exportando dados...');
  },

  exportSuccess(format?: string) {
    toast.success('Exportação concluída', {
      description: format ? `Arquivo ${format} gerado com sucesso.` : undefined,
    });
  },

  exportError() {
    toast.error('Erro ao exportar', {
      description: 'Tente novamente mais tarde.',
    });
  },

  importSuccess(count?: number) {
    toast.success('Importação concluída', {
      description: count ? `${count} registros importados.` : undefined,
    });
  },

  importError(error?: string) {
    toast.error('Erro ao importar', {
      description: error || 'Verifique o arquivo e tente novamente.',
    });
  },

  // Permissions
  permissionDenied() {
    toast.error('Acesso negado', {
      description: 'Você não tem permissão para realizar esta ação.',
    });
  },

  // Generic
  actionSuccess(message: string) {
    toast.success(message);
  },

  actionError(message: string, error?: string) {
    toast.error(message, { description: error });
  },

  comingSoon() {
    toast.info('Em breve!', {
      description: 'Esta funcionalidade estará disponível em breve.',
    });
  },
};

export default toast;
