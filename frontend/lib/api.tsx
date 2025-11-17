import axios from "axios";

const ROLES = {
  STUDENT: "STUDENT",
  INSTRUCTOR: "INSTRUCTOR",
} as const;

export type RegisterData = {
  email: string;
  password: string;
  name: string;
  role: keyof typeof ROLES;
};

export type LoginData = {
  email: string;
  password: string;
};

const apiClient = axios.create({
  baseURL: "http://localhost:5001",
  withCredentials: true,
});

export const registerApi = async (data: RegisterData) => {
  return apiClient.post("/auth/register", data);
};

export const loginApi = async (data: LoginData) => {
  return apiClient.post("/auth/login", data);
};

export const getMeApi = async () => {
  return apiClient.get("/me");
};

export const logoutApi = async () => {
  return apiClient.post("/logout");
};

export const User = {
  STUDENT: "STUDENT",
  INSTRUCTOR: "INSTRUCTOR",
} as const;
