import { useEffect, useState } from "react";
import { notificationsApi } from "../../api/notifications";

export function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const notifs = await notificationsApi.getMyNotifications();
      setNotifications(Array.isArray(notifs) ? notifs : []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      loadNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No notifications</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-md p-4 ${
                !notif.read ? "border-l-4 border-blue-600" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold">{notif.title || "Notification"}</h3>
                  <p className="text-gray-700">{notif.message || notif.content || ""}</p>
                  {notif.created_at && (
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
                {!notif.read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id || index.toString())}
                    className="ml-4 text-blue-600 hover:underline text-sm"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




