export interface SidebarLocation {
  pathname: string;
  hash: string;
}

/** Compara rota e âncora explicitamente; pathname sozinho não identifica deep links. */
export function isSidebarNavItemActive(href: string, location: SidebarLocation): boolean {
  const [pathname, hash] = href.split('#', 2);
  if (hash) return pathname === location.pathname && location.hash === `#${hash}`;
  if (pathname === location.pathname) return true;
  // Rotas filhas (detalhe/edição) mantêm o item-pai marcado — '/' e href
  // só-âncora ('#/x' → pathname '') ficam exatos para não marcar tudo.
  return pathname !== '' && pathname !== '/' && location.pathname.startsWith(`${pathname}/`);
}
