import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmpresasConteudo2Props {
  empresas: {
    aliquota_rat: number | null;
    aliquota_terceiros: number | null;
    ativo: boolean;
    bairro: string | null;
    cep: string | null;
    cidade: string | null;
    cnae_principal: string | null;
    cnpj: string | null;
    codigo_fpas: string | null;
    cor_hex: string | null;
    created_at: string;
    email: string | null;
    endereco: string | null;
    estado: string | null;
    id: string;
    inscricao_estadual: string | null;
    is_padrao: boolean;
    logo_url: string | null;
    nome_fantasia: string | null;
    razao_social: string;
    regime_tributario: string | null;
    sigla: string | null;
    telefone: string | null;
    user_id: string;
  }[];
  selectedEmpresa: string;
  setSelectedEmpresa: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
}

export function EmpresasConteudo2({
  empresas,
  selectedEmpresa,
  setSelectedEmpresa,
}: EmpresasConteudo2Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
    >
      <Card
        className="border-primary/30 relative overflow-hidden"
        style={{ boxShadow: 'var(--shadow-glow-primary)' }}
      >
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm" />
        <CardContent className="relative p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                  Contexto Ativo
                </p>
                <p className="text-sm font-bold text-foreground">
                  {empresas.find((e) => e.id === selectedEmpresa)?.nome_fantasia ||
                    empresas.find((e) => e.id === selectedEmpresa)?.razao_social}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEmpresa(null)}
              className="text-xs"
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
