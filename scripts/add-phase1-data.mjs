import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addPhase1Data() {
  console.log('Adding Phase 1 data to existing database...\n');

  // Get all cities
  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('id, name, status, governor_agent_id')
    .order('name');

  if (citiesError) {
    console.error('Error fetching cities:', citiesError);
    throw citiesError;
  }

  console.log(`Found ${cities.length} cities`);

  // Update city focus with variety and add resource balances
  const focuses = ['INFRASTRUCTURE', 'EDUCATION', 'CULTURE', 'DEFENSE'];

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const focus = focuses[i % focuses.length];

    // Update focus
    const { error: updateError } = await supabase
      .from('cities')
      .update({
        focus: focus,
        focus_set_at: new Date().toISOString(),
      })
      .eq('id', city.id);

    if (updateError) {
      console.error(`Error updating focus for ${city.name}:`, updateError);
      continue;
    }

    console.log(`Updated ${city.name}: focus=${focus}`);

    // Check if resource balance exists
    const { data: existingBalance } = await supabase
      .from('city_resource_balances')
      .select('id')
      .eq('city_id', city.id)
      .maybeSingle();

    if (!existingBalance) {
      // Create resource balance
      const { error: balanceError } = await supabase
        .from('city_resource_balances')
        .insert({
          city_id: city.id,
          materials: 50,
          energy: 50,
          knowledge: 50,
          influence: 50,
        });

      if (balanceError) {
        console.error(`Error creating balance for ${city.name}:`, balanceError);
      } else {
        console.log(`  Added resource balance (50 of each)`);
      }
    } else {
      console.log(`  Resource balance already exists`);
    }
  }

  // Get all agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, display_name')
    .order('created_at')
    .limit(5);

  if (agentsError) {
    console.error('Error fetching agents:', agentsError);
    throw agentsError;
  }

  console.log(`\nFound ${agents.length} agents`);

  // Check if demo alliance exists
  const { data: existingAlliance } = await supabase
    .from('alliances')
    .select('id, name')
    .eq('name', 'Founding Coalition')
    .maybeSingle();

  if (existingAlliance) {
    console.log('\nDemo alliance "Founding Coalition" already exists');
  } else if (agents.length >= 2) {
    console.log('\nCreating demo alliance...');

    const { data: alliance, error: allianceError } = await supabase
      .from('alliances')
      .insert({
        name: 'Founding Coalition',
        created_by_agent_id: agents[0].id,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (allianceError) {
      console.error('Error creating alliance:', allianceError);
    } else {
      console.log(`Created alliance: ${alliance.name}`);

      // Add both agents as members
      await supabase.from('alliance_members').insert([
        {
          alliance_id: alliance.id,
          agent_id: agents[0].id,
          role: 'FOUNDER',
          is_active: true,
        },
        {
          alliance_id: alliance.id,
          agent_id: agents[1].id,
          role: 'MEMBER',
          is_active: true,
        },
      ]);

      console.log(`Added ${agents[0].display_name} (FOUNDER) and ${agents[1].display_name} (MEMBER)`);

      // Log alliance formation
      await supabase.from('world_events').insert({
        type: 'ALLIANCE_FORMED',
        agent_id: agents[0].id,
        payload: {
          alliance_id: alliance.id,
          alliance_name: alliance.name,
          founding_members: [
            { id: agents[0].id, name: agents[0].display_name },
            { id: agents[1].id, name: agents[1].display_name },
          ],
        },
        occurred_at: new Date().toISOString(),
      });

      console.log('Logged ALLIANCE_FORMED event');

      // Find a governed city to add council member
      const governedCity = cities.find(c => c.status === 'GOVERNED' && c.governor_agent_id === agents[0].id);

      if (governedCity) {
        console.log(`\nAdding council member to ${governedCity.name}...`);

        // Check if council member already exists
        const { data: existingCouncil } = await supabase
          .from('city_council_members')
          .select('id')
          .eq('city_id', governedCity.id)
          .eq('agent_id', agents[1].id)
          .maybeSingle();

        if (!existingCouncil) {
          await supabase.from('city_council_members').insert({
            city_id: governedCity.id,
            agent_id: agents[1].id,
            added_via_alliance_id: alliance.id,
            can_change_focus: true,
            can_view_resources: true,
          });

          console.log(`Added ${agents[1].display_name} as council member`);

          // Log shared governance
          await supabase.from('world_events').insert({
            type: 'CITY_SHARED_GOVERNANCE_GRANTED',
            agent_id: agents[0].id,
            city_id: governedCity.id,
            payload: {
              city_name: governedCity.name,
              council_member_id: agents[1].id,
              council_member_name: agents[1].display_name,
              permissions: {
                can_change_focus: true,
                can_view_resources: true,
              },
            },
            occurred_at: new Date().toISOString(),
          });

          console.log('Logged CITY_SHARED_GOVERNANCE_GRANTED event');
        } else {
          console.log('Council member already exists');
        }
      } else {
        console.log('\nNo governed cities found to add council member');
        console.log('To demo council features, first claim a city with one of the agents');
      }
    }
  } else {
    console.log('\nNot enough agents to create demo alliance (need at least 2)');
  }

  console.log('\n=== Phase 1 Data Added Successfully ===');
  console.log('\nNext steps:');
  console.log('1. Run world cycle: curl -X POST http://localhost:3000/api/admin/jobs -H "Authorization: Bearer civitas-admin-secret" -H "Content-Type: application/json" -d \'{"job": "run_world_cycle"}\'');
  console.log('2. View cities with resources on the dashboard');
  console.log('3. Create alliances and manage city focus via the Agent Console');
}

// Main execution
(async () => {
  try {
    await addPhase1Data();
  } catch (error) {
    console.error('Adding Phase 1 data failed:', error);
    process.exit(1);
  }
})();
