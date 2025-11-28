import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, BellOff, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  checkPushSupport,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
  sendTestNotification,
} from "@/utils/pushNotifications";

export const PushNotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    checkSupport();
    checkSubscription();
  }, [user]);

  const checkSupport = async () => {
    const supported = await checkPushSupport();
    setIsSupported(supported);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  const checkSubscription = async () => {
    const subscription = await getCurrentSubscription();
    setIsSubscribed(!!subscription);
  };

  const handleToggle = async (enabled: boolean) => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (enabled) {
        await subscribeToPush(user.id);
        setIsSubscribed(true);
        setPermission('granted');
        toast({
          title: "Push Notifications Enabled",
          description: "You'll receive prayer reminders and community updates.",
        });
      } else {
        await unsubscribeFromPush(user.id);
        setIsSubscribed(false);
        toast({
          title: "Push Notifications Disabled",
          description: "You won't receive push notifications anymore.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await sendTestNotification(user.id);
      toast({
        title: "Test Sent",
        description: "Check for the notification!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive prayer reminders and community updates even when the app is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'denied' && (
          <Alert>
            <X className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. Please enable them in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        {permission === 'granted' && isSubscribed && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Push notifications are active. You'll receive reminders and updates.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">Enable Push Notifications</div>
            <div className="text-sm text-muted-foreground">
              Get notified about prayer times and community updates
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || permission === 'denied'}
          />
        </div>

        {isSubscribed && (
          <Button
            onClick={handleTestNotification}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            Send Test Notification
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
