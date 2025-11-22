import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import type { WebSocketMessage } from "./useWebSocket";
import { useAuth } from "../auth/useAuth";
import { notificationsApi } from "../api/notifications";
import { applicationsApi } from "../api/applications";
import { showToast } from "../components/Toast";
import type { ApplicationPublic } from "../types/api";

export function useNotifications() {
  const { isAuthenticated, role } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingApplications, setPendingApplications] = useState<ApplicationPublic[]>([]);
  const [hasNewApplication, setHasNewApplication] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await notificationsApi.getUnreadCount();
      setUnreadCount(result?.count || 0);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  }, []);

  const loadPendingApplications = useCallback(async () => {
    try {
      const allApplications = await applicationsApi.getAllApplicationsForOrg();
      console.log("All applications loaded:", allApplications);
      console.log("Applications count:", allApplications?.length || 0);
      
      const pending = allApplications.filter(app => app.status === "pending");
      console.log("Pending applications:", pending);
      console.log("Pending count:", pending.length);
      
      setPendingApplications(pending || []);
    } catch (error) {
      console.error("Failed to load pending applications:", error);
      setPendingApplications([]);
    }
  }, []);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log("WebSocket message received:", message);

    if (message.type === "new_application" || message.type === "application_created") {
      // New application notification
      setHasNewApplication(true);
      loadUnreadCount();
      loadPendingApplications();
      
      if (message.data) {
        showToast(
          `🔔 Nova prijava na događaj: ${message.data.event_title || message.data.title || "Nepoznat događaj"}`,
          "info"
        );
      } else if (message.message) {
        showToast(message.message, "info");
      }
    } else if (message.type === "application_status_changed" || message.type === "application_updated") {
      // Application status changed
      loadUnreadCount();
      loadPendingApplications();
      
      if (message.data) {
        const status = message.data.status;
        const statusText = status === "accepted" ? "prihvaćena" : status === "rejected" ? "odbijena" : status;
        showToast(`Status prijave je promenjen: ${statusText}`, "info");
      }
    } else if (message.type === "notification") {
      // General notification
      loadUnreadCount();
      if (message.message) {
        showToast(message.message, "info");
      }
    }
  }, [loadUnreadCount, loadPendingApplications]);

  // Connect to WebSocket only if authenticated and is organisation
  const { isConnected } = useWebSocket(
    "/ws/notifications",
    handleWebSocketMessage,
    isAuthenticated && role === "organisation"
  );

  useEffect(() => {
    if (isAuthenticated && role === "organisation") {
      loadUnreadCount();
      loadPendingApplications();
      
      // Fallback: Poll for updates every 30 seconds if WebSocket is not connected
      const pollInterval = setInterval(() => {
        if (!isConnected) {
          loadUnreadCount();
          loadPendingApplications();
        }
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(pollInterval);
    }
  }, [isAuthenticated, role, isConnected, loadUnreadCount, loadPendingApplications]);

  return {
    unreadCount,
    pendingApplications,
    hasNewApplication,
    setHasNewApplication,
    isConnected,
    refreshNotifications: loadUnreadCount,
    refreshApplications: loadPendingApplications,
  };
}

