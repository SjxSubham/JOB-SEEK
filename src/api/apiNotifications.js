import supabaseClient from "@/utils/supabase";

/**
 * Get all notifications for the current user
 * @param {string} token - Supabase auth token
 * @param {object} options - Query options
 * @param {number} options.limit - Number of notifications to fetch
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} options.unreadOnly - Only fetch unread notifications
 * @returns {Promise<object>} Notifications data with count
 */
export async function getNotifications(
  token,
  { limit = 20, offset = 0, unreadOnly = false } = {}
) {
  const supabase = await supabaseClient(token);

  let query = supabase
    .from("notifications")
    .select("*, job:jobs(title, company:companies(name, logo_url))", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }

  return { notifications: data, total: count };
}

/**
 * Get unread notification count for the current user
 * @param {string} token - Supabase auth token
 * @returns {Promise<number>} Unread count
 */
export async function getUnreadNotificationCount(token) {
  const supabase = await supabaseClient(token);

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("read", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a notification as read
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.notification_id - Notification ID
 * @returns {Promise<object>} Updated notification
 */
export async function markNotificationAsRead(token, { notification_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notification_id)
    .select()
    .single();

  if (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }

  return data;
}

/**
 * Mark all notifications as read for the current user
 * @param {string} token - Supabase auth token
 * @returns {Promise<number>} Number of notifications marked as read
 */
export async function markAllNotificationsAsRead(token) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("read", false)
    .select();

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Failed to mark all notifications as read");
  }

  return data?.length || 0;
}

/**
 * Delete a notification
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.notification_id - Notification ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteNotification(token, { notification_id }) {
  const supabase = await supabaseClient(token);

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notification_id);

  if (error) {
    console.error("Error deleting notification:", error);
    throw new Error("Failed to delete notification");
  }

  return true;
}

/**
 * Delete all read notifications
 * @param {string} token - Supabase auth token
 * @returns {Promise<number>} Number of notifications deleted
 */
export async function deleteReadNotifications(token) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("read", true)
    .select();

  if (error) {
    console.error("Error deleting read notifications:", error);
    throw new Error("Failed to delete read notifications");
  }

  return data?.length || 0;
}

/**
 * Create a notification (typically called from server/trigger, but available for client)
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter (for consistency with useFetch hook)
 * @param {object} notificationData - Notification data
 * @returns {Promise<object>} Created notification
 */
export async function createNotification(token, _, notificationData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("notifications")
    .insert([notificationData])
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }

  return data;
}

/**
 * Subscribe to real-time notifications
 * @param {string} token - Supabase auth token
 * @param {string} userId - User ID to subscribe for
 * @param {function} onNotification - Callback when new notification arrives
 * @returns {Promise<object>} Subscription object with unsubscribe method
 */
export async function subscribeToNotifications(token, userId, onNotification) {
  const supabase = await supabaseClient(token);

  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("New notification received:", payload);
        onNotification(payload.new);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    },
  };
}

/**
 * Get notifications grouped by date
 * @param {string} token - Supabase auth token
 * @param {object} options - Query options
 * @returns {Promise<object>} Notifications grouped by date
 */
export async function getNotificationsGroupedByDate(
  token,
  { limit = 50 } = {}
) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("notifications")
    .select("*, job:jobs(title, company:companies(name, logo_url))")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }

  // Group by date
  const grouped = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  data.forEach((notification) => {
    const date = new Date(notification.created_at).toDateString();
    let key;

    if (date === today) {
      key = "Today";
    } else if (date === yesterday) {
      key = "Yesterday";
    } else {
      key = new Date(notification.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(notification);
  });

  return grouped;
}
