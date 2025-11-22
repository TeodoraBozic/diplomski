import apiRequest from "./client";
import type { ApplicationIn, ApplicationPublic, ApplicationUpdate, OrgDecision } from "../types/api";

export const applicationsApi = {
  apply: async (data: ApplicationIn): Promise<any> => {
    return apiRequest<any>("/user/apply", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyApplications: async (): Promise<ApplicationPublic[]> => {
    return apiRequest<ApplicationPublic[]>("/user/mojaapliciranja");
  },

  cancelApplication: async (applicationId: string): Promise<any> => {
    return apiRequest<any>(`/user/applications/${applicationId}/cancel`, {
      method: "PATCH",
    });
  },

  getAllApplicationsForOrg: async (): Promise<ApplicationPublic[]> => {
    return apiRequest<ApplicationPublic[]>("/org/GetAllAppl/all");
  },

  getEventApplications: async (eventId: string): Promise<ApplicationPublic[]> => {
    return apiRequest<ApplicationPublic[]>(`/org/event/${eventId}`);
  },

  updateApplicationStatus: async (
    applicationId: string,
    status: OrgDecision,
    data?: ApplicationUpdate
  ): Promise<any> => {
    return apiRequest<any>(`/org/applications/${applicationId}/status/${status}`, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  },
};


