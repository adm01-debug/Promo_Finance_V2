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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Copy, Mail, Plus, ShieldCheck, UserMinus } from 'lucide-react';
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
  statusConvite,
  type OrgPapel,
} from '@/lib/organizacoes/convites';

const PAPEIS_CONVIDAVEIS: OrgPapel[] = ['ADMIN', 'MEMBRO', 'LEITOR'];

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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Convites
                  </CardTitle>
                  <CardDescription>
                    Convites expiram em 7 dias e só podem ser aceitos pelo e-mail convidado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    className="grid gap-4 md:grid-cols-[2fr_1fr_auto] md:items-end"
                    onSubmit={(event) => {
                      event.preventDefault();
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
                      });
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="convite-email">E-mail</Label>
                      <Input
                        id="convite-email"
                        type="email"
                        value={novoConvite.email}
                        onChange={(e) => setNovoConvite((s) => ({ ...s, email: e.target.value }))}
                        placeholder="pessoa@empresa.com.br"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="convite-papel">Papel</Label>
                      <Select
                        value={novoConvite.papel}
                        onValueChange={(valor) =>
                          setNovoConvite((s) => ({ ...s, papel: valor as OrgPapel }))
                        }
                      >
                        <SelectTrigger id="convite-papel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAPEIS_CONVIDAVEIS.map((papel) => (
                            <SelectItem key={papel} value={papel}>
                              {ROTULO_ORG_PAPEL[papel]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={criarConvite.isPending}>
                      {criarConvite.isPending ? 'Gerando...' : 'Convidar'}
                    </Button>
                  </form>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(convites.data ?? []).map((convite) => {
                        const status = statusConvite(convite);
                        return (
                          <TableRow key={convite.id}>
                            <TableCell className="font-medium">{convite.email_convidado}</TableCell>
                            <TableCell>{ROTULO_ORG_PAPEL[convite.papel_proposto]}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  status === 'PENDENTE'
                                    ? 'default'
                                    : status === 'UTILIZADO'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                              >
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              {status === 'PENDENTE' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void copiarLink(convite.token)}
                                >
                                  <Copy className="mr-1 h-3 w-3" /> Link
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  revogarConvite.mutate(convite.id, {
                                    onSuccess: () => toast.success('Convite revogado.'),
                                    onError: (erro) => toast.error(mensagemErro(erro)),
                                  })
                                }
                              >
                                Revogar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {!convites.isLoading && (convites.data ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhum convite emitido.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Membros</CardTitle>
                  <CardDescription>
                    A organização precisa manter ao menos um gestor ativo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pessoa</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(membros.data ?? []).map((membro) => (
                        <TableRow key={membro.id}>
                          <TableCell>
                            <div className="font-medium">{membro.nome ?? 'Usuário'}</div>
                            <div className="text-xs text-muted-foreground">
                              {membro.email ?? membro.usuario_id}
                            </div>
                          </TableCell>
                          <TableCell className="w-48">
                            <Select
                              value={membro.papel_na_org}
                              disabled={!ehResponsavel || membro.papel_na_org === 'RESPONSAVEL'}
                              onValueChange={(valor) =>
                                atualizarMembro.mutate(
                                  {
                                    membro,
                                    membros: membros.data ?? [],
                                    papel: valor as OrgPapel,
                                  },
                                  {
                                    onSuccess: () => toast.success('Papel atualizado.'),
                                    onError: (erro) => toast.error(mensagemErro(erro)),
                                  },
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(['RESPONSAVEL', ...PAPEIS_CONVIDAVEIS] as OrgPapel[]).map(
                                  (papel) => (
                                    <SelectItem
                                      key={papel}
                                      value={papel}
                                      disabled={papel === 'RESPONSAVEL'}
                                    >
                                      {ROTULO_ORG_PAPEL[papel]}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant={membro.ativo ? 'default' : 'secondary'}>
                              {membro.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={!ehResponsavel || membro.papel_na_org === 'RESPONSAVEL'}
                              onClick={() =>
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
                            >
                              <UserMinus className="mr-1 h-3 w-3" />
                              {membro.ativo ? 'Desativar' : 'Reativar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!membros.isLoading && (membros.data ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhum membro vinculado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
