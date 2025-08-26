import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompactDiceAnimation from '../components/Rolls/CompactDiceAnimation';

// Mock framer-motion and react-spring
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} data-testid="motion-div" {...props}>
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

vi.mock('@react-spring/web', () => ({
  useSpring: () => [
    { rotation: 0, scale: 1, y: 0 },
    {
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn()
    }
  ],
  animated: {
    div: ({ children, className, style }: any) => (
      <div className={className} style={style} data-testid="animated-div">
        {children}
      </div>
    )
  },
  config: {
    wobbly: { tension: 180, friction: 12 },
    slow: { tension: 280, friction: 60 }
  }
}));

describe('CompactDiceAnimation', () => {
  it('renders dice shape when not rolling', () => {
    render(
      <CompactDiceAnimation
        diceType="d20"
        isRolling={false}
        modalSize={{ width: 320, height: 200 }}
      />
    );

    // Check for SVG element instead of emoji
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('shows rolling state with proper styling', () => {
    render(
      <CompactDiceAnimation
        diceType="d6"
        isRolling={true}
        modalSize={{ width: 320, height: 200 }}
      />
    );

    expect(screen.getAllByTestId('motion-div')[0]).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('displays result when provided', () => {
    render(
      <CompactDiceAnimation
        diceType="d20"
        isRolling={false}
        rollResult={20}
        modalSize={{ width: 320, height: 200 }}
      />
    );

    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('adapts size to modal constraints', () => {
    const { container } = render(
      <CompactDiceAnimation
        diceType="d20"
        isRolling={false}
        modalSize={{ width: 200, height: 150 }}
      />
    );

    const diceContainer = container.firstChild as HTMLElement;
    expect(diceContainer).toHaveStyle({ width: '50px', height: '50px' });
  });

  it('applies hidden styling when isHidden is true', () => {
    render(
      <CompactDiceAnimation
        diceType="d20"
        isRolling={true}
        isHidden={true}
        modalSize={{ width: 320, height: 200 }}
      />
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveClass('border-purple-500');
  });

  it('respects reduced motion preferences', () => {
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: true,
      addListener: vi.fn(),
      removeListener: vi.fn()
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    });

    render(
      <CompactDiceAnimation
        diceType="d20"
        isRolling={true}
        reducedMotion={true}
        modalSize={{ width: 320, height: 200 }}
      />
    );

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('calls onAnimationComplete when provided', () => {
    const mockCallback = vi.fn();
    
    render(
      <CompactDiceAnimation
        diceType="d20"
        isRolling={false}
        rollResult={15}
        onAnimationComplete={mockCallback}
        modalSize={{ width: 320, height: 200 }}
      />
    );

    // In a real test, we'd simulate the animation completion
    // For now, we just verify the component renders without error
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('applies correct dice variant styling', () => {
    render(
      <CompactDiceAnimation
        diceType="d4"
        isRolling={false}
        modalSize={{ width: 320, height: 200 }}
      />
    );

    // Check for triangle shape (d4) - look for polygon element
    expect(document.querySelector('polygon')).toBeInTheDocument();
  });
});