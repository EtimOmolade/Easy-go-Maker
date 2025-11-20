import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  type: string;
  title: string;
  message: string;
  url: string;
  userId?: string | null;
  notificationId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: PushPayload = await req.json();
    const { type, title, message, url, userId, notificationId } = payload;

    console.log('📥 Push notification request received (STUB MODE)');
    console.log('   Type:', type);
    console.log('   Title:', title);
    console.log('   Message:', message);
    console.log('   URL:', url);
    console.log('   User ID:', userId);
    console.log('   Notification ID:', notificationId);

    // Fetch push subscriptions for logging
    let query = supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ Failed to fetch subscriptions:', fetchError.message);
    } else if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ No push subscriptions found for user:', userId || 'all users');
    } else {
      console.log(`📊 Found ${subscriptions.length} push subscription(s):`, 
        subscriptions.map(s => ({ id: s.id, user_id: s.user_id, endpoint: s.endpoint.substring(0, 50) + '...' }))
      );
    }

    console.log('✅ STUB: Push notification processing complete (not actually sent)');
    console.log('ℹ️ Push notifications are currently disabled. A Deno-compatible implementation is needed.');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Push notifications are currently disabled (stub implementation)',
        subscriptionCount: subscriptions?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error in push notification stub:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 'STUB_ERROR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
