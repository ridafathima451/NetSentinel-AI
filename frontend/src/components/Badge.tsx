import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'risk' | 'status' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', className = '' }) => {
  const norm = (label || '').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (variant === 'risk') {
    switch (norm) {
      case 'CRITICAL':
        colorClasses = 'bg-red-950/80 text-red-300 border-red-700/60 shadow-glowRed';
        break;
      case 'HIGH':
        colorClasses = 'bg-orange-950/80 text-orange-300 border-orange-700/60';
        break;
      case 'MEDIUM':
        colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-700/60';
        break;
      case 'LOW':
        colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
        break;
    }
  } else if (variant === 'status') {
    switch (norm) {
      case 'NEW':
        colorClasses = 'bg-blue-950/80 text-blue-300 border-blue-700/60';
        break;
      case 'INVESTIGATING':
        colorClasses = 'bg-purple-950/80 text-purple-300 border-purple-700/60';
        break;
      case 'RESOLVED':
        colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
        break;
      case 'FALSE_POSITIVE':
        colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
        break;
      case 'OPEN':
        colorClasses = 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};
