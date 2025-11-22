import apiRequest from "./client";
import type { ReviewUserToOrgIn, ReviewOrgToUserIn } from "../types/api";

export const reviewsApi = {
  createUserToOrgReview: async (eventId: string, data: ReviewUserToOrgIn): Promise<any> => {
    return apiRequest<any>(`/user/reviews/user-to-org/${eventId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  createOrgToUserReview: async (
    eventId: string,
    userId: string,
    data: ReviewOrgToUserIn
  ): Promise<any> => {
    return apiRequest<any>(`/org/org/${eventId}/rate-user/${userId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};




