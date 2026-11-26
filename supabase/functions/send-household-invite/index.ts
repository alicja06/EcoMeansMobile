import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getDefaultKey(name: string) {
  const rawValue = Deno.env.get(name);

  if (!rawValue) {
    throw new Error(`Missing Edge Function environment variable: ${name}`);
  }

  let keys: unknown;

  try {
    keys = JSON.parse(rawValue);
  } catch {
    throw new Error(`Invalid Edge Function key map: ${name}`);
  }

  if (
    typeof keys !== 'object' ||
    keys === null ||
    !('default' in keys) ||
    typeof keys.default !== 'string'
  ) {
    throw new Error(`Default key is missing from Edge Function key map: ${name}`);
  }

  return keys.default;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const authorization = request.headers.get('Authorization');

  if (!authorization) {
    return jsonResponse({ error: 'Authentication required.' }, 401);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!supabaseUrl) {
      throw new Error('Missing Edge Function environment variable: SUPABASE_URL');
    }

    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid request body.' }, 400);
    }

    if (typeof requestBody !== 'object' || requestBody === null) {
      return jsonResponse({ error: 'Invalid request body.' }, 400);
    }

    const { email, householdId } = requestBody as Record<string, unknown>;

    if (
      typeof email !== 'string' ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof householdId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        householdId,
      )
    ) {
      return jsonResponse({ error: 'Invalid email or household.' }, 400);
    }

    const publishableKey = getDefaultKey('SUPABASE_PUBLISHABLE_KEYS');
    const secretKey = getDefaultKey('SUPABASE_SECRET_KEYS');
    const userClient = createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authorization },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: 'A valid session is required.' }, 401);
    }

    const { data: inviteCode, error: inviteCodeError } =
      await userClient.rpc('create_household_invite_code', {
        p_household_id: householdId,
      });

    if (inviteCodeError || typeof inviteCode !== 'string' || !inviteCode) {
      console.error('Household invite code creation failed:', inviteCodeError);
      return jsonResponse({ error: 'Could not create household invitation.' }, 403);
    }

    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const redirectTo =
      `ecomeansmobile://auth/callback?invite=${encodeURIComponent(inviteCode)}`;
    const { error: sendError } =
      await adminClient.auth.admin.inviteUserByEmail(email.trim(), {
        redirectTo,
      });

    if (sendError) {
      console.error('Household invitation email failed:', sendError.message);
      const { error: revokeError } = await adminClient
        .from('household_invite_codes')
        .update({ expires_at: new Date().toISOString() })
        .eq('token', inviteCode);

      if (revokeError) {
        console.error('Could not revoke unsent household invitation:', revokeError);
      }

      return jsonResponse(
        { error: 'Could not send invitation email.' },
        502,
      );
    }

    return jsonResponse({ sent: true });
  } catch (error) {
    console.error('Household invitation email failed:', error);
    return jsonResponse({ error: 'Could not send invitation email.' }, 500);
  }
});
