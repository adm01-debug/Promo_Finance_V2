# ♿ Guia de Acessibilidade - Promo Finance
## WCAG 2.1 Nível AA Compliance

## Princípios WCAG

### 1. PERCEPTÍVEL
Informação e componentes da interface devem ser apresentados de forma que os usuários possam percebê-los.

#### 1.1 Alternativas em Texto
- ✅ Todas as imagens têm atributo `alt`
- ✅ Ícones decorativos: `alt=""`
- ✅ Ícones funcionais: `alt` descritivo
- ✅ Logos: `alt="Nome da Empresa"`

#### 1.2 Mídia Baseada em Tempo
- ✅ Vídeos têm legendas
- ✅ Áudio tem transcrições

#### 1.3 Adaptável
- ✅ Estrutura semântica HTML5
- ✅ Headings hierárquicos (h1 → h6)
- ✅ Landmarks ARIA

#### 1.4 Distinguível
- ✅ Contraste mínimo 4.5:1 (texto normal)
- ✅ Contraste mínimo 3:1 (texto grande)
- ✅ Sem informação só por cor
- ✅ Resize até 200% sem perda de função

### 2. OPERÁVEL
Componentes e navegação devem ser operáveis.

#### 2.1 Acessível por Teclado
- ✅ Todos os controles acessíveis por teclado
- ✅ Sem keyboard traps
- ✅ Atalhos de teclado documentados

#### 2.2 Tempo Suficiente
- ✅ Sem limites de tempo rígidos
- ✅ Opção de pausar/parar animações

#### 2.3 Convulsões
- ✅ Sem flashes > 3 vezes/segundo

#### 2.4 Navegável
- ✅ Skip links
- ✅ Títulos de página descritivos
- ✅ Ordem de foco lógica
- ✅ Link purpose claro

### 3. COMPREENSÍVEL
Informação e operação devem ser compreensíveis.

#### 3.1 Legível
- ✅ Idioma da página declarado (`lang="pt-BR"`)
- ✅ Idioma de partes declarado

#### 3.2 Previsível
- ✅ Foco não causa mudanças inesperadas
- ✅ Input não causa mudanças inesperadas
- ✅ Navegação consistente

#### 3.3 Assistência de Input
- ✅ Erros identificados
- ✅ Labels e instruções
- ✅ Sugestões de erro
- ✅ Prevenção de erros

### 4. ROBUSTO
Conteúdo deve ser robusto para interpretação por tecnologias assistivas.

#### 4.1 Compatível
- ✅ HTML válido
- ✅ ARIA usado corretamente

---

## Implementação

### Skip Links
```tsx
// src/components/SkipLinks.tsx
export function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content">Pular para conteúdo principal</a>
      <a href="#main-nav">Pular para navegação</a>
    </div>
  );
}

// CSS
.skip-links a {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-links a:focus {
  position: static;
  width: auto;
  height: auto;
}
```

### ARIA Landmarks
```tsx
<body>
  <SkipLinks />
  <header role="banner">...</header>
  <nav role="navigation" aria-label="Principal">...</nav>
  <main role="main" id="main-content">...</main>
  <aside role="complementary">...</aside>
  <footer role="contentinfo">...</footer>
</body>
```

### Formulários Acessíveis
```tsx
<form>
  <label htmlFor="email">
    E-mail
    <span aria-label="obrigatório">*</span>
  </label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={errors.email ? "true" : "false"}
    aria-describedby={errors.email ? "email-error" : undefined}
  />
  {errors.email && (
    <div id="email-error" role="alert" className="error">
      {errors.email}
    </div>
  )}
</form>
```

### Focus Management
```tsx
// Dialog com trap de foco
import { useRef, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';

export function Dialog({ isOpen, onClose, children }) {
  const closeButtonRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <FocusTrap>
      <div role="dialog" aria-modal="true">
        <button ref={closeButtonRef} onClick={onClose}>
          <span aria-label="Fechar">×</span>
        </button>
        {children}
      </div>
    </FocusTrap>
  );
}
```

### Live Regions
```tsx
// Status messages
<div role="status" aria-live="polite">
  {message}
</div>

// Urgent alerts
<div role="alert" aria-live="assertive">
  {error}
</div>
```

---

## Checklist Completo

### Geral
- [ ] HTML válido (W3C Validator)
- [ ] Lang declarado (`<html lang="pt-BR">`)
- [ ] Títulos de página únicos
- [ ] Skip links implementados

### Cores e Contraste
- [ ] Texto normal: contraste ≥ 4.5:1
- [ ] Texto grande: contraste ≥ 3:1
- [ ] Componentes UI: contraste ≥ 3:1
- [ ] Sem informação apenas por cor

### Teclado
- [ ] Todos os controles acessíveis
- [ ] Ordem de foco lógica
- [ ] Indicador de foco visível
- [ ] Sem keyboard traps

### Imagens
- [ ] Todas têm `alt`
- [ ] Alt vazio em decorativas
- [ ] Alt descritivo em funcionais

### Formulários
- [ ] Labels para todos os inputs
- [ ] Erros claramente identificados
- [ ] `aria-required` em obrigatórios
- [ ] `aria-invalid` em campos com erro
- [ ] `aria-describedby` para mensagens

### Landmarks
- [ ] `<header role="banner">`
- [ ] `<nav role="navigation">`
- [ ] `<main role="main">`
- [ ] `<aside role="complementary">`
- [ ] `<footer role="contentinfo">`

### Headings
- [ ] Estrutura hierárquica (h1 → h6)
- [ ] Não pular níveis
- [ ] Apenas um h1 por página

### Tabelas
- [ ] `<th>` para cabeçalhos
- [ ] `scope` em cabeçalhos
- [ ] `<caption>` descritiva

### Botões e Links
- [ ] Texto descritivo (não "clique aqui")
- [ ] `aria-label` quando texto insuficiente
- [ ] Botões para ações, links para navegação

---

## Ferramentas de Teste

### Automatizadas
- **axe DevTools** (Chrome/Firefox extension)
- **Lighthouse** (Chrome DevTools)
- **WAVE** (Web Accessibility Evaluation Tool)
- **Pa11y**

### Manuais
- **Navegação por teclado** (Tab, Shift+Tab, Enter, Esc)
- **Screen readers**
  - NVDA (Windows)
  - JAWS (Windows)
  - VoiceOver (Mac/iOS)
  - TalkBack (Android)
- **Zoom** até 200%
- **Contraste** (Colour Contrast Analyser)

---

## Testes Obrigatórios

### 1. Teclado
```
✓ Tab percorre todos os controles
✓ Enter ativa botões e links
✓ Esc fecha modals
✓ Setas navegam em menus
✓ Foco sempre visível
```

### 2. Screen Reader
```
✓ Conteúdo lido corretamente
✓ Landmarks anunciados
✓ Estados comunicados (aberto, fechado, etc)
✓ Erros anunciados
```

### 3. Zoom
```
✓ 200% sem scroll horizontal
✓ Texto não sobreposto
✓ Funcionalidade mantida
```

### 4. Contraste
```
✓ Todos os textos passam
✓ Ícones passam
✓ Bordas de foco passam
```

---

## Recursos

- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

---

**Última atualização:** 30/12/2025  
**Nível:** WCAG 2.1 AA  
**Status:** Em implementação
