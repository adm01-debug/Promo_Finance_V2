import { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  FileText,
  Video,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  type: 'article' | 'video' | 'tutorial';
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    category: 'Contas',
    question: 'Como cadastrar uma nova conta a pagar?',
    answer: 'Acesse o menu "Contas a Pagar", clique no botão "Nova Conta" no canto superior direito. Preencha os campos obrigatórios (descrição, valor e vencimento) e clique em "Salvar".',
  },
  {
    id: '2',
    category: 'Contas',
    question: 'Como baixar uma conta (registrar pagamento)?',
    answer: 'Na lista de contas, clique no menu de ações (três pontos) da conta desejada e selecione "Baixar Conta". Confirme a data de pagamento e o valor pago.',
  },
  {
    id: '3',
    category: 'Contas',
    question: 'Posso editar uma conta já paga?',
    answer: 'Contas pagas só podem ser editadas após estornar o pagamento. Clique no menu de ações e selecione "Estornar" para voltar a conta ao status pendente.',
  },
  {
    id: '4',
    category: 'Relatórios',
    question: 'Como exportar relatórios?',
    answer: 'Acesse o menu "Relatórios", selecione o tipo de relatório e o período desejado. Clique em "Exportar" e escolha o formato (PDF, Excel ou CSV).',
  },
  {
    id: '5',
    category: 'Relatórios',
    question: 'Posso agendar envio automático de relatórios?',
    answer: 'Sim! Nas configurações de cada relatório, você pode agendar o envio automático por e-mail. Defina a frequência (diária, semanal ou mensal) e os destinatários.',
  },
  {
    id: '6',
    category: 'Integrações',
    question: 'Como conectar com o Bitrix24?',
    answer: 'Acesse Configurações > Integrações > Bitrix24. Clique em "Conectar" e siga as instruções para autorizar o acesso. A sincronização de clientes e negócios será automática.',
  },
  {
    id: '7',
    category: 'Conta',
    question: 'Como alterar minha senha?',
    answer: 'Acesse Configurações > Segurança. Na seção "Alterar Senha", informe sua senha atual e a nova senha. A nova senha deve ter no mínimo 8 caracteres.',
  },
  {
    id: '8',
    category: 'Conta',
    question: 'Como habilitar autenticação de dois fatores?',
    answer: 'Em Configurações > Segurança, clique em "Configurar 2FA". Escaneie o QR Code com seu aplicativo autenticador (Google Authenticator ou similar) e confirme o código.',
  },
];

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: '1',
    title: 'Primeiros Passos',
    description: 'Guia completo para começar a usar o Finance Hub',
    category: 'Início',
    url: '/docs/getting-started',
    type: 'article',
  },
  {
    id: '2',
    title: 'Gestão de Contas a Pagar',
    description: 'Aprenda a gerenciar suas contas a pagar de forma eficiente',
    category: 'Contas',
    url: '/docs/contas-pagar',
    type: 'article',
  },
  {
    id: '3',
    title: 'Relatórios Financeiros',
    description: 'Como gerar e interpretar relatórios',
    category: 'Relatórios',
    url: '/docs/relatorios',
    type: 'article',
  },
  {
    id: '4',
    title: 'Tour pelo Dashboard',
    description: 'Vídeo explicativo sobre o painel principal',
    category: 'Início',
    url: '/videos/dashboard-tour',
    type: 'video',
  },
  {
    id: '5',
    title: 'Importação de Dados',
    description: 'Tutorial: como importar dados de planilhas',
    category: 'Avançado',
    url: '/docs/import-tutorial',
    type: 'tutorial',
  },
];

const CATEGORIES = ['Todos', 'Contas', 'Relatórios', 'Integrações', 'Conta', 'Início', 'Avançado'];

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = FAQ_ITEMS.filter((item) => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredArticles = HELP_ARTICLES.filter((article) => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Central de Ajuda
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Como podemos ajudar você hoje?
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar ajuda..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-full transition-colors',
              activeCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickLinkCard
          icon={<Book className="w-6 h-6" />}
          title="Documentação"
          description="Guias completos e referências"
          href="/docs"
        />
        <QuickLinkCard
          icon={<MessageCircle className="w-6 h-6" />}
          title="Chat ao Vivo"
          description="Fale com nossa equipe"
          href="/chat"
        />
        <QuickLinkCard
          icon={<Mail className="w-6 h-6" />}
          title="Contato"
          description="Envie um e-mail"
          href="mailto:suporte@financehub.com"
        />
      </div>

      {/* Articles */}
      {filteredArticles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Artigos e Tutoriais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Perguntas Frequentes
        </h2>
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma pergunta encontrada para sua busca.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFAQs.map((faq) => (
              <FAQAccordion
                key={faq.id}
                faq={faq}
                isExpanded={expandedFAQ === faq.id}
                onToggle={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Still need help */}
      <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg text-center">
        <Lightbulb className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Ainda precisa de ajuda?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Nossa equipe está pronta para ajudar você
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline">
            <MessageCircle className="w-4 h-4 mr-2" />
            Iniciar Chat
          </Button>
          <Button>
            <Mail className="w-4 h-4 mr-2" />
            Enviar E-mail
          </Button>
        </div>
      </div>
    </div>
  );
}

// Quick link card
interface QuickLinkCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function QuickLinkCard({ icon, title, description, href }: QuickLinkCardProps) {
  return (
    <a
      href={href}
      className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </a>
  );
}

// Article card
interface ArticleCardProps {
  article: HelpArticle;
}

function ArticleCard({ article }: ArticleCardProps) {
  const typeIcons = {
    article: <FileText className="w-4 h-4" />,
    video: <Video className="w-4 h-4" />,
    tutorial: <Lightbulb className="w-4 h-4" />,
  };

  return (
    <a
      href={article.url}
      className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow group"
    >
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
        {typeIcons[article.type]}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {article.description}
        </p>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
    </a>
  );
}

// FAQ Accordion
interface FAQAccordionProps {
  faq: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQAccordion({ faq, isExpanded, onToggle }: FAQAccordionProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white pr-4">
          {faq.question}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-gray-600 dark:text-gray-400">
            {faq.answer}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-gray-400">Isso foi útil?</span>
            <button className="px-2 py-1 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors">
              👍 Sim
            </button>
            <button className="px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
              👎 Não
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HelpCenter;
