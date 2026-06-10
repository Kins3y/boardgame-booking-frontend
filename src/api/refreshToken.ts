import { api } from "./client";

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await api.post("/auth/refresh", {
    refresh_token: refreshToken,
  });

  const newAccessToken = res.data.access_token;

  localStorage.setItem("access_token", newAccessToken);

  return newAccessToken;
}