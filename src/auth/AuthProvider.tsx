/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type {
  AuthState,
  LoginCredentials,
  AuthContextType,
} from "../types/auth";
import { authService } from "../services/authService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Verify user on component mount
  useEffect(() => {
    const verifyUser = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
          }));
          return;
        }

        const verifiedUser = await authService.verifyToken();

        if (!verifiedUser) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        setAuthState({
          user: verifiedUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to verify authentication",
        }));
      }
    };

    verifyUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setAuthState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const user = await authService.login(credentials);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
