import axios from "axios";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR";
}

const apiClient = axios.create({
  baseURL: "http://localhost:5001/api",
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const loginApi = (data: LoginData) =>
  apiClient.post("/auth/login", data);
export const logoutApi = () => apiClient.post("/auth/logout");
export const getMeApi = () => apiClient.get("/auth/me");
export const registerApi = (data: RegisterData) =>
  apiClient.post("/auth/register", data);

export const fetchMyCoursesApi = () => apiClient.get("/courses/my");
export const createCourseApi = (data: any) => apiClient.post("/courses", data);
export const updateCourseApi = (id: string, data: any) =>
  apiClient.patch(`/courses/${id}`, data);
export const deleteCourseApi = (id: string) =>
  apiClient.delete(`/courses/${id}`);

export const fetchLessonsApi = (courseId: string) =>
  apiClient.get(`/lessons/${courseId}`);
export const createLessonApi = (data: any) => apiClient.post("/lessons", data);
export const updateLessonApi = (id: string, data: any) =>
  apiClient.patch(`/lessons/${id}`, data);
export const deleteLessonApi = (id: string) =>
  apiClient.delete(`/lessons/${id}`);
