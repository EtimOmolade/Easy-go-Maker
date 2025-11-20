import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  type: 'reminder' | 'announcement';
  title: string;
  message: string;
  url: string;
  userId?: string; // For reminders, send to specific user. For announcements, send to all
  notificationId?: string;
}

interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Web Push utilities for Deno
async function generateVAPIDHeaders(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subject: string
): Promise<Record<string, string>> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const jwtHeader = { typ: 'JWT', alg: 'ES256' };
  const jwtPayload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  // Import private key
  const privateKeyBuffer = urlBase64ToUint8Array(vapidPrivateKey);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Create JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(jwtHeader)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signatureB64}`;

  return {
    Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendWebPush(
  subscription: WebPushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subject: string
): Promise<Response> {
  const headers = await generateVAPIDHeaders(
    subscription.endpoint,
    vapidPublicKey,
    vapidPrivateKey,
    subject
  );

  headers['Content-Type'] = 'application/octet-stream';
  headers['Content-Encoding'] = 'aes128gcm';
  headers['TTL'] = '86400'; // 24 hours

  // Encrypt payload
  const encoder = new TextEncoder();
  const payloadBuffer = encoder.encode(payload);

  // For simplicity, using unencrypted payload in this implementation
  // In production, implement proper ECDH encryption
  
  return fetch(subscription.endpoint, {
    method: 'POST',
    headers,
    body: payloadBuffer,
  });
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

    // Get VAPID credentials
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('VAPID keys not configured');
    }

    // Fetch subscriptions
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

    // Notification payload
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

    // Send to all subscriptions
    for (const sub of subscriptions) {
      try {
        const webPushSub: WebPushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        };

        const response = await sendWebPush(
          webPushSub,
          notificationPayload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );

        if (response.status === 201 || response.status === 200) {
          console.log(`✅ Sent to subscription ${sub.id}`);
          successCount++;

          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);
        } else if (response.status === 410 || response.status === 404) {
          console.log(`🗑️ Subscription expired: ${sub.id}`);
          expiredSubscriptions.push(sub.id);
          failureCount++;
        } else {
          console.error(`❌ Failed to send to ${sub.id}: ${response.status}`);
          failureCount++;
        }
      } catch (error: any) {
        console.error(`❌ Error sending to ${sub.id}:`, error.message);
        failureCount++;
        
        if (error.message?.includes('410') || error.message?.includes('404')) {
          expiredSubscriptions.push(sub.id);
        }
      }
    }

    // Clean up expired subscriptions
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
