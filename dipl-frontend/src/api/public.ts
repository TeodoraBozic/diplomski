import apiRequest from "./client";
import type { UserPublic, OrganisationPublic, EventPublic } from "../types/api";

export const publicApi = {
  // Users
  getUsers: async (): Promise<UserPublic[]> => {
    return apiRequest<UserPublic[]>("/public/users/");
  },

  getUserById: async (userId: string): Promise<UserPublic> => {
    return apiRequest<UserPublic>(`/public/users/${userId}`);
  },

  getUserByUsername: async (username: string): Promise<UserPublic> => {
    return apiRequest<UserPublic>(`/public/users/pronadjipouseru/${username}`);
  },

  getReviewsGivenByOrg: async (orgId: string): Promise<any> => {
    return apiRequest<any>(`/public/users/org/${orgId}/given`);
  },

  getReviewsForUser: async (userId: string): Promise<any> => {
    return apiRequest<any>(`/public/users/user/${userId}/reviews`);
  },

  getUserAvgRating: async (userId: string): Promise<any> => {
    return apiRequest<any>(`/public/users/user/${userId}/avg-rating`);
  },

  // Organisations
  getAllOrganisations: async (): Promise<OrganisationPublic[]> => {
    return apiRequest<OrganisationPublic[]>("/public/organisations/");
  },

  getOrganisations: async (): Promise<OrganisationPublic[]> => {
    return apiRequest<OrganisationPublic[]>("/public/organisations/");
  },

  getOrganisationById: async (orgId: string): Promise<OrganisationPublic> => {
    return apiRequest<OrganisationPublic>(`/public/organisations/${orgId}`);
  },

  getOrganisationByUsername: async (username: string): Promise<OrganisationPublic[]> => {
    return apiRequest<OrganisationPublic[]>(`/public/organisations/by-username/${username}`);
  },

  getOrganisationByEvent: async (eventId: string): Promise<OrganisationPublic> => {
    return apiRequest<OrganisationPublic>(`/public/events/organisation/${eventId}`);
  }, 

  getOrgStats: async (organisationId: string): Promise<any> => {
    return apiRequest<any>(`/public/organisationsstatiiiiistika/${organisationId}/stats`);
  },

  getReviewsReceivedByOrg: async (orgId: string): Promise<any> => {
    return apiRequest<any>(`/public/organisations/org/${orgId}/received`);
  },

  getReviewsForOrg: async (orgId: string): Promise<any> => {
    return apiRequest<any>(`/public/organisations/org/${orgId}/reviews`);
  },

  getOrgAvgRating: async (orgId: string): Promise<any> => {
    return apiRequest<any>(`/public/organisations/org/${orgId}/avg-rating`);
  },

  // Events
  getAllEvents: async (): Promise<EventPublic[]> => {
    return apiRequest<EventPublic[]>("/public/events/all");
  },

  getEventById: async (eventId: string): Promise<EventPublic> => {
    return apiRequest<EventPublic>(`/public/events/${eventId}`);
  },

  getEventByTitle: async (title: string): Promise<EventPublic> => {
    return apiRequest<EventPublic>(`/public/events/by-title/${title}`);
  },

  filterEvents: async (params: {
    category?: string | null;
    tags?: string[] | null;
    location?: string | null;
    date_from?: string | null;
    date_to?: string | null;
  }): Promise<EventPublic[]> => {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append("category", params.category);
    if (params.tags) params.tags.forEach(tag => queryParams.append("tags", tag));
    if (params.location) queryParams.append("location", params.location);
    if (params.date_from) queryParams.append("date_from", params.date_from);
    if (params.date_to) queryParams.append("date_to", params.date_to);

    const query = queryParams.toString();
    return apiRequest<EventPublic[]>(`/public/events/filter${query ? `?${query}` : ""}`);
  },

  getEventsByOrg: async (username: string): Promise<EventPublic[]> => {
    return apiRequest<EventPublic[]>(`/public/events/by-org/${username}`);
  },

  getEventsByLocation: async (city: string): Promise<EventPublic[]> => {
    return apiRequest<EventPublic[]>(`/public/events/location/${city}`);
  },

  getEventsThisMonth: async (): Promise<EventPublic[]> => {
    return apiRequest<EventPublic[]>("/public/events/this-month");
  },

  getEventsThisWeek: async (): Promise<EventPublic[]> => {
    return apiRequest<EventPublic[]>("/public/events/this-week");
  },

  getUpcomingEvents: async (): Promise<EventPublic[]> => {
    return apiRequest<EventPublic[]>("/public/events/upcoming");
  },

  getOrgHistory: async (organisationId: string): Promise<EventPublic[]> => {
    return apiRequest<EventPublic[]>(`/public/events/organisation/${organisationId}/history`);
  },

  getCategories: async (): Promise<any> => {
    return apiRequest<any>("/public/events/categories");
  },
};

