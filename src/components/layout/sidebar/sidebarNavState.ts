export interface SidebarLocation {
  pathname: string;
  hash: string;
}

/** Compara rota e âncora explicitamente; pathname sozinho não identifica deep links. */
export function isSidebarNavItemActive(href: string, location: SidebarLocation): boolean {
  const [pathname, hash] = href.split('#', 2);
  if (pathname !== location.pathname) return false;
  return !hash || location.hash === `#${hash}`;
}
