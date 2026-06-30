export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function apiClient<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && options?.body instanceof FormData;

  const headers = new Headers(options?.headers);
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    const errorMessage =
      !data.success && "error" in data ? data.error : "Request failed";
    throw new ApiError(response.status, errorMessage);
  }

  if (!data.success) {
    throw new ApiError(response.status, data.error, data.code);
  }

  return data.data;
}
