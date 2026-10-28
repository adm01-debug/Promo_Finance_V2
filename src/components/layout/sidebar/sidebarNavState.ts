export interface SidebarLocation {
  pathname: string;
  hash: string;
}

/** Compara rota e âncora explicitamente; pathname sozinho não identifica deep links. */
export function isSidebarNavItemActive(href: string, location: SidebarLocation): boolean {
  return sidebarNavItemAriaCurrent(href, location) !== undefined;
}

/**
 * aria-current do item: 'page' só no match exato — um pai ativo por prefixo e o
 * item da rota filha não podem anunciar duas "páginas atuais" (WCAG). O pai por
 * prefixo e âncoras da mesma página viram 'location'.
 */
export function sidebarNavItemAriaCurrent(
  href: string,
  location: SidebarLocation
): 'page' | 'location' | undefined {
  const [pathname, hash] = href.split('#', 2);
  if (hash) {
    return pathname === location.pathname && location.hash === `#${hash}` ? 'location' : undefined;
  }
  if (pathname === location.pathname) return 'page';
  // Rotas filhas (detalhe/edição) mantêm o item-pai marcado — '/' e href
  // só-âncora ('#/x' → pathname '') ficam exatos para não marcar tudo.
  if (pathname !== '' && pathname !== '/' && location.pathname.startsWith(`${pathname}/`)) {
    return 'location';
  }
  return undefined;
}
