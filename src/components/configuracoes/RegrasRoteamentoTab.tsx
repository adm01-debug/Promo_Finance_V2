import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Building2, 
  CreditCard, 
  Route, 
  Banknote,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface RegraRoteamento {
  id: string;
  nome: string;
  cnpj: string;
  contaBancariaId: string;
  tipoCobranca: 'boleto' | 'pix' | 'cartao' | 'todos';
  prioridade: number;
  ativo: boolean;
}

const contasBancarias = [
  { id: '1', nome: 'Itaú Main - 4567-8', banco: 'Itaú' },
  { id: '2', nome: 'Bradesco Sec - 1234-5', banco: 'Bradesco' },
  { id: '3', nome: 'Nubank PJ - 9876-5', banco: 'Nubank' },
];

const cnpjs = [
  { id: '1', numero: '12.345.678/0001-90', nome: 'Quantum Sentinel Ltda' },
  { id: '2', numero: '98.765.432/0001-10', nome: 'Alpha Logistics SA' },
];

export function RegrasRoteamentoTab() {
  const [regras, setRegras] = useState<RegraRoteamento[]>([
    { 
      id: '1', 
      nome: 'Roteamento Padrão Matriz', 
      cnpj: '12.345.678/0001-90', 
      contaBancariaId: '1', 
      tipoCobranca: 'todos', 
      prioridade: 1, 
      ativo: true 
    },
    { 
      id: '2', 
      nome: 'Pix Emergencial Filial', 
      cnpj: '98.765.432/0001-10', 
      contaBancariaId: '3', 
      tipoCobranca: 'pix', 
      prioridade: 2, 
      ativo: true 
    },
  ]);

  const { toast } = useToast();

  const handleAddRegra = () => {
    const newRegra: RegraRoteamento = {
      id: Math.random().toString(36).substr(2, 9),
      nome: 'Nova Regra de Roteamento',
      cnpj: cnpjs[0].numero,
      contaBancariaId: contasBancarias[0].id,
      tipoCobranca: 'todos',
      prioridade: regras.length + 1,
      ativo: true,
    };
    setRegras([...regras, newRegra]);
    toast({
      title: "Regra adicionada",
      description: "Uma nova regra de roteamento foi criada.",
    });
  };

  const handleRemoveRegra = (id: string) => {
    setRegras(regras.filter(r => r.id !== id));
    toast({
      title: "Regra removida",
      variant: "destructive",
    });
  };

  const toggleRegra = (id: string) => {
    setRegras(regras.map(r => r.id === id ? { ...r, ativo: !r.ativo } : r));
  };

  return (
    <div className="space-y-6">
      <Card className="premium-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Route className="h-6 w-6 text-primary" /> Roteamento Inteligente multi-CNPJ
            </CardTitle>
            <CardDescription>
              Defina para qual conta bancária cada lançamento deve ser direcionado com base no CNPJ e tipo de cobrança.
            </CardDescription>
          </div>
          <Button onClick={handleAddRegra} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Regra
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {regras.map((regra, index) => (
                <motion.div
                  key={regra.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl border border-white/5 bg-card/5 hover:bg-card/10 transition-all group"
                >
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {regra.prioridade}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Input 
                            value={regra.nome} 
                            onChange={(e) => {
                              const newRegras = [...regras];
                              newRegras[index].nome = e.target.value;
                              setRegras(newRegras);
                            }}
                            className="h-7 text-sm font-bold bg-transparent border-none p-0 focus-visible:ring-0 w-auto min-w-[200px]"
                          />
                          <Badge variant={regra.ativo ? "default" : "outline"} className="text-[10px] uppercase">
                            {regra.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {regra.cnpj}
                          </span>
                          <span className="flex items-center gap-1">
                            <Banknote className="h-3 w-3" /> {contasBancarias.find(c => c.id === regra.contaBancariaId)?.nome}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="grid grid-cols-2 gap-2 flex-1 md:flex-none">
                        <Select 
                          value={regra.cnpj}
                          onValueChange={(val) => {
                            const newRegras = [...regras];
                            newRegras[index].cnpj = val;
                            setRegras(newRegras);
                          }}
                        >
                          <SelectTrigger className="h-9 w-full md:w-[180px] bg-black/20 border-white/10">
                            <SelectValue placeholder="CNPJ" />
                          </SelectTrigger>
                          <SelectContent>
                            {cnpjs.map(c => (
                              <SelectItem key={c.id} value={c.numero}>{c.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select 
                          value={regra.contaBancariaId}
                          onValueChange={(val) => {
                            const newRegras = [...regras];
                            newRegras[index].contaBancariaId = val;
                            setRegras(newRegras);
                          }}
                        >
                          <SelectTrigger className="h-9 w-full md:w-[180px] bg-black/20 border-white/10">
                            <SelectValue placeholder="Conta Destino" />
                          </SelectTrigger>
                          <SelectContent>
                            {contasBancarias.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={regra.ativo} 
                          onCheckedChange={() => toggleRegra(regra.id)}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveRegra(regra.id)}
                          className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {regras.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl">
                <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">Nenhuma regra de roteamento configurada.</p>
                <Button variant="link" onClick={handleAddRegra} className="mt-2">
                  Clique para criar a primeira regra
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Validação Alpha</p>
              <p className="text-[10px] text-muted-foreground italic">Garante que não existam conflitos de roteamento entre CNPJs.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/5 border-secondary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Matching Automático</p>
              <p className="text-[10px] text-muted-foreground italic">Integração direta com Asaas e Open Finance para liquidação.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
              <ChevronRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Priorização Dinâmica</p>
              <p className="text-[10px] text-muted-foreground italic">Regras processadas por ordem de precedência configurada.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
