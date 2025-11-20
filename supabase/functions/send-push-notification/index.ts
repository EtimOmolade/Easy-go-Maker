import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  type: 'reminder' | 'announcement';
  title: string;
  message: string;
  url: string;
  userId?: string;
  notificationId?: string;
}

Deno.serve(async (req) => {
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

    console.log('📤 Sending push notification:', { type, title, userId });

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('VAPID keys not configured');
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    let query = supabase.from('push_subscriptions').select('*');
    
    if (type === 'reminder' && userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ No subscriptions found');
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificationPayload = JSON.stringify({
      title,
      body: message,
      icon: '/logo-192.png',
      badge: '/logo-192.png',
      tag: type,
      data: { url, type, notificationId },
      requireInteraction: type === 'reminder',
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });

    let successCount = 0;
    let failureCount = 0;
    const expiredSubscriptions: string[] = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);

        console.log(`✅ Sent to subscription ${sub.id}`);
        successCount++;

        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);

      } catch (error: any) {
        console.error(`❌ Error sending to ${sub.id}:`, error.message);
        failureCount++;
        
        if (error.statusCode === 410 || error.statusCode === 404) {
          expiredSubscriptions.push(sub.id);
        }
      }
    }

    if (expiredSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
      
      console.log(`🧹 Cleaned up ${expiredSubscriptions.length} expired subscriptions`);
    }

    console.log(`📊 Results: ${successCount} success, ${failureCount} failures`);

    return new Response(
      JSON.stringify({
        success: true,
        successCount,
        failureCount,
        cleanedUpCount: expiredSubscriptions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
