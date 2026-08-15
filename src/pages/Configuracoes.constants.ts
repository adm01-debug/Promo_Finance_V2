// Constantes e configuração inicial da página Configuracoes — extraídas para zerar max-lines.
import type { EtapaReguaCobranca } from '@/types/financial';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export interface EtapaConfig {
  id: string;
  etapa: EtapaReguaCobranca;
  nome: string;
  diasAposVencimento: number;
  canais: ('email' | 'sms' | 'whatsapp' | 'telefone')[];
  templateId: string;
  ativo: boolean;
  cor: string;
}

export interface Template {
  id: string;
  nome: string;
  tipo: 'email' | 'sms' | 'whatsapp';
  assunto?: string;
  conteudo: string;
  variaveis: string[];
}

export const etapasIniciais: EtapaConfig[] = [
  { id: '1', etapa: 'preventiva', nome: 'Lembrete Preventivo', diasAposVencimento: -3, canais: ['email', 'whatsapp'], templateId: '1', ativo: true, cor: 'bg-secondary' },
  { id: '2', etapa: 'lembrete', nome: 'Lembrete de Vencimento', diasAposVencimento: 0, canais: ['email', 'sms', 'whatsapp'], templateId: '2', ativo: true, cor: 'bg-warning' },
  { id: '3', etapa: 'cobranca', nome: '1ª Cobrança', diasAposVencimento: 5, canais: ['email', 'whatsapp', 'telefone'], templateId: '3', ativo: true, cor: 'bg-streak' },
  { id: '4', etapa: 'cobranca', nome: '2ª Cobrança', diasAposVencimento: 15, canais: ['email', 'whatsapp', 'telefone'], templateId: '4', ativo: true, cor: 'bg-destructive' },
  { id: '5', etapa: 'negociacao', nome: 'Negociação', diasAposVencimento: 30, canais: ['telefone', 'whatsapp'], templateId: '5', ativo: true, cor: 'bg-accent' },
  { id: '6', etapa: 'juridico', nome: 'Aviso Jurídico', diasAposVencimento: 60, canais: ['email'], templateId: '6', ativo: false, cor: 'bg-muted-foreground' },
];

export const templatesIniciais: Template[] = [
  {
    id: '1',
    nome: 'Lembrete Preventivo',
    tipo: 'email',
    assunto: 'Lembrete: Fatura vencendo em breve',
    conteudo: 'Olá {{cliente}},\n\nGostaríamos de lembrar que sua fatura no valor de {{valor}} vence em {{data_vencimento}}.\n\nPara sua comodidade, segue o link para pagamento: {{link_pagamento}}\n\nAtenciosamente,\n{{empresa}}',
    variaveis: ['cliente', 'valor', 'data_vencimento', 'link_pagamento', 'empresa']
  },
  {
    id: '2',
    nome: 'Vencimento Hoje',
    tipo: 'whatsapp',
    conteudo: 'Olá {{cliente}}! 👋\n\nSua fatura de {{valor}} vence *hoje*.\n\n💳 Pague agora: {{link_pagamento}}\n\nQualquer dúvida, estamos à disposição!',
    variaveis: ['cliente', 'valor', 'link_pagamento']
  },
  {
    id: '3',
    nome: '1ª Cobrança',
    tipo: 'email',
    assunto: 'Fatura em atraso - Regularize sua situação',
    conteudo: 'Prezado(a) {{cliente}},\n\nIdentificamos que sua fatura no valor de {{valor}}, vencida em {{data_vencimento}}, encontra-se em aberto.\n\nPara evitar encargos adicionais, solicitamos a regularização o mais breve possível.\n\nLink para pagamento: {{link_pagamento}}\n\nEm caso de dúvidas, entre em contato conosco.\n\nAtenciosamente,\n{{empresa}}',
    variaveis: ['cliente', 'valor', 'data_vencimento', 'link_pagamento', 'empresa']
  },
];
