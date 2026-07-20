/// <reference types="vite/client" />

interface Window {
  /** Exposto por Boletos.tsx para o painel de preview disparar a sincronização Bitrix24. */
  syncBitrixBoleto?: (boletoId: string) => void;
}
