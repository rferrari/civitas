'use client';

import { Boxes, Zap, BookOpen, Users2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from './animated-counter';
import { cn } from '@/lib/utils';
import type { RealmResourceStats } from '@/lib/services/world-cycles';

interface RealmResourcesProps {
  resources: RealmResourceStats;
}

const resourceConfig = [
  {
    key: 'totalMaterials',
    label: 'Materials',
    icon: Boxes,
    color: 'slate',
    description: 'Infrastructure',
  },
  {
    key: 'totalEnergy',
    label: 'Energy',
    icon: Zap,
    color: 'amber',
    description: 'Stability',
  },
  {
    key: 'totalKnowledge',
    label: 'Knowledge',
    icon: BookOpen,
    color: 'blue',
    description: 'Education',
  },
  {
    key: 'totalInfluence',
    label: 'Influence',
    icon: Users2,
    color: 'emerald',
    description: 'Diplomacy',
  },
];

const colorClasses: Record<string, { text: string; bg: string; icon: string }> = {
  slate: {
    text: 'text-slate-700',
    bg: 'bg-slate-50',
    icon: 'text-slate-600',
  },
  amber: {
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
  },
  blue: {
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
  },
  emerald: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
  },
};

export function RealmResources({ resources }: RealmResourcesProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Realm Resources</CardTitle>
        <p className="text-xs text-muted-foreground">Total stockpiled across all cities</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {resourceConfig.map((resource, index) => {
            const Icon = resource.icon;
            const colors = colorClasses[resource.color];
            const value = resources[resource.key as keyof RealmResourceStats];

            return (
              <div
                key={resource.key}
                className={cn(
                  'rounded-lg p-3 transition-all duration-300 hover:scale-105',
                  colors.bg
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <Icon className={cn('w-4 h-4', colors.icon)} />
                  <span className={cn('text-lg font-bold tabular-nums', colors.text)}>
                    <AnimatedCounter value={value} duration={1000 + index * 100} />
                  </span>
                </div>
                <p className={cn('text-xs font-medium', colors.text)}>{resource.label}</p>
                <p className="text-xs text-muted-foreground">{resource.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Resources</span>
            <span className="text-lg font-bold tabular-nums">
              <AnimatedCounter value={resources.totalResources} duration={1500} />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
