import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiRequest as baseApiRequest } from "./api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * @deprecated Используйте импорт из @/lib/api вместо этого модуля
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: RequestInit = {}
): Promise<Response> {
  // Направляем вызов на новую реализацию
  return baseApiRequest(
    method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    url,
    data,
    options
  );
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  credentials?: RequestCredentials;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, credentials = "include" }) =>
  async ({ queryKey }) => {
    const options = {
      credentials: 'include' as const,
      headers: {
        'Content-Type': 'application/json'
      }
    };
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