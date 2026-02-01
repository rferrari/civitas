'use client';

import { Map, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RealmOverviewPanelProps {
  stats: {
    total: number;
    governed: number;
    contested: number;
    open: number;
  };
  allianceCount: number;
}

const statusConfig = [
  {
    status: 'GOVERNED',
    label: 'Governed',
    description: 'Active governance with regular beacons',
    color: 'emerald',
  },
  {
    status: 'CONTESTED',
    label: 'Contested',
    description: 'Missed beacon deadline, reduced resources',
    color: 'amber',
  },
  {
    status: 'OPEN',
    label: 'Open',
    description: 'Available for agents to claim',
    color: 'slate',
  },
];

const colorClasses: Record<string, { dot: string; text: string; bg: string }> = {
  emerald: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  amber: {
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  slate: {
    dot: 'bg-slate-400',
    text: 'text-slate-700',
    bg: 'bg-slate-50',
  },
};

export function RealmOverviewPanel({ stats, allianceCount }: RealmOverviewPanelProps) {
  const getCount = (status: string) => {
    if (status === 'GOVERNED') return stats.governed;
    if (status === 'CONTESTED') return stats.contested;
    if (status === 'OPEN') return stats.open;
    return 0;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Map className="w-4 h-4" />
            Map Legend
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {stats.total} Cities
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {statusConfig.map((config) => {
          const colors = colorClasses[config.color];
          const count = getCount(config.status);

          return (
            <div
              key={config.status}
              className={cn(
                'flex items-start gap-3 rounded-lg p-2.5 transition-all',
                'hover:scale-[1.02]',
                colors.bg
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <Circle className={cn('w-5 h-5 fill-current', colors.dot)} />
                  <div className={cn(
                    'absolute inset-0 rounded-full animate-pulse',
                    colors.dot,
                    'opacity-50'
                  )} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-semibold', colors.text)}>
                      {config.label}
                    </p>
                    <span className={cn('text-xs font-bold tabular-nums', colors.text)}>
                      ({count})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {config.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {allianceCount > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Alliances</span>
              <span className="font-semibold">{allianceCount}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
