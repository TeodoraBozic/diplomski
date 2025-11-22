import apiRequest from "./client";

export const notificationsApi = {
  getMyNotifications: async (): Promise<any> => {
    return apiRequest<any>("/notifications/me");
  },

  markAsRead: async (notificationId: string): Promise<any> => {
    return apiRequest<any>(`/notifications/read/${notificationId}`, {
      method: "PATCH",
    });
  },

  markAllRead: async (): Promise<any> => {
    return apiRequest<any>("/notifications/read-all", {
      method: "PATCH",
    });
  },

  getUnreadCount: async (): Promise<any> => {
    return apiRequest<any>("/notifications/count");
  },
};




