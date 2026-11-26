import { useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, FileSearch, Send, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { parseCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import {
  useAnalisesCredito,
  type AnaliseCredito,
  type FiltroAnaliseCredito,
} from '@/hooks/useAnalisesCredito';

const formatBRL = (v: number | null | undefined) =>
  typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

const formatData = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

/** Valor em pt-BR ("1.500,00") ou plano ("1500.5"); null quando vazio/inválido. */
function parseValorBRL(texto: string): number | null {
  if (!texto.trim()) return null;
  // Parser único do sistema: recusa separador ambíguo ("1,500.00") em vez de
  // gravar um limite mil vezes menor.
  const n = parseCurrency(texto, 'BRL');
  return Number.isFinite(n) && n > 0 ? n : null;
}

const formatCnpj = (cnpj: string | null) =>
  cnpj && cnpj.length === 14
    ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    : (cnpj ?? 'sem CNPJ');

const STATUS_LABEL: Record<AnaliseCredito['status'], string> = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
};

const STATUS_CLASS: Record<AnaliseCredito['status'], string> = {
  pendente: 'bg-warning/15 text-warning border-warning/30',
  em_analise: 'bg-primary/10 text-primary border-primary/30',
  aprovado: 'bg-success/15 text-success border-success/30',
  reprovado: 'bg-destructive/15 text-destructive border-destructive/30',
};

/** Mesmo prazo da edge function: aviso 'pendente' recém-gravado pode estar em curso. */
const CALLBACK_EM_CURSO_MS = 2 * 60_000;

const podeReenviar = (analise: AnaliseCredito) =>
  analise.callback_status === 'falhou' ||
  (analise.callback_status === 'pendente' &&
    Date.now() - Date.parse(analise.decidido_em ?? '') >= CALLBACK_EM_CURSO_MS);

type ModoDialogo = 'aprovar' | 'reprovar' | 'dados';

interface DialogoState {
  modo: ModoDialogo;
  analise: AnaliseCredito;
}

export function AnaliseCreditoPanel() {
  const [filtro, setFiltro] = useState<FiltroAnaliseCredito>('pendente');
  const [dialogo, setDialogo] = useState<DialogoState | null>(null);
  const {
    analises,
    total,
    isLoading,
    isError,
    erroCarga,
    decidir,
    isDecidindo,
    atualizarDados,
    isAtualizando,
    reenviarCallback,
    isReenviando,
  } = useAnalisesCredito(filtro);
  const truncada = total > analises.length;

  return (
    <div className="space-y-4">
      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as FiltroAnaliseCredito)}>
        <TabsList>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="aprovado">Aprovadas</TabsTrigger>
          <TabsTrigger value="reprovado">Reprovadas</TabsTrigger>
          <TabsTrigger value="todos">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      {truncada && (
        <p className="text-xs text-muted-foreground">
          Mostrando as {analises.length} mais recentes de {total}. As anteriores entram na lista
          conforme o topo da fila é resolvido.
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            {erroCarga ?? 'Não foi possível carregar a fila de análise de crédito.'}
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && analises.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma análise {filtro === 'todos' ? 'registrada' : `com status "${filtro}"`}. As
            solicitações chegam automaticamente do Promo Champions na 1ª venda de cada cliente.
          </CardContent>
        </Card>
      )}

      {analises.map((a) => (
        <AnaliseCard
          key={a.id}
          analise={a}
          onAbrir={(modo) => setDialogo({ modo, analise: a })}
          onReenviar={() => reenviarCallback(a.id)}
          reenviando={isReenviando}
        />
      ))}

      {dialogo && (
        <DialogoAnalise
          estado={dialogo}
          ocupado={isDecidindo || isAtualizando}
          onFechar={() => setDialogo(null)}
          onDecidir={(input) => {
            decidir(input, { onSuccess: () => setDialogo(null) });
          }}
          onAtualizar={(input) => {
            atualizarDados(input, { onSuccess: () => setDialogo(null) });
          }}
        />
      )}
    </div>
  );
}

function AnaliseCard({
  analise,
  onAbrir,
  onReenviar,
  reenviando,
}: {
  analise: AnaliseCredito;
  onAbrir: (modo: ModoDialogo) => void;
  onReenviar: () => void;
  reenviando: boolean;
}) {
  const decidida = analise.status === 'aprovado' || analise.status === 'reprovado';
  const cnpja = analise.dados_cnpja;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">
            {analise.cliente_empresa || analise.cliente_nome || 'Cliente sem nome'}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatCnpj(analise.cnpj)}
            </span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Pedido {analise.pedido_numero ?? analise.referencia_externa} ·{' '}
            {formatBRL(analise.valor_pedido)}
            {analise.vendedor_email ? ` · vendedor ${analise.vendedor_email}` : ''} · solicitado em{' '}
            {formatData(analise.solicitado_em ?? analise.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('font-semibold', STATUS_CLASS[analise.status])}>
            {STATUS_LABEL[analise.status]}
          </Badge>
          {decidida && analise.callback_status !== 'enviado' && (
            <Badge variant="destructive" title={analise.callback_erro ?? undefined}>
              Champions não avisado
            </Badge>
          )}
          {decidida && analise.callback_status !== 'enviado' && podeReenviar(analise) && (
            <Button size="sm" variant="outline" onClick={onReenviar} disabled={reenviando}>
              <Send className="h-4 w-4 mr-1" /> Reenviar ao Champions
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-1 sm:grid-cols-2">
          <Linha rotulo="Receita (CNPJ.já)">
            {cnpja
              ? `${cnpja.razaoSocial || '—'} · ${cnpja.situacaoCadastral ?? 'situação ?'} · aberta em ${formatData(cnpja.dataAbertura)} · capital ${formatBRL(cnpja.capitalSocial)}${cnpja.porte ? ` · ${cnpja.porte}` : ''}${cnpja.endereco?.uf ? ` · ${cnpja.endereco.uf}` : ''}`
              : 'não consultado'}
          </Linha>
          <Linha rotulo="Escavador">{analise.dados_escavador?.resumo || 'não registrado'}</Linha>
          <Linha rotulo="Consulta financeira">
            {analise.dados_consulta_financeira?.resumo || 'não registrada'}
          </Linha>
          <Linha rotulo="Contato">
            {[analise.cliente_nome, analise.cliente_email, analise.cliente_telefone]
              .filter(Boolean)
              .join(' · ') || '—'}
          </Linha>
        </div>

        {analise.alertas.length > 0 && (
          <ul className="space-y-1">
            {analise.alertas.map((al) => (
              <li
                key={al.codigo}
                className={cn(
                  'flex items-start gap-2 rounded-md border px-2 py-1 text-xs',
                  al.nivel === 'critico'
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-warning/40 bg-warning/10 text-foreground'
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{al.mensagem}</span>
              </li>
            ))}
          </ul>
        )}

        {decidida && (
          <p className="text-xs text-muted-foreground">
            Decidido em {formatData(analise.decidido_em)}
            {analise.status === 'aprovado'
              ? ` · limite ${formatBRL(analise.limite_aprovado)}${analise.parcelas_max ? ` · até ${analise.parcelas_max}x` : ''}`
              : ''}
            {analise.parecer ? ` · ${analise.parecer}` : ''}
          </p>
        )}

        {!decidida && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => onAbrir('dados')}>
              <FileSearch className="h-4 w-4 mr-1" /> Registrar consultas
            </Button>
            <Button size="sm" onClick={() => onAbrir('aprovar')}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onAbrir('reprovar')}>
              <XCircle className="h-4 w-4 mr-1" /> Reprovar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <p>
      <span className="text-muted-foreground">{rotulo}: </span>
      <span>{children}</span>
    </p>
  );
}

function DialogoAnalise({
  estado,
  ocupado,
  onFechar,
  onDecidir,
  onAtualizar,
}: {
  estado: DialogoState;
  ocupado: boolean;
  onFechar: () => void;
  onDecidir: (input: {
    analiseId: string;
    decisao: 'aprovado' | 'reprovado';
    limiteAprovado?: number | null;
    parcelasMax?: number | null;
    parecer?: string | null;
  }) => void;
  onAtualizar: (input: {
    analiseId: string;
    cnpj?: string | null;
    escavador?: string | null;
    consultaFinanceira?: string | null;
  }) => void;
}) {
  const { modo, analise } = estado;
  // Pré-preenchido no formato do campo ("1.500,75"): o parser é estrito e
  // recusaria o ponto decimal do JavaScript, travando a aprovação.
  const [limite, setLimite] = useState<string>(
    analise.valor_pedido != null
      ? analise.valor_pedido.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : ''
  );
  const [parcelas, setParcelas] = useState<string>('1');
  const [parecer, setParecer] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>(analise.cnpj ?? '');
  const [escavador, setEscavador] = useState<string>(analise.dados_escavador?.resumo ?? '');
  const [consulta, setConsulta] = useState<string>(analise.dados_consulta_financeira?.resumo ?? '');

  // Texto digitado que não vira valor bloqueia a aprovação (ex.: "1.500,00" mal colado).
  const limiteInvalido =
    modo === 'aprovar' && limite.trim() !== '' && parseValorBRL(limite) === null;

  const titulo =
    modo === 'aprovar'
      ? 'Aprovar crédito'
      : modo === 'reprovar'
        ? 'Reprovar crédito'
        : 'Registrar consultas';

  const confirmar = () => {
    if (modo === 'dados') {
      // Só o que o analista mexeu vai na requisição; campo intocado não
      // sobrescreve o que outro analista salvou enquanto o diálogo estava aberto.
      const mudou = (atual: string, inicial: string) =>
        atual.trim() !== inicial.trim() ? atual.trim() || null : undefined;
      onAtualizar({
        analiseId: analise.id,
        cnpj: mudou(cnpj, analise.cnpj ?? ''),
        escavador: mudou(escavador, analise.dados_escavador?.resumo ?? ''),
        consultaFinanceira: mudou(consulta, analise.dados_consulta_financeira?.resumo ?? ''),
      });
      return;
    }
    const parcelasNum = Number(parcelas);
    onDecidir({
      analiseId: analise.id,
      decisao: modo === 'aprovar' ? 'aprovado' : 'reprovado',
      limiteAprovado: modo === 'aprovar' ? parseValorBRL(limite) : null,
      parcelasMax:
        modo === 'aprovar' && Number.isInteger(parcelasNum) && parcelasNum > 0 ? parcelasNum : null,
      parecer: parecer.trim() || null,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {analise.cliente_empresa || analise.cliente_nome} · pedido{' '}
            {analise.pedido_numero ?? analise.referencia_externa} ·{' '}
            {formatBRL(analise.valor_pedido)}
          </DialogDescription>
        </DialogHeader>

        {modo === 'dados' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="credito-cnpj">CNPJ (reconsulta o CNPJ.já ao salvar)</Label>
              <Input
                id="credito-cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="credito-escavador">Escavador (processos, protestos)</Label>
              <Textarea
                id="credito-escavador"
                value={escavador}
                onChange={(e) => setEscavador(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="credito-consulta">Consulta financeira (Serasa/SCR/referências)</Label>
              <Textarea
                id="credito-consulta"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {modo === 'aprovar' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="credito-limite">Limite aprovado (R$)</Label>
              <Input
                id="credito-limite"
                inputMode="decimal"
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
                aria-invalid={limiteInvalido}
              />
              {limiteInvalido && (
                <p className="text-xs text-destructive">Informe um valor válido, ex.: 1.500,00</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="credito-parcelas">Parcelas (máx.)</Label>
              <Input
                id="credito-parcelas"
                inputMode="numeric"
                value={parcelas}
                onChange={(e) => setParcelas(e.target.value)}
              />
            </div>
          </div>
        )}

        {modo !== 'dados' && (
          <div className="space-y-1">
            <Label htmlFor="credito-parecer">
              Parecer {modo === 'reprovar' ? '(motivo — vai para o vendedor)' : '(opcional)'}
            </Label>
            <Textarea
              id="credito-parecer"
              value={parecer}
              onChange={(e) => setParecer(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button
            onClick={confirmar}
            disabled={ocupado || limiteInvalido || (modo === 'reprovar' && !parecer.trim())}
            variant={modo === 'reprovar' ? 'destructive' : 'default'}
          >
            {ocupado ? 'Enviando…' : titulo}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
