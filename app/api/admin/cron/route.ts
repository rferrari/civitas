import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'civitas-admin-secret';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] === ADMIN_SECRET : false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Admin authorization required' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();

    const { data: recentLogs } = await supabase
      .from('cron_job_logs')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(10);

    const { data: stats } = await supabase
      .rpc('get_cron_stats')
      .maybeSingle();

    return Response.json({
      success: true,
      recentLogs: recentLogs || [],
      stats: stats || null,
    });
  } catch (error) {
    console.error('Failed to get cron status:', error);
    return Response.json(
      { error: 'Failed to get cron status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Admin authorization required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, schedule } = body;

    const supabase = createServerClient();

    if (action === 'test') {
      const { data, error } = await supabase.rpc('trigger_world_cycle_job');

      if (error) throw error;

      return Response.json({
        success: true,
        message: 'Test execution triggered',
        result: data,
      });
    }

    if (action === 'update_schedule' && schedule) {
      const { data, error } = await supabase.rpc('update_world_cycle_schedule', {
        new_schedule: schedule,
      });

      if (error) throw error;

      return Response.json({
        success: true,
        message: 'Schedule updated',
        result: data,
      });
    }

    return Response.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to execute cron action:', error);
    return Response.json(
      { error: 'Failed to execute cron action' },
      { status: 500 }
    );
  }
}
