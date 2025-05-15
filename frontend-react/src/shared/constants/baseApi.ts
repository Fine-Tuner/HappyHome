import axios from "axios";

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN;
export const API_BASE_URL = `${API_ORIGIN}/api/v1/`;

export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
