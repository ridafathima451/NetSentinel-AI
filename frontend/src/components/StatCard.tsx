import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'purple' | 'red' | 'green' | 'amber';
  tooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  tooltip,
}) => {
  const variantStyles = {
    blue: {
      border: 'border-blue-500/30 hover:border-blue-500/60',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'hover:shadow-glowCyan',
      valueColor: 'text-blue-300',
    },
    purple: {
      border: 'border-purple-500/30 hover:border-purple-500/60',
      iconBg: 'bg-purple-500/10 text-purple-400',
      glow: 'hover:shadow-glow',
      valueColor: 'text-purple-300',
    },
    red: {
      border: 'border-red-500/30 hover:border-red-500/60',
      iconBg: 'bg-red-500/10 text-red-400',
      glow: 'hover:shadow-glowRed',
      valueColor: 'text-red-400',
    },
    green: {
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: '',
      valueColor: 'text-emerald-300',
    },
    amber: {
      border: 'border-amber-500/30 hover:border-amber-500/60',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: '',
      valueColor: 'text-amber-300',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      title={tooltip}
      className={`cyber-card p-5 relative overflow-hidden transition-all duration-300 ${style.border} ${style.glow}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyber-textSecondary">
            {title}
          </p>
          <h3 className={`text-2xl font-bold mt-1 font-mono ${style.valueColor}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {subtitle && (
            <p className="text-xs text-cyber-textMuted mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${style.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
