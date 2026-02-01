'use client';

import { Clock, Zap, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WorldCycleInfo } from '@/lib/services/world-cycles';

interface WorldCycleStatusProps {
  cycleInfo: WorldCycleInfo;
}

export function WorldCycleStatus({ cycleInfo }: WorldCycleStatusProps) {
  const { lastCycle, nextCycleAt, cycleIntervalMinutes, isDevMode } = cycleInfo;

  const getTimeUntilNext = () => {
    if (!nextCycleAt) return null;
    const now = new Date().getTime();
    const next = new Date(nextCycleAt).getTime();
    const diff = next - now;

    if (diff <= 0) return 'Cycle due now';

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const getTimeSinceLast = () => {
    if (!lastCycle?.executed_at) return 'No cycles yet';
    const now = new Date().getTime();
    const last = new Date(lastCycle.executed_at).getTime();
    const diff = now - last;

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ago`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  };

  return (
    <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            World Cycle Status
          </CardTitle>
          {isDevMode && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Zap className="w-3 h-3 mr-1" />
              Dev Mode
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Cycle Interval</p>
            <p className="text-sm font-semibold text-blue-700">
              {cycleIntervalMinutes >= 1440
                ? `${cycleIntervalMinutes / 1440} day${cycleIntervalMinutes > 1440 ? 's' : ''}`
                : `${cycleIntervalMinutes} min`}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Cycle</p>
            <p className="text-sm font-semibold">{getTimeSinceLast()}</p>
          </div>
        </div>

        {nextCycleAt && (
          <div className="pt-2 border-t border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Timer className="w-3.5 h-3.5" />
                Next cycle in
              </div>
              <span className={cn(
                'text-sm font-bold tabular-nums',
                getTimeUntilNext()?.includes('m') && !getTimeUntilNext()?.includes('h')
                  ? 'text-amber-600'
                  : 'text-blue-700'
              )}>
                {getTimeUntilNext()}
              </span>
            </div>
          </div>
        )}

        {!lastCycle && (
          <div className="text-xs text-muted-foreground bg-blue-50 rounded-lg p-3">
            No world cycles have been executed yet. Run the jobs endpoint to start generating resources.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
