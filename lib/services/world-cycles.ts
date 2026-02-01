import { createServerClient } from '@/lib/supabase/client';

export interface WorldCycleInfo {
  lastCycle: {
    id: string;
    executed_at: string;
    cycle_start: string;
    cycle_end: string;
  } | null;
  nextCycleAt: string | null;
  cycleIntervalMinutes: number;
  isDevMode: boolean;
}

export async function getWorldCycleInfo(): Promise<WorldCycleInfo> {
  const isDev =
    process.env.NODE_ENV === 'development' ||
    process.env.VERCEL_ENV === 'preview' ||
    process.env.CIVITAS_ENV === 'dev' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev';

  const customIntervalMinutes = process.env.CYCLE_INTERVAL_MINUTES
    ? parseInt(process.env.CYCLE_INTERVAL_MINUTES, 10)
    : null;

  const cycleIntervalMinutes = customIntervalMinutes
    ? customIntervalMinutes
    : isDev
      ? 5
      : 1440;

  const supabase = createServerClient();

  const { data: lastCycle } = await supabase
    .from('world_cycles')
    .select('id, executed_at, cycle_start, cycle_end')
    .order('executed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextCycleAt = null;
  if (lastCycle?.executed_at) {
    const lastCycleTime = new Date(lastCycle.executed_at);
    nextCycleAt = new Date(lastCycleTime.getTime() + cycleIntervalMinutes * 60 * 1000).toISOString();
  }

  return {
    lastCycle,
    nextCycleAt,
    cycleIntervalMinutes,
    isDevMode: isDev,
  };
}

export interface RealmResourceStats {
  totalMaterials: number;
  totalEnergy: number;
  totalKnowledge: number;
  totalInfluence: number;
  totalResources: number;
}

export async function getRealmResourceStats(): Promise<RealmResourceStats> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from('city_resource_balances')
    .select('materials, energy, knowledge, influence');

  let totalMaterials = 0;
  let totalEnergy = 0;
  let totalKnowledge = 0;
  let totalInfluence = 0;

  if (data) {
    for (const balance of data) {
      totalMaterials += balance.materials || 0;
      totalEnergy += balance.energy || 0;
      totalKnowledge += balance.knowledge || 0;
      totalInfluence += balance.influence || 0;
    }
  }

  return {
    totalMaterials,
    totalEnergy,
    totalKnowledge,
    totalInfluence,
    totalResources: totalMaterials + totalEnergy + totalKnowledge + totalInfluence,
  };
}

export interface DevelopmentFocusStats {
  EDUCATION: number;
  INFRASTRUCTURE: number;
  CULTURE: number;
  DEFENSE: number;
}

export async function getDevelopmentFocusStats(): Promise<DevelopmentFocusStats> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from('cities')
    .select('focus')
    .in('status', ['GOVERNED', 'CONTESTED']);

  const stats: DevelopmentFocusStats = {
    EDUCATION: 0,
    INFRASTRUCTURE: 0,
    CULTURE: 0,
    DEFENSE: 0,
  };

  if (data) {
    for (const city of data) {
      const focus = city.focus || 'INFRASTRUCTURE';
      if (focus in stats) {
        stats[focus as keyof DevelopmentFocusStats]++;
      }
    }
  }

  return stats;
}

export async function getAllianceCount(): Promise<number> {
  const supabase = createServerClient();

  const { count } = await supabase
    .from('alliances')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE');

  return count || 0;
}
