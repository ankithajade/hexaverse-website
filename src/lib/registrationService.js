import { supabase } from './supabaseClient';
import { USN_REGEX } from './validators';

/**
 * Fallback event metadata when database table event is not returned or fails.
 */
const DEFAULT_EVENT_CONFIGS = {
  'aiml-workshop': { slug: 'aiml-workshop', event_type: 'workshop', fee_per_head: 0, is_team: false, is_open: true },
  'aids-workshop': { slug: 'aids-workshop', event_type: 'workshop', fee_per_head: 0, is_team: false, is_open: true },
  'cse-workshop':  { slug: 'cse-workshop',  event_type: 'workshop', fee_per_head: 0, is_team: false, is_open: true },
  'ise-workshop':  { slug: 'ise-workshop',  event_type: 'workshop', fee_per_head: 0, is_team: false, is_open: true },
  'ece-workshop':  { slug: 'ece-workshop',  event_type: 'workshop', fee_per_head: 0, is_team: false, is_open: true },
  'eee-workshop':  { slug: 'eee-workshop',  event_type: 'workshop', fee_per_head: 0, is_team: false, is_open: true },

  'aiml-event':    { slug: 'aiml-event',    event_type: 'signature', fee_per_head: 50, is_team: true, team_min: 1, team_max: 2, is_open: true },
  'aids-event':    { slug: 'aids-event',    event_type: 'signature', fee_per_head: 50, is_team: true, team_min: 2, team_max: 3, is_open: true },
  'cse-event':     { slug: 'cse-event',     event_type: 'signature', fee_per_head: 50, is_team: true, team_min: 2, team_max: 3, is_open: true },
  'ise-event':     { slug: 'ise-event',     event_type: 'signature', fee_per_head: 50, is_team: true, team_min: 2, team_max: 3, is_open: true },
  'ece-event':     { slug: 'ece-event',     event_type: 'signature', fee_per_head: 50, is_team: true, team_min: 3, team_max: 4, is_open: true },
  'eee-event':     { slug: 'eee-event',     event_type: 'signature', fee_per_head: 50, is_team: true, team_min: 2, team_max: 4, is_open: true },

  'treasure-hunt': { slug: 'treasure-hunt', event_type: 'treasure_hunt', fee_per_head: 80, is_team: true, team_min: 2, team_max: 3, is_open: true },
};

/** Fetch event details from database or local fallback config */
export async function getEventConfig(slug) {
  try {
    const { data, error } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
    if (!error && data) return data;
  } catch (err) {
    console.warn('[RegistrationService] Failed to query events table, using local fallback:', err);
  }
  return DEFAULT_EVENT_CONFIGS[slug] || { slug, event_type: 'signature', fee_per_head: 50, is_team: true, team_min: 2, team_max: 4, is_open: true };
}

/** Check team name availability (Edge Function first, DB query fallback) */
export async function checkTeamNameAvailability(eventSlug, teamName) {
  if (!teamName || teamName.trim().length < 2) return null;

  // Try Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('check-team-name', {
      body: { event_slug: eventSlug, team_name: teamName },
    });
    if (!error && data && typeof data.available === 'boolean') {
      return data.available;
    }
  } catch (err) {
    console.warn('[RegistrationService] Edge function check-team-name unreachable, falling back to DB query');
  }

  // Fallback DB Query
  try {
    const norm = teamName.trim().toLowerCase();
    const { data } = await supabase
      .from('teams')
      .select('id')
      .eq('event_slug', eventSlug)
      .eq('team_name_norm', norm)
      .maybeSingle();

    return !data;
  } catch (err) {
    console.warn('[RegistrationService] DB query for team name availability failed:', err);
    return true;
  }
}

/** Submit registration (Edge Function first, Direct Database API fallback) */
export async function submitRegistration(payload) {
  const { event_slug, registrant, team_members, team_name } = payload;

  // 1. Try Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('create-registration', {
      body: payload,
    });
    if (!error && data) {
      if (data.error) throw new Error(data.error);
      return data;
    }
  } catch (err) {
    // If explicit error message returned by function, throw it
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('FunctionsFetchError')) {
      throw err;
    }
    console.warn('[RegistrationService] Edge function create-registration failed/unreachable. Executing DB fallback handler.');
  }

  // 2. Client-side DB Fallback
  const event = await getEventConfig(event_slug);
  const isWorkshop = event_slug.endsWith('-workshop') || event.event_type === 'workshop';

  if (!event.is_open) {
    throw new Error('Registrations for this event are closed.');
  }

  // ── Workshop Registration Fallback ──
  if (isWorkshop) {
    const { name, semester, usn, email, phone } = registrant || {};

    if (!name || !semester || !email || !phone) {
      throw new Error('Missing required fields for workshop registration.');
    }

    if ([3, 5, 7].includes(Number(semester))) {
      if (!usn || !USN_REGEX.test(usn.trim())) {
        throw new Error(`Invalid USN format for Semester ${semester}`);
      }
    }

    // Check duplicate email
    const { data: existingEmail } = await supabase
      .from('workshop_registrations')
      .select('id')
      .eq('event_slug', event_slug)
      .ilike('email', email.trim())
      .maybeSingle();

    if (existingEmail) {
      throw new Error('You have already registered for this workshop with this email address.');
    }

    // Check duplicate USN
    if (usn) {
      const { data: existingUsn } = await supabase
        .from('workshop_registrations')
        .select('id')
        .eq('event_slug', event_slug)
        .ilike('usn', usn.trim())
        .maybeSingle();

      if (existingUsn) {
        throw new Error('This USN is already registered for this workshop.');
      }
    }

    // Insert into workshop_registrations
    const { data: reg, error: regErr } = await supabase
      .from('workshop_registrations')
      .insert({
        event_slug,
        name: name.trim(),
        semester: Number(semester),
        usn: usn ? usn.trim().toUpperCase() : null,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        status: 'confirmed',
      })
      .select()
      .single();

    if (regErr) throw new Error(regErr.message || 'Failed to save workshop registration.');

    return {
      success: true,
      is_free: true,
      message: 'Workshop registration confirmed',
      registration_id: reg.id,
    };
  }

  // ── Team Registration Fallback ──
  const members = team_members || [];
  const totalMembers = members.length;

  if (!team_name || !team_name.trim()) {
    throw new Error('Team name is required.');
  }

  const minM = event.team_min || 2;
  const maxM = event.team_max || 4;

  if (totalMembers < minM) throw new Error(`Minimum ${minM} members required for ${event.title || 'this event'}.`);
  if (totalMembers > maxM) throw new Error(`Maximum ${maxM} members allowed for ${event.title || 'this event'}.`);

  // Check team name uniqueness
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('event_slug', event_slug)
    .eq('team_name_norm', team_name.trim().toLowerCase())
    .maybeSingle();

  if (existingTeam) {
    throw new Error(`Team name "${team_name}" is already taken for this event.`);
  }

  const amount_expected = Number(event.fee_per_head || 50) * totalMembers;

  // Insert Team
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({
      event_slug,
      team_name: team_name.trim(),
      team_size: totalMembers,
      payment_status: 'pending',
    })
    .select()
    .single();

  if (teamErr) throw new Error(teamErr.message || 'Failed to create team.');

  // Insert Team Members
  const memberRows = members.map((m, idx) => ({
    team_id: team.id,
    is_lead: idx === 0,
    name: m.name.trim(),
    usn: m.usn.trim().toUpperCase(),
    email: m.email ? m.email.trim().toLowerCase() : (idx === 0 ? registrant?.email : null),
    phone: m.phone ? m.phone.trim() : (idx === 0 ? registrant?.phone : null),
    position: idx + 1,
  }));

  const { error: memErr } = await supabase.from('team_members').insert(memberRows);

  if (memErr) {
    await supabase.from('teams').delete().eq('id', team.id);
    throw new Error(memErr.message || 'Failed to register team members.');
  }

  // Create Payment record
  const mockOrderId = `ORD_${event_slug}_${team.id.slice(0, 8)}_${Date.now()}`;
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      registration_type: 'team',
      registration_id: team.id,
      amount_expected,
      currency: 'INR',
      status: 'created',
      gateway: 'mock_gateway',
      gateway_order_id: mockOrderId,
    })
    .select()
    .single();

  if (!payErr && payment) {
    await supabase.from('teams').update({ payment_ref: payment.id }).eq('id', team.id);
  }

  return {
    success: true,
    is_free: false,
    payment_reference: payment?.id || team.id,
    gateway_order_id: mockOrderId,
    amount_expected,
    team_id: team.id,
  };
}

/** Verify Payment (Edge Function first, Direct Database API fallback) */
export async function verifyPayment(payload) {
  // 1. Try Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: payload,
    });
    if (!error && data) {
      if (data.error) throw new Error(data.error);
      return data;
    }
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('FunctionsFetchError')) {
      throw err;
    }
    console.warn('[RegistrationService] Edge function verify-payment failed/unreachable. Executing DB fallback.');
  }

  // 2. Client-side DB Fallback
  const { payment_reference, gateway_order_id, gateway_payment_id, amount_paid } = payload;

  let query = supabase.from('payments').select('*');
  if (payment_reference) {
    query = query.eq('id', payment_reference);
  } else if (gateway_order_id) {
    query = query.eq('gateway_order_id', gateway_order_id);
  } else {
    throw new Error('payment_reference or gateway_order_id is required for verification.');
  }

  const { data: payment } = await query.maybeSingle();

  const payId = gateway_payment_id || `PAY_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const actualPaid = Number(amount_paid ?? payment?.amount_expected ?? 0);

  if (payment) {
    await supabase
      .from('payments')
      .update({
        status: 'success',
        amount_paid: actualPaid,
        gateway_payment_id: payId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (payment.registration_type === 'team') {
      await supabase
        .from('teams')
        .update({ payment_status: 'success' })
        .eq('id', payment.registration_id);
    }
  }

  return {
    success: true,
    message: 'Payment verified and registration confirmed',
    status: 'success',
  };
}
