import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
interface NotificationDropdownProps {
  userId: string;
  isAdmin: boolean;
}
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
}
const NotificationDropdown = ({ userId }: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    loadNotifications();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔔 New notification received (real-time):", payload.new);
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🗑️ Notification deleted (real-time):", payload.old);
          setNotifications((prev) => prev.filter((n) => n.id !== (payload.old as Notification).id));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("✏️ Notification updated (real-time):", payload.new);
          setNotifications((prev) =>
            prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n)),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        })
        .limit(20);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notificationId);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                is_read: true,
              }
            : n,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
        })),
      );
      setOpen(false);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };
  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Optimistically update UI first
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
      if (error) {
        console.error("Error deleting notification:", error);
        // Revert optimistic update on error
        await loadNotifications();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      // Revert optimistic update on error
      await loadNotifications();
    }
  };
  const handleClearRead = async () => {
    const readIds = notifications.filter((n) => n.is_read).map((n) => n.id);

    // Optimistically update UI
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    try {
      const { error } = await supabase.from("notifications").delete().in("id", readIds);
      if (error) {
        console.error("Error clearing read notifications:", error);
        await loadNotifications();
      }
      setOpen(false);
    } catch (error) {
      console.error("Error clearing read notifications:", error);
      await loadNotifications();
    }
  };
  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    switch (notification.related_type) {
      case "guideline":
        navigate("/guidelines");
        break;
      case "journal":
        navigate("/journal");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        navigate("/dashboard");
    }
    setOpen(false);
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "prayer_reminder":
        return "🕊️";
      case "streak_milestone":
        return "🔥";
      case "journal_reminder":
        return "📝";
      case "achievement":
        return "✨";
      default:
        return "🔔";
    }
  };
  const getTimeAgo = (dateString: string) => {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffInMinutes = Math.floor((now - then) / 60000);
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return new Date(dateString).toLocaleDateString();
  };
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Open notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {notifications.length} total{unreadCount > 0 && ` · ${unreadCount} unread`}
            </p>
          </div>
          <div className="flex gap-2">
            {notifications.filter((n) => n.is_read).length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearRead} className="h-8 text-xs">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear Read
              </Button>
            )}
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-8 text-xs">
                <CheckCheck className="h-3 w-3 mr-1" />
                Read All
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 hover:bg-accent transition-colors relative group ${!notification.is_read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{notification.title}</p>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 min-h-0 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            aria-label="Delete notification"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{getTimeAgo(notification.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default NotificationDropdown;
