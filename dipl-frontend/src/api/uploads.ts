import apiRequest from "./client";

export const uploadsApi = {
  uploadUserImage: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<any>("/upload/user/me", {
      method: "POST",
      body: formData,
    });
  },

  uploadOrgLogo: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<any>("/upload/org/me", {
      method: "POST",
      body: formData,
    });
  },

  uploadEventImage: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<any>("/upload/event-image", {
      method: "POST",
      body: formData,
    });
  },
};


