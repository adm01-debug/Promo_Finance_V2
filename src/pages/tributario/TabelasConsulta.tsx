import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LISTA_LC116, TIPI } from '@/lib/tributario/ipi-iss';
import { pct, LOCAL_LABEL } from './IpiIss.helpers';

export function TabelasConsulta() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TIPI — Decreto 11.158/2022</CardTitle>
          <CardDescription>Recorte operacional dos NCM de maior giro.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NCM</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Alíquota</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TIPI.map((t) => (
                  <TableRow key={t.ncm}>
                    <TableCell className="tabular-nums">{t.ncm}</TableCell>
                    <TableCell>{t.descricao}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(t.aliquota)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.situacao.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de serviços — LC 116/2003</CardTitle>
          <CardDescription>Local de incidência e retenções aplicáveis por item.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-right">IRRF</TableHead>
                  <TableHead>INSS 11%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LISTA_LC116.map((i) => (
                  <TableRow key={i.item}>
                    <TableCell className="tabular-nums">{i.item}</TableCell>
                    <TableCell>{i.descricao}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {LOCAL_LABEL[i.local]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {i.irrfAliquota ? pct(i.irrfAliquota) : '—'}
                    </TableCell>
                    <TableCell>
                      {i.retencaoInss11 ? <Badge variant="destructive">Sim</Badge> : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
