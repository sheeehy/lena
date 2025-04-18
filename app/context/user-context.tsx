//context/user-context.tsx
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { UserProfile } from "../types/user";

// Default user profile for testing
const DEFAULT_USER: UserProfile = {
  id: "user_1",
  name: "Jack Sheehy",
  email: "jack@example.com",
  birthDate: "2003-01-15", // January 15, 2003
  avatarUrl:
    "https://media.licdn.com/dms/image/v2/D5603AQGBCvgNJwvCwg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1701202936674?e=1748476800&v=beta&t=PHYo-IRm_-0eaFRS1M4KZ1iBtr1gn4G-ToKc6U32B2I",
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
};

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Simulate fetching user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // For now, we'll use the default user after a small delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setUser(DEFAULT_USER);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch user"));
        console.error("Error fetching user:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Update user function
  const updateUser = async (updates: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (user) {
        const updatedUser = {
          ...user,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        setUser(updatedUser);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update user"));
      console.error("Error updating user:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return <UserContext.Provider value={{ user, isLoading, error, updateUser }}>{children}</UserContext.Provider>;
}
