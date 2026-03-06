import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { vi } from 'vitest';

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// All providers wrapper
interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Custom render with all providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Render with specific router path
interface RenderWithRouterOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

function renderWithRouter(
  ui: ReactElement,
  { route = '/', ...options }: RenderWithRouterOptions = {}
): RenderResult {
  window.history.pushState({}, 'Test page', route);
  return customRender(ui, options);
}

// Wait for element utilities
async function waitForLoadingToFinish() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// Mock functions factories
function createMockFn<T extends (...args: unknown[]) => unknown>() {
  return vi.fn() as unknown as T;
}

// Create mock API response
interface MockApiResponse<T> {
  data: T;
  error: null;
}

interface MockApiError {
  data: null;
  error: { message: string; code?: string };
}

function createMockApiSuccess<T>(data: T): MockApiResponse<T> {
  return { data, error: null };
}

function createMockApiError(message: string, code?: string): MockApiError {
  return { data: null, error: { message, code } };
}

// Mock date utilities
function mockDate(date: Date | string) {
  const mockDate = new Date(date);
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);
  return () => vi.useRealTimers();
}

// Mock fetch
function mockFetch<T>(data: T, options?: { status?: number; ok?: boolean }) {
  const mockResponse = {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    headers: new Headers(),
  };

  return vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);
}

// Mock Supabase
function createMockSupabase() {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();

  return {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
      limit: mockLimit,
      range: mockRange,
    })),
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.url' } })),
      })),
    },
  };
}

// Test data factories
interface TestUser {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'user';
}

function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    nome: 'Test User',
    role: 'user',
    ...overrides,
  };
}

interface TestContaPagar {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  fornecedorId?: string;
  categoriaId?: string;
}

function createTestContaPagar(overrides?: Partial<TestContaPagar>): TestContaPagar {
  return {
    id: 'test-conta-id',
    descricao: 'Conta de teste',
    valor: 100.0,
    dataVencimento: '2025-02-15',
    status: 'pendente',
    ...overrides,
  };
}

interface TestContaReceber {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: 'pendente' | 'recebido' | 'atrasado' | 'cancelado';
  clienteId?: string;
  categoriaId?: string;
}

function createTestContaReceber(overrides?: Partial<TestContaReceber>): TestContaReceber {
  return {
    id: 'test-conta-id',
    descricao: 'Receita de teste',
    valor: 250.0,
    dataVencimento: '2025-02-20',
    status: 'pendente',
    ...overrides,
  };
}

interface TestCliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  documento: string;
}

function createTestCliente(overrides?: Partial<TestCliente>): TestCliente {
  return {
    id: 'test-cliente-id',
    nome: 'Cliente Teste',
    email: 'cliente@test.com',
    telefone: '(11) 99999-9999',
    tipo: 'pessoa_fisica',
    documento: '123.456.789-09',
    ...overrides,
  };
}

interface TestFornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
}

function createTestFornecedor(overrides?: Partial<TestFornecedor>): TestFornecedor {
  return {
    id: 'test-fornecedor-id',
    razaoSocial: 'Fornecedor Teste LTDA',
    nomeFantasia: 'Fornecedor Teste',
    cnpj: '12.345.678/0001-90',
    email: 'fornecedor@test.com',
    telefone: '(11) 3333-4444',
    ...overrides,
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Export custom utilities
export {
  customRender as render,
  renderWithRouter,
  waitForLoadingToFinish,
  createMockFn,
  createMockApiSuccess,
  createMockApiError,
  mockDate,
  mockFetch,
  createMockSupabase,
  createTestUser,
  createTestContaPagar,
  createTestContaReceber,
  createTestCliente,
  createTestFornecedor,
  createTestQueryClient,
  AllProviders,
};
