import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createGameSession,
  getEditorMap,
  getEditorMaps
} from "../api/gameApi";
import type {
  MapEditorMapSummary,
  MapEditorSavedMap,
  MapEditorSavedSystem
} from "../types/game";
import "./CreateSession.css";

function getSystemIcon(system: MapEditorSavedSystem): string {
  if (system.system_type === "start") {
    return "🏠";
  }

  if (system.system_type === "archive") {
    return `📚${system.archive_level ?? 1}`;
  }

  return "⭐";
}

function getSystemPreviewPosition(
  system: MapEditorSavedSystem,
  map: MapEditorSavedMap
): { left: string; top: string } {
  const safeGridWidth = Math.max(1, map.grid_width);
  const safeGridHeight = Math.max(1, map.grid_height);

  const left = ((system.x + 0.5) / safeGridWidth) * 100;
  const top = ((system.y + 0.5) / safeGridHeight) * 100;

  return {
    left: `${left}%`,
    top: `${top}%`
  };
}

function getSystemPreviewPoint(
  system: MapEditorSavedSystem,
  map: MapEditorSavedMap
): { x: number; y: number } {
  const safeGridWidth = Math.max(1, map.grid_width);
  const safeGridHeight = Math.max(1, map.grid_height);

  return {
    x: ((system.x + 0.5) / safeGridWidth) * 100,
    y: ((system.y + 0.5) / safeGridHeight) * 100
  };
}

function MapPreview({ map }: { map: MapEditorSavedMap }) {
  const systemById = useMemo(() => {
    return new Map(
      map.systems.map((system) => [system.id, system])
    );
  }, [map.systems]);

  if (map.systems.length === 0) {
    return (
      <div className="map-preview-empty">
        This map has no systems.
      </div>
    );
  }

  return (
    <div className="map-preview-card">
      <div className="map-preview-header">
        <div>
          <h2>{map.name}</h2>
          <p>
            {map.players_count} players · {map.systems.length} systems ·{" "}
            {map.connections.length} corridors
          </p>
        </div>
      </div>

      <div className="map-preview-board">
        <svg
          className="map-preview-connections"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {map.connections.map((connection) => {
            const fromSystem = systemById.get(connection.from_system_id);
            const toSystem = systemById.get(connection.to_system_id);

            if (!fromSystem || !toSystem) {
              return null;
            }

            const fromPoint = getSystemPreviewPoint(fromSystem, map);
            const toPoint = getSystemPreviewPoint(toSystem, map);

            return (
              <line
                key={connection.id}
                x1={fromPoint.x}
                y1={fromPoint.y}
                x2={toPoint.x}
                y2={toPoint.y}
                className={[
                  "map-preview-connection",
                  connection.is_dangerous ? "dangerous" : "safe",
                  connection.is_wraparound ? "wraparound" : ""
                ].join(" ")}
              />
            );
          })}
        </svg>

        {map.systems.map((system) => {
          const position = getSystemPreviewPosition(system, map);

          return (
            <div
              key={system.id}
              className={[
                "map-preview-system",
                system.system_type
              ].join(" ")}
              style={{
                left: position.left,
                top: position.top
              }}
              title={`${system.name} (${system.system_type})`}
            >
              <span className="map-preview-system-icon">
                {getSystemIcon(system)}
              </span>

              <span className="map-preview-system-name">
                {system.name}
              </span>
            </div>
          );
        })}
      </div>

      <div className="map-preview-legend">
        <span>🏠 Start</span>
        <span>⭐ Normal</span>
        <span>📚 Archive</span>
        <span className="legend-safe">Safe corridor</span>
        <span className="legend-dangerous">Dangerous corridor</span>
      </div>
    </div>
  );
}

export default function CreateSession() {
  const navigate = useNavigate();

  const [sessionName, setSessionName] = useState<string>("Untitled session");
  const [maps, setMaps] = useState<MapEditorMapSummary[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [selectedMapDetails, setSelectedMapDetails] =
    useState<MapEditorSavedMap | null>(null);

  const [isLoadingMaps, setIsLoadingMaps] = useState<boolean>(false);
  const [isLoadingMapDetails, setIsLoadingMapDetails] =
    useState<boolean>(false);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const selectedMap = useMemo(() => {
    if (selectedMapId === null) {
      return null;
    }

    return maps.find((map) => map.id === selectedMapId) ?? null;
  }, [maps, selectedMapId]);

  async function loadMaps() {
    try {
      setIsLoadingMaps(true);
      setError("");

      const loadedMaps = await getEditorMaps();
      const activeMaps = loadedMaps.filter((map) => map.is_active);

      setMaps(activeMaps);

      if (activeMaps.length > 0) {
        setSelectedMapId(activeMaps[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load maps");
    } finally {
      setIsLoadingMaps(false);
    }
  }

  async function loadSelectedMapDetails(mapId: number) {
    try {
      setIsLoadingMapDetails(true);
      setError("");

      const loadedMap = await getEditorMap(mapId);

      setSelectedMapDetails(loadedMap);
    } catch (err) {
      setSelectedMapDetails(null);
      setError(
        err instanceof Error ? err.message : "Failed to load selected map"
      );
    } finally {
      setIsLoadingMapDetails(false);
    }
  }

  async function handleCreateSession() {
    if (selectedMapId === null) {
      setError("Select map");
      return;
    }

    if (!sessionName.trim()) {
      setError("Session name is required");
      return;
    }

    try {
      setIsCreatingSession(true);
      setError("");

      const newSession = await createGameSession(
        selectedMapId,
        sessionName.trim()
      );

      navigate(`/game/sessions/${newSession.id}/setup`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create session"
      );
    } finally {
      setIsCreatingSession(false);
    }
  }

  useEffect(() => {
    loadMaps();
  }, []);

  useEffect(() => {
    if (selectedMapId === null) {
      setSelectedMapDetails(null);
      return;
    }

    loadSelectedMapDetails(selectedMapId);
  }, [selectedMapId]);

  return (
    <div className="create-session-page">
      <header className="create-session-header">
        <div>
          <h1>Create Session</h1>
          <p>Select a prepared map and create a new game session.</p>
        </div>

        <Link to="/map-editor">
          <button>Create new map</button>
        </Link>
      </header>

      {error && <div className="create-session-error">{error}</div>}

      <section className="create-session-layout">
        <div className="create-session-panel">
          <label>
            Session name
            <input
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
            />
          </label>

          <label>
            Map
            <select
              value={selectedMapId ?? ""}
              onChange={(event) =>
                setSelectedMapId(Number(event.target.value))
              }
              disabled={isLoadingMaps || maps.length === 0}
            >
              {maps.length === 0 && (
                <option value="">
                  {isLoadingMaps ? "Loading maps..." : "No maps available"}
                </option>
              )}

              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name} — {map.players_count} players
                </option>
              ))}
            </select>
          </label>

          {selectedMap && (
            <div className="selected-map-card">
              <h2>{selectedMap.name}</h2>

              <div className="selected-map-meta">
                <span>Players: {selectedMap.players_count}</span>
                <span>Map ID: {selectedMap.id}</span>
              </div>
            </div>
          )}

          {maps.length === 0 && !isLoadingMaps && (
            <div className="create-session-empty-state">
              <p>No prepared maps found.</p>

              <Link to="/map-editor">
                <button>Create your first map</button>
              </Link>
            </div>
          )}

          <button
            className="create-session-submit"
            onClick={handleCreateSession}
            disabled={
              isCreatingSession ||
              isLoadingMaps ||
              selectedMapId === null ||
              maps.length === 0
            }
          >
            {isCreatingSession ? "Creating..." : "Create session"}
          </button>
        </div>

        <aside className="create-session-preview-panel">
          {isLoadingMapDetails && (
            <div className="map-preview-empty">
              Loading map preview...
            </div>
          )}

          {!isLoadingMapDetails && selectedMapDetails && (
            <MapPreview map={selectedMapDetails} />
          )}

          {!isLoadingMapDetails && !selectedMapDetails && (
            <div className="map-preview-empty">
              Select a map to preview it.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}