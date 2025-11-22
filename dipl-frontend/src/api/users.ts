import apiRequest from "./client";
import type { UserDB, UserUpdate } from "../types/api";

export const usersApi = {
  getMe: async (): Promise<UserDB> => {
    return apiRequest<UserDB>("/user/me");
  },

  updateMe: async (data: UserUpdate): Promise<UserDB> => {
    return apiRequest<UserDB>("/user/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteMe: async (): Promise<any> => {
    return apiRequest<any>("/user/me", {
      method: "DELETE",
    });
  },

  getNearbyEvents: async (): Promise<any> => {
    return apiRequest<any>("/user/nearby_events");
  },
};




