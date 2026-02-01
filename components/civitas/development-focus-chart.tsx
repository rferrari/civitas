'use client';

import { GraduationCap, Hammer, Sparkles, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DevelopmentFocusStats } from '@/lib/services/world-cycles';

interface DevelopmentFocusChartProps {
  focusStats: DevelopmentFocusStats;
}

const focusConfig = [
  {
    key: 'EDUCATION',
    label: 'Education',
    icon: GraduationCap,
    color: 'blue',
    description: '+50% Knowledge',
  },
  {
    key: 'INFRASTRUCTURE',
    label: 'Infrastructure',
    icon: Hammer,
    color: 'slate',
    description: '+50% Materials',
  },
  {
    key: 'CULTURE',
    label: 'Culture',
    icon: Sparkles,
    color: 'purple',
    description: '+50% Influence',
  },
  {
    key: 'DEFENSE',
    label: 'Defense',
    icon: Shield,
    color: 'red',
    description: '+25% Energy & Materials',
  },
];

const colorClasses: Record<string, { text: string; bg: string; bar: string; icon: string }> = {
  blue: {
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    bar: 'bg-blue-500',
    icon: 'text-blue-600',
  },
  slate: {
    text: 'text-slate-700',
    bg: 'bg-slate-50',
    bar: 'bg-slate-500',
    icon: 'text-slate-600',
  },
  purple: {
    text: 'text-purple-700',
    bg: 'bg-purple-50',
    bar: 'bg-purple-500',
    icon: 'text-purple-600',
  },
  red: {
    text: 'text-red-700',
    bg: 'bg-red-50',
    bar: 'bg-red-500',
    icon: 'text-red-600',
  },
};

export function DevelopmentFocusChart({ focusStats }: DevelopmentFocusChartProps) {
  const total = Object.values(focusStats).reduce((sum, val) => sum + val, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Development Focus</CardTitle>
        <p className="text-xs text-muted-foreground">Resource generation priorities</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {focusConfig.map((focus) => {
          const Icon = focus.icon;
          const colors = colorClasses[focus.color];
          const count = focusStats[focus.key as keyof DevelopmentFocusStats];
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={focus.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', colors.bg)}>
                    <Icon className={cn('w-4 h-4', colors.icon)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{focus.label}</p>
                    <p className="text-xs text-muted-foreground">{focus.description}</p>
                  </div>
                </div>
                <span className={cn('text-sm font-bold tabular-nums', colors.text)}>
                  {count}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', colors.bar)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        {total === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4 bg-slate-50 rounded-lg">
            No cities are currently governed
          </div>
        )}
      </CardContent>
    </Card>
  );
}
