"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Student } from "@/lib/types";

interface AuthContextType {
  student: Student | null;
  isLoading: boolean;
  login: (rollNumber: string) => Promise<{ success: boolean; error?: string }>;
  enroll: (
    data: Omit<Student, "createdAt" | "rollNumber">
  ) => Promise<{
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string>;
    rollNumber?: string;
  }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "ats_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        setStudent(JSON.parse(stored));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (rollNumber: string) => {
    const res = await fetch("/api/students/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    setStudent(data.student);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.student));
    return { success: true };
  }, []);

  const enroll = useCallback(async (data: Omit<Student, "createdAt" | "rollNumber">) => {
    const res = await fetch("/api/students/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok)
      return {
        success: false,
        error: result.error,
        fieldErrors: result.fieldErrors,
      };
    setStudent(result.student);
    localStorage.setItem(SESSION_KEY, JSON.stringify(result.student));
    return { success: true, rollNumber: result.student.rollNumber as string };
  }, []);

  const logout = useCallback(() => {
    setStudent(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ student, isLoading, login, enroll, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
