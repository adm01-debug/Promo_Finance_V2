import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Info, Truck } from 'lucide-react';
import { ALIQUOTAS_UF, UFS } from '@/lib/tributario/icms';
import { SubstituicaoTributaria } from './SubstituicaoTributaria';
import { DiferencialAliquotas } from './DiferencialAliquotas';
import { pct } from './IcmsStDifal.helpers';

export default function IcmsStDifalPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 md:p-6">
          <PageHeader
            title="ICMS — Substituição Tributária e DIFAL"
            subtitle="MVA ajustada, PMPF, FCP e diferencial de alíquotas nas 27 unidades federativas."
            badge="Etapa C"
            icon={Truck}
            gradientFrom="from-primary/80"
            gradientVia="via-primary"
            gradientTo="to-warning"
          />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              As alíquotas internas cadastradas são as modais de cada UF. Produtos com alíquota
              específica devem ser calculados com o override de alíquota interna.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="st">
            <TabsList>
              <TabsTrigger value="st">Substituição Tributária</TabsTrigger>
              <TabsTrigger value="difal">DIFAL</TabsTrigger>
              <TabsTrigger value="tabela">Tabela por UF</TabsTrigger>
            </TabsList>
            <TabsContent value="st" className="mt-6">
              <SubstituicaoTributaria />
            </TabsContent>
            <TabsContent value="difal" className="mt-6">
              <DiferencialAliquotas />
            </TabsContent>
            <TabsContent value="tabela" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alíquotas modais internas e FCP</CardTitle>
                  <CardDescription>Vigência 2025/2026 — 27 unidades federativas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>UF</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Região</TableHead>
                          <TableHead className="text-right">Interna</TableHead>
                          <TableHead className="text-right">FCP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {UFS.map((uf) => (
                          <TableRow key={uf}>
                            <TableCell className="font-medium">{uf}</TableCell>
                            <TableCell>{ALIQUOTAS_UF[uf].nome}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{ALIQUOTAS_UF[uf].regiao}</Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {pct(ALIQUOTAS_UF[uf].interna)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {pct(ALIQUOTAS_UF[uf].fcp)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
