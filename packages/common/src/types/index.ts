/**
 * Standard API response envelope for all endpoints.
 * Matches ERR-001: structured error responses with user-readable reasons.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

/**
 * Base user interface shared across roles.
 */
export interface UserBase {
  id: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Patient profile.
 */
export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  phone: string;
}

/**
 * Doctor profile (public-facing).
 */
export interface DoctorProfile {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  departments: string[];
  bio?: string;
  consultationFee: number;
  photoUrl?: string;
  isActive: boolean;
}

/**
 * Authentication request/response types.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserBase;
  tokens: AuthTokens;
}
