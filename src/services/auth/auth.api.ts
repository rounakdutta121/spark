import type { AuthUser, LoginCredentials, RegisterCredentials } from "@/types/auth";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
  code?: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

async function authFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    const message = !data.success ? data.error : "Request failed";
    throw new Error(message);
  }

  return data.data;
}

export async function apiRegister(
  credentials: RegisterCredentials,
): Promise<AuthUser> {
  const data = await authFetch<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return data.user;
}

export async function apiLogin(
  credentials: LoginCredentials,
): Promise<AuthUser> {
  const data = await authFetch<{ user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return data.user;
}

export async function apiLogout(): Promise<void> {
  await authFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function apiRefresh(): Promise<AuthUser> {
  const data = await authFetch<{ user: AuthUser }>("/api/auth/refresh", {
    method: "POST",
  });
  return data.user;
}

export async function apiGetMe(): Promise<AuthUser> {
  const data = await authFetch<{ user: AuthUser }>("/api/auth/me");
  return data.user;
}

export async function apiForgotPassword(email: string): Promise<void> {
  await authFetch<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<void> {
  await authFetch<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiVerifyEmail(token: string): Promise<AuthUser> {
  const data = await authFetch<{ user: AuthUser }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  return data.user;
}

export async function apiResendVerification(): Promise<void> {
  await authFetch<{ message: string }>("/api/auth/resend-verification", {
    method: "POST",
  });
}
