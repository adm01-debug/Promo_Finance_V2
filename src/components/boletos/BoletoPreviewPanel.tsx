import { useState } from 'react';
import { Download, Printer, Mail, CheckCircle2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { BoletoBarcode } from './BoletoBarcode';

interface Boleto {
  id: string; numero: string; linha_digitavel: string; codigo_barras: string;
  valor: number; vencimento: string; cedente_nome: string; cedente_cnpj: string | null;
  sacado_nome: string; sacado_cpf_cnpj: string | null; banco: string; agencia: string;
  conta: string; descricao: string | null; status: string;
}

interface BoletoPreviewPanelProps {
  boleto: Boleto;
  onUpdateStatus: (data: { id: string; status: string }) => void;
}

export function BoletoPreviewPanel({ boleto, onUpdateStatus }: BoletoPreviewPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => { navigator.clipboard.writeText(boleto.linha_digitavel.replace(/\s/g, '')); setCopied(true); toast.success('Linha digitável copiada!'); setTimeout(() => setCopied(false), 2000); };
  const handleDownload = () => { import('@/lib/pdf-generator').then(({ generateBoletoPDF }) => { generateBoletoPDF({ numero: boleto.numero, linha_digitavel: boleto.linha_digitavel, codigo_barras: boleto.codigo_barras, valor: boleto.valor, vencimento: boleto.vencimento, cedente_nome: boleto.cedente_nome, cedente_cnpj: boleto.cedente_cnpj, sacado_nome: boleto.sacado_nome, sacado_cpf_cnpj: boleto.sacado_cpf_cnpj, banco: boleto.banco, agencia: boleto.agencia, conta: boleto.conta, descricao: boleto.descricao }); toast.success('PDF do boleto gerado com sucesso!'); }); };

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white text-black rounded-lg p-6 space-y-4 print:shadow-none">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-4"><div className="w-20 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">Logo Banco</div><div className="text-2xl font-bold">{boleto.banco}</div></div>
          <div className="text-right"><div className="text-sm text-muted-foreground">Nosso Número</div><div className="text-lg font-mono font-bold">{boleto.numero}</div></div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Linha Digitável</div>
          <div className="flex items-center gap-2"><code className="text-lg font-mono tracking-wider flex-1">{boleto.linha_digitavel}</code><Button variant="ghost" size="sm" onClick={handleCopy}>{copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}</Button></div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4"><div><div className="text-xs text-muted-foreground">Beneficiário (Cedente)</div><div className="font-semibold">{boleto.cedente_nome}</div><div className="text-sm text-muted-foreground">{boleto.cedente_cnpj}</div></div><div><div className="text-xs text-muted-foreground">Agência/Código do Beneficiário</div><div className="font-mono">{boleto.agencia} / {boleto.conta}</div></div></div>
          <div className="space-y-4"><div><div className="text-xs text-muted-foreground">Pagador (Sacado)</div><div className="font-semibold">{boleto.sacado_nome}</div><div className="text-sm text-muted-foreground">{boleto.sacado_cpf_cnpj}</div></div><div className="flex gap-6"><div><div className="text-xs text-muted-foreground">Vencimento</div><div className="font-semibold">{formatDate(boleto.vencimento)}</div></div><div><div className="text-xs text-muted-foreground">Valor</div><div className="font-semibold text-lg">{formatCurrency(boleto.valor)}</div></div></div></div>
        </div>
        <Separator />
        <BoletoBarcode banco={boleto.banco} valor={boleto.valor} vencimento={boleto.vencimento} cedenteCnpj={boleto.cedente_cnpj || undefined} numero={boleto.numero} />
      </div>
      <div className="flex gap-2 print:hidden flex-wrap">
        <Button onClick={handleDownload} className="flex-1 gap-2"><Download className="h-4 w-4" />Download PDF</Button>
        <Button variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" />Imprimir</Button>
        <Button variant="outline" onClick={() => { onUpdateStatus({ id: boleto.id, status: 'enviado' }); toast.success('Boleto enviado por e-mail!'); }} className="gap-2"><Mail className="h-4 w-4" />Enviar</Button>
        {boleto.status !== 'pago' && boleto.status !== 'cancelado' && (
          <Button variant="outline" onClick={() => onUpdateStatus({ id: boleto.id, status: 'pago' })} className="gap-2 text-success"><CheckCircle2 className="h-4 w-4" />Marcar Pago</Button>
        )}
      </div>
    </div>
  );
}
