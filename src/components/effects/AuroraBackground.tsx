/**
 * Aurora Vela — fundo animado das telas de autenticação (Z3).
 * Port CSS-puro da maquete aprovada (efeito ReactBits Pro): 4 blobs
 * radial-gradient roxo/índigo em mix-blend-mode:screen, animados só via
 * transform. Zero dependências (dispensa o `ogl` da proposta original).
 * `prefers-reduced-motion: reduce` congela os blobs (guard global no index.css).
 */
export interface AuroraBackgroundProps {
  /** Classes extras do container (ex.: "-z-10" para empilhar atrás do conteúdo). */
  className?: string;
}

export function AuroraBackground({ className = '' }: AuroraBackgroundProps) {
  return (
    <div className={`vela-aurora ${className}`.trim()} aria-hidden="true">
      <div className="vela-aur vela-aur-1" />
      <div className="vela-aur vela-aur-2" />
      <div className="vela-aur vela-aur-3" />
      <div className="vela-aur vela-aur-4" />
    </div>
  );
}
