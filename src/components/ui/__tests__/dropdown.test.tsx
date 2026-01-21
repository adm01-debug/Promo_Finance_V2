import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator } from '../dropdown';

describe('Dropdown', () => {
  const renderDropdown = (props = {}) => {
    return render(
      <Dropdown {...props}>
        <DropdownTrigger>
          <button>Open Menu</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownSeparator />
          <DropdownItem>Item 3</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
  };

  it('renders trigger button', () => {
    renderDropdown();
    expect(screen.getByRole('button', { name: 'Open Menu' })).toBeInTheDocument();
  });

  it('does not show content by default', () => {
    renderDropdown();
    expect(screen.queryByText('Item 1')).not.toBeVisible();
  });

  it('shows content on trigger click', async () => {
    renderDropdown();
    
    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeVisible();
    });
  });

  it('hides content on outside click', async () => {
    renderDropdown();
    
    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    await waitFor(() => expect(screen.getByText('Item 1')).toBeVisible());
    
    fireEvent.click(document.body);
    await waitFor(() => expect(screen.queryByText('Item 1')).not.toBeVisible());
  });

  it('hides content on Escape key', async () => {
    renderDropdown();
    
    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    await waitFor(() => expect(screen.getByText('Item 1')).toBeVisible());
    
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('Item 1')).not.toBeVisible());
  });

  it('calls onOpenChange when toggled', async () => {
    const onOpenChange = vi.fn();
    renderDropdown({ onOpenChange });
    
    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    
    fireEvent.click(document.body);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('renders controlled dropdown', () => {
    render(
      <Dropdown open={true}>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem>Visible Item</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByText('Visible Item')).toBeVisible();
  });
});

describe('DropdownTrigger', () => {
  it('renders children', () => {
    render(
      <Dropdown>
        <DropdownTrigger>
          <button>Custom Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem>Item</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByRole('button', { name: 'Custom Trigger' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Dropdown>
        <DropdownTrigger className="custom-trigger">
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem>Item</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByRole('button', { name: 'Trigger' }).parentElement).toHaveClass('custom-trigger');
  });
});

describe('DropdownContent', () => {
  it('applies default styles', async () => {
    render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent data-testid="content">
          <DropdownItem>Item</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    const content = screen.getByTestId('content');
    expect(content).toHaveClass('rounded-md', 'border', 'shadow-md');
  });

  it('applies custom className', () => {
    render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent className="custom-content" data-testid="content">
          <DropdownItem>Item</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByTestId('content')).toHaveClass('custom-content');
  });

  it('renders with different alignments', () => {
    const { rerender } = render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent align="start" data-testid="content">
          <DropdownItem>Item</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByTestId('content')).toHaveAttribute('data-align', 'start');
    
    rerender(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent align="end" data-testid="content">
          <DropdownItem>Item</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByTestId('content')).toHaveAttribute('data-align', 'end');
  });
});

describe('DropdownItem', () => {
  it('renders with text', () => {
    render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem>Menu Item</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByText('Menu Item')).toBeInTheDocument();
  });

  it('handles click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem onClick={onClick}>Clickable</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    await user.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders disabled item', () => {
    render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem disabled>Disabled</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByText('Disabled')).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem disabled onClick={onClick}>Disabled</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    await user.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders with icon', () => {
    const Icon = () => <span data-testid="icon">✓</span>;
    
    render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem icon={<Icon />}>With Icon</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders destructive variant', () => {
    render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem variant="destructive">Delete</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByText('Delete')).toHaveClass('text-red-600');
  });

  it('renders with shortcut', () => {
    render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem shortcut="⌘K">Command</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });
});

describe('DropdownSeparator', () => {
  it('renders separator', () => {
    render(
      <Dropdown open>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem>Item 1</DropdownItem>
          <DropdownSeparator data-testid="separator" />
          <DropdownItem>Item 2</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    expect(screen.getByTestId('separator')).toBeInTheDocument();
    expect(screen.getByTestId('separator')).toHaveClass('border-t');
  });
});

describe('Dropdown Keyboard Navigation', () => {
  it('navigates items with arrow keys', async () => {
    const user = userEvent.setup();
    
    render(
      <Dropdown>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem>First</DropdownItem>
          <DropdownItem>Second</DropdownItem>
          <DropdownItem>Third</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('First')).toHaveFocus();
    
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('Second')).toHaveFocus();
  });

  it('selects item with Enter', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(
      <Dropdown>
        <DropdownTrigger>
          <button>Trigger</button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem onClick={onClick}>Select Me</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
    
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    
    expect(onClick).toHaveBeenCalled();
  });
});
