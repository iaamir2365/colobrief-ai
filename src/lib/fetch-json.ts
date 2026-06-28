export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * fetch() wrapper that validates JSON responses and surfaces readable errors
 * when the server returns HTML (e.g. a Next.js 404 page).
 */
export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T; response: Response }> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError(
      "Unable to connect to the server. Please check your connection and try again.",
      0
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    if (response.status === 404) {
      throw new ApiError(
        "Server API not found. Please refresh the page or restart the app, then try again.",
        404
      );
    }

    throw new ApiError(
      "Unexpected server response. Please refresh the page and try again.",
      response.status
    );
  }

  let data: T;
  try {
    data = (await response.json()) as T;
  } catch {
    throw new ApiError("Invalid server response. Please try again.", response.status);
  }

  return { data, response };
}
