import axios from "axios";
import { User, Document, ChatMessage, ExtractedData, DocumentInsights, Comparison, ExtractedItem } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for HTTPOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle authorization errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, clear local storage and redirect to landing if not on landing page
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (data: any): Promise<User> => {
    const res = await api.post<User>("/auth/register", data);
    if (res.data && (res.data as any).access_token) {
      localStorage.setItem("access_token", (res.data as any).access_token);
    }
    return res.data;
  },
  login: async (data: any): Promise<User> => {
    const res = await api.post<User>("/auth/login", data);
    if (res.data && (res.data as any).access_token) {
      localStorage.setItem("access_token", (res.data as any).access_token);
    }
    return res.data;
  },
  logout: async (): Promise<any> => {
    const res = await api.post("/auth/logout");
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
    return res.data;
  },
  googleLogin: async (data: { email: string; full_name: string; uid: string }): Promise<User> => {
    const res = await api.post<User>("/auth/google", data);
    if (res.data && (res.data as any).access_token) {
      localStorage.setItem("access_token", (res.data as any).access_token);
    }
    return res.data;
  },
  me: async (): Promise<User> => {
    const res = await api.get<User>("/auth/me");
    return res.data;
  },
};

export const documentsAPI = {
  upload: async (file: File, onUploadProgress?: (progressEvent: any) => void): Promise<Document> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<Document>("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    return res.data;
  },
  list: async (): Promise<Document[]> => {
    const res = await api.get<Document[]>("/documents");
    return res.data;
  },
  get: async (id: string): Promise<Document> => {
    const res = await api.get<Document>(`/documents/${id}`);
    return res.data;
  },
  delete: async (id: string): Promise<any> => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
  getDownloadUrl: async (id: string): Promise<string> => {
    const res = await api.get<{ download_url: string }>(`/documents/${id}/download`);
    return res.data.download_url;
  },
  getUsageStats: async (): Promise<any> => {
    const res = await api.get<any>("/documents/usage/stats");
    return res.data;
  },
};

export const analyzeAPI = {
  getSummary: async (id: string, type: "quick" | "standard" | "detailed" = "standard"): Promise<any> => {
    const res = await api.get(`/analyze/${id}/summary`, { params: { type } });
    return res.data;
  },
  getExtractedData: async (id: string): Promise<ExtractedData> => {
    const res = await api.get<ExtractedData>(`/analyze/${id}/extracted-data`);
    return res.data;
  },
  getExtractedDataCsvUrl: (id: string): string => {
    return `${API_URL}/analyze/${id}/extracted-data/csv`;
  },
  getInsights: async (id: string): Promise<DocumentInsights> => {
    const res = await api.get<DocumentInsights>(`/analyze/${id}/insights`);
    return res.data;
  },
  executeSmartAction: async (id: string, actionType: string, language?: string): Promise<string> => {
    const res = await api.post<{ content: string }>(`/analyze/${id}/smart-action`, {
      action_type: actionType,
      language: language || "English",
    });
    return res.data.content;
  },
};

export const chatAPI = {
  getHistory: async (id: string): Promise<ChatMessage[]> => {
    const res = await api.get<ChatMessage[]>(`/chat/${id}/history`);
    return res.data;
  },
  sendMessage: async (id: string, content: string): Promise<{ response: string; source_chunks: any[] }> => {
    const res = await api.post<{ response: string; source_chunks: any[] }>(`/chat/${id}`, { content });
    return res.data;
  },
  clearHistory: async (id: string): Promise<any> => {
    const res = await api.delete(`/chat/${id}/history`);
    return res.data;
  },
  getSuggestedQuestions: async (id: string): Promise<string[]> => {
    const res = await api.get<{ questions: string[] }>(`/chat/${id}/suggested-questions`);
    return res.data.questions;
  },
};

export const compareAPI = {
  compare: async (documentIds: string[]): Promise<Comparison> => {
    const res = await api.post<Comparison>("/compare", { document_ids: documentIds });
    return res.data;
  },
  getReportUrl: (comparisonId: string): string => {
    return `${API_URL}/compare/${comparisonId}/report`;
  },
};

export default api;
