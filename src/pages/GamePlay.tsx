import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { buildBuilding, getFullSession } from "../api/gameApi";
import type {
  BuildingType,
  FullGameSession,
  SessionBuilding,
  SessionPlayer,
  SessionSystem
} from "../types/game";
import "./GameSession.css";

const BUILDING_OPTIONS: {
  type: BuildingType;
  name: string;
  icon: string;
  cost: string;
}[] = [
  {
    type: "mine",
    name: "Mine",
    icon: "⛏️",
    cost: "6 🧱 / 2 ⚡"
  },
  {
    type: "power_plant",
    name: "Power Plant",
    icon: "⚡",
    cost: "6 🧱 / 3 ⚡"
  },
  {
    type: "storage",
    name: "Supply Depot",
    icon: "📦",
    cost: "3 🧱 / 2 ⚡"
  }
];

const BUILDING_DISPLAY_NAMES: Record<string, string> = {
  mine: "Mine",
  power_plant: "Power Plant",
  energy_plant: "Energy Plant",
  storage: "Supply Depot",
  research_center: "Research Center",
  barracks: "Barracks",
  spaceport: "Spaceport",
  orbital_defense: "Orbital Defense"
};

function getBuildingDisplayName(building: SessionBuilding): string {
  if (building.building_name) {
    return building.building_name;
  }

  const fallbackName =
    BUILDING_DISPLAY_NAMES[building.building_type] ??
    building.building_type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return fallbackName;
}

function getBuildingsForPlayer(
  session: FullGameSession,
  playerId: number
): SessionBuilding[] {
  const playerBuildings: SessionBuilding[] = [];

  for (const system of session.systems) {
    const buildings = system.buildings ?? [];

    for (const building of buildings) {
      if (building.owner_player_id === playerId) {
        playerBuildings.push({
          ...building,
          system_id: building.system_id ?? system.system_id,
          system_name: building.system_name ?? system.system_name
        });
      }
    }
  }

  return playerBuildings;
}

function getSystemPosition(
  system: SessionSystem,
  systems: SessionSystem[]
): { left: string; top: string } {
  const xValues = systems.map((item) => item.x ?? 0);
  const yValues = systems.map((item) => item.y ?? 0);

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const normalizedX =
    maxX === minX ? 50 : 8 + (((system.x ?? 0) - minX) / (maxX - minX)) * 84;

  const normalizedY =
    maxY === minY ? 50 : 8 + (((system.y ?? 0) - minY) / (maxY - minY)) * 84;

  return {
    left: `${normalizedX}%`,
    top: `${normalizedY}%`
  };
}

export default function GamePlay() {
  const { sessionId } = useParams();

  const [session, setSession] = useState<FullGameSession | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] =
    useState<BuildingType>("mine");
  const [selectedSystemId, setSelectedSystemId] = useState<number | null>(null);

  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);

  const numericSessionId = Number(sessionId);

  const selectedPlayer = useMemo(() => {
    if (!session || selectedPlayerId === null) {
      return null;
    }

    return (
      session.players.find((player) => player.id === selectedPlayerId) ?? null
    );
  }, [session, selectedPlayerId]);

  const controlledSystems = useMemo(() => {
    if (!session || selectedPlayerId === null) {
      return [];
    }

    return session.systems.filter(
      (system) => system.owner_player_id === selectedPlayerId
    );
  }, [session, selectedPlayerId]);

  async function loadSession() {
    if (!Number.isInteger(numericSessionId) || numericSessionId < 1) {
      setError("Invalid session ID");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const sessionData = await getFullSession(numericSessionId);

      setSession(sessionData);

      if (!selectedPlayerId && sessionData.players.length > 0) {
        const firstPlayer = sessionData.players[0];
        setSelectedPlayerId(firstPlayer.id);

        const firstControlledSystem = sessionData.systems.find(
          (system) => system.owner_player_id === firstPlayer.id
        );

        setSelectedSystemId(firstControlledSystem?.system_id ?? null);
      }
    } catch (err) {
      setSession(null);
      setError(err instanceof Error ? err.message : "Failed to load game");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBuildBuilding() {
    if (!session) {
      return;
    }

    if (!selectedPlayerId) {
      setError("Select player");
      return;
    }

    if (!selectedSystemId) {
      setError("Select controlled system");
      return;
    }

    try {
      setIsBuilding(true);
      setError("");

      await buildBuilding(
        session.id,
        selectedPlayerId,
        selectedSystemId,
        selectedBuildingType
      );

      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build building");
    } finally {
      setIsBuilding(false);
    }
  }

  function handleSelectPlayer(player: SessionPlayer) {
    setSelectedPlayerId(player.id);

    const firstControlledSystem = session?.systems.find(
      (system) => system.owner_player_id === player.id
    );

    setSelectedSystemId(firstControlledSystem?.system_id ?? null);
  }

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  return (
    <div className="game-page game-simulation-page">
      <header className="game-header">
        <div>
          <h1>ARCHONT Game</h1>
          <p>Simulation screen</p>
        </div>

        <button onClick={loadSession} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {error && <div className="game-error">{error}</div>}

      {session && (
        <>
          <section className="game-panel simulation-summary-panel">
            <div>
              <h2>{session.name}</h2>

              <div className="session-info">
                <span>Status: {session.status}</span>
                <span>Round: {session.current_round}</span>
                <span>Players: {session.players_count}</span>
              </div>
            </div>
          </section>

          <section className="simulation-layout">
            <aside className="simulation-sidebar players-sidebar">
              <h2>Players</h2>

              <div className="compact-players-list">
                {session.players.map((player) => {
                  const isSelected = player.id === selectedPlayerId;
                  const playerBuildings = getBuildingsForPlayer(
                    session,
                    player.id
                  );

                  return (
                    <button
                      className={
                        isSelected
                          ? "compact-player-card selected"
                          : "compact-player-card"
                      }
                      key={player.id}
                      onClick={() => handleSelectPlayer(player)}
                    >
                      <div className="compact-player-header">
                        <strong>{player.faction_name}</strong>
                        <span>
                          {player.civilization_name ?? "No civilization"}
                        </span>
                      </div>

                      <div className="resource-icons">
                        <span title="Matter">🧱 {player.matter}</span>
                        <span title="Energy">⚡ {player.energy}</span>
                        <span title="Data">💾 {player.data}</span>
                      </div>

                      <div className="compact-player-meta">
                        <span>{player.nickname ?? `User ${player.user_id}`}</span>
                        <span>Buildings: {playerBuildings.length}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="map-panel">
              <div className="map-header">
                <div>
                  <h2>Galactic map</h2>
                  <p>
                    Select a controlled system on the map or from the build
                    panel.
                  </p>
                </div>
              </div>

              <div className="galaxy-map">
                {session.systems.map((system) => {
                  const buildings = system.buildings ?? [];
                  const position = getSystemPosition(system, session.systems);

                  const isSelected = system.system_id === selectedSystemId;
                  const isControlledBySelectedPlayer =
                    system.owner_player_id === selectedPlayerId;

                  return (
                    <button
                      key={system.system_id}
                      className={[
                        "map-system-node",
                        system.owner_player_id ? "owned" : "neutral",
                        isSelected ? "selected" : "",
                        isControlledBySelectedPlayer ? "selectable" : ""
                      ].join(" ")}
                      style={{
                        left: position.left,
                        top: position.top
                      }}
                      onClick={() => {
                        if (isControlledBySelectedPlayer) {
                          setSelectedSystemId(system.system_id);
                        }
                      }}
                    >
                      <strong>{system.system_name}</strong>

                      <span>
                        {system.owner_faction
                          ? system.owner_faction
                          : "Neutral"}
                      </span>

                      {buildings.length > 0 && (
                        <div className="map-building-icons">
                          {buildings.map((building) => (
                            <span key={building.id}>
                              {getBuildingDisplayName(building)}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </main>

            <aside className="simulation-sidebar build-sidebar">
              <h2>Construction</h2>

              <label>
                Player
                <select
                  value={selectedPlayerId ?? ""}
                  onChange={(event) => {
                    const playerId = Number(event.target.value);
                    const player = session.players.find(
                      (item) => item.id === playerId
                    );

                    if (player) {
                      handleSelectPlayer(player);
                    }
                  }}
                >
                  <option value="">Select player</option>

                  {session.players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.faction_name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="building-buttons">
                {BUILDING_OPTIONS.map((building) => (
                  <button
                    key={building.type}
                    className={
                      selectedBuildingType === building.type
                        ? "building-option selected"
                        : "building-option"
                    }
                    onClick={() => setSelectedBuildingType(building.type)}
                  >
                    <span className="building-icon">{building.icon}</span>

                    <span>
                      <strong>{building.name}</strong>
                      <small>{building.cost}</small>
                    </span>
                  </button>
                ))}
              </div>

              <label>
                Controlled system
                <select
                  value={selectedSystemId ?? ""}
                  onChange={(event) =>
                    setSelectedSystemId(Number(event.target.value))
                  }
                  disabled={!selectedPlayer || controlledSystems.length === 0}
                >
                  <option value="">Select system</option>

                  {controlledSystems.map((system) => (
                    <option key={system.system_id} value={system.system_id}>
                      {system.system_name}
                    </option>
                  ))}
                </select>
              </label>

              {controlledSystems.length === 0 && (
                <p className="action-hint">
                  Selected player does not control any systems.
                </p>
              )}

              <button
                className="build-submit-button"
                onClick={handleBuildBuilding}
                disabled={
                  isBuilding ||
                  session.status !== "started" ||
                  !selectedPlayerId ||
                  !selectedSystemId
                }
              >
                {isBuilding ? "Building..." : "Build"}
              </button>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}