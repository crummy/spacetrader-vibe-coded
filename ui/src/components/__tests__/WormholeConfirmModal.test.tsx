// Tests for WormholeConfirmModal component
import { render, screen, fireEvent } from '@testing-library/react';
import { WormholeConfirmModal } from '../WormholeConfirmModal.tsx';
import { vi } from 'vitest';

const mockCost = {
  wormholeTax: 100,
  mercenaryPay: 50,
  insurance: 25,
  interest: 10,
  fuel: 0, // No fuel cost for wormhole travel
  total: 185
};

describe('WormholeConfirmModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render cost breakdown correctly', () => {
    render(
      <WormholeConfirmModal
        targetSystemIndex={5}
        cost={mockCost}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Wormhole Travel Costs')).toBeInTheDocument();
    expect(screen.getByText('100 cr.', { exact: false })).toBeInTheDocument(); // Wormhole tax
    expect(screen.getByText('50 cr.', { exact: false })).toBeInTheDocument(); // Mercenaries
    expect(screen.getByText('25 cr.', { exact: false })).toBeInTheDocument(); // Insurance
    expect(screen.getByText('10 cr.', { exact: false })).toBeInTheDocument(); // Interest
    expect(screen.getByText('185 cr.', { exact: false })).toBeInTheDocument(); // Total
  });

  it('should show destination system name', () => {
    render(
      <WormholeConfirmModal
        targetSystemIndex={5}
        cost={mockCost}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Should show destination system - Balosnee is system 5
    expect(screen.getByText(/Destination:.*Balosnee/)).toBeInTheDocument();
  });

  it('should show wormhole explanation text', () => {
    render(
      <WormholeConfirmModal
        targetSystemIndex={5}
        cost={mockCost}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Wormhole tax must be paid when you want to warp through a wormhole/)).toBeInTheDocument();
    expect(screen.getByText(/It depends on the type of your ship/)).toBeInTheDocument();
  });

  it('should call onConfirm when Pay & Travel button is clicked', () => {
    render(
      <WormholeConfirmModal
        targetSystemIndex={5}
        cost={mockCost}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText('Pay & Travel');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should call onCancel when Cancel button is clicked', () => {
    render(
      <WormholeConfirmModal
        targetSystemIndex={5}
        cost={mockCost}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should hide interest row when interest is zero', () => {
    const costWithoutInterest = { ...mockCost, interest: 0, total: 175 };
    
    render(
      <WormholeConfirmModal
        targetSystemIndex={5}
        cost={costWithoutInterest}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Should not show interest row when it's 0
    expect(screen.queryByText('Interest:')).not.toBeInTheDocument();
    expect(screen.getByText('175 cr.', { exact: false })).toBeInTheDocument(); // Updated total
  });
});
