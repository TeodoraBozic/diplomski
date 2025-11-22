import apiRequest from "./client";
import type { UserIn, UserPublic, OrganisationIn, LoginResponse } from "../types/api";

export const authApi = {
  registerUser: async (data: UserIn): Promise<UserPublic> => {
    return apiRequest<UserPublic>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  loginUser: async (username: string, password: string): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("grant_type", "password");

    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
  },

  loginOrg: async (email: string, password: string): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>("/auth/org/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  registerOrg: async (data: OrganisationIn): Promise<any> => {
    return apiRequest<any>("/public/organisations/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};




