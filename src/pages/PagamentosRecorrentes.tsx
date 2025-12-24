import { useState } from 'react';
import { Plus, Repeat, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PagamentoRecorrenteForm } from '@/components/pagamentos-recorrentes/PagamentoRecorrenteForm';
import { PagamentosRecorrentesList } from '@/components/pagamentos-recorrentes/PagamentosRecorrentesList';

export default function PagamentosRecorrentes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/contas-pagar">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Repeat className="h-8 w-8 text-primary" />
              Pagamentos Recorrentes
            </h1>
            <p className="text-muted-foreground mt-1">
              Automatize suas despesas fixas e nunca esqueça de um pagamento
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Recorrente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Pagamento Recorrente</DialogTitle>
              <DialogDescription>
                Configure um pagamento que será gerado automaticamente de acordo com a frequência definida.
              </DialogDescription>
            </DialogHeader>
            <PagamentoRecorrenteForm
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Como funciona?</CardTitle>
          <CardDescription>
            Os pagamentos recorrentes geram automaticamente novas contas a pagar de acordo com a frequência configurada.
            Você pode pausar, reativar ou excluir a qualquer momento.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Lista de pagamentos recorrentes */}
      <PagamentosRecorrentesList />
    </motion.div>
  );
}
