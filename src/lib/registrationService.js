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

  'treasure-hunt': { slug: 'treasure-hunt', event_type: 'treasure_hunt', fee_per_head: 80, is_team: true, team_min: 3, team_max: 3, is_open: true },
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

/** Check team name availability using check-team-name Edge Function */
export async function checkTeamNameAvailability(eventSlug, teamName) {
  if (!teamName || teamName.trim().length < 2) return null;

  try {
    const { data, error } = await supabase.functions.invoke('check-team-name', {
      body: { event_slug: eventSlug, team_name: teamName },
    });
    if (!error && data && typeof data.available === 'boolean') {
      return data.available;
    }
  } catch (err) {
    console.warn('[RegistrationService] Edge function check-team-name error:', err);
  }
  return null;
}

/** Submit registration via create-registration Edge Function */
export async function submitRegistration(payload) {
  const { data, error } = await supabase.functions.invoke('create-registration', {
    body: payload,
  });

  if (error) {
  let serverMessage = null;

  try {
    if (error.context) {
      const errorBody = await error.context.json();
      serverMessage = errorBody?.error || errorBody?.message || null;
    }
  } catch {
    // Ignore parsing errors and use the generic message below
  }

  throw new Error(
    serverMessage ||
    error.message ||
    'Failed to communicate with registration server.'
  );
}

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

/** Server-side Cashfree payment verification */
export async function verifyPayment({ order_id, gateway_order_id, payment_reference }) {
  const targetOrderId = order_id || gateway_order_id;
  const { data, error } = await supabase.functions.invoke('verify-payment', {
    body: {
      order_id: targetOrderId,
      gateway_order_id: targetOrderId,
      payment_reference,
    },
  });

  if (error) {
    let serverMessage = null;
    try {
      if (error.context) {
        const errorBody = await error.context.json();
        serverMessage = errorBody?.error || errorBody?.message || errorBody?.details || null;
      }
    } catch {
      // Ignore parsing errors
    }

    throw new Error(
      serverMessage ||
      error.message ||
      'Payment verification request failed.'
    );
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
