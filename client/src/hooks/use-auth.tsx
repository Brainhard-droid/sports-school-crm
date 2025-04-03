import { createContext, ReactNode, useContext, useTransition } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      console.log('Fetching user data...');
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.status === 401) {
          console.log('User not authenticated');
          return null;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        console.log('User data received:', userData);
        return userData;
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    },
    retry: false,
    gcTime: 0, // Disable caching
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Attempting login...');
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to login');
      }

      const userData = await res.json();
      console.log('Login successful:', userData);
      return userData;
    },
    onSuccess: (userData: SelectUser) => {
      queryClient.setQueryData(["/api/user"], userData);
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      startTransition(() => {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('Logging out...');
      const res = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to logout');
      }
    },
    onSuccess: () => {
      console.log('Logout successful');
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      startTransition(() => {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive",
        });
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log('Attempting registration...');
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to register");
      }

      const userData = await res.json();
      console.log('Registration successful:', userData);
      return userData;
    },
    onSuccess: (userData: SelectUser) => {
      queryClient.setQueryData(["/api/user"], userData);
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      console.error('Registration error:', error);
      startTransition(() => {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}