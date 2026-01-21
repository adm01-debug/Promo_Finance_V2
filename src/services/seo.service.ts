/**
 * SEO Meta Service - Manage page metadata
 */

interface MetaData {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  locale?: string;
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  robots?: string;
  canonical?: string;
}

const DEFAULT_META: MetaData = {
  siteName: 'Finance Hub',
  locale: 'pt_BR',
  type: 'website',
  twitterCard: 'summary_large_image',
};

class SEOService {
  private defaultMeta: MetaData;

  constructor(defaultMeta: MetaData = DEFAULT_META) {
    this.defaultMeta = defaultMeta;
  }

  /**
   * Set page meta tags
   */
  setMeta(meta: MetaData): void {
    const mergedMeta = { ...this.defaultMeta, ...meta };
    
    this.setTitle(mergedMeta.title);
    this.setDescription(mergedMeta.description);
    this.setKeywords(mergedMeta.keywords);
    this.setCanonical(mergedMeta.canonical);
    this.setRobots(mergedMeta.robots);
    this.setOpenGraph(mergedMeta);
    this.setTwitterCard(mergedMeta);
  }

  /**
   * Set page title
   */
  setTitle(title?: string): void {
    if (!title) return;
    
    const fullTitle = title.includes(this.defaultMeta.siteName!)
      ? title
      : `${title} | ${this.defaultMeta.siteName}`;
    
    document.title = fullTitle;
    this.setMetaTag('og:title', fullTitle);
    this.setMetaTag('twitter:title', fullTitle);
  }

  /**
   * Set page description
   */
  setDescription(description?: string): void {
    if (!description) return;
    
    this.setMetaTag('description', description);
    this.setMetaTag('og:description', description);
    this.setMetaTag('twitter:description', description);
  }

  /**
   * Set keywords
   */
  setKeywords(keywords?: string[]): void {
    if (!keywords || keywords.length === 0) return;
    this.setMetaTag('keywords', keywords.join(', '));
  }

  /**
   * Set canonical URL
   */
  setCanonical(url?: string): void {
    if (!url) return;
    
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  /**
   * Set robots directive
   */
  setRobots(robots?: string): void {
    if (!robots) return;
    this.setMetaTag('robots', robots);
  }

  /**
   * Set Open Graph tags
   */
  private setOpenGraph(meta: MetaData): void {
    if (meta.type) this.setMetaTag('og:type', meta.type, 'property');
    if (meta.url) this.setMetaTag('og:url', meta.url, 'property');
    if (meta.image) this.setMetaTag('og:image', meta.image, 'property');
    if (meta.siteName) this.setMetaTag('og:site_name', meta.siteName, 'property');
    if (meta.locale) this.setMetaTag('og:locale', meta.locale, 'property');
    
    // Article specific
    if (meta.type === 'article') {
      if (meta.author) this.setMetaTag('article:author', meta.author, 'property');
      if (meta.publishedTime) this.setMetaTag('article:published_time', meta.publishedTime, 'property');
      if (meta.modifiedTime) this.setMetaTag('article:modified_time', meta.modifiedTime, 'property');
      if (meta.section) this.setMetaTag('article:section', meta.section, 'property');
    }
  }

  /**
   * Set Twitter Card tags
   */
  private setTwitterCard(meta: MetaData): void {
    if (meta.twitterCard) this.setMetaTag('twitter:card', meta.twitterCard);
    if (meta.twitterSite) this.setMetaTag('twitter:site', meta.twitterSite);
    if (meta.twitterCreator) this.setMetaTag('twitter:creator', meta.twitterCreator);
    if (meta.image) this.setMetaTag('twitter:image', meta.image);
  }

  /**
   * Set or update meta tag
   */
  private setMetaTag(name: string, content: string, attributeName: 'name' | 'property' = 'name'): void {
    let meta = document.querySelector(`meta[${attributeName}="${name}"]`) as HTMLMetaElement;
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attributeName, name);
      document.head.appendChild(meta);
    }
    
    meta.content = content;
  }

  /**
   * Remove meta tag
   */
  removeMetaTag(name: string): void {
    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (meta) {
      meta.remove();
    }
  }

  /**
   * Add JSON-LD structured data
   */
  setStructuredData(data: Record<string, unknown>): void {
    let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify(data);
  }

  /**
   * Generate Organization structured data
   */
  setOrganizationData(org: {
    name: string;
    url: string;
    logo?: string;
    description?: string;
    sameAs?: string[];
  }): void {
    this.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      url: org.url,
      logo: org.logo,
      description: org.description,
      sameAs: org.sameAs,
    });
  }

  /**
   * Generate WebApplication structured data
   */
  setWebAppData(app: {
    name: string;
    url: string;
    description?: string;
    applicationCategory?: string;
    operatingSystem?: string;
  }): void {
    this.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: app.name,
      url: app.url,
      description: app.description,
      applicationCategory: app.applicationCategory || 'FinanceApplication',
      operatingSystem: app.operatingSystem || 'Any',
    });
  }

  /**
   * Generate BreadcrumbList structured data
   */
  setBreadcrumbs(items: Array<{ name: string; url: string }>): void {
    this.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    });
  }

  /**
   * Reset all meta tags to defaults
   */
  reset(): void {
    this.setMeta(this.defaultMeta);
  }
}

// Singleton instance
export const seoService = new SEOService();

// Page meta presets
export const PAGE_META = {
  dashboard: {
    title: 'Dashboard',
    description: 'Visualize suas finanças com gráficos e métricas em tempo real.',
  },
  contasPagar: {
    title: 'Contas a Pagar',
    description: 'Gerencie suas contas a pagar, acompanhe vencimentos e controle suas despesas.',
  },
  contasReceber: {
    title: 'Contas a Receber',
    description: 'Acompanhe suas contas a receber, receitas e pagamentos de clientes.',
  },
  clientes: {
    title: 'Clientes',
    description: 'Gerencie seu cadastro de clientes, dados de contato e histórico financeiro.',
  },
  fornecedores: {
    title: 'Fornecedores',
    description: 'Cadastre e gerencie seus fornecedores, pagamentos e relacionamentos comerciais.',
  },
  relatorios: {
    title: 'Relatórios',
    description: 'Gere relatórios financeiros detalhados e analise a saúde financeira do seu negócio.',
  },
  configuracoes: {
    title: 'Configurações',
    description: 'Configure preferências do sistema, categorias e integrações.',
  },
  login: {
    title: 'Entrar',
    description: 'Faça login no Finance Hub para gerenciar suas finanças.',
    robots: 'noindex, nofollow',
  },
  register: {
    title: 'Cadastro',
    description: 'Crie sua conta no Finance Hub e comece a organizar suas finanças.',
  },
};

export default seoService;
