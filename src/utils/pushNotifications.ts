import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BNq8LjqQpG3JX_Z7FqJ8VdP_nMh9LXM5K4Cm8TyG0xJ5rH3h6V0Zp7dL8KsG4hJ2vN9yW1Xm5Rq3Tp4HgK7sL9c';

// Convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function checkPushSupport(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return false;
  }

  if (!('PushManager' in window)) {
    console.log('Push notifications not supported');
    return false;
  }

  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  return true;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Helper to wait for service worker with timeout
async function waitForServiceWorker(timeoutMs: number = 10000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((_, reject) => 
      setTimeout(() => reject(new Error('Service worker ready timeout')), timeoutMs)
    )
  ]);
}

// Helper to wrap any promise with a timeout
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    console.log('Starting push subscription...');
    
    // Check support
    const isSupported = await checkPushSupport();
    if (!isSupported) {
      console.log('Push not supported');
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser",
        variant: "destructive",
      });
      return false;
    }

    console.log('Push supported, requesting permission...');
    
    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Permission denied:', permission);
      toast({
        title: "Permission Denied",
        description: "Please allow notifications to enable push alerts",
        variant: "destructive",
      });
      return false;
    }

    console.log('Permission granted, waiting for service worker...');

    // Get service worker registration with timeout
    const registration = await waitForServiceWorker(10000);

    console.log('Service worker ready, subscribing to push...');
    console.log('Using VAPID key:', VAPID_PUBLIC_KEY.substring(0, 20) + '...');
    
    // Subscribe to push with timeout
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await withTimeout(
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      }),
      15000, // 15 second timeout
      'Push subscription timeout - browser push service not responding'
    );

    console.log('Push subscription obtained, saving to database...');

    // Extract subscription details
    const subscriptionJson = subscription.toJSON();
    const endpoint = subscription.endpoint;
    const p256dh = subscriptionJson.keys?.p256dh || '';
    const auth = subscriptionJson.keys?.auth || '';

    // Save subscription to database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint,
        p256dh_key: p256dh,
        auth_key: auth,
        user_agent: navigator.userAgent,
      }, {
        onConflict: 'endpoint',
      });

    if (error) {
      console.error('Failed to save subscription:', error);
      toast({
        title: "Error",
        description: "Failed to save push subscription",
        variant: "destructive",
      });
      return false;
    }

    console.log('Push subscription saved successfully');
    toast({
      title: "Success",
      description: "Push notifications enabled successfully",
    });

    return true;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to enable push notifications";
    if (error instanceof Error) {
      if (error.message.includes('Service worker ready timeout')) {
        errorMessage = "Service worker not ready. Please refresh the page and try again.";
      } else if (error.message.includes('subscription timeout')) {
        errorMessage = "Connection timed out. Please check your internet and try again.";
      } else if (error.message.includes('AbortError')) {
        errorMessage = "Subscription was cancelled. Please try again.";
      } else if (error.message.includes('NotAllowedError')) {
        errorMessage = "Permission denied. Please reset browser permissions and try again.";
      } else if (error.message.includes('InvalidStateError')) {
        errorMessage = "Service worker not ready. Please refresh the page and try again.";
      } else if (error.message.includes('NotSupportedError')) {
        errorMessage = "Push notifications are not supported in your browser.";
      }
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    return false;
  }
}

export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Delete from database
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint);

      if (error) {
        console.error('Failed to delete subscription:', error);
      }
    }

    toast({
      title: "Success",
      description: "Push notifications disabled",
    });

    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    toast({
      title: "Error",
      description: "Failed to disable push notifications",
      variant: "destructive",
    });
    return false;
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

export async function sendTestPushNotification(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        type: 'test',
        title: '🔔 Test Notification',
        message: 'If you see this, push notifications are working!',
        url: '/dashboard',
        userId,
      },
    });

    if (error) {
      throw error;
    }

    toast({
      title: "Test Sent",
      description: "Check your notifications!",
    });

    return true;
  } catch (error) {
    console.error('Error sending test:', error);
    toast({
      title: "Error",
      description: "Failed to send test notification",
      variant: "destructive",
    });
    return false;
  }
}
