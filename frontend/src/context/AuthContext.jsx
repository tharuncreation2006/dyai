
import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check whether a valid login already exists
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login
  const login = async (email, password) => {
    const formData = new URLSearchParams();

    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    localStorage.setItem(
      "access_token",
      response.data.access_token
    );

    const userResponse = await api.get("/auth/me");
    setUser(userResponse.data);

    return userResponse.data;
  };

  // Register
  const register = async (name, email, password) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password
    });

    return response.data;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom authentication hook
export function useAuth() {
  return useContext(AuthContext);
}
