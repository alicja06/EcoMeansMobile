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

    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: cleanupError } = await adminClient.rpc(
      'prepare_account_deletion',
      { p_user_id: user.id },
    );

    if (cleanupError) {
      console.error('Account data cleanup failed:', cleanupError);
      return jsonResponse(
        { error: 'Could not prepare account deletion.' },
        500,
      );
    }

    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(user.id, false);

    if (deleteError) {
      console.error('Auth user deletion failed:', deleteError);
      return jsonResponse({ error: 'Could not delete the account.' }, 500);
    }

    return jsonResponse({ deleted: true });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return jsonResponse({ error: 'Account deletion failed.' }, 500);
  }
});
