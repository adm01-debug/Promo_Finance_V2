// Páginas (lazy chunks) do domínio "financeiro" — módulo só de componentes (Fast Refresh).
import { lazy } from 'react';

export const ContasPagar = lazy(() => import('../pages/ContasPagar'));
export const ContasReceber = lazy(() => import('../pages/ContasReceber'));
export const FluxoCaixa = lazy(() => import('../pages/FluxoCaixa'));
export const Conciliacao = lazy(() => import('../pages/Conciliacao'));
export const Cobrancas = lazy(() => import('../pages/Cobrancas'));
export const Boletos = lazy(() => import('../pages/Boletos'));
export const Clientes = lazy(() => import('../pages/Clientes'));
export const Fornecedores = lazy(() => import('../pages/Fornecedores'));
export const ContasBancarias = lazy(() => import('../pages/ContasBancarias'));
export const Aprovacoes = lazy(() => import('../pages/Aprovacoes'));
export const Financeiro = lazy(() => import('../pages/Financeiro'));
export const PagamentosRecorrentes = lazy(() => import('../pages/PagamentosRecorrentes'));
export const Asaas = lazy(() => import('../pages/Asaas'));
export const BlingPage = lazy(() => import('../pages/Bling'));
export const Tesouraria = lazy(() => import('../pages/Tesouraria'));
export const MetasFinanceirasPage = lazy(() => import('../pages/MetasFinanceiras'));
export const PortalTokensPage = lazy(() => import('../pages/clientes/PortalTokens'));
export const ScoringClientesPage = lazy(() => import('../pages/clientes/ScoringClientes'));
export const Compras = lazy(() => import('../pages/Compras'));
