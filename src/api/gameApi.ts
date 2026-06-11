import type {
  AvailableUser,
  FullGameSession,
  SessionOverviewItem,
  StartSystemOption
} from "../types/game";

const API_URL = import.meta.env.VITE_API_URL;

export type GameSessionSummary = {
  id: number;
  map_id: number;
  name: string;
  status: string;
  current_round: number;
};

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

export async function createGameSession(
  mapId: number,
  name: string
): Promise<GameSessionSummary> {
  const response = await fetch(`${API_URL}/game/sessions/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      map_id: mapId,
      name
    })
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function getFullSession(
  sessionId: number
): Promise<FullGameSession> {
  const response = await fetch(`${API_URL}/game/sessions/${sessionId}/full`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function getAvailableUsers(
  sessionId: number
): Promise<AvailableUser[]> {
  const response = await fetch(
    `${API_URL}/game/sessions/${sessionId}/available-users`
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = await response.json();

  return data.users;
}

export async function addPlayerToSession(
  sessionId: number,
  userId: number,
  factionName: string,
  startSystemId: number
): Promise<void> {
  const response = await fetch(`${API_URL}/game/sessions/${sessionId}/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: userId,
      faction_name: factionName,
      start_system_id: startSystemId
    })
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function startGameSession(sessionId: number): Promise<void> {
  const response = await fetch(`${API_URL}/game/sessions/${sessionId}/start`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function getSessionsOverview(): Promise<SessionOverviewItem[]> {
  const response = await fetch(`${API_URL}/game/sessions/overview`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function finishGameSession(sessionId: number): Promise<void> {
  const response = await fetch(`${API_URL}/game/sessions/${sessionId}/finish`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function getSessionStartSystems(
  sessionId: number
): Promise<StartSystemOption[]> {
  const response = await fetch(
    `${API_URL}/game/sessions/${sessionId}/start-systems`
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}