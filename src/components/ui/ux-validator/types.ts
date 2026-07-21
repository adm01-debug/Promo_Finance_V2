export interface ValidationStep {
  id: string;
  name: string;
  path: string;
  status: 'pending' | 'success' | 'error';
  diffScore?: number;
  screenshots?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    diffMobile?: string;
    diffTablet?: string;
    diffDesktop?: string;
  };
}

export type ViewMode = 'side-by-side' | 'overlay' | 'diff' | 'split' | 'heatmap';
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
