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

export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    // Check support
    const isSupported = await checkPushSupport();
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser",
        variant: "destructive",
      });
      return false;
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      toast({
        title: "Permission Denied",
        description: "Please allow notifications to enable push alerts",
        variant: "destructive",
      });
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as any,
    });

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

    toast({
      title: "Success",
      description: "Push notifications enabled successfully",
    });

    return true;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    toast({
      title: "Error",
      description: "Failed to enable push notifications",
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
