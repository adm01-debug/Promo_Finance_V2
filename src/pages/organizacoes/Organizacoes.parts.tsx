// Cards de convites e membros da página Organizacoes — extraídos para zerar max-lines.
import { Copy, Mail, UserMinus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  ROTULO_ORG_PAPEL,
  statusConvite,
  type OrgPapel,
} from '@/lib/organizacoes/convites';
import type { ConviteOrganizacao, MembroOrganizacao } from '@/hooks/useOrganizacoes';

const PAPEIS_CONVIDAVEIS: OrgPapel[] = ['ADMIN', 'MEMBRO', 'LEITOR'];

export function ConvitesCard({
  convites,
  convitesLoading,
  novoConvite,
  onNovoConviteChange,
  convitePending,
  onSubmitConvite,
  onRevogar,
  onCopiarLink,
}: {
  convites: ConviteOrganizacao[] | undefined;
  convitesLoading: boolean;
  novoConvite: { email: string; papel: OrgPapel };
  onNovoConviteChange: (patch: Partial<{ email: string; papel: OrgPapel }>) => void;
  convitePending: boolean;
  onSubmitConvite: () => void;
  onRevogar: (id: string) => void;
  onCopiarLink: (token: string) => void;
}) {
  return (
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
            onSubmitConvite();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="convite-email">E-mail</Label>
            <Input
              id="convite-email"
              type="email"
              value={novoConvite.email}
              onChange={(e) => onNovoConviteChange({ email: e.target.value })}
              placeholder="pessoa@empresa.com.br"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="convite-papel">Papel</Label>
            <Select
              value={novoConvite.papel}
              onValueChange={(valor) =>
                onNovoConviteChange({ papel: valor as OrgPapel })
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
          <Button type="submit" disabled={convitePending}>
            {convitePending ? 'Gerando...' : 'Convidar'}
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
            {(convites ?? []).map((convite) => {
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
                        onClick={() => void onCopiarLink(convite.token)}
                      >
                        <Copy className="mr-1 h-3 w-3" /> Link
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRevogar(convite.id)}
                    >
                      Revogar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!convitesLoading && (convites ?? []).length === 0 && (
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
  );
}

export function MembrosCard({
  membros,
  membrosLoading,
  ehResponsavel,
  onAtualizarPapel,
  onToggleAtivo,
}: {
  membros: MembroOrganizacao[] | undefined;
  membrosLoading: boolean;
  ehResponsavel: boolean;
  onAtualizarPapel: (membro: MembroOrganizacao, papel: OrgPapel) => void;
  onToggleAtivo: (membro: MembroOrganizacao) => void;
}) {
  return (
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
            {(membros ?? []).map((membro) => (
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
                      onAtualizarPapel(membro, valor as OrgPapel)
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
                    onClick={() => onToggleAtivo(membro)}
                  >
                    <UserMinus className="mr-1 h-3 w-3" />
                    {membro.ativo ? 'Desativar' : 'Reativar'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!membrosLoading && (membros ?? []).length === 0 && (
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
  );
}
