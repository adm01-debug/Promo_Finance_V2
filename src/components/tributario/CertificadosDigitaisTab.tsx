import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertTriangle, KeyRound, Loader2, Plus, ShieldCheck, Upload } from 'lucide-react';
import {
  useCertificadosDigitais,
  useToggleCertificado,
  useUploadCertificado,
} from '@/hooks/useCertificadosDigitais';
import { useUserEmpresas } from '@/hooks/useUserEmpresas';
import { getAllStates } from '@/lib/brazilian-validators/estados';
import { formatCNPJ } from '@/lib/brazilian-validators/cnpj';

const DIAS_ALERTA_VENCIMENTO = 30;

function statusVencimento(validoAte: string): {
  variant: 'default' | 'destructive' | 'outline';
  label: string;
  dias: number;
} {
  const alvo = new Date(validoAte).getTime();
  const dias = Math.floor((alvo - Date.now()) / (1000 * 60 * 60 * 24));
  if (dias < 0) return { variant: 'destructive', label: 'Vencido', dias };
  if (dias <= DIAS_ALERTA_VENCIMENTO) return { variant: 'destructive', label: `Vence em ${dias}d`, dias };
  if (dias <= 60) return { variant: 'outline', label: `${dias}d restantes`, dias };
  return { variant: 'default', label: 'Vigente', dias };
}

export function CertificadosDigitaisTab() {
  const { data: vinculos = [], isLoading: loadingEmpresas } = useUserEmpresas();
  const { data: certificados = [], isLoading: loadingCerts } = useCertificadosDigitais();
  const upload = useUploadCertificado();
  const toggle = useToggleCertificado();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [uf, setUf] = useState<string>('SP');
  const [ambiente, setAmbiente] = useState<'homologacao' | 'producao'>('homologacao');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');

  const empresas = useMemo(
    () => vinculos.map((v) => ({ id: v.empresa_id, label: v.empresa.razao_social })),
    [vinculos],
  );

  const vencendo = useMemo(
    () => certificados.filter((c) => c.ativo && statusVencimento(c.valido_ate).dias <= DIAS_ALERTA_VENCIMENTO),
    [certificados],
  );

  const resetForm = () => {
    setEmpresaId('');
    setFile(null);
    setPassword('');
    setUf('SP');
    setAmbiente('homologacao');
  };

  const handleSubmit = async () => {
    if (!empresaId || !file || !password) return;
    try {
      await upload.mutateAsync({ empresa_id: empresaId, file, password, ambiente, uf });
      setDialogOpen(false);
      resetForm();
    } catch { /* toast já disparado no hook */ }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Certificados Digitais A1
            </CardTitle>
            <CardDescription>
              Necessários para comunicação com a SEFAZ (descoberta automática de NF-e emitidas contra seus CNPJs).
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo certificado</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Cadastrar certificado digital A1</DialogTitle>
                <DialogDescription>
                  Envie o arquivo <code>.pfx</code> do CNPJ e a senha. O arquivo é armazenado
                  criptografado e usado apenas no backend para chamadas à SEFAZ.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Empresa</Label>
                  <Select value={empresaId} onValueChange={setEmpresaId} disabled={loadingEmpresas}>
                    <SelectTrigger><SelectValue placeholder="Selecionar empresa" /></SelectTrigger>
                    <SelectContent>
                      {empresas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>UF</Label>
                    <Select value={uf} onValueChange={setUf}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {getAllStates().map((s) => (
                          <SelectItem key={s.abbr} value={s.abbr}>{s.abbr} — {s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ambiente SEFAZ</Label>
                    <Select value={ambiente} onValueChange={(v) => setAmbiente(v as typeof ambiente)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação (testes)</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Arquivo .pfx</Label>
                  <Input
                    type="file"
                    accept=".pfx,.p12,application/x-pkcs12"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Senha do certificado</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                    placeholder="Senha usada ao exportar o .pfx"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={upload.isPending}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!empresaId || !file || !password || upload.isPending}
                  className="gap-2"
                >
                  {upload.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Validando…</>
                    : <><Upload className="h-4 w-4" /> Enviar</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="space-y-4">
          {vencendo.length > 0 && (
            <Alert variant="warning" title="Atenção: certificados vencendo">
              {vencendo.length} certificado(s) vencem em até {DIAS_ALERTA_VENCIMENTO} dias.
              Renove com o AR ou autoridade certificadora antes do vencimento para evitar
              interrupção na descoberta automática de NF-e.
            </Alert>
          )}


          {loadingCerts ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : certificados.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="Nenhum certificado cadastrado"
              description="Cadastre o certificado A1 (.pfx) de cada CNPJ para habilitar a integração automática com a SEFAZ."
            />
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Razão social</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificados.map((c) => {
                    const st = statusVencimento(c.valido_ate);
                    const validade = new Date(c.valido_ate);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{formatCNPJ(c.cnpj)}</TableCell>
                        <TableCell className="max-w-[240px] truncate" title={c.razao_social ?? ''}>
                          {c.razao_social ?? '—'}
                        </TableCell>
                        <TableCell>{c.uf}</TableCell>
                        <TableCell>
                          <Badge variant={c.ambiente === 'producao' ? 'default' : 'outline'}>
                            {c.ambiente === 'producao' ? 'Produção' : 'Homologação'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {validade.toLocaleDateString('pt-BR')}{' '}
                          <span className="text-muted-foreground text-xs">
                            ({formatDistanceToNow(validade, { locale: ptBR, addSuffix: true })})
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={c.ativo}
                            disabled={toggle.isPending}
                            onCheckedChange={(v) => toggle.mutate({ id: c.id, ativo: v })}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
