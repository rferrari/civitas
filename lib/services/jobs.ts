import { createServerClient } from '@/lib/supabase/client';
import { WORLD_CONSTANTS } from '@/lib/constants';
import { generateReport } from './reports';

export interface JobResult {
  job: string;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

const isDev =
  process.env.NODE_ENV === 'development' ||
  process.env.VERCEL_ENV === 'preview' ||
  process.env.CIVITAS_ENV === 'dev' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev';

const customIntervalMinutes = process.env.CYCLE_INTERVAL_MINUTES
  ? parseInt(process.env.CYCLE_INTERVAL_MINUTES, 10)
  : null;

const CYCLE_INTERVAL_MS = customIntervalMinutes
  ? customIntervalMinutes * 60 * 1000
  : isDev
    ? 5 * 60 * 1000
    : 24 * 60 * 60 * 1000;

interface FocusModifiers {
  materials: number;
  energy: number;
  knowledge: number;
  influence: number;
}

const FOCUS_MODIFIERS: Record<string, FocusModifiers> = {
  EDUCATION: { materials: -0.1, energy: 0, knowledge: 0.5, influence: 0 },
  INFRASTRUCTURE: { materials: 0.5, energy: 0, knowledge: 0, influence: -0.1 },
  CULTURE: { materials: 0, energy: -0.1, knowledge: 0, influence: 0.5 },
  DEFENSE: { materials: 0.25, energy: 0.25, knowledge: 0, influence: -0.25 },
};

const BASE_GENERATION = 10;

export async function markOverdueCitiesContested(): Promise<JobResult> {
  const supabase = createServerClient();
  const cutoff = new Date(Date.now() - WORLD_CONSTANTS.BEACON_WINDOW_MS).toISOString();

  const { data: overdueCities, error: fetchError } = await supabase
    .from('cities')
    .select('*')
    .eq('status', 'GOVERNED')
    .lt('last_beacon_at', cutoff);

  if (fetchError) {
    return {
      job: 'mark_overdue_contested',
      success: false,
      message: `Failed to fetch overdue cities: ${fetchError.message}`,
    };
  }

  if (!overdueCities || overdueCities.length === 0) {
    return {
      job: 'mark_overdue_contested',
      success: true,
      message: 'No overdue cities found',
      details: { citiesProcessed: 0 },
    };
  }

  const now = new Date().toISOString();
  let processedCount = 0;

  for (const city of overdueCities) {
    const { error: updateError } = await supabase
      .from('cities')
      .update({
        status: 'CONTESTED',
        contested_at: now,
        beacon_streak_days: 0,
        updated_at: now,
      })
      .eq('id', city.id);

    if (updateError) continue;

    await supabase.from('world_events').insert({
      type: 'CITY_CONTESTED',
      city_id: city.id,
      agent_id: city.governor_agent_id,
      payload: {
        city_name: city.name,
        last_beacon_at: city.last_beacon_at,
        previous_streak: city.beacon_streak_days,
      },
      occurred_at: now,
    });

    processedCount++;
  }

  return {
    job: 'mark_overdue_contested',
    success: true,
    message: `Marked ${processedCount} cities as contested`,
    details: { citiesProcessed: processedCount, cityIds: overdueCities.map((c) => c.id) },
  };
}

export async function generateDailyReport(): Promise<JobResult> {
  try {
    const report = await generateReport('DAILY');
    return {
      job: 'generate_daily_report',
      success: true,
      message: 'Daily report generated successfully',
      details: { reportId: report.id, headline: report.headline },
    };
  } catch (error) {
    return {
      job: 'generate_daily_report',
      success: false,
      message: `Failed to generate daily report: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function generateWeeklyReport(): Promise<JobResult> {
  try {
    const report = await generateReport('WEEKLY');
    return {
      job: 'generate_weekly_report',
      success: true,
      message: 'Weekly report generated successfully',
      details: { reportId: report.id, headline: report.headline },
    };
  } catch (error) {
    return {
      job: 'generate_weekly_report',
      success: false,
      message: `Failed to generate weekly report: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function runWorldCycle(): Promise<JobResult> {
  const supabase = createServerClient();
  const now = new Date();

  try {
    const { data: lastCycle } = await supabase
      .from('world_cycles')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastCycle && lastCycle.executed_at) {
      const timeSinceLastCycle = now.getTime() - new Date(lastCycle.executed_at).getTime();
      if (timeSinceLastCycle < CYCLE_INTERVAL_MS) {
        return {
          job: 'run_world_cycle',
          success: true,
          message: `Too soon to run cycle. Last cycle was ${Math.floor(timeSinceLastCycle / 1000 / 60)} minutes ago. Need ${Math.floor(CYCLE_INTERVAL_MS / 1000 / 60)} minutes.`,
          details: {
            lastCycleAt: lastCycle.executed_at,
            nextCycleAt: new Date(new Date(lastCycle.executed_at).getTime() + CYCLE_INTERVAL_MS).toISOString(),
            cycleIntervalMinutes: CYCLE_INTERVAL_MS / 1000 / 60,
          },
        };
      }
    }

    const cycleStart = lastCycle?.executed_at ? new Date(lastCycle.executed_at) : new Date(now.getTime() - CYCLE_INTERVAL_MS);
    const cycleEnd = now;

    const { data: cycle, error: cycleError } = await supabase
      .from('world_cycles')
      .insert({
        cycle_start: cycleStart.toISOString(),
        cycle_end: cycleEnd.toISOString(),
        executed_at: now.toISOString(),
        status: 'EXECUTED',
      })
      .select()
      .single();

    if (cycleError) {
      throw new Error(`Failed to create cycle record: ${cycleError.message}`);
    }

    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('id, name, status, focus, governor_agent_id');

    if (citiesError) {
      throw new Error(`Failed to fetch cities: ${citiesError.message}`);
    }

    let citiesProcessed = 0;
    let totalResourcesGenerated = 0;

    for (const city of cities || []) {
      const focus = city.focus || 'INFRASTRUCTURE';
      const modifiers = FOCUS_MODIFIERS[focus] || FOCUS_MODIFIERS.INFRASTRUCTURE;

      const contestedPenalty = city.status === 'CONTESTED' ? 0.5 : 1.0;

      const materials = Math.floor(BASE_GENERATION * (1 + modifiers.materials) * contestedPenalty);
      const energy = Math.floor(BASE_GENERATION * (1 + modifiers.energy) * contestedPenalty);
      const knowledge = Math.floor(BASE_GENERATION * (1 + modifiers.knowledge) * contestedPenalty);
      const influence = Math.floor(BASE_GENERATION * (1 + modifiers.influence) * contestedPenalty);

      const { data: balance } = await supabase
        .from('city_resource_balances')
        .select('*')
        .eq('city_id', city.id)
        .maybeSingle();

      if (balance) {
        const { error: updateError } = await supabase
          .from('city_resource_balances')
          .update({
            materials: (balance.materials || 0) + materials,
            energy: (balance.energy || 0) + energy,
            knowledge: (balance.knowledge || 0) + knowledge,
            influence: (balance.influence || 0) + influence,
            updated_at: now.toISOString(),
          })
          .eq('city_id', city.id);

        if (updateError) continue;
      } else {
        const { error: insertError } = await supabase
          .from('city_resource_balances')
          .insert({
            city_id: city.id,
            materials,
            energy,
            knowledge,
            influence,
          });

        if (insertError) continue;
      }

      await supabase.from('resource_ledger_entries').insert({
        city_id: city.id,
        cycle_id: cycle.id,
        type: 'GENERATION',
        delta_materials: materials,
        delta_energy: energy,
        delta_knowledge: knowledge,
        delta_influence: influence,
        reason: `World cycle generation (focus: ${focus}, status: ${city.status})`,
      });

      citiesProcessed++;
      totalResourcesGenerated += materials + energy + knowledge + influence;
    }

    await supabase.from('world_events').insert({
      type: 'WORLD_CYCLE_COMPLETED',
      payload: {
        cycle_id: cycle.id,
        cities_processed: citiesProcessed,
        total_resources_generated: totalResourcesGenerated,
        cycle_start: cycleStart.toISOString(),
        cycle_end: cycleEnd.toISOString(),
        interval_minutes: CYCLE_INTERVAL_MS / 1000 / 60,
        is_dev_mode: isDev,
      },
      occurred_at: now.toISOString(),
    });

    return {
      job: 'run_world_cycle',
      success: true,
      message: `World cycle completed. Processed ${citiesProcessed} cities, generated ${totalResourcesGenerated} total resources.`,
      details: {
        cycleId: cycle.id,
        citiesProcessed,
        totalResourcesGenerated,
        cycleStart: cycleStart.toISOString(),
        cycleEnd: cycleEnd.toISOString(),
        intervalMinutes: CYCLE_INTERVAL_MS / 1000 / 60,
        isDevMode: isDev,
      },
    };
  } catch (error) {
    return {
      job: 'run_world_cycle',
      success: false,
      message: `Failed to run world cycle: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function runAllJobs(): Promise<JobResult[]> {
  const results: JobResult[] = [];

  results.push(await runWorldCycle());

  results.push(await markOverdueCitiesContested());

  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay();

  if (hour === 0 || isDev) {
    results.push(await generateDailyReport());
  }

  if ((hour === 0 && dayOfWeek === 1) || isDev) {
    results.push(await generateWeeklyReport());
  }

  return results;
}
