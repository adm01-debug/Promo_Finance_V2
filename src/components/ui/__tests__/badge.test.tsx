import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('renders with primary variant', () => {
    render(<Badge variant="primary">Primary</Badge>);
    const badge = screen.getByText('Primary');
    expect(badge).toHaveClass('bg-primary');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText('Secondary');
    expect(badge).toHaveClass('bg-secondary');
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green');
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow');
  });

  it('renders with danger variant', () => {
    render(<Badge variant="danger">Danger</Badge>);
    const badge = screen.getByText('Danger');
    expect(badge).toHaveClass('bg-red');
  });

  it('renders with info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-blue');
  });

  it('renders with small size', () => {
    render(<Badge size="sm">Small</Badge>);
    const badge = screen.getByText('Small');
    expect(badge).toHaveClass('text-xs');
  });

  it('renders with medium size', () => {
    render(<Badge size="md">Medium</Badge>);
    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('text-sm');
  });

  it('renders with large size', () => {
    render(<Badge size="lg">Large</Badge>);
    const badge = screen.getByText('Large');
    expect(badge).toHaveClass('text-base');
  });

  it('renders with dot indicator', () => {
    render(<Badge dot>With Dot</Badge>);
    const badge = screen.getByText('With Dot');
    expect(badge.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('renders with outline style', () => {
    render(<Badge outline>Outline</Badge>);
    const badge = screen.getByText('Outline');
    expect(badge).toHaveClass('border');
  });

  it('renders with pill shape', () => {
    render(<Badge pill>Pill</Badge>);
    const badge = screen.getByText('Pill');
    expect(badge).toHaveClass('rounded-full');
  });

  it('renders with icon', () => {
    const Icon = () => <span data-testid="icon">★</span>;
    render(<Badge icon={<Icon />}>With Icon</Badge>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders as span by default', () => {
    const { container } = render(<Badge>Span</Badge>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('renders as custom element', () => {
    const { container } = render(<Badge as="div">Div</Badge>);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('renders with count', () => {
    render(<Badge count={5}>Notifications</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders max count when exceeds limit', () => {
    render(<Badge count={100} maxCount={99}>Notifications</Badge>);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('renders removable badge', () => {
    render(<Badge removable>Removable</Badge>);
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('handles remove click', () => {
    const onRemove = vi.fn();
    render(<Badge removable onRemove={onRemove}>Removable</Badge>);
    
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalled();
  });
});

// Import vi and fireEvent for the last tests
import { vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
