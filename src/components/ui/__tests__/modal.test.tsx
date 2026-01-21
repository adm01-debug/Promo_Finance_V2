import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { Modal } from '@/components/ui/modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.queryByText(/modal content/i)).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.getByText(/modal content/i)).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Content</div>
      </Modal>
    );
    
    expect(screen.getByText(/test modal/i)).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        title="Title"
        description="This is a description"
      >
        <div>Content</div>
      </Modal>
    );
    
    expect(screen.getByText(/this is a description/i)).toBeInTheDocument();
  });

  it('calls onClose when clicking overlay', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    );
    
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does not close when clicking modal content', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div data-testid="modal-content">Content</div>
      </Modal>
    );
    
    const content = screen.getByTestId('modal-content');
    fireEvent.click(content);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when clicking close button', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} showCloseButton>
        <div>Content</div>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose when pressing Escape', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onClose on Escape when closeOnEscape is false', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnEscape={false}>
        <div>Content</div>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose on overlay click when closeOnOverlay is false', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnOverlay={false}>
        <div>Content</div>
      </Modal>
    );
    
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} size="sm">
        <div>Small</div>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');

    rerender(
      <Modal isOpen={true} onClose={() => {}} size="lg">
        <div>Large</div>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-lg');

    rerender(
      <Modal isOpen={true} onClose={() => {}} size="xl">
        <div>Extra Large</div>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-xl');

    rerender(
      <Modal isOpen={true} onClose={() => {}} size="full">
        <div>Full</div>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-full');
  });

  it('renders footer content', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        footer={<button>Save</button>}
      >
        <div>Content</div>
      </Modal>
    );
    
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} className="custom-modal">
        <div>Content</div>
      </Modal>
    );
    
    expect(screen.getByRole('dialog')).toHaveClass('custom-modal');
  });

  it('traps focus inside modal', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <input data-testid="input-1" />
        <button data-testid="button-1">Click</button>
      </Modal>
    );
    
    const input = screen.getByTestId('input-1');
    const button = screen.getByTestId('button-1');
    
    expect(document.body).toContainElement(input);
    expect(document.body).toContainElement(button);
  });
});
