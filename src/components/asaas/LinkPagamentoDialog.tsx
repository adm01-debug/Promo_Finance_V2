// ============================================
// DIALOG: Link de Pagamento ASAAS
// ============================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Link2, Copy, ExternalLink } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId?: string;
}

export function LinkPagamentoDialog({ open, onOpenChange, empresaId }: Props) {
  const { criarLinkPagamento } = useAsaas(empresaId);

  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoCobranca, setTipoCobranca] = useState('DETACHED');
  const [diasLimite, setDiasLimite] = useState('10');
  const [maxParcelas, setMaxParcelas] = useState('');
  const [linkGerado, setLinkGerado] = useState<string | null>(null);

  const handleCriar = async () => {
    const valorNum = parseFloat(valor);
    if (!nome || isNaN(valorNum) || valorNum <= 0) {
      toast.error('Preencha nome e valor');
      return;
    }

    try {
      const result = await criarLinkPagamento.mutateAsync({
        nome,
        valor: valorNum,
        descricao: descricao || undefined,
        tipo_cobranca: tipoCobranca,
        dias_limite_vencimento: parseInt(diasLimite) || 10,
        max_parcelas: maxParcelas ? parseInt(maxParcelas) : undefined,
      });
      if (result?.url) {
        setLinkGerado(result.url);
      } else {
        onOpenChange(false);
        resetForm();
      }
    } catch { /* hook handles */ }
  };

  const resetForm = () => {
    setNome(''); setValor(''); setDescricao('');
    setTipoCobranca('DETACHED'); setDiasLimite('10');
    setMaxParcelas(''); setLinkGerado(null);
  };

  const copyLink = () => {
    if (linkGerado) {
      navigator.clipboard.writeText(linkGerado);
      toast.success('Link copiado!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" /> Link de Pagamento
          </DialogTitle>
          <DialogDescription>Crie um link compartilhável para receber pagamentos</DialogDescription>
        </DialogHeader>

        {linkGerado ? (
          <div className="space-y-4 mt-2">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <p className="text-sm font-medium text-foreground">Link criado com sucesso!</p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded border border-border overflow-hidden text-ellipsis whitespace-nowrap">
                  {linkGerado}
                </code>
                <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <a href={linkGerado} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Abrir Link
                </a>
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={resetForm}>
              Criar Outro Link
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nome do link *</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Venda de Produto X" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="100.00" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipoCobranca} onValueChange={setTipoCobranca}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DETACHED">Avulso</SelectItem>
                    <SelectItem value="INSTALLMENT">Parcelado</SelectItem>
                    <SelectItem value="RECURRENT">Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dias para vencimento</Label>
                <Input type="number" min="1" value={diasLimite} onChange={e => setDiasLimite(e.target.value)} />
              </div>
              {tipoCobranca === 'INSTALLMENT' && (
                <div className="space-y-2">
                  <Label>Máx. parcelas</Label>
                  <Input type="number" min="2" max="12" value={maxParcelas} onChange={e => setMaxParcelas(e.target.value)} placeholder="12" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição do pagamento..." rows={2} />
            </div>

            <Button className="w-full" onClick={handleCriar} disabled={criarLinkPagamento.isPending || !nome || !valor}>
              {criarLinkPagamento.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
              ) : (
                <><Link2 className="h-4 w-4 mr-2" /> Gerar Link</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
