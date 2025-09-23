// Tests for ArrivalModal component
import { render, screen, fireEvent } from '@testing-library/react';
import { ArrivalModal } from '../ArrivalModal.tsx';
import { vi } from 'vitest';

describe('ArrivalModal', () => {
  const mockOnContinue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show short trip message for non-long trips', () => {
    render(
      <ArrivalModal
        systemIndex={1} // Adahn
        isLongTrip={false}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText('Arrived at Adahn')).toBeInTheDocument();
    expect(screen.getByText('Another trip you have survived.')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('should show long trip message for long trips', () => {
    render(
      <ArrivalModal
        systemIndex={5} // Balosnee
        isLongTrip={true}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText('Arrived at Balosnee')).toBeInTheDocument();
    expect(screen.getByText("Be glad you didn't encounter any pirates.")).toBeInTheDocument();
  });

  it('should call onContinue when Continue button is clicked', () => {
    render(
      <ArrivalModal
        systemIndex={0}
        isLongTrip={false}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    expect(mockOnContinue).toHaveBeenCalledTimes(1);
  });

  it('should show correct system name for different systems', () => {
    const { rerender } = render(
      <ArrivalModal
        systemIndex={0} // Acamar
        isLongTrip={false}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText('Arrived at Acamar')).toBeInTheDocument();

    rerender(
      <ArrivalModal
        systemIndex={10} // Campor
        isLongTrip={false}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText('Arrived at Campor')).toBeInTheDocument();
  });
});
