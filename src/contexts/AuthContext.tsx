import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "@/lib/api";

interface User {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: "student" | "tutor";
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
    role?: "student" | "tutor"
  ) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    role?: "student" | "tutor"
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("zenith_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Validate that the user object has the required properties
        if (parsedUser._id && parsedUser.email && parsedUser.name) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("zenith_user");
        }
      } catch (e) {
        localStorage.removeItem("zenith_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    role: "student" | "tutor" = "student"
  ) => {
    try {
      const userData = await authAPI.login({ email, password });

      // Map _id to id for frontend compatibility
      const userWithId = {
        ...userData,
        id: userData._id,
      };

      setUser(userWithId);
      localStorage.setItem("zenith_user", JSON.stringify(userWithId));
    } catch (error) {
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: "student" | "tutor" = "student"
  ) => {
    try {
      const userData = await authAPI.register({ name, email, password, role });

      // Map _id to id for frontend compatibility
      const userWithId = {
        ...userData,
        id: userData._id,
      };

      setUser(userWithId);
      localStorage.setItem("zenith_user", JSON.stringify(userWithId));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("zenith_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
