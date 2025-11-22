// Generated types from OpenAPI spec

export type Role = "user" | "admin";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type OrgDecision = "accepted" | "rejected";
export type EventCategory = "sports" | "cultural" | "business" | "eco" | "festival" | "concert" | "education" | "charity" | "community" | "other";
export type OrganisationStatus = "pending" | "approved" | "rejected";
export type OrganisationType = "official" | "informal";
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface UserIn {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  title: string;
  location: string;
  age: number;
  about: string;
  skills?: string[];
  experience?: string | null;
}

export interface UserPublic {
  username: string;
  title?: string | null;
  location?: string | null;
  age?: number | null;
  about?: string | null;
  skills: string[];
  experience?: string | null;
  profile_image?: string | null;
}

export interface UserDB {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  title: string;
  location: string;
  age: number;
  about: string;
  skills: string[];
  experience?: string | null;
  _id: string;
  role: Role;
  created_at: string;
  updated_at?: string | null;
  profile_image?: string | null;
}

export interface UserUpdate {
  username?: string | null;
  email?: string | null;
  password?: string | null;
  title?: string | null;
  location?: string | null;
  age?: number | null;
  about?: string | null;
  skills?: string[] | null;
  experience?: string | null;
}

export interface OrganisationIn {
  username: string;
  name: string;
  email: string;
  password: string;
  description: string;
  location: string;
  phone?: string | null;
  website?: string | null;
  org_type?: OrganisationType;
}

export interface OrganisationLogin {
  email: string;
  password: string;
}

export interface OrganisationPublic {
  username: string;
  email: string;
  name: string;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  website?: string | null;
  status?: OrganisationStatus;
  logo?: string | null;
  org_type?: OrganisationType;
  id?: string | null;
  _id?: string | null;
}

export interface OrganisationUpdate {
  username?: string | null;
  name?: string | null;
  email?: string | null;
  password?: string | null;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  website?: string | null;
  org_type?: OrganisationType | null;
}

export interface EventIn {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  category: EventCategory;
  max_volunteers?: number | null;
  image?: string | null;
  tags: string[];
}

export interface EventPublic {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  category: EventCategory;
  max_volunteers?: number | null;
  image?: string | null;
  tags: string[];
  organisation_name?: string | null;
  organisation_username?: string | null;
  organisation_id?: string | null;
  _id?: string | null;
  id?: string | null;
}

export interface EventUpdate {
  title?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  category?: EventCategory | null;
  max_volunteers?: number | null;
  image?: string | null;
  tags?: string[] | null;
}

export interface ApplicationIn {
  event_id: string;
  motivation: string;
  phone: string;
  extra_notes?: string | null;
}

export interface ApplicationPublic {
  id?: string | null;
  _id?: string | null;
  application_id?: string | null;
  event_title: string;
  user_info: Record<string, any>;
  organisation_name: string;
  motivation: string;
  phone: string;
  extra_notes?: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface ApplicationUpdate {
  status?: OrgDecision | null;
  extra_notes?: string | null;
}

export interface ReviewUserToOrgIn {
  rating: ReviewRating;
  comment?: string | null;
}

export interface ReviewOrgToUserIn {
  rating: ReviewRating;
  comment?: string | null;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

