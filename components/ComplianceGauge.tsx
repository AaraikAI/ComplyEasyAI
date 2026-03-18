import React, { useEffect, useState } from 'react';

interface ComplianceGaugeProps {
  score: number;
  label?: string;
  size?: number;
}

export const ComplianceGauge: React.FC<ComplianceGaugeProps> = ({
  score,
  label = 'Compliance Score',
  size = 200,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(Math.min(100, Math.max(0, score))), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Semi-circle: arc from 180° to 0° (left to right)
  const circumference = Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#10b981', text: 'text-emerald-500' }; // emerald-500
    if (s >= 60) return { stroke: '#f59e0b', text: 'text-amber-500' }; // amber-500
    return { stroke: '#ef4444', text: 'text-red-500' }; // red-500
  };

  const color = getColor(animatedScore);

  // Arc path: semi-circle from left to right
  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-surface-200 dark:text-surface-700"
        />
        {/* Foreground arc */}
        <path
          d={arcPath}
          fill="none"
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className={`${color.text} fill-current`}
          style={{ fontSize: size * 0.22, fontWeight: 700 }}
        >
          {Math.round(animatedScore)}
        </text>
        {/* "/ 100" subtext */}
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="fill-current text-surface-400 dark:text-surface-500"
          style={{ fontSize: size * 0.08 }}
        >
          / 100
        </text>
      </svg>
      <span className="text-sm font-medium text-surface-500 dark:text-surface-400 -mt-1">
        {label}
      </span>
    </div>
  );
};
