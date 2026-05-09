import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files (initially minimal, we will expand)
const resources = {
  pt: {
    common: {
      dashboard: 'Dashboard',
      financeiro: 'Financeiro',
      fiscal: 'Fiscal & Documentos',
      cadastros: 'Cadastros',
      administracao: 'Administração',
      configuracoes: 'Configurações',
      sair: 'Sair',
      perfil: 'Meu Perfil',
      bem_vindo: 'Bem-vindo ao Quantum',
    }
  },
  en: {
    common: {
      dashboard: 'Dashboard',
      financeiro: 'Financial',
      fiscal: 'Tax & Documents',
      cadastros: 'Records',
      administracao: 'Administration',
      configuracoes: 'Settings',
      sair: 'Sign Out',
      perfil: 'My Profile',
      bem_vindo: 'Welcome to Quantum',
    }
  },
  es: {
    common: {
      dashboard: 'Dashboard',
      financeiro: 'Financiero',
      fiscal: 'Fiscal y Documentos',
      cadastros: 'Registros',
      administracao: 'Administración',
      configuracoes: 'Configuración',
      sair: 'Cerrar Sesión',
      perfil: 'Mi Perfil',
      bem_vindo: 'Bienvenido a Quantum',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;
