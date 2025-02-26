import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: RequestInit = {}
): Promise<Response> {
  console.log(`Making ${method} request to ${url}`);
  console.log('Request data:', data);
  console.log('Request options:', options);

  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    ...options
  });

  console.log('Response status:', res.status);
  console.log('Response headers:', Object.fromEntries(res.headers.entries()));

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  credentials?: RequestCredentials;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, credentials = "include" }) =>
  async ({ queryKey }) => {
    console.log('Making query request:', queryKey[0]);
    const res = await fetch(queryKey[0] as string, {
      credentials,
    });

    console.log('Query response status:', res.status);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});