import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  buildBuilding,
  colonizeSystemWithArk,
  endTurn,
  getEditorMap,
  getFullSession,
  packColonyBuildingIntoArk,
  passTurn
} from "../api/gameApi";
import type {
  BuildingType,
  FullGameSession,
  MapEditorSavedMap,
  SessionBuilding,
  SessionPlayer,
  SessionSystem,
  SessionUnit
} from "../types/game";
import "./GameSession.css";

const UNIT_ACTION_ENERGY_COST = 3;
const COMMAND_POINTS_PER_ROUND = 3;

type ResourceCost = {
  matter?: number;
  energy?: number;
  data?: number;
  food?: number;
};

const BUILDING_COSTS: Record<BuildingType, ResourceCost> = {
  mine: {
    matter: 6,
    energy: 2
  },
  power_plant: {
    matter: 6,
    energy: 3
  },
  storage: {
    matter: 3,
    energy: 2
  }
};

function getResourceShortageMessage(
  player: SessionPlayer | null,
  cost: ResourceCost
): string | null {
  if (!player) {
    return "No active player selected.";
  }

  const missingResources: string[] = [];

  if ((cost.matter ?? 0) > player.matter) {
    missingResources.push(`matter: need ${cost.matter}, have ${player.matter}`);
  }

  if ((cost.energy ?? 0) > player.energy) {
    missingResources.push(`energy: need ${cost.energy}, have ${player.energy}`);
  }

  if ((cost.data ?? 0) > player.data) {
    missingResources.push(`data: need ${cost.data}, have ${player.data}`);
  }

  if ((cost.food ?? 0) > player.food) {
    missingResources.push(`food: need ${cost.food}, have ${player.food}`);
  }

  if (missingResources.length === 0) {
    return null;
  }

  return `Not enough resources — ${missingResources.join(", ")}.`;
}

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

  if (unit.unit_type === "ark" || unit.state === "ark") {
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
  const buildings = system.buildings ?? [];
  const units = system.units ?? [];

  const colonyBuildingsCount = buildings.filter(
    (building) => building.building_type === "colony"
  ).length;

  const arkCount = units.filter(
    (unit) => unit.unit_type === "ark" || unit.state === "ark"
  ).length;

  const parts: string[] = [];

  if (colonyBuildingsCount > 0) {
    parts.push(`🏛 ${colonyBuildingsCount}`);
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

function getPlayerColonyCount(
  session: FullGameSession,
  playerId: number
): number {
  return getBuildingsForPlayer(session, playerId).filter(
    (building) => building.building_type === "colony"
  ).length;
}

function getSystemPosition(
  system: SessionSystem,
  mapDetails: MapEditorSavedMap | null
): { left: string; top: string } {
  const gridWidth = Math.max(1, mapDetails?.grid_width ?? 20);
  const gridHeight = Math.max(1, mapDetails?.grid_height ?? 20);

  const left = (((system.x ?? 0) + 0.5) / gridWidth) * 100;
  const top = (((system.y ?? 0) + 0.5) / gridHeight) * 100;

  return {
    left: `${left}%`,
    top: `${top}%`
  };
}

function getSystemPoint(
  system: SessionSystem,
  mapDetails: MapEditorSavedMap | null
): { x: number; y: number } {
  const gridWidth = Math.max(1, mapDetails?.grid_width ?? 20);
  const gridHeight = Math.max(1, mapDetails?.grid_height ?? 20);

  return {
    x: (((system.x ?? 0) + 0.5) / gridWidth) * 100,
    y: (((system.y ?? 0) + 0.5) / gridHeight) * 100
  };
}

type MapPoint = {
  x: number;
  y: number;
};

type MapLineSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function getWraparoundLineSegments(
  fromPoint: MapPoint,
  toPoint: MapPoint
): MapLineSegment[] {
  const deltaX = Math.abs(toPoint.x - fromPoint.x);
  const deltaY = Math.abs(toPoint.y - fromPoint.y);

  const shouldWrapHorizontally = deltaX >= deltaY;

  if (shouldWrapHorizontally) {
    if (fromPoint.x < toPoint.x) {
      return [
        {
          x1: fromPoint.x,
          y1: fromPoint.y,
          x2: 0,
          y2: fromPoint.y
        },
        {
          x1: 100,
          y1: toPoint.y,
          x2: toPoint.x,
          y2: toPoint.y
        }
      ];
    }

    return [
      {
        x1: fromPoint.x,
        y1: fromPoint.y,
        x2: 100,
        y2: fromPoint.y
      },
      {
        x1: 0,
        y1: toPoint.y,
        x2: toPoint.x,
        y2: toPoint.y
      }
    ];
  }

  if (fromPoint.y < toPoint.y) {
    return [
      {
        x1: fromPoint.x,
        y1: fromPoint.y,
        x2: fromPoint.x,
        y2: 0
      },
      {
        x1: toPoint.x,
        y1: 100,
        x2: toPoint.x,
        y2: toPoint.y
      }
    ];
  }

  return [
    {
      x1: fromPoint.x,
      y1: fromPoint.y,
      x2: fromPoint.x,
      y2: 100
    },
    {
      x1: toPoint.x,
      y1: 0,
      x2: toPoint.x,
      y2: toPoint.y
    }
  ];
}

export default function GamePlay() {
  const { sessionId } = useParams();

  const [session, setSession] = useState<FullGameSession | null>(null);
  const [mapDetails, setMapDetails] = useState<MapEditorSavedMap | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] =
    useState<BuildingType>("mine");
  const [selectedSystemId, setSelectedSystemId] = useState<number | null>(null);
  const [selectedStructureKey, setSelectedStructureKey] = useState<string | null>(
    null
  );
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const [error, setError] = useState<string>("");
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [isTurnActionLoading, setIsTurnActionLoading] =
    useState<boolean>(false);
  const [isUnitActionLoading, setIsUnitActionLoading] =
    useState<boolean>(false);

  const numericSessionId = Number(sessionId);

  const currentPlayer = useMemo(() => {
    if (!session || session.current_player_id === null) {
      return null;
    }

    return (
      session.players.find(
        (player) => player.id === session.current_player_id
      ) ?? null
    );
  }, [session]);

  const controlledSystems = useMemo(() => {
    if (!session || !currentPlayer) {
      return [];
    }

    return session.systems.filter(
      (system) => system.owner_player_id === currentPlayer.id
    );
  }, [session, currentPlayer]);

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
    Boolean(currentPlayer) &&
    selectedSystem?.owner_player_id === currentPlayer?.id;

  const selectedBuildingResourceError = getResourceShortageMessage(
    currentPlayer,
    BUILDING_COSTS[selectedBuildingType]
  );

  async function loadSession() {
    if (!Number.isInteger(numericSessionId) || numericSessionId < 1) {
      setError("Invalid session ID");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setActionErrors({});

      const sessionData = await getFullSession(numericSessionId);
      const loadedMapDetails = await getEditorMap(sessionData.map_id);

      setSession(sessionData);
      setMapDetails(loadedMapDetails);

      const playerToSelect =
        sessionData.players.find(
          (player) => player.id === sessionData.current_player_id
        ) ?? sessionData.players[0];

      if (playerToSelect) {
        setSelectedPlayerId(playerToSelect.id);

        const firstControlledSystem = sessionData.systems.find(
          (system) => system.owner_player_id === playerToSelect.id
        );

        setSelectedSystemId(firstControlledSystem?.system_id ?? null);
      } else {
        setSelectedPlayerId(null);
        setSelectedSystemId(null);
      }
    } catch (err) {
      setSession(null);
      setMapDetails(null);
      setError(err instanceof Error ? err.message : "Failed to load game");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBuildBuilding() {
    if (!session) {
      return;
    }

    if (!currentPlayer) {
      setActionErrors({
        build: "No current player is active."
      });
      return;
    }

    if (!selectedSystemId) {
      setActionErrors({
        build: "Select a controlled system."
      });
      return;
    }

    if (!canBuildInSelectedSystem) {
      setActionErrors({
        build: "You can build only in the current player's systems."
      });
      return;
    }

    if (selectedBuildingResourceError) {
      setActionErrors({
        build: selectedBuildingResourceError
      });
      return;
    }

    try {
      setIsBuilding(true);
      setError("");
      setActionErrors({});

      await buildBuilding(
        session.id,
        currentPlayer.id,
        selectedSystemId,
        selectedBuildingType
      );

      await loadSession();
    } catch (err) {
      setActionErrors({
        build: err instanceof Error ? err.message : "Failed to build building"
      });
    } finally {
      setIsBuilding(false);
    }
  }

  function selectCurrentPlayerFromSession(updatedSession: FullGameSession) {
    const nextCurrentPlayer =
      updatedSession.players.find(
        (player) => player.id === updatedSession.current_player_id
      ) ?? updatedSession.players[0];

    if (!nextCurrentPlayer) {
      setSelectedPlayerId(null);
      setSelectedSystemId(null);
      setSelectedStructureKey(null);
      setSelectedUnitId(null);
      return;
    }

    setSelectedPlayerId(nextCurrentPlayer.id);

    const firstControlledSystem = updatedSession.systems.find(
      (system) => system.owner_player_id === nextCurrentPlayer.id
    );

    setSelectedSystemId(firstControlledSystem?.system_id ?? null);
    setSelectedStructureKey(null);
    setSelectedUnitId(null);
  }

  async function handleEndTurn() {
    if (!session) {
      return;
    }

    try {
      setIsTurnActionLoading(true);
      setError("");
      setActionErrors({});

      const updatedSession = await endTurn(session.id);

      setSession(updatedSession);
      selectCurrentPlayerFromSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end turn");
    } finally {
      setIsTurnActionLoading(false);
    }
  }

  async function handlePassTurn() {
    if (!session) {
      return;
    }

    try {
      setIsTurnActionLoading(true);
      setError("");
      setActionErrors({});

      const updatedSession = await passTurn(session.id);

      setSession(updatedSession);
      selectCurrentPlayerFromSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pass");
    } finally {
      setIsTurnActionLoading(false);
    }
  }

  async function handlePackColonyBuildingIntoArk(building: SessionBuilding) {
    if (!session) {
      return;
    }

    const actionErrorKey = `building-${building.id}`;

    if (!currentPlayer || building.owner_player_id !== currentPlayer.id) {
      setActionErrors({
        [actionErrorKey]: "Only the current player can control this colony."
      });
      return;
    }

    const colonyCount = getPlayerColonyCount(session, currentPlayer.id);

    if (colonyCount <= 1) {
      setActionErrors({
        [actionErrorKey]: "Player cannot pack the last Colony into Ark."
      });
      return;
    }

    const resourceError = getResourceShortageMessage(currentPlayer, {
      energy: UNIT_ACTION_ENERGY_COST
    });

    if (resourceError) {
      setActionErrors({
        [actionErrorKey]: resourceError
      });
      return;
    }

    try {
      setIsUnitActionLoading(true);
      setError("");
      setActionErrors({});

      const updatedSession = await packColonyBuildingIntoArk(
        session.id,
        building.id
      );

      setSession(updatedSession);
      selectCurrentPlayerFromSession(updatedSession);
    } catch (err) {
      setActionErrors({
        [actionErrorKey]: err instanceof Error ? err.message : "Failed to pack colony into ark"
      });
    } finally {
      setIsUnitActionLoading(false);
    }
  }

  async function handleColonizeSystem(unit: SessionUnit) {
    if (!session) {
      return;
    }

    const actionErrorKey = `unit-${unit.id}`;

    if (!currentPlayer || unit.owner_player_id !== currentPlayer.id) {
      setActionErrors({
        [actionErrorKey]: "Only the current player can control this ark."
      });
      return;
    }

    const resourceError = getResourceShortageMessage(currentPlayer, {
      energy: UNIT_ACTION_ENERGY_COST
    });

    if (resourceError) {
      setActionErrors({
        [actionErrorKey]: resourceError
      });
      return;
    }

    try {
      setIsUnitActionLoading(true);
      setError("");
      setActionErrors({});

      const updatedSession = await colonizeSystemWithArk(session.id, unit.id);

      setSession(updatedSession);
      selectCurrentPlayerFromSession(updatedSession);
    } catch (err) {
      setActionErrors({
        [actionErrorKey]: err instanceof Error ? err.message : "Failed to colonize system"
      });
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

  function getSessionSystemById(systemId: number): SessionSystem | undefined {
    return session?.systems.find((system) => system.system_id === systemId);
  }

  function getMapSystemDetailsById(systemId: number) {
    return mapDetails?.systems.find((system) => system.id === systemId);
  }

  function getGameplaySystemVisualClass(systemId: number): string {
    const mapSystem = getMapSystemDetailsById(systemId);

    if (!mapSystem) {
      return "system-visual-normal";
    }

    if (mapSystem.system_type === "start") {
      return "system-visual-start";
    }

    if (mapSystem.system_type === "archive") {
      const archiveLevel = mapSystem.archive_level ?? 1;

      return `system-visual-archive archive-level-${archiveLevel}`;
    }

    return "system-visual-normal";
  }

  function getSystemTypeLabel(systemId: number): string | null {
    const mapSystem = getMapSystemDetailsById(systemId);

    if (!mapSystem) {
      return null;
    }

    if (mapSystem.system_type === "start") {
      return "START";
    }

    if (mapSystem.system_type === "archive") {
      return `ARCHIVE ${mapSystem.archive_level ?? 1}`;
    }

    return null;
  }

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

            <div className="round-flow-hint">
              Round advances automatically after all players spend CP or pass.
            </div>
          </section>

          <section className="game-panel hotseat-turn-panel">
            <div>
              <p className="turn-kicker">Hotseat mode</p>
              <h2>Round {session.current_round}</h2>
              <p className="action-hint">
                Pass the device to the current player.
              </p>
            </div>

            <div className="turn-current-player-card">
              <span>Current player</span>
              <strong>
                {currentPlayer?.faction_name ?? "No active player"}
              </strong>
              <small>
                {currentPlayer?.civilization_name ?? "No civilization"}
              </small>
              <div className="turn-command-points">
                CP: {currentPlayer?.command_points_left ?? 0}/
                {COMMAND_POINTS_PER_ROUND}
              </div>
            </div>

            <div className="turn-actions">
              <button
                type="button"
                onClick={handleEndTurn}
                disabled={
                  isTurnActionLoading ||
                  session.status !== "started" ||
                  !currentPlayer
                }
              >
                {isTurnActionLoading ? "Processing..." : "End turn"}
              </button>

              <button
                type="button"
                onClick={handlePassTurn}
                disabled={
                  isTurnActionLoading ||
                  session.status !== "started" ||
                  !currentPlayer
                }
              >
                {isTurnActionLoading ? "Processing..." : "Pass"}
              </button>
            </div>
          </section>

          <section className="simulation-layout">
            <aside className="simulation-sidebar players-sidebar">
              <h2>Players</h2>

              <div className="compact-players-list">
                {session.players.map((player) => {
                  const isSelected = player.id === selectedPlayerId;
                  const isCurrentPlayer =
                    player.id === session.current_player_id;
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
                          {isCurrentPlayer
                            ? "Current turn"
                            : player.civilization_name ?? "No civilization"}
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
                        <span>Fleets: {player.fleets?.length ?? 0}/4</span>
                        <span className="player-card-turn-state">
                          <span>
                            CP: {player.command_points_left}/
                            {COMMAND_POINTS_PER_ROUND}
                          </span>

                          {player.has_passed && (
                            <strong className="player-pass-badge">PASS</strong>
                          )}
                        </span>
                      </div>

                      {(player.fleets?.length ?? 0) > 0 && (
                        <div className="compact-fleet-list">
                          {player.fleets.map((fleet) => (
                            <div key={fleet.id} className="compact-fleet-row">
                              <span>
                                {fleet.name} · {fleet.system_name ?? `System ${fleet.system_id}`}
                              </span>
                              <span>{fleet.units.length}/5 units</span>
                            </div>
                          ))}
                        </div>
                      )}
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
  Select any system to open its overview. Corridors show safe, dangerous and
  wraparound routes.
</p>
                </div>
              </div>

              <div className="galaxy-map enhanced-galaxy-map">
  <svg
    className="game-map-connections"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    {(mapDetails?.connections ?? []).map((connection) => {
  const fromSystem = getSessionSystemById(connection.from_system_id);
  const toSystem = getSessionSystemById(connection.to_system_id);

  if (!fromSystem || !toSystem) {
    return null;
  }

  const fromPoint = getSystemPoint(fromSystem, mapDetails);
  const toPoint = getSystemPoint(toSystem, mapDetails);

  if (connection.is_wraparound) {
    const segments = getWraparoundLineSegments(fromPoint, toPoint);

    return (
      <g key={connection.id}>
        {segments.map((segment, index) => (
          <line
            key={`${connection.id}-${index}`}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            className={[
              "game-map-connection",
              connection.is_dangerous ? "dangerous" : "safe",
              "wraparound"
            ].join(" ")}
          />
        ))}
      </g>
    );
  }

  return (
    <line
      key={connection.id}
      x1={fromPoint.x}
      y1={fromPoint.y}
      x2={toPoint.x}
      y2={toPoint.y}
      className={[
        "game-map-connection",
        connection.is_dangerous ? "dangerous" : "safe"
      ].join(" ")}
    />
  );
})}
  </svg>

  {session.systems.map((system) => {
    const position = getSystemPosition(system, mapDetails);
    const isSelected = system.system_id === selectedSystemId;
    const isControlledBySelectedPlayer =
      system.owner_player_id === selectedPlayerId;

    const buildingsCount = system.buildings?.length ?? 0;
    const unitsCount = system.units?.length ?? 0;

    const systemVisualClass = getGameplaySystemVisualClass(system.system_id);
    const systemTypeLabel = getSystemTypeLabel(system.system_id);

    return (
      <button
  key={system.system_id}
  className={[
    "map-system-node",
    "compact-map-system-node",
    system.owner_player_id ? "owned" : "neutral",
    systemVisualClass,
    isSelected ? "selected" : "",
    isControlledBySelectedPlayer ? "selectable" : ""
  ].join(" ")}
  style={{
    left: position.left,
    top: position.top
  }}
  title={`${system.system_name} · ${
    system.owner_faction ? system.owner_faction : "Neutral"
  }`}
  onClick={() => {
    setSelectedSystemId(system.system_id);
    setSelectedStructureKey(null);
    setSelectedUnitId(null);
  }}
>
  {systemTypeLabel && (
    <span className="compact-system-type-badge">
      {systemTypeLabel}
    </span>
  )}

  <span className="compact-system-title">
    {system.system_name}
  </span>

  <span className="compact-system-owner">
    {system.owner_faction ? system.owner_faction : "Neutral"}
  </span>

  <span className="compact-system-icons">
    <span title="Colony / Ark status">
      {getSystemColonyMapStatus(system)}
    </span>

    {buildingsCount > 0 && (
      <span title="Buildings">🏗 {buildingsCount}</span>
    )}

    {unitsCount > 0 && (
      <span title="Units">⚙ {unitsCount}</span>
    )}
  </span>
</button>
    );
  })}
</div>

<div className="game-map-legend">
    <span className="legend-line-safe">Safe corridor</span>
    <span className="legend-line-dangerous">Dangerous corridor</span>
    <span className="legend-line-wraparound">Wraparound corridor</span>
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
                        const groupedBuildings = groupBuildingsByType(buildings);

                        if (Object.keys(groupedBuildings).length === 0) {
                          return (
                            <p className="action-hint">
                              No buildings or colonies.
                            </p>
                          );
                        }

                        return (
                          <div className="overview-card-grid">
                            {Object.entries(groupedBuildings).map(
                              ([buildingType, buildingGroup]) => {
                                const firstBuilding = buildingGroup[0];

                                if (!firstBuilding) {
                                  return null;
                                }

                                const structureKey = `building-${buildingType}-${firstBuilding.owner_player_id}`;
                                const isSelected =
                                  selectedStructureKey === structureKey;
                                const details =
                                  BUILDING_DETAILS[buildingType] ?? {
                                    income: "No income data",
                                    produces: [],
                                    technologies: [],
                                    description: "No description yet."
                                  };
                                const isColony = buildingType === "colony";
                                const canControl =
                                  firstBuilding.owner_player_id === currentPlayer?.id &&
                                  session.status === "started";
                                const resourceError = getResourceShortageMessage(
                                  currentPlayer,
                                  { energy: UNIT_ACTION_ENERGY_COST }
                                );
                                const actionErrorKey = `building-${firstBuilding.id}`;
                                const currentPlayerColonyCount = currentPlayer
                                  ? getPlayerColonyCount(session, currentPlayer.id)
                                  : 0;
                                const isLastPlayerColony =
                                  isColony && canControl && currentPlayerColonyCount <= 1;

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
                                      {isColony ? "🏛 " : ""}
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

                                        {isColony && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                handlePackColonyBuildingIntoArk(
                                                  firstBuilding
                                                );
                                              }}
                                              disabled={
                                                isUnitActionLoading ||
                                                !canControl ||
                                                isLastPlayerColony ||
                                                Boolean(resourceError)
                                              }
                                            >
                                              Pack into Ark ·{" "}
                                              {UNIT_ACTION_ENERGY_COST} ⚡
                                            </button>

                                            {isLastPlayerColony && (
                                              <p className="action-hint">
                                                Last Colony cannot be packed into Ark.
                                              </p>
                                            )}

                                            {resourceError && (
                                              <p className="inline-action-error">
                                                {resourceError}
                                              </p>
                                            )}

                                            {actionErrors[actionErrorKey] && (
                                              <p className="inline-action-error">
                                                {actionErrors[actionErrorKey]}
                                              </p>
                                            )}
                                          </>
                                        )}
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
                        const visibleUnits = selectedSystem.units ?? [];

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
                                unit.owner_player_id === currentPlayer?.id &&
                                session.status === "started";
                              const resourceError = getResourceShortageMessage(
                                currentPlayer,
                                { energy: UNIT_ACTION_ENERGY_COST }
                              );
                              const actionErrorKey = `unit-${unit.id}`;

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
                                    {unit.unit_type === "ark" || unit.state === "ark" ? "🚀 " : ""}
                                    {getUnitDisplayName(unit)}
                                  </strong>

                                  <span>ATK: {unit.attack}</span>
                                  <span>DEF: {unit.defense}</span>
                                  <span>{getUnitHpText(unit)}</span>

                                  {isSelected && (
                                    <div className="overview-card-details">
                                      <p>Food upkeep: {unit.food_upkeep}</p>

                                      {(unit.unit_type === "ark" ||
                                        unit.state === "ark") && (
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleColonizeSystem(unit);
                                            }}
                                            disabled={
                                              isUnitActionLoading ||
                                              !canControl ||
                                              Boolean(resourceError)
                                            }
                                          >
                                            Colonize System ·{" "}
                                            {UNIT_ACTION_ENERGY_COST} ⚡
                                          </button>
                                        )}

                                      {resourceError && (
                                        <p className="inline-action-error">
                                          {resourceError}
                                        </p>
                                      )}

                                      {actionErrors[actionErrorKey] && (
                                        <p className="inline-action-error">
                                          {actionErrors[actionErrorKey]}
                                        </p>
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
              <div className="acting-player-card">
                <span>Acting player</span>
                <strong>{currentPlayer?.faction_name ?? "No active player"}</strong>
                <small>
                  {currentPlayer
                    ? `CP: ${currentPlayer.command_points_left}/${COMMAND_POINTS_PER_ROUND}`
                    : "No turn state"}
                </small>
              </div>

              <div className="building-buttons">
                {BUILDING_OPTIONS.map((building) => (
                  <button
                    key={building.type}
                    className={
                      selectedBuildingType === building.type
                        ? "building-option selected"
                        : "building-option"
                    }
                    onClick={() => {
                      setSelectedBuildingType(building.type);
                      setActionErrors((currentErrors) => ({
                        ...currentErrors,
                        build: ""
                      }));
                    }}
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
                    setActionErrors((currentErrors) => ({
                      ...currentErrors,
                      build: ""
                    }));
                  }}
                  disabled={!currentPlayer || controlledSystems.length === 0}
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
                  Current player does not control any systems.
                </p>
              )}

              {selectedSystem && !canBuildInSelectedSystem && (
                <p className="action-hint">
                  Select a system controlled by the selected player to build
                  here.
                </p>
              )}

              {selectedBuildingResourceError && (
                <p className="inline-action-error">
                  {selectedBuildingResourceError}
                </p>
              )}

              {actionErrors.build && (
                <p className="inline-action-error">{actionErrors.build}</p>
              )}

              <button
                className="build-submit-button"
                onClick={handleBuildBuilding}
                disabled={
                  isBuilding ||
                  session.status !== "started" ||
                  !currentPlayer ||
                  !selectedSystemId ||
                  !canBuildInSelectedSystem ||
                  Boolean(selectedBuildingResourceError)
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
