export const ROUTES = {
  // Auth routes
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Main routes
  DASHBOARD: '/',
  CONTAS_PAGAR: '/contas-pagar',
  CONTAS_RECEBER: '/contas-receber',
  FORNECEDORES: '/fornecedores',
  CLIENTES: '/clientes',
  RELATORIOS: '/relatorios',
  CONFIGURACOES: '/configuracoes',
  
  // Helper functions
  contaPagar: (id: string) => `/contas-pagar/${id}`,
  contaReceber: (id: string) => `/contas-receber/${id}`,
  fornecedor: (id: string) => `/fornecedores/${id}`,
  cliente: (id: string) => `/clientes/${id}`,
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.REGISTER,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.AUTH.RESET_PASSWORD,
];

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.CONTAS_PAGAR,
  ROUTES.CONTAS_RECEBER,
  ROUTES.FORNECEDORES,
  ROUTES.CLIENTES,
  ROUTES.RELATORIOS,
  ROUTES.CONFIGURACOES,
];

export type RouteKey = keyof typeof ROUTES;
