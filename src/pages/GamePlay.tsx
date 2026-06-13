import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  buildBuilding,
  colonizeSystemWithArk,
  getFullSession,
  nextRound,
  packColonyIntoArk
} from "../api/gameApi";
import type {
  BuildingType,
  FullGameSession,
  SessionBuilding,
  SessionPlayer,
  SessionSystem,
  SessionUnit
} from "../types/game";
import "./GameSession.css";

const UNIT_ACTION_ENERGY_COST = 3;

const BUILDING_OPTIONS: {
  type: BuildingType;
  name: string;
  icon: string;
  cost: string;
  income: string;
}[] = [
  {
    type: "mine",
    name: "Mine",
    icon: "⛏️",
    cost: "6 🧱 / 2 ⚡",
    income: "+2 🧱 / round"
  },
  {
    type: "power_plant",
    name: "Power Plant",
    icon: "⚡",
    cost: "6 🧱 / 3 ⚡",
    income: "+2 ⚡ / round"
  },
  {
    type: "storage",
    name: "Supply Depot",
    icon: "📦",
    cost: "3 🧱 / 2 ⚡",
    income: "+1 🍞 / round"
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

const BUILDING_DETAILS: Record<
  string,
  {
    income: string;
    produces: string[];
    technologies: string[];
    description: string;
  }
> = {
  mine: {
    income: "+2 🧱 Matter / round",
    produces: [],
    technologies: [],
    description: "Basic matter production building."
  },
  power_plant: {
    income: "+2 ⚡ Energy / round",
    produces: [],
    technologies: [],
    description: "Basic energy production building."
  },
  energy_plant: {
    income: "+2 ⚡ Energy / round",
    produces: [],
    technologies: [],
    description: "Alternative energy production building."
  },
  storage: {
    income: "+1 🍞 Food / round",
    produces: [],
    technologies: [],
    description:
      "Supply building. Up to 2 Supply Depots can be built in one system."
  },
  research_center: {
    income: "+1 💾 Data / round",
    produces: [],
    technologies: ["Blueprint research", "Civilization upgrades"],
    description: "Allows research actions and technology progression."
  },
  barracks: {
    income: "No direct income",
    produces: ["Infantry", "Boarding units"],
    technologies: ["Ground warfare"],
    description: "Military production building."
  },
  spaceport: {
    income: "No direct income",
    produces: ["Ark", "Fleet units", "Scouts"],
    technologies: ["Movement", "Expansion"],
    description: "Orbital production and movement infrastructure."
  },
  orbital_defense: {
    income: "No direct income",
    produces: [],
    technologies: ["Defense protocols"],
    description: "Defensive orbital structure."
  },
  colony: {
    income: "+2 🧱 Matter / round, +2 ⚡ Energy / round",
    produces: [],
    technologies: [],
    description: "A deployed colony makes the system colonized. It has no HP."
  }
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

function getUnitDisplayName(unit: SessionUnit): string {
  if (unit.unit_type === "colony" && unit.state === "deployed") {
  return unit.is_foundation ? "Foundation Colony" : "Colony";
}

  if (unit.unit_type === "colony" && unit.state === "ark") {
    return "Ark";
  }

  return unit.unit_type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getUnitHpText(unit: SessionUnit): string {
  if (unit.current_hp === null || unit.max_hp === null) {
    return "HP: —";
  }

  return `HP: ${unit.current_hp}/${unit.max_hp}`;
}

function getSystemColonyMapStatus(system: SessionSystem): string {
  const units = system.units ?? [];

  const deployedColoniesCount = units.filter(
    (unit) => unit.unit_type === "colony" && unit.state === "deployed"
  ).length;

  const arkCount = units.filter(
    (unit) => unit.unit_type === "colony" && unit.state === "ark"
  ).length;

  const parts: string[] = [];

  if (deployedColoniesCount > 0) {
    parts.push(`🏛 ${deployedColoniesCount}`);
  }

  if (arkCount > 0) {
    parts.push(`🚀 ${arkCount}`);
  }

  return parts.length > 0 ? parts.join(" / ") : "—";
}

function groupBuildingsByType(buildings: SessionBuilding[]) {
  return buildings.reduce<Record<string, SessionBuilding[]>>(
    (groups, building) => {
      if (!groups[building.building_type]) {
        groups[building.building_type] = [];
      }

      groups[building.building_type].push(building);

      return groups;
    },
    {}
  );
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
  const [selectedStructureKey, setSelectedStructureKey] = useState<string | null>(
    null
  );
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [isEndingRound, setIsEndingRound] = useState<boolean>(false);
  const [isUnitActionLoading, setIsUnitActionLoading] =
    useState<boolean>(false);

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

  const selectedSystem = useMemo(() => {
    if (!session || selectedSystemId === null) {
      return null;
    }

    return (
      session.systems.find((system) => system.system_id === selectedSystemId) ??
      null
    );
  }, [session, selectedSystemId]);

  const canBuildInSelectedSystem =
    Boolean(selectedSystem) &&
    Boolean(selectedPlayerId) &&
    selectedSystem?.owner_player_id === selectedPlayerId;

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

    if (!canBuildInSelectedSystem) {
      setError("Selected player does not control this system");
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

  async function handleNextRound() {
    if (!session) {
      return;
    }

    try {
      setIsEndingRound(true);
      setError("");

      const updatedSession = await nextRound(session.id);

      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start next round");
    } finally {
      setIsEndingRound(false);
    }
  }

  async function handlePackColonyIntoArk(unit: SessionUnit) {
    if (!session) {
      return;
    }

    if (unit.owner_player_id !== selectedPlayerId) {
      setError("Select the owner player to control this colony");
      return;
    }

    try {
      setIsUnitActionLoading(true);
      setError("");

      const updatedSession = await packColonyIntoArk(session.id, unit.id);

      setSession(updatedSession);
      setSelectedStructureKey(null);
      setSelectedUnitId(unit.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch ark");
    } finally {
      setIsUnitActionLoading(false);
    }
  }

  async function handleColonizeSystem(unit: SessionUnit) {
    if (!session) {
      return;
    }

    if (unit.owner_player_id !== selectedPlayerId) {
      setError("Select the owner player to control this ark");
      return;
    }

    try {
      setIsUnitActionLoading(true);
      setError("");

      const updatedSession = await colonizeSystemWithArk(session.id, unit.id);

      setSession(updatedSession);
      setSelectedUnitId(null);
      setSelectedStructureKey(`colony-${unit.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to colonize system");
    } finally {
      setIsUnitActionLoading(false);
    }
  }

  function handleSelectPlayer(player: SessionPlayer) {
    setSelectedPlayerId(player.id);

    const firstControlledSystem = session?.systems.find(
      (system) => system.owner_player_id === player.id
    );

    setSelectedSystemId(firstControlledSystem?.system_id ?? null);
    setSelectedStructureKey(null);
    setSelectedUnitId(null);
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

            <button
              onClick={handleNextRound}
              disabled={isEndingRound || session.status !== "started"}
            >
              {isEndingRound ? "Processing..." : "Next round"}
            </button>
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
                        <span title="Food">🍞 {player.food}</span>
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
                    Select any system to open its overview. The map only shows
                    colony and ark presence.
                  </p>
                </div>
              </div>

              <div className="galaxy-map">
                {session.systems.map((system) => {
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
                        setSelectedSystemId(system.system_id);
                        setSelectedStructureKey(null);
                        setSelectedUnitId(null);
                      }}
                    >
                      <strong>{system.system_name}</strong>

                      <span>
                        {system.owner_faction ? system.owner_faction : "Neutral"}
                      </span>

                      <span className="map-colony-status">
                        {getSystemColonyMapStatus(system)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedSystem && (
                <section className="system-overview-panel">
                  <div className="system-overview-header">
                    <div>
                      <h2>{selectedSystem.system_name}</h2>
                      <p>
                        Owner:{" "}
                        {selectedSystem.owner_faction
                          ? selectedSystem.owner_faction
                          : "Neutral system"}
                      </p>
                    </div>

                    <span>System ID: {selectedSystem.system_id}</span>
                  </div>

                  <div className="system-overview-grid">
                    <div className="system-overview-block">
                      <h3>Buildings & Colonies</h3>

                      {(() => {
                        const buildings = selectedSystem.buildings ?? [];
                        const units = selectedSystem.units ?? [];

                        const deployedColonies = units.filter(
                          (unit) =>
                            unit.unit_type === "colony" &&
                            unit.state === "deployed"
                        );

                        const groupedBuildings = groupBuildingsByType(buildings);
                        const hasStructures =
                          Object.keys(groupedBuildings).length > 0 ||
                          deployedColonies.length > 0;

                        if (!hasStructures) {
                          return (
                            <p className="action-hint">
                              No buildings or colonies.
                            </p>
                          );
                        }

                        return (
                          <div className="overview-card-grid">
                            {deployedColonies.map((colony) => {
                              const structureKey = `colony-${colony.id}`;
                              const isSelected =
                                selectedStructureKey === structureKey;
                              const details = BUILDING_DETAILS.colony;
                              const canControl =
                                colony.owner_player_id === selectedPlayerId &&
                                session.status === "started";

                              return (
                                <div
                                  key={structureKey}
                                  className={
                                    isSelected
                                      ? "overview-card selected"
                                      : "overview-card"
                                  }
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    setSelectedStructureKey(structureKey);
                                    setSelectedUnitId(null);
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      setSelectedStructureKey(structureKey);
                                      setSelectedUnitId(null);
                                    }
                                  }}
                                >
                                  <strong>🏛 {getUnitDisplayName(colony)}</strong>
                                  <span>{details.income}</span>

                                  {isSelected && (
                                    <div className="overview-card-details">
                                      <p>{details.description}</p>
                                      <p>ATK: {colony.attack}</p>
                                      <p>DEF: {colony.defense}</p>
                                      <p>{getUnitHpText(colony)}</p>

                                      <button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    handlePackColonyIntoArk(colony);
  }}
  disabled={
    isUnitActionLoading ||
    !canControl ||
    colony.is_foundation ||
    !selectedPlayer ||
    selectedPlayer.energy < UNIT_ACTION_ENERGY_COST
  }
>
  Launch Ark · {UNIT_ACTION_ENERGY_COST} ⚡
</button>
{colony.is_foundation && (
  <p className="action-hint">
    Foundation Colony is the faction's primary settlement and cannot be launched as an ark.
  </p>
)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {Object.entries(groupedBuildings).map(
                              ([buildingType, buildingGroup]) => {
                                const structureKey = `building-${buildingType}`;
                                const isSelected =
                                  selectedStructureKey === structureKey;
                                const firstBuilding = buildingGroup[0];

                                if (!firstBuilding) {
                                  return null;
                                }

                                const details =
                                  BUILDING_DETAILS[buildingType] ?? {
                                    income: "No income data",
                                    produces: [],
                                    technologies: [],
                                    description: "No description yet."
                                  };

                                return (
                                  <div
                                    key={structureKey}
                                    className={
                                      isSelected
                                        ? "overview-card selected"
                                        : "overview-card"
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                      setSelectedStructureKey(structureKey);
                                      setSelectedUnitId(null);
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        setSelectedStructureKey(structureKey);
                                        setSelectedUnitId(null);
                                      }
                                    }}
                                  >
                                    <strong>
                                      {getBuildingDisplayName(firstBuilding)} ×
                                      {buildingGroup.length}
                                    </strong>

                                    <span>{details.income}</span>

                                    {isSelected && (
                                      <div className="overview-card-details">
                                        <p>{details.description}</p>

                                        <p>
                                          <strong>Can produce:</strong>{" "}
                                          {details.produces.length > 0
                                            ? details.produces.join(", ")
                                            : "Nothing yet"}
                                        </p>

                                        <p>
                                          <strong>Technologies:</strong>{" "}
                                          {details.technologies.length > 0
                                            ? details.technologies.join(", ")
                                            : "No technologies yet"}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="system-overview-block">
                      <h3>Units</h3>

                      {(() => {
                        const units = selectedSystem.units ?? [];

                        const visibleUnits = units.filter(
                          (unit) =>
                            !(
                              unit.unit_type === "colony" &&
                              unit.state === "deployed"
                            )
                        );

                        if (visibleUnits.length === 0) {
                          return (
                            <p className="action-hint">
                              No units in this system.
                            </p>
                          );
                        }

                        return (
                          <div className="overview-card-grid">
                            {visibleUnits.map((unit) => {
                              const isSelected = selectedUnitId === unit.id;
                              const canControl =
                                unit.owner_player_id === selectedPlayerId &&
                                session.status === "started";

                              return (
                                <div
                                  key={unit.id}
                                  className={
                                    isSelected
                                      ? "overview-card selected"
                                      : "overview-card"
                                  }
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    setSelectedUnitId(unit.id);
                                    setSelectedStructureKey(null);
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      setSelectedUnitId(unit.id);
                                      setSelectedStructureKey(null);
                                    }
                                  }}
                                >
                                  <strong>
                                    {unit.state === "ark" ? "🚀 " : ""}
                                    {getUnitDisplayName(unit)}
                                  </strong>

                                  <span>ATK: {unit.attack}</span>
                                  <span>DEF: {unit.defense}</span>
                                  <span>{getUnitHpText(unit)}</span>

                                  {isSelected && (
                                    <div className="overview-card-details">
                                      <p>Food upkeep: {unit.food_upkeep}</p>

                                      {unit.unit_type === "colony" &&
                                        unit.state === "ark" && (
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleColonizeSystem(unit);
                                            }}
                                            disabled={
                                              isUnitActionLoading ||
                                              !canControl ||
                                              !selectedPlayer ||
                                              selectedPlayer.energy <
                                                UNIT_ACTION_ENERGY_COST
                                            }
                                          >
                                            Colonize System ·{" "}
                                            {UNIT_ACTION_ENERGY_COST} ⚡
                                          </button>
                                        )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </section>
              )}
            </main>

            <aside className="simulation-sidebar build-sidebar">
              <h2>Construction</h2>

              <label>
                Player
                <select
                  value={selectedPlayerId ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;

                    if (!value) {
                      setSelectedPlayerId(null);
                      setSelectedSystemId(null);
                      setSelectedStructureKey(null);
                      setSelectedUnitId(null);
                      return;
                    }

                    const playerId = Number(value);
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
                      <small>{building.income}</small>
                    </span>
                  </button>
                ))}
              </div>

              <label>
                Controlled system
                <select
                  value={canBuildInSelectedSystem ? selectedSystemId ?? "" : ""}
                  onChange={(event) => {
                    const value = event.target.value;

                    setSelectedSystemId(value ? Number(value) : null);
                    setSelectedStructureKey(null);
                    setSelectedUnitId(null);
                  }}
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

              {selectedSystem && !canBuildInSelectedSystem && (
                <p className="action-hint">
                  Select a system controlled by the selected player to build
                  here.
                </p>
              )}

              <button
                className="build-submit-button"
                onClick={handleBuildBuilding}
                disabled={
                  isBuilding ||
                  session.status !== "started" ||
                  !selectedPlayerId ||
                  !selectedSystemId ||
                  !canBuildInSelectedSystem
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
