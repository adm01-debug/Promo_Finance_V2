import { useState } from 'react';
import { Download, Printer, Mail, CheckCircle2, Copy, Check, History, Clock, Share2, RefreshCw, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { toast } from 'sonner';
import { BoletoBarcode } from './BoletoBarcode';
import { BoletoHistorico } from './BoletoHistorico';
import { Badge } from '@/components/ui/badge';

interface Boleto {
  id: string; numero: string; linha_digitavel: string; codigo_barras: string;
  valor: number; vencimento: string; cedente_nome: string; cedente_cnpj: string | null;
  sacado_nome: string; sacado_cpf_cnpj: string | null; banco: string; agencia: string;
  conta: string; descricao: string | null; status: string;
  asaas_id?: string | null; external_provider?: string | null;
  bitrix_id?: string | null; bitrix_status?: string | null; eventos_pagamento?: any[] | null;
  rastreio_status?: Array<{ status: string; data: string; detalhe: string }>;
}

interface BoletoPreviewPanelProps {
  boleto: Boleto;
  onUpdateStatus: (data: { id: string; status: any }) => void;
}

export function BoletoPreviewPanel({ boleto, onUpdateStatus }: BoletoPreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showRastreio, setShowRastreio] = useState(false);

  const handleCopy = () => { navigator.clipboard.writeText(boleto.linha_digitavel.replace(/\s/g, '')); setCopied(true); toast.success('Linha digitável copiada!'); setTimeout(() => setCopied(false), 2000); };
  
  const handleDownload = () => { 
    import('@/lib/pdf-generator').then(({ generateBoletoPDF }) => { 
      generateBoletoPDF({ 
        numero: boleto.numero, 
        linha_digitavel: boleto.linha_digitavel, 
        codigo_barras: boleto.codigo_barras, 
        valor: boleto.valor, 
        vencimento: boleto.vencimento, 
        cedente_nome: boleto.cedente_nome, 
        cedente_cnpj: boleto.cedente_cnpj, 
        sacado_nome: boleto.sacado_nome, 
        sacado_cpf_cnpj: boleto.sacado_cpf_cnpj, 
        banco: boleto.banco, 
        agencia: boleto.agencia, 
        conta: boleto.conta, 
        descricao: boleto.descricao 
      }); 
      toast.success('PDF do boleto gerado com sucesso!'); 
    }); 
  };

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white text-black rounded-lg p-6 space-y-4 print:shadow-none">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">Logo Banco</div>
            <div className="text-2xl font-bold">{boleto.banco}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Nosso Número</div>
            <div className="text-lg font-mono font-bold">{boleto.numero}</div>
          </div>
        </div>
        
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Linha Digitável</div>
          <div className="flex items-center gap-2">
            <code className="text-lg font-mono tracking-wider flex-1 break-all">{boleto.linha_digitavel}</code>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Beneficiário (Cedente)</div>
              <div className="font-semibold">{boleto.cedente_nome}</div>
              <div className="text-sm text-muted-foreground">{boleto.cedente_cnpj}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Agência/Código do Beneficiário</div>
              <div className="font-mono">{boleto.agencia} / {boleto.conta}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Pagador (Sacado)</div>
              <div className="font-semibold">{boleto.sacado_nome}</div>
              <div className="text-sm text-muted-foreground">{boleto.sacado_cpf_cnpj}</div>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-xs text-muted-foreground">Vencimento</div>
                <div className="font-semibold">{formatDate(boleto.vencimento)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Valor</div>
                <div className="font-semibold text-lg">{formatCurrency(boleto.valor)}</div>
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <BoletoBarcode banco={boleto.banco} valor={boleto.valor} vencimento={boleto.vencimento} cedenteCnpj={boleto.cedente_cnpj || undefined} numero={boleto.numero} />
      </div>

      {/* Seção de Rastreio */}
      <div className="space-y-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-muted-foreground"
          onClick={() => setShowRastreio(!showRastreio)}
        >
          <History className="h-4 w-4" />
          {showRastreio ? 'Ocultar Histórico Neural' : 'Ver Rastreio e Histórico Neural'}
        </Button>

        {showRastreio && (
          <div className="space-y-6">
            <div className="space-y-3 pl-2 border-l-2 border-muted ml-2 py-2">
              {boleto.rastreio_status && boleto.rastreio_status.length > 0 ? (
                boleto.rastreio_status.map((step, i) => (
                  <div key={i} className="relative pl-4">
                    <div className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase">{step.status}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDateTime(step.data)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{step.detalhe}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Nenhum evento registrado no rastreio</span>
                </div>
              )}
            </div>
            
            <BoletoHistorico boletoId={boleto.id} />
          </div>
        )}
      </div>

      <div className="flex gap-2 print:hidden flex-wrap pt-2">
        <Button onClick={handleDownload} className="flex-1 gap-2"><Download className="h-4 w-4" />Download PDF</Button>
        <Button variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" />Imprimir</Button>
        <Button variant="outline" onClick={() => { onUpdateStatus({ id: boleto.id, status: 'enviado' }); toast.success('Boleto enviado!'); }} className="gap-2"><Mail className="h-4 w-4" />Enviar</Button>
        
        {boleto.asaas_id && (
          <Badge variant="secondary" className="gap-1 flex items-center px-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            <Barcode className="h-3 w-3" />
            ASAAS: {boleto.asaas_id}
          </Badge>
        )}

        {boleto.bitrix_id ? (
          <Badge variant="secondary" className="gap-1 flex items-center px-3">
            <Share2 className="h-3 w-3" />
            Bitrix24: {boleto.bitrix_status || 'Sincronizado'}
          </Badge>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => {
              // @ts-ignore
              if (window.syncBitrixBoleto) window.syncBitrixBoleto(boleto.id);
            }} 
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sincronizar Bitrix24
          </Button>
        )}

        {boleto.status !== 'pago' && boleto.status !== 'cancelado' && (
          <Button variant="outline" onClick={() => onUpdateStatus({ id: boleto.id, status: 'pago' })} className="gap-2 text-success"><CheckCircle2 className="h-4 w-4" />Marcar Pago</Button>
        )}
      </div>
    </div>
  );
}
