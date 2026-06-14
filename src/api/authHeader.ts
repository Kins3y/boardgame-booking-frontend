import type { InternalAxiosRequestConfig } from "axios";

export function authHeader(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const accessToken = localStorage.getItem("access_token");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
}