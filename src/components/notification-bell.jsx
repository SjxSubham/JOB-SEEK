import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Briefcase,
  User,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import useFetch from "@/hooks/use-fetch";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
} from "@/api/apiNotifications";
import { Link } from "react-router-dom";

const NOTIFICATION_ICONS = {
  application_status: Briefcase,
  new_application: Briefcase,
  job_match: Sparkles,
  profile_view: User,
  job_expiring: Briefcase,
  system: Bell,
};

const NOTIFICATION_COLORS = {
  application_status: "text-blue-400",
  new_application: "text-green-400",
  job_match: "text-purple-400",
  profile_view: "text-pink-400",
  job_expiring: "text-yellow-400",
  system: "text-gray-400",
};

const NotificationBell = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const dropdownRef = useRef(null);

  const { fn: fnGetNotifications, loading: loadingNotifications } =
    useFetch(getNotifications);
  const { fn: fnGetUnreadCount } = useFetch(getUnreadNotificationCount);
  const { fn: fnMarkAsRead } = useFetch(markNotificationAsRead);
  const { fn: fnMarkAllAsRead } = useFetch(markAllNotificationsAsRead);
  const { fn: fnDeleteNotification } = useFetch(deleteNotification);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const result = await fnGetNotifications({ limit: 20 });
      if (result?.notifications) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await fnGetUnreadCount();
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Initial fetch and subscription setup
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchUnreadCount();

      // Set up real-time subscription
      const setupSubscription = async () => {
        try {
          const sub = await subscribeToNotifications(
            null, // Token will be fetched in the function
            user.id,
            (newNotification) => {
              setNotifications((prev) => [newNotification, ...prev]);
              setUnreadCount((prev) => prev + 1);
            },
          );
          setSubscription(sub);
        } catch (error) {
          console.error("Error setting up notification subscription:", error);
        }
      };

      setupSubscription();

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [user?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle marking notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await fnMarkAsRead({ notification_id: notificationId });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle marking all as read
  const handleMarkAllAsRead = async () => {
    try {
      await fnMarkAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          read_at: new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Handle deleting notification
  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await fnDeleteNotification({ notification_id: notificationId });
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (!notification?.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const Icon = NOTIFICATION_ICONS[type] || Bell;
    return Icon;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full transition-all",
          "border border-white/10 bg-slate-900/50 hover:bg-slate-800/70",
          "focus:outline-none focus:ring-2 focus:ring-sky-400/50",
          isOpen && "bg-slate-800/70 ring-2 ring-sky-400/50",
        )}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5 text-slate-300" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-1 text-xs font-bold text-white shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-12 z-50 w-80 sm:w-96",
            "rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl",
            "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]",
            "animate-in fade-in-0 slide-in-from-top-2 duration-200",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-sky-400 transition-colors hover:bg-sky-400/10"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loadingNotifications ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="mb-2 h-10 w-10 text-slate-600" />
                <p className="text-sm text-slate-400">No notifications yet</p>
                <p className="text-xs text-slate-500">
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColor =
                    NOTIFICATION_COLORS[notification.type] || "text-gray-400";

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "group relative flex gap-3 px-4 py-3 transition-colors",
                        !notification.read && "bg-sky-500/5",
                        "hover:bg-white/5 cursor-pointer",
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkAsRead(notification.id);
                        }
                        if (notification.action_url) {
                          setIsOpen(false);
                        }
                      }}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                          "bg-slate-800/50 border border-white/5",
                          iconColor,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {notification.action_url ? (
                          <Link
                            to={notification.action_url}
                            onClick={() => setIsOpen(false)}
                            className="block"
                          >
                            <p
                              className={cn(
                                "text-sm font-medium",
                                notification.read
                                  ? "text-slate-300"
                                  : "text-white",
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                              {notification.message}
                            </p>
                          </Link>
                        ) : (
                          <>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                notification.read
                                  ? "text-slate-300"
                                  : "text-white",
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                              {notification.message}
                            </p>
                          </>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-sky-400"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-sky-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/10 p-2">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full rounded-lg py-2 text-center text-sm text-sky-400 transition-colors hover:bg-sky-400/10"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
