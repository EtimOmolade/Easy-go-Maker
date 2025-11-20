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

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
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

    console.log('Sending push notification:', { type, title, userId });

    // Fetch push subscriptions
    let query = supabase
      .from('push_subscriptions')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found');
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions to send to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get VAPID keys from secrets
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('VAPID keys not configured');
    }

    // Build push notification payload
    const notificationPayload = {
      title,
      body: message,
      icon: '/logo-192.png',
      badge: '/logo-192.png',
      tag: type,
      data: {
        url,
        type,
        notificationId,
      },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    let successCount = 0;
    let failureCount = 0;
    const expiredSubscriptions: string[] = [];

    // Import web-push library once
    const webpush = await import('https://deno.land/x/webpush@v0.0.7/mod.ts');

    console.log('VAPID keys loaded:', {
      publicKey: vapidPublicKey.substring(0, 20) + '...',
      privateKey: vapidPrivateKey.substring(0, 10) + '...',
      subject: vapidSubject,
    });

    // Send push notifications
    for (const subscription of subscriptions as PushSubscription[]) {
      try {
        console.log(`Sending to subscription ${subscription.id}:`, {
          endpoint: subscription.endpoint.substring(0, 50) + '...',
          hasP256dh: !!subscription.p256dh_key,
          hasAuth: !!subscription.auth_key,
        });

        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload),
          {
            vapidDetails: {
              subject: vapidSubject,
              publicKey: vapidPublicKey,
              privateKey: vapidPrivateKey,
            },
          }
        );

        console.log(`✅ Successfully sent to ${subscription.id}`);
        successCount++;

        // Update last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', subscription.id);

      } catch (error: any) {
        console.error(`❌ Failed to send to ${subscription.id}:`, {
          message: error.message,
          statusCode: error.statusCode,
          body: error.body,
          headers: error.headers,
          stack: error.stack?.substring(0, 500),
          endpoint: subscription.endpoint.substring(0, 80) + '...',
        });
        failureCount++;

        // Check if subscription is expired (410 Gone or 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          expiredSubscriptions.push(subscription.id);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);

      if (deleteError) {
        console.error('Failed to delete expired subscriptions:', deleteError);
      } else {
        console.log(`Cleaned up ${expiredSubscriptions.length} expired subscriptions`);
      }
    }

    console.log(`Push notification sent: ${successCount} success, ${failureCount} failures`);

    return new Response(
      JSON.stringify({
        success: true,
        successCount,
        failureCount,
        cleanedUpCount: expiredSubscriptions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
