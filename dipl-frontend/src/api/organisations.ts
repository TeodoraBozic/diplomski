import apiRequest from "./client";
import type { OrganisationPublic, OrganisationUpdate } from "../types/api";

export const organisationsApi = {
  getMe: async (): Promise<OrganisationPublic> => {
    return apiRequest<OrganisationPublic>("/org/me");
  },

  updateMe: async (data: OrganisationUpdate): Promise<any> => {
    return apiRequest<any>("/org/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  getHistory: async (): Promise<any> => {
    return apiRequest<any>("/org/history");
  },
};




