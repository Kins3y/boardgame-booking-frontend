import type { FullGameSession, Technology } from "../types/game";

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

export type SessionTechnologiesResponse = {
  session_id: number;
  catalog: Technology[];
  players: {
    session_player_id: number;
    technologies: Technology[];
    dominance_points: number;
  }[];
};

export async function getSessionTechnologies(
  sessionId: number,
): Promise<SessionTechnologiesResponse> {
  const response = await fetch(`${API_URL}/game/sessions/${sessionId}/technologies`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function researchTechnology(
  sessionId: number,
  technologyKey: string,
): Promise<FullGameSession> {
  const response = await fetch(
    `${API_URL}/game/sessions/${sessionId}/technologies/research`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        technology_key: technologyKey,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = await response.json();

  return data.session;
}
