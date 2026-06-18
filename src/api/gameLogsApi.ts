import type { GameLogsResponse } from "../types/game";

const API_URL = import.meta.env.VITE_API_URL;

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    return JSON.stringify(data.detail);
  } catch {
    return "Unknown API error";
  }
}

export async function getGameSessionLogs(
  sessionId: number,
  limit: number = 500,
): Promise<GameLogsResponse> {
  const response = await fetch(
    `${API_URL}/game/sessions/${sessionId}/logs?limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}
