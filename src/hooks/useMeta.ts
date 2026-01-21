import { useEffect } from 'react';

interface MetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'Finance Hub';
const DEFAULT_DESCRIPTION = 'Sistema de gestão financeira completo para controle de contas a pagar e receber';
const DEFAULT_KEYWORDS = 'gestão financeira, contas a pagar, contas a receber, controle financeiro, finanças';

/**
 * Hook for managing page metadata and SEO
 */
export function useMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary',
  canonicalUrl,
  noIndex = false,
}: MetaProps = {}) {
  useEffect(() => {
    // Update document title
    const fullTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    document.title = fullTitle;

    // Helper to set or remove meta tag
    const setMeta = (name: string, content: string | undefined, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement | null;

      if (content) {
        if (!element) {
          element = document.createElement('meta');
          if (isProperty) {
            element.setAttribute('property', name);
          } else {
            element.setAttribute('name', name);
          }
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      } else if (element) {
        element.remove();
      }
    };

    // Set basic meta tags
    setMeta('description', description);
    setMeta('keywords', keywords);
    
    // Set robots meta
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Set Open Graph tags
    setMeta('og:title', ogTitle || fullTitle, true);
    setMeta('og:description', ogDescription || description, true);
    setMeta('og:type', ogType, true);
    setMeta('og:image', ogImage, true);
    setMeta('og:url', canonicalUrl || window.location.href, true);

    // Set Twitter tags
    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', ogTitle || fullTitle);
    setMeta('twitter:description', ogDescription || description);
    setMeta('twitter:image', ogImage);

    // Set canonical URL
    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonicalUrl) {
      if (!canonicalElement) {
        canonicalElement = document.createElement('link');
        canonicalElement.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalElement);
      }
      canonicalElement.setAttribute('href', canonicalUrl);
    } else if (canonicalElement) {
      canonicalElement.remove();
    }

    // Cleanup function
    return () => {
      // Reset title on unmount
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogType, twitterCard, canonicalUrl, noIndex]);
}

/**
 * Hook for setting page title only
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/**
 * Hook for structured data (JSON-LD)
 */
export function useStructuredData(data: Record<string, unknown>) {
  useEffect(() => {
    // Create script element for structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'structured-data';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      ...data,
    });

    // Remove existing structured data
    const existing = document.getElementById('structured-data');
    if (existing) {
      existing.remove();
    }

    // Add new structured data
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [data]);
}

/**
 * Pre-configured meta for common pages
 */
export function useDashboardMeta() {
  useMeta({
    title: 'Dashboard',
    description: 'Visão geral das suas finanças com resumos de contas a pagar e receber',
  });
}

export function useContasPagarMeta() {
  useMeta({
    title: 'Contas a Pagar',
    description: 'Gerencie suas contas a pagar, acompanhe vencimentos e controle despesas',
  });
}

export function useContasReceberMeta() {
  useMeta({
    title: 'Contas a Receber',
    description: 'Acompanhe suas receitas e contas a receber de clientes',
  });
}

export function useClientesMeta() {
  useMeta({
    title: 'Clientes',
    description: 'Gerencie o cadastro de clientes e acompanhe histórico de transações',
  });
}

export function useFornecedoresMeta() {
  useMeta({
    title: 'Fornecedores',
    description: 'Cadastre e gerencie seus fornecedores e parceiros comerciais',
  });
}

export function useRelatoriosMeta() {
  useMeta({
    title: 'Relatórios',
    description: 'Relatórios financeiros detalhados para análise e tomada de decisão',
  });
}

export function useConfiguracoesMeta() {
  useMeta({
    title: 'Configurações',
    description: 'Configure suas preferências de usuário e do sistema',
    noIndex: true,
  });
}

export default useMeta;
