import type {
  AvailableUser,
  FullGameSession,
  SessionOverviewItem,
  Civilization,
  StartSystemOption,
  BuildingType,
  MapEditorMapSummary,
  MapEditorSavePayload,
  MapEditorSavedMap
} from "../types/game";

const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders(hasJsonBody: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {};

  if (hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("access_token");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

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
  civilizationId: number,
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
      civilization_id: civilizationId,
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

export async function getCivilizations(): Promise<Civilization[]> {
  const response = await fetch(`${API_URL}/game/civilizations/`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function removePlayerFromSession(
  sessionId: number,
  sessionPlayerId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/game/sessions/${sessionId}/players/${sessionPlayerId}`,
    {
      method: "DELETE"
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function deleteCreatedSession(sessionId: number): Promise<void> {
  const response = await fetch(`${API_URL}/game/sessions/${sessionId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function updateGameSessionName(
  sessionId: number,
  name: string
): Promise<GameSessionSummary> {
  const response = await fetch(`${API_URL}/game/sessions/${sessionId}/name`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name
    })
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function buildBuilding(
  sessionId: number,
  sessionPlayerId: number,
  systemId: number,
  buildingType: BuildingType
): Promise<void> {
  const response = await fetch(
    `${API_URL}/game/sessions/${sessionId}/buildings/build`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session_player_id: sessionPlayerId,
        system_id: systemId,
        building_type: buildingType
      })
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function nextRound(
  sessionId: number
): Promise<FullGameSession> {
  const response = await fetch(
    `${API_URL}/game/sessions/${sessionId}/next-round`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = await response.json();

  return data.session;
}

export async function packColonyIntoArk(
  sessionId: number,
  unitId: number
): Promise<FullGameSession> {
  const response = await fetch(
    `${API_URL}/game/sessions/${sessionId}/units/${unitId}/pack-into-ark`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = await response.json();

  return data.session;
}

export async function colonizeSystemWithArk(
  sessionId: number,
  unitId: number
): Promise<FullGameSession> {
  const response = await fetch(
    `${API_URL}/game/sessions/${sessionId}/units/${unitId}/colonize`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = await response.json();

  return data.session;
}

export async function getEditorMaps(): Promise<MapEditorMapSummary[]> {
  const response = await fetch(`${API_URL}/game/maps/editor/`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function createEditorMap(
  payload: MapEditorSavePayload
): Promise<MapEditorSavedMap> {
  const response = await fetch(`${API_URL}/game/maps/editor/`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function getEditorMap(
  mapId: number
): Promise<MapEditorSavedMap> {
  const response = await fetch(`${API_URL}/game/maps/editor/${mapId}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function updateEditorMap(
  mapId: number,
  payload: MapEditorSavePayload
): Promise<MapEditorSavedMap> {
  const response = await fetch(`${API_URL}/game/maps/editor/${mapId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function deleteEditorMap(
  mapId: number
): Promise<void> {
  const response = await fetch(`${API_URL}/game/maps/editor/${mapId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}