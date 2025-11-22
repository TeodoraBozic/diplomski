import apiRequest from "./client";
import type { EventIn, EventPublic, EventUpdate } from "../types/api";

export const eventsApi = {
  createEvent: async (data: EventIn): Promise<any> => {
    return apiRequest<any>("/org/events/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyEvents: async (): Promise<EventPublic[]> => {
    return apiRequest<EventPublic[]>("/org/events/my");
  },

  updateEvent: async (eventId: string, data: EventUpdate): Promise<any> => {
    return apiRequest<any>(`/org/events/update/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteEvent: async (eventId: string): Promise<any> => {
    return apiRequest<any>(`/org/events/delete/${eventId}`, {
      method: "DELETE",
    });
  },
};




