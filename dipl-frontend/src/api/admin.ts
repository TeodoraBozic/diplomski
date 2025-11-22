import apiRequest from "./client";
import type { OrganisationPublic, UserPublic } from "../types/api";

export const adminApi = {
  getPendingOrgs: async (): Promise<OrganisationPublic[]> => {
    return apiRequest<OrganisationPublic[]>("/admin/pending");
  },

  approveOrg: async (orgId: string): Promise<any> => {
    return apiRequest<any>(`/admin/${orgId}/approve`, {
      method: "PATCH",
    });
  },

  rejectOrg: async (orgId: string): Promise<any> => {
    return apiRequest<any>(`/admin/${orgId}/reject`, {
      method: "PATCH",
    });
  },

  getAllUsers: async (): Promise<UserPublic[]> => {
    return apiRequest<UserPublic[]>("/admin/users");
  },
};




