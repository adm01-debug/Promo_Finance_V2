import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card', () => {
  it('renders with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-card');
  });

  it('renders with default styles', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass('rounded-lg', 'border', 'bg-card');
  });

  it('renders with variant elevated', () => {
    const { container } = render(<Card variant="elevated">Content</Card>);
    expect(container.firstChild).toHaveClass('shadow-lg');
  });

  it('renders with variant outlined', () => {
    const { container } = render(<Card variant="outlined">Content</Card>);
    expect(container.firstChild).toHaveClass('border-2');
  });

  it('renders with variant ghost', () => {
    const { container } = render(<Card variant="ghost">Content</Card>);
    expect(container.firstChild).toHaveClass('border-transparent');
  });

  it('renders as clickable', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick} clickable>Clickable</Card>);
    
    fireEvent.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders with hover effect when clickable', () => {
    const { container } = render(<Card clickable>Clickable</Card>);
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('renders with padding', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    expect(container.firstChild).toHaveClass('p-6');
  });

  it('renders without padding', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    expect(container.firstChild).not.toHaveClass('p-4', 'p-6');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('renders with children', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    expect(container.firstChild).toHaveClass('flex', 'flex-col', 'space-y-1.5');
  });

  it('applies custom className', () => {
    const { container } = render(<CardHeader className="custom-header">Header</CardHeader>);
    expect(container.firstChild).toHaveClass('custom-header');
  });
});

describe('CardTitle', () => {
  it('renders with children', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders as h3 by default', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CardTitle className="custom-title">Title</CardTitle>);
    expect(screen.getByText('Title')).toHaveClass('custom-title');
  });

  it('applies default font styles', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title')).toHaveClass('text-lg', 'font-semibold');
  });
});

describe('CardDescription', () => {
  it('renders with children', () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText('Description')).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('applies custom className', () => {
    render(<CardDescription className="custom-desc">Description</CardDescription>);
    expect(screen.getByText('Description')).toHaveClass('custom-desc');
  });
});

describe('CardContent', () => {
  it('renders with children', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies default padding', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    expect(container.firstChild).toHaveClass('p-6', 'pt-0');
  });

  it('applies custom className', () => {
    const { container } = render(<CardContent className="custom-content">Content</CardContent>);
    expect(container.firstChild).toHaveClass('custom-content');
  });
});

describe('CardFooter', () => {
  it('renders with children', () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    expect(container.firstChild).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('applies custom className', () => {
    const { container } = render(<CardFooter className="custom-footer">Footer</CardFooter>);
    expect(container.firstChild).toHaveClass('custom-footer');
  });
});

describe('Card Composition', () => {
  it('renders complete card with all parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main content goes here</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description text')).toBeInTheDocument();
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
