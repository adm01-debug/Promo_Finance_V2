/**
 * Gestão de organizações: criação, membros e convites.
 * Apresentação apenas — regras de negócio vêm de `@/lib/organizacoes/convites`
 * e a autorização efetiva é garantida pelas policies de RLS.
 */
import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Building2, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  useAtualizarMembro,
  useConvitesOrganizacao,
  useCriarConvite,
  useCriarOrganizacao,
  useMembrosOrganizacao,
  useOrganizacoes,
  useRevogarConvite,
} from '@/hooks/useOrganizacoes';
import {
  ROTULO_ORG_PAPEL,
  resumirMembros,
  type OrgPapel,
} from '@/lib/organizacoes/convites';
import { ConvitesCard, MembrosCard } from './Organizacoes.parts';

function mensagemErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.';
}

export default function Organizacoes() {
  const { user } = useAuth();
  const organizacoes = useOrganizacoes();
  const [orgSelecionada, setOrgSelecionada] = useState<string | null>(null);

  useEffect(() => {
    if (!orgSelecionada && organizacoes.data && organizacoes.data.length > 0) {
      setOrgSelecionada(organizacoes.data[0].id);
    }
  }, [organizacoes.data, orgSelecionada]);

  const membros = useMembrosOrganizacao(orgSelecionada);
  const convites = useConvitesOrganizacao(orgSelecionada);

  const criarOrganizacao = useCriarOrganizacao();
  const criarConvite = useCriarConvite(orgSelecionada);
  const revogarConvite = useRevogarConvite(orgSelecionada);
  const atualizarMembro = useAtualizarMembro(orgSelecionada);

  const [novaOrg, setNovaOrg] = useState({ nome: '', cnpj: '' });
  const [novoConvite, setNovoConvite] = useState<{ email: string; papel: OrgPapel }>({
    email: '',
    papel: 'MEMBRO',
  });

  const organizacaoAtual = useMemo(
    () => organizacoes.data?.find((org) => org.id === orgSelecionada) ?? null,
    [organizacoes.data, orgSelecionada],
  );

  const resumo = useMemo(() => resumirMembros(membros.data ?? []), [membros.data]);
  const ehResponsavel = organizacaoAtual?.responsavel_id === user?.id;

  const copiarLink = async (token: string) => {
    const link = `${window.location.origin}/convite/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link do convite copiado.');
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente: ' + link);
    }
  };

  return (
    <MainLayout>
      <div className="relative">
        <PageBackground />
        <PageHeader
          title="Organizações"
          subtitle="Estrutura multi-tenant: crie organizações, convide pessoas e defina papéis."
          icon={Building2}
        />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Nova organização
              </CardTitle>
              <CardDescription>
                Você se torna o responsável e o primeiro membro ativo automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-[2fr_1fr_auto] md:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  criarOrganizacao.mutate(
                    { nome: novaOrg.nome, cnpj: novaOrg.cnpj },
                    {
                      onSuccess: (org) => {
                        toast.success(`Organização "${org.nome}" criada.`);
                        setNovaOrg({ nome: '', cnpj: '' });
                        setOrgSelecionada(org.id);
                      },
                      onError: (erro) => toast.error(mensagemErro(erro)),
                    },
                  );
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="org-nome">Nome</Label>
                  <Input
                    id="org-nome"
                    value={novaOrg.nome}
                    onChange={(e) => setNovaOrg((s) => ({ ...s, nome: e.target.value }))}
                    placeholder="Escritório Contábil Alpha"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-cnpj">CNPJ (opcional)</Label>
                  <Input
                    id="org-cnpj"
                    value={novaOrg.cnpj}
                    onChange={(e) => setNovaOrg((s) => ({ ...s, cnpj: e.target.value }))}
                    placeholder="00.000.000/0001-00"
                    inputMode="numeric"
                  />
                </div>
                <Button type="submit" disabled={criarOrganizacao.isPending}>
                  {criarOrganizacao.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Minhas organizações</CardTitle>
                <CardDescription>
                  {resumo.ativos} membro(s) ativo(s) · {resumo.inativos} inativo(s)
                </CardDescription>
              </div>
              <div className="w-full md:w-80">
                {organizacoes.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={orgSelecionada ?? undefined}
                    onValueChange={(valor) => setOrgSelecionada(valor)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma organização" />
                    </SelectTrigger>
                    <SelectContent>
                      {(organizacoes.data ?? []).map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!organizacoes.isLoading && (organizacoes.data ?? []).length === 0 && (
                <Alert>
                  <AlertDescription>
                    Você ainda não participa de nenhuma organização. Crie a primeira acima ou
                    aceite um convite recebido por e-mail.
                  </AlertDescription>
                </Alert>
              )}

              {organizacaoAtual && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{organizacaoAtual.tipo}</Badge>
                  {ehResponsavel && (
                    <Badge className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Você é o responsável
                    </Badge>
                  )}
                  {Object.entries(resumo.porPapel)
                    .filter(([, total]) => total > 0)
                    .map(([papel, total]) => (
                      <Badge key={papel} variant="secondary">
                        {ROTULO_ORG_PAPEL[papel as OrgPapel]}: {total}
                      </Badge>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {orgSelecionada && (
            <>
              <ConvitesCard
                convites={convites.data}
                convitesLoading={convites.isLoading}
                novoConvite={novoConvite}
                onNovoConviteChange={(patch) => setNovoConvite((s) => ({ ...s, ...patch }))}
                convitePending={criarConvite.isPending}
                onSubmitConvite={() =>
                  criarConvite.mutate(novoConvite, {
                    onSuccess: (convite) => {
                      toast.success(
                        convite.emailEnviado
                          ? `Convite enviado por e-mail para ${convite.email_convidado}.`
                          : 'Convite gerado. Copie o link e envie ao convidado.',
                      );
                      setNovoConvite({ email: '', papel: 'MEMBRO' });
                    },
                    onError: (erro) => toast.error(mensagemErro(erro)),
                  })
                }
                onRevogar={(id) =>
                  revogarConvite.mutate(id, {
                    onSuccess: () => toast.success('Convite revogado.'),
                    onError: (erro) => toast.error(mensagemErro(erro)),
                  })
                }
                onCopiarLink={copiarLink}
              />

              <MembrosCard
                membros={membros.data}
                membrosLoading={membros.isLoading}
                ehResponsavel={ehResponsavel}
                onAtualizarPapel={(membro, papel) =>
                  atualizarMembro.mutate(
                    {
                      membro,
                      membros: membros.data ?? [],
                      papel,
                    },
                    {
                      onSuccess: () => toast.success('Papel atualizado.'),
                      onError: (erro) => toast.error(mensagemErro(erro)),
                    },
                  )
                }
                onToggleAtivo={(membro) =>
                  atualizarMembro.mutate(
                    {
                      membro,
                      membros: membros.data ?? [],
                      ativo: !membro.ativo,
                    },
                    {
                      onSuccess: () => toast.success('Vínculo atualizado.'),
                      onError: (erro) => toast.error(mensagemErro(erro)),
                    },
                  )
                }
              />
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
