import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, FileText, Download, CreditCard, Clock, CheckCircle2,
  ArrowRight, Mail, Phone, ExternalLink, Building2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function PortalCliente() {
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const mockDocuments = [
    { id: '1', type: 'Fatura', number: '2024/001', value: 1250.00, dueDate: '2024-05-20', status: 'pago' },
    { id: '2', type: 'NF-e', number: '154', value: 3450.50, dueDate: '2024-05-15', status: 'pendente' },
    { id: '3', type: 'Boleto', number: '887', value: 450.00, dueDate: '2024-05-25', status: 'pendente' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary/20 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-border/50 shadow-2xl bg-background/80 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">Portal do Cliente Premium</CardTitle>
              <CardDescription>Acesse seus documentos financeiros com total segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Token de Acesso</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Cole seu token aqui..." 
                    className="w-full bg-muted/50 border-2 border-border/50 rounded-xl px-4 py-3 font-mono text-center text-primary focus:border-primary/50 transition-all outline-none"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center">O token foi enviado para o seu e-mail cadastrado.</p>
              </div>
              <Button 
                onClick={() => setIsAuthenticated(true)}
                className="w-full py-6 text-lg font-bold gap-2 group shadow-xl shadow-primary/20"
              >
                Acessar Portal
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* User Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg">
              JS
            </div>
            <div>
              <h2 className="text-2xl font-black">Olá, João Silva</h2>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" /> Silva & Filhos Ltda.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><Mail className="h-4 w-4" /> Suporte</Button>
            <Button variant="ghost" className="text-destructive" onClick={() => setIsAuthenticated(false)}>Sair</Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary text-white shadow-xl shadow-primary/20">
            <CardContent className="p-6">
              <p className="text-primary-foreground/80 text-xs font-bold uppercase tracking-wider">A pagar este mês</p>
              <h3 className="text-3xl font-black mt-2">{formatCurrency(3900.50)}</h3>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold bg-white/10 w-fit px-2 py-1 rounded">
                <Clock className="h-3 w-3" /> 2 títulos pendentes
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-6">
              <p className="text-success text-xs font-bold uppercase tracking-wider">Total Liquidado</p>
              <h3 className="text-3xl font-black mt-2 text-success">{formatCurrency(1250.00)}</h3>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-success/80">
                <CheckCircle2 className="h-3 w-3" /> 1 título pago este mês
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-2">
              <p className="text-sm text-muted-foreground">Dúvidas sobre sua fatura?</p>
              <Button size="sm" className="w-full gap-2">WhatsApp Suporte</Button>
            </CardContent>
          </Card>
        </div>

        {/* Documents Table */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Seus Documentos
            </CardTitle>
            <CardDescription>Visualize e baixe boletos, notas fiscais e comprovantes</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Documento</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Vencimento</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {mockDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{doc.type} #{doc.number}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{doc.id.split('-')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={doc.status === 'pago' ? 'success' : 'warning'} className="text-[10px]">
                          {doc.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium">{formatDate(doc.dueDate)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black">{formatCurrency(doc.value)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.status === 'pendente' && (
                            <Button size="sm" variant="outline" className="gap-2 h-8 text-[11px] font-bold border-primary/50 text-primary hover:bg-primary/5">
                              <CreditCard className="h-3 w-3" /> Pagar Agora
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
