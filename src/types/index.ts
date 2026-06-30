export type UserRole = "USER" | "ADMIN" | "MODERATOR";

export type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "OTHER";

export type SubscriptionTier = "FREE" | "PREMIUM" | "PLATINUM";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
