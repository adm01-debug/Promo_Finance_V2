/**
 * Etapa R — Página de preferências do resumo (digest) de conformidade fiscal.
 *
 * Camada puramente de apresentação: toda a semântica de elegibilidade vive no
 * motor puro `preferencias-digest.ts` e no job de envio. Aqui apenas coletamos
 * e persistimos a configuração do usuário.
 */
import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, MailCheck, Save } from 'lucide-react';
import {
  PREFERENCIA_DIGEST_PADRAO,
  useDigestPreferences,
  type DigestPreferenceInput,
} from '@/hooks/useDigestPreferences';
import type { FrequenciaDigest, SeveridadeDigest } from '@/lib/tributario/obrigacoes/preferencias-digest';

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const SEVERIDADES: { valor: SeveridadeDigest; rotulo: string; ajuda: string }[] = [
  { valor: 'critica', rotulo: 'Somente críticas', ajuda: 'Apenas o que exige ação imediata.' },
  { valor: 'alta', rotulo: 'Alta ou pior', ajuda: 'Críticas e altas.' },
  { valor: 'media', rotulo: 'Média ou pior', ajuda: 'Recomendado para a rotina contábil.' },
  { valor: 'baixa', rotulo: 'Todas', ajuda: 'Inclui alertas informativos.' },
];

const FREQUENCIAS: { valor: FrequenciaDigest; rotulo: string }[] = [
  { valor: 'diaria', rotulo: 'Diária' },
  { valor: 'semanal', rotulo: 'Semanal' },
  { valor: 'mensal', rotulo: 'Mensal' },
];

const emailValido = (valor: string) => valor === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

export default function PreferenciasDigest() {
  const { preferencia, isLoading, error, salvar, isSaving } = useDigestPreferences();
  const [form, setForm] = useState<DigestPreferenceInput>(PREFERENCIA_DIGEST_PADRAO);

  useEffect(() => {
    if (!preferencia) return;
    setForm({
      ativo: preferencia.ativo,
      frequencia: preferencia.frequencia,
      dia_semana: preferencia.dia_semana,
      dia_mes: preferencia.dia_mes,
      hora_envio: preferencia.hora_envio,
      severidade_minima: preferencia.severidade_minima,
      tipos_ignorados: preferencia.tipos_ignorados ?? [],
      empresas_filtro: preferencia.empresas_filtro ?? [],
      email_alternativo: preferencia.email_alternativo,
      max_alertas: preferencia.max_alertas,
    });
  }, [preferencia]);

  const emailOk = emailValido(form.email_alternativo ?? '');

  const resumo = useMemo(() => {
    if (!form.ativo) return 'Envio desativado.';
    const quando =
      form.frequencia === 'diaria'
        ? 'todos os dias'
        : form.frequencia === 'semanal'
          ? `toda ${DIAS_SEMANA[form.dia_semana]}`
          : `todo dia ${form.dia_mes} do mês`;
    const sev = SEVERIDADES.find((s) => s.valor === form.severidade_minima)?.rotulo ?? '';
    return `Você receberá ${quando}, às ${String(form.hora_envio).padStart(2, '0')}:00 (horário de Brasília) — ${sev.toLowerCase()}.`;
  }, [form]);

  return (
    <MainLayout>
      <PageBackground>
        <PageHeader
          title="Preferências do resumo fiscal"
          description="Defina com que frequência e com qual nível de severidade você recebe por e-mail o resumo de conformidade fiscal."
        />

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Configuração de envio</CardTitle>
                <CardDescription>
                  As preferências valem apenas para você e não alteram os alertas do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label htmlFor="digest-ativo" className="text-base">
                      Receber o resumo por e-mail
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Desative para pausar os envios sem perder a configuração.
                    </p>
                  </div>
                  <Switch
                    id="digest-ativo"
                    checked={form.ativo}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="digest-frequencia">Frequência</Label>
                    <Select
                      value={form.frequencia}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, frequencia: v as FrequenciaDigest }))
                      }
                    >
                      <SelectTrigger id="digest-frequencia">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIAS.map((f) => (
                          <SelectItem key={f.valor} value={f.valor}>
                            {f.rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="digest-hora">Horário de envio</Label>
                    <Select
                      value={String(form.hora_envio)}
                      onValueChange={(v) => setForm((f) => ({ ...f, hora_envio: Number(v) }))}
                    >
                      <SelectTrigger id="digest-hora">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, h) => (
                          <SelectItem key={h} value={String(h)}>
                            {String(h).padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {form.frequencia === 'semanal' && (
                    <div className="space-y-2">
                      <Label htmlFor="digest-dia-semana">Dia da semana</Label>
                      <Select
                        value={String(form.dia_semana)}
                        onValueChange={(v) => setForm((f) => ({ ...f, dia_semana: Number(v) }))}
                      >
                        <SelectTrigger id="digest-dia-semana">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIAS_SEMANA.map((d, i) => (
                            <SelectItem key={d} value={String(i)}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {form.frequencia === 'mensal' && (
                    <div className="space-y-2">
                      <Label htmlFor="digest-dia-mes">Dia do mês</Label>
                      <Select
                        value={String(form.dia_mes)}
                        onValueChange={(v) => setForm((f) => ({ ...f, dia_mes: Number(v) }))}
                      >
                        <SelectTrigger id="digest-dia-mes">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              Dia {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Limitado ao dia 28 para existir em todos os meses.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="digest-severidade">Severidade mínima</Label>
                    <Select
                      value={form.severidade_minima}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, severidade_minima: v as SeveridadeDigest }))
                      }
                    >
                      <SelectTrigger id="digest-severidade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERIDADES.map((s) => (
                          <SelectItem key={s.valor} value={s.valor}>
                            {s.rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {SEVERIDADES.find((s) => s.valor === form.severidade_minima)?.ajuda}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="digest-max">Máximo de alertas por e-mail</Label>
                    <Input
                      id="digest-max"
                      type="number"
                      min={1}
                      max={500}
                      value={form.max_alertas}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          max_alertas: Math.min(500, Math.max(1, Number(e.target.value) || 1)),
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="digest-email">E-mail alternativo (opcional)</Label>
                    <Input
                      id="digest-email"
                      type="email"
                      placeholder="contabilidade@empresa.com.br"
                      value={form.email_alternativo ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email_alternativo: e.target.value }))
                      }
                      aria-invalid={!emailOk}
                    />
                    {!emailOk && (
                      <p className="text-xs text-destructive">Informe um e-mail válido.</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Se vazio, o resumo vai para o e-mail da sua conta.
                    </p>
                  </div>
                </div>

                <Button onClick={() => salvar(form)} disabled={isSaving || !emailOk}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Salvando...' : 'Salvar preferências'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MailCheck className="h-5 w-5 text-primary" />
                  Resumo
                </CardTitle>
                <CardDescription>Como ficará o seu envio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">{resumo}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={form.ativo ? 'default' : 'secondary'}>
                    {form.ativo ? 'Ativo' : 'Pausado'}
                  </Badge>
                  <Badge variant="outline">{form.max_alertas} alertas no máximo</Badge>
                </div>
                {preferencia?.ultimo_envio_em && (
                  <p className="text-xs text-muted-foreground">
                    Último envio:{' '}
                    {new Date(preferencia.ultimo_envio_em).toLocaleString('pt-BR')}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Envios idênticos consecutivos são suprimidos automaticamente para evitar
                  repetição.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </PageBackground>
    </MainLayout>
  );
}
