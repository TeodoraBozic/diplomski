// Base API client with authentication and error handling

// Use proxy in development, direct URL in production
const BASE_URL = import.meta.env.DEV ? "/api" : "http://localhost:8000";

export interface ApiError {
  message: string;
  status?: number;
  detail?: any;
}

async function safeJsonParse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await safeJsonParse<{ detail?: any; message?: string }>(response);
      
      // Ako je detail string, koristi ga kao message
      let errorMessage = errorData.message;
      if (!errorMessage && typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (!errorMessage && Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        // Ako je detail array (FastAPI validation errors), formatiraj prvu grešku
        const firstError = errorData.detail[0];
        if (firstError.msg) {
          errorMessage = firstError.msg;
        }
      }
      
      const error: ApiError = {
        message: errorMessage || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        detail: errorData.detail,
      };
      throw error;
    }

    return await safeJsonParse<T>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw {
        message: "Network error. Please check your connection.",
        status: 0,
      } as ApiError;
    }
    throw error;
  }
}

export default apiRequest;

