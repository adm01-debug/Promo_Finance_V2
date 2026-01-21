import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Alert', () => {
  it('renders with children', () => {
    render(<Alert>Alert message</Alert>);
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    const { container } = render(<Alert>Default</Alert>);
    expect(container.firstChild).toHaveClass('bg-muted');
  });

  it('renders with info variant', () => {
    const { container } = render(<Alert variant="info">Info</Alert>);
    expect(container.firstChild).toHaveClass('bg-blue-50', 'border-blue-200');
  });

  it('renders with success variant', () => {
    const { container } = render(<Alert variant="success">Success</Alert>);
    expect(container.firstChild).toHaveClass('bg-green-50', 'border-green-200');
  });

  it('renders with warning variant', () => {
    const { container } = render(<Alert variant="warning">Warning</Alert>);
    expect(container.firstChild).toHaveClass('bg-yellow-50', 'border-yellow-200');
  });

  it('renders with error variant', () => {
    const { container } = render(<Alert variant="error">Error</Alert>);
    expect(container.firstChild).toHaveClass('bg-red-50', 'border-red-200');
  });

  it('renders with custom icon', () => {
    const CustomIcon = () => <span data-testid="custom-icon">!</span>;
    render(<Alert icon={<CustomIcon />}>With Icon</Alert>);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    const { container } = render(<Alert variant="info" showIcon={false}>No Icon</Alert>);
    expect(container.querySelector('[data-alert-icon]')).not.toBeInTheDocument();
  });

  it('renders dismissible alert', () => {
    render(<Alert dismissible>Dismissible</Alert>);
    expect(screen.getByRole('button', { name: /fechar|dismiss|close/i })).toBeInTheDocument();
  });

  it('calls onDismiss when dismissed', () => {
    const onDismiss = vi.fn();
    render(<Alert dismissible onDismiss={onDismiss}>Dismissible</Alert>);
    
    fireEvent.click(screen.getByRole('button', { name: /fechar|dismiss|close/i }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('hides after dismiss', async () => {
    const { container } = render(<Alert dismissible>Dismissible</Alert>);
    
    fireEvent.click(screen.getByRole('button', { name: /fechar|dismiss|close/i }));
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(container.firstChild).toHaveClass('hidden');
  });

  it('applies custom className', () => {
    const { container } = render(<Alert className="custom-alert">Custom</Alert>);
    expect(container.firstChild).toHaveClass('custom-alert');
  });

  it('renders with title', () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
        Content
      </Alert>
    );
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <Alert>
        <AlertDescription>Detailed description</AlertDescription>
      </Alert>
    );
    expect(screen.getByText('Detailed description')).toBeInTheDocument();
  });

  it('has correct role', () => {
    render(<Alert>Accessible</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders inline variant', () => {
    const { container } = render(<Alert inline>Inline</Alert>);
    expect(container.firstChild).toHaveClass('inline-flex');
  });

  it('renders with action button', () => {
    const onAction = vi.fn();
    render(
      <Alert 
        action={<button onClick={onAction}>Retry</button>}
      >
        With Action
      </Alert>
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('renders with border', () => {
    const { container } = render(<Alert bordered>Bordered</Alert>);
    expect(container.firstChild).toHaveClass('border');
  });

  it('renders compact size', () => {
    const { container } = render(<Alert size="sm">Small</Alert>);
    expect(container.firstChild).toHaveClass('p-2', 'text-sm');
  });

  it('renders large size', () => {
    const { container } = render(<Alert size="lg">Large</Alert>);
    expect(container.firstChild).toHaveClass('p-6', 'text-base');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Alert ref={ref}>With Ref</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('AlertTitle', () => {
  it('renders with text', () => {
    render(<AlertTitle>Title Text</AlertTitle>);
    expect(screen.getByText('Title Text')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    render(<AlertTitle>Title</AlertTitle>);
    expect(screen.getByText('Title')).toHaveClass('font-medium');
  });

  it('applies custom className', () => {
    render(<AlertTitle className="custom-title">Title</AlertTitle>);
    expect(screen.getByText('Title')).toHaveClass('custom-title');
  });
});

describe('AlertDescription', () => {
  it('renders with text', () => {
    render(<AlertDescription>Description text</AlertDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    render(<AlertDescription>Description</AlertDescription>);
    expect(screen.getByText('Description')).toHaveClass('text-sm');
  });

  it('applies custom className', () => {
    render(<AlertDescription className="custom-desc">Description</AlertDescription>);
    expect(screen.getByText('Description')).toHaveClass('custom-desc');
  });
});

describe('Alert Composition', () => {
  it('renders complete alert', () => {
    render(
      <Alert variant="error" dismissible>
        <AlertTitle>Error Occurred</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try again.
        </AlertDescription>
      </Alert>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fechar|dismiss|close/i })).toBeInTheDocument();
  });
});
