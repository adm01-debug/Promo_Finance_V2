import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react';

interface Props {
  nomeCliente: string; setNomeCliente: (v: string) => void;
  cpfCnpj: string; setCpfCnpj: (v: string) => void;
  emailCliente: string; setEmailCliente: (v: string) => void;
  telefoneCliente: string; setTelefoneCliente: (v: string) => void;
  isPending: boolean;
  onCreate: () => void;
}

export function NovoClienteAsaasForm({
  nomeCliente, setNomeCliente, cpfCnpj, setCpfCnpj,
  emailCliente, setEmailCliente, telefoneCliente, setTelefoneCliente,
  isPending, onCreate,
}: Props) {
  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Nome completo ou razão social" />
      </div>
      <div className="space-y-2">
        <Label>CPF/CNPJ *</Label>
        <Input value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} placeholder="email@exemplo.com" />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={telefoneCliente} onChange={e => setTelefoneCliente(e.target.value)} placeholder="(11) 99999-0000" />
        </div>
      </div>
      <Button className="w-full" onClick={onCreate} disabled={isPending || !nomeCliente || !cpfCnpj}>
        {isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cadastrando...</>
        ) : (
          <><UserPlus className="h-4 w-4 mr-2" /> Cadastrar Cliente</>
        )}
      </Button>
    </div>
  );
}
