// Card de parâmetros da página CalculadoraTributaria — extraído para zerar max-lines.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { NumberField } from '@/components/tributario/calculadora/NumberField';
import { derivarAtividadePresumido } from '@/lib/tributario/calculadora/atividade-cnae';
import { ROTULO_ATIVIDADE, type CampoInput } from './CalculadoraTributaria.helpers';

type UpdateCampo = <K extends keyof CampoInput>(k: K, v: CampoInput[K]) => void;

export function ParametrosCard({
  form,
  update,
  regimeSelecionado,
  onRegimeChange,
  cnaeManual,
  setCnaeManual,
  cnaeEmpresa,
  atividadeDerivada,
}: {
  form: CampoInput;
  update: UpdateCampo;
  regimeSelecionado: string;
  onRegimeChange: (v: string) => void;
  cnaeManual: boolean;
  setCnaeManual: (v: boolean) => void;
  cnaeEmpresa: string;
  atividadeDerivada: ReturnType<typeof derivarAtividadePresumido>;
}) {
  return (
    <Card className="lg:col-span-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Parâmetros</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={regimeSelecionado} onValueChange={onRegimeChange}>
          <TabsList className="grid grid-cols-4 mb-3">
            <TabsTrigger value="simples_nacional">Simples</TabsTrigger>
            <TabsTrigger value="lucro_presumido">Presumido</TabsTrigger>
            <TabsTrigger value="lucro_real">Real</TabsTrigger>
            <TabsTrigger value="reforma">Reforma</TabsTrigger>
          </TabsList>

          {/* Comuns */}
          <Accordion type="multiple" defaultValue={['receitas']} className="w-full">
            <AccordionItem value="receitas">
              <AccordionTrigger className="text-sm">Receitas & folha</AccordionTrigger>
              <AccordionContent className="grid grid-cols-2 gap-3">
                <NumberField label="Receita bruta anual" suffix="R$" value={form.receitaBrutaAnual} onChange={(v) => update('receitaBrutaAnual', v)} step={10000} />
                <NumberField label="% Serviços" suffix="%" value={form.percentualServicos} onChange={(v) => update('percentualServicos', v)} step={1} />
                <NumberField label="Folha anual" suffix="R$" value={form.folhaAnual} onChange={(v) => update('folhaAnual', v)} step={1000} />
                <NumberField label="RAT" hint="0,01 a 0,03" value={form.aliquotaRat} onChange={(v) => update('aliquotaRat', v)} step={0.001} />
                <NumberField label="Terceiros" hint="ex 0,058" value={form.aliquotaTerceiros} onChange={(v) => update('aliquotaTerceiros', v)} step={0.001} />
                <NumberField label="Alíq. ICMS" value={form.aliquotaIcms} onChange={(v) => update('aliquotaIcms', v)} step={0.01} />
                <NumberField label="Alíq. ISS" value={form.aliquotaIss} onChange={(v) => update('aliquotaIss', v)} step={0.001} />
                <NumberField label="Créditos ICMS (compras)" suffix="R$" value={form.creditoIcmsCompras} onChange={(v) => update('creditoIcmsCompras', v)} step={1000} />
              </AccordionContent>
            </AccordionItem>

            <TabsContent value="lucro_real" className="mt-0">
              <AccordionItem value="lalur">
                <AccordionTrigger className="text-sm">LALUR & prejuízo</AccordionTrigger>
                <AccordionContent className="grid grid-cols-2 gap-3">
                  <NumberField label="Lucro contábil (LAIR)" suffix="R$" value={form.lucroContabil} onChange={(v) => update('lucroContabil', v)} step={10000} />
                  <NumberField label="Prejuízo fiscal acumulado" suffix="R$" value={form.prejuizoAcumulado} onChange={(v) => update('prejuizoAcumulado', v)} step={10000} />
                  <NumberField label="Total adições" suffix="R$" value={form.adicoesLalur} onChange={(v) => update('adicoesLalur', v)} step={1000} hint="Multas, brindes, doações" />
                  <NumberField label="Total exclusões" suffix="R$" value={form.exclusoesLalur} onChange={(v) => update('exclusoesLalur', v)} step={1000} hint="Dividendos, incentivos" />
                  <div className="col-span-2 flex items-center justify-between rounded-md border border-border p-2">
                    <Label className="text-xs">CSLL 15% (financeira)</Label>
                    <Switch checked={form.csllFinanceira} onCheckedChange={(v) => update('csllFinanceira', v)} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="creditos">
                <AccordionTrigger className="text-sm">Créditos PIS/COFINS</AccordionTrigger>
                <AccordionContent className="grid grid-cols-2 gap-3">
                  <NumberField label="Insumos" suffix="R$" value={form.creditoPisCofinsInsumos} onChange={(v) => update('creditoPisCofinsInsumos', v)} step={10000} />
                  <NumberField label="Energia elétrica" suffix="R$" value={form.creditoPisCofinsEnergia} onChange={(v) => update('creditoPisCofinsEnergia', v)} step={1000} />
                  <NumberField label="Aluguéis PJ" suffix="R$" value={form.creditoPisCofinsAlugueis} onChange={(v) => update('creditoPisCofinsAlugueis', v)} step={1000} />
                  <NumberField label="Fretes na venda" suffix="R$" value={form.creditoPisCofinsFretes} onChange={(v) => update('creditoPisCofinsFretes', v)} step={1000} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="retencoes">
                <AccordionTrigger className="text-sm">Retenções na fonte</AccordionTrigger>
                <AccordionContent className="grid grid-cols-2 gap-3">
                  <NumberField label="IRRF sofrido" suffix="R$" value={form.irrfSofrido} onChange={(v) => update('irrfSofrido', v)} step={100} />
                  <NumberField label="CSRF 4,65%" suffix="R$" value={form.csrfSofrido} onChange={(v) => update('csrfSofrido', v)} step={100} />
                </AccordionContent>
              </AccordionItem>
            </TabsContent>

            <TabsContent value="lucro_presumido" className="mt-0 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground" htmlFor="cnae-presumido">
                  CNAE preponderante
                </Label>
                <Input
                  id="cnae-presumido"
                  inputMode="numeric"
                  placeholder="ex.: 4930-2/02"
                  value={form.cnaePreponderante}
                  onChange={(e) => {
                    setCnaeManual(true);
                    update('cnaePreponderante', e.target.value);
                  }}
                />
                {cnaeEmpresa && !cnaeManual && (
                  <p className="text-xs text-muted-foreground">
                    Preenchido pelo cadastro da empresa selecionada.
                  </p>
                )}
                {cnaeManual && cnaeEmpresa && cnaeEmpresa !== form.cnaePreponderante && (
                  <button
                    type="button"
                    className="text-xs text-primary underline-offset-2 hover:underline"
                    onClick={() => setCnaeManual(false)}
                  >
                    Usar CNAE do cadastro ({cnaeEmpresa})
                  </button>
                )}
                {atividadeDerivada && (
                  <p className="text-xs text-muted-foreground">
                    Derivado: <span className="text-foreground">{ROTULO_ATIVIDADE[atividadeDerivada.atividade]}</span>
                    {' · '}
                    {(atividadeDerivada.presuncaoIrpj * 100).toFixed(0)}% IRPJ /{' '}
                    {(atividadeDerivada.presuncaoCsll * 100).toFixed(0)}% CSLL — {atividadeDerivada.fundamento}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Atividade</Label>
                <Select
                  value={form.atividadePresumido}
                  onValueChange={(v) => update('atividadePresumido', v as CampoInput['atividadePresumido'])}
                  disabled={Boolean(atividadeDerivada)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROTULO_ATIVIDADE) as Array<keyof typeof ROTULO_ATIVIDADE>).map((k) => (
                      <SelectItem key={k} value={k}>{ROTULO_ATIVIDADE[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {atividadeDerivada && (
                  <p className="text-xs text-muted-foreground">
                    Limpe o CNAE para escolher a atividade manualmente.
                  </p>
                )}
              </div>
            </TabsContent>


            <TabsContent value="simples_nacional" className="mt-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs text-muted-foreground">Anexo</Label>
                  <Select value={form.anexoSimples} onValueChange={(v) => update('anexoSimples', v as CampoInput['anexoSimples'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I">Anexo I — Comércio</SelectItem>
                      <SelectItem value="II">Anexo II — Indústria</SelectItem>
                      <SelectItem value="III">Anexo III — Serviços (Fator R aplicável)</SelectItem>
                      <SelectItem value="IV">Anexo IV — Serviços específicos</SelectItem>
                      <SelectItem value="V">Anexo V — Serviços (Fator R aplicável)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <NumberField label="RBT12" suffix="R$" value={form.rbt12} onChange={(v) => update('rbt12', v)} step={10000} />
                <NumberField label="Folha 12m" suffix="R$" value={form.folha12m} onChange={(v) => update('folha12m', v)} step={1000} />
              </div>
            </TabsContent>

            <TabsContent value="reforma" className="mt-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Ano de referência" value={form.anoReforma} onChange={(v) => update('anoReforma', v)} step={1} hint="2026..2033+" />
                <NumberField label="Redução regime especial" value={form.reducaoReforma} onChange={(v) => update('reducaoReforma', v)} step={0.1} hint="0=0% .. 1=100%" />
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs text-muted-foreground">Categoria Imposto Seletivo</Label>
                  <Select value={form.categoriaSeletivo} onValueChange={(v) => update('categoriaSeletivo', v as CampoInput['categoriaSeletivo'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      <SelectItem value="bebidas_alcoolicas">Bebidas alcoólicas</SelectItem>
                      <SelectItem value="fumo">Fumo</SelectItem>
                      <SelectItem value="veiculos">Veículos</SelectItem>
                      <SelectItem value="bens_luxo">Bens de luxo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Accordion>
        </Tabs>
      </CardContent>
    </Card>
  );
}
