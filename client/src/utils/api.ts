import { queryClient } from "@/lib/queryClient";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export async function apiRequest(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<Response> {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response;
}
