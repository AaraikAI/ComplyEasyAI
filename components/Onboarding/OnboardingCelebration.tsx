import React, { useEffect, useState, useMemo } from 'react';
import { Trophy, ArrowRight } from 'lucide-react';

export interface OnboardingCelebrationProps {
  message: string;
  onDismiss: () => void;
  onNextSteps?: () => void;
  reducedMotion?: boolean;
}

// Generate confetti pieces with randomized properties (Signal greens/blues)
const generateConfetti = (count: number) => {
  const colors = [
    '#38E8A6', '#3AA0FF', '#34C88A', '#22D3EE', '#5EEAD4',
    '#60A5FA', '#38E8A6', '#3AA0FF', '#2DD4BF', '#93C5FD',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    rotation: Math.random() * 360,
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? 'square' : 'circle',
  }));
};

export const OnboardingCelebration: React.FC<OnboardingCelebrationProps> = ({
  message,
  onDismiss,
  onNextSteps,
  reducedMotion = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [checkmarkDone, setCheckmarkDone] = useState(false);
  const confettiPieces = useMemo(() => generateConfetti(40), []);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    const checkTimer = setTimeout(() => setCheckmarkDone(true), 800);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(checkTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 cursor-pointer ${
        reducedMotion ? '' : 'transition-opacity duration-300'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleDismiss}
      role="alert"
      aria-live="polite"
    >
      {/* Confetti layer */}
      {!reducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute animate-confetti-fall"
              style={{
                left: `${piece.left}%`,
                top: '-10px',
                width: `${piece.size}px`,
                height: piece.shape === 'circle' ? `${piece.size}px` : `${piece.size * 1.5}px`,
                backgroundColor: piece.color,
                borderRadius: piece.shape === 'circle' ? '50%' : '2px',
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                transform: `rotate(${piece.rotation}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Achievement card */}
      <div
        className={`relative bg-signal-panel2 border border-white/[0.08] rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center ${
          reducedMotion ? '' : `transition-transform duration-500 ${isVisible ? 'scale-100' : 'scale-90'}`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated checkmark */}
        <div className="mb-5 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-signal-green/10 border-2 border-signal-green/30 flex items-center justify-center">
            <svg
              className={`w-10 h-10 text-signal-green ${
                reducedMotion ? '' : checkmarkDone ? 'animate-none' : ''
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M5 13l4 4L19 7"
                className={reducedMotion ? '' : 'animate-checkmark-draw'}
                style={{
                  strokeDasharray: 24,
                  strokeDashoffset: reducedMotion ? 0 : undefined,
                }}
              />
            </svg>
          </div>
        </div>

        {/* Achievement badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-signal-amber/10 border border-signal-amber/20 rounded-full mb-4">
          <Trophy className="w-4 h-4 text-signal-amber" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-signal-amber">Achievement Unlocked</span>
        </div>

        {/* Message */}
        <h3 className="font-display text-xl font-bold tracking-tight text-signal-ink mb-2">{message}</h3>
        <p className="text-sm text-signal-sub mb-6">
          Keep up the great momentum on your compliance journey.
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3">
          {onNextSteps && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNextSteps();
                handleDismiss();
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-signal-canvas bg-signal-green hover:opacity-90 rounded-xl transition-all"
            >
              Next Steps
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm font-medium text-signal-sub hover:text-signal-ink transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// NOTE: Audio can be added for celebration sounds by importing and playing
// an audio file here. Example: new Audio('/sounds/celebration.mp3').play();
// This is omitted to avoid requiring audio assets.
