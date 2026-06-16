import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  buildBuilding,
  colonizeSystemWithArk,
  endTurn,
  getEditorMap,
  getFullSession,
  issueFleetCommand,
  packColonyBuildingIntoArk,
  produceUnitFromBuilding,
  passTurn
} from "../api/gameApi";
import type {
  BuildingType,
  FullGameSession,
  MapEditorSavedMap,
  SessionBuilding,
  SessionFleet,
  SessionPlayer,
  SessionSystem,
  SessionUnit,
  UnitType
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
  },
  barracks: {
    matter: 8,
    energy: 3
  },
  spaceport: {
    matter: 10,
    energy: 4,
    data: 1
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
  },
  {
    type: "barracks",
    name: "Barracks",
    icon: "🛡️",
    cost: "8 🧱 / 3 ⚡",
    income: "Produces light units / Ark"
  },
  {
    type: "spaceport",
    name: "Spaceport",
    icon: "🛰️",
    cost: "10 🧱 / 4 ⚡ / 1 💾",
    income: "Produces medium / heavy units"
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
  orbital_defense: "Orbital Defense",
  colony: "Colony"
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
    produces: ["Scout Drone", "Marine Squad", "Ark"],
    technologies: ["Light unit tactics", "Expansion logistics"],
    description: "Light-unit and Ark production building."
  },
  spaceport: {
    income: "No direct income",
    produces: ["Frigate", "Cruiser"],
    technologies: ["Fleet warfare", "Heavy ship construction"],
    description: "Orbital production building for medium and heavy fleet units."
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

type UnitProductionOption = {
  unit_type: UnitType;
  name: string;
  icon: string;
  producedBy: BuildingType;
  costText: string;
  statsText: string;
  resourceCost: ResourceCost;
};

const UNIT_PRODUCTION_OPTIONS: UnitProductionOption[] = [
  {
    unit_type: "scout",
    name: "Scout Drone",
    icon: "🛸",
    producedBy: "barracks",
    costText: "4 🧱 / 2 ⚡",
    statsText: "ATK 1 · DEF 0 · HP 2",
    resourceCost: {
      matter: 4,
      energy: 2
    }
  },
  {
    unit_type: "marine",
    name: "Marine Squad",
    icon: "🪖",
    producedBy: "barracks",
    costText: "5 🧱 / 2 ⚡",
    statsText: "ATK 1 · DEF 1 · HP 3",
    resourceCost: {
      matter: 5,
      energy: 2
    }
  },
  {
    unit_type: "ark",
    name: "Ark",
    icon: "🚀",
    producedBy: "barracks",
    costText: "8 🧱 / 6 ⚡ / 1 💾",
    statsText: "ATK 0 · DEF 1 · HP 10 · non-combat",
    resourceCost: {
      matter: 8,
      energy: 6,
      data: 1
    }
  },
  {
    unit_type: "frigate",
    name: "Frigate",
    icon: "🚢",
    producedBy: "spaceport",
    costText: "8 🧱 / 5 ⚡ / 1 💾",
    statsText: "ATK 2 · DEF 1 · HP 4",
    resourceCost: {
      matter: 8,
      energy: 5,
      data: 1
    }
  },
  {
    unit_type: "cruiser",
    name: "Cruiser",
    icon: "🛳️",
    producedBy: "spaceport",
    costText: "14 🧱 / 9 ⚡ / 2 💾",
    statsText: "ATK 4 · DEF 2 · HP 8",
    resourceCost: {
      matter: 14,
      energy: 9,
      data: 2
    }
  }
];

function getProductionOptionsForBuilding(
  buildingType: string
): UnitProductionOption[] {
  return UNIT_PRODUCTION_OPTIONS.filter(
    (unitOption) => unitOption.producedBy === buildingType
  );
}

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
  const [selectedCommandFleetId, setSelectedCommandFleetId] =
    useState<number | null>(null);
  const [selectedCommandTargetSystemId, setSelectedCommandTargetSystemId] =
    useState<number | null>(null);
  const [stagedFleetOrders, setStagedFleetOrders] = useState<
    Record<number, number>
  >({});

  const [error, setError] = useState<string>("");
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [isTurnActionLoading, setIsTurnActionLoading] =
    useState<boolean>(false);
  const [isUnitActionLoading, setIsUnitActionLoading] =
    useState<boolean>(false);
  const [isProducingUnit, setIsProducingUnit] = useState<boolean>(false);
  const [isFleetCommandLoading, setIsFleetCommandLoading] =
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
    setSelectedCommandFleetId(null);
    setSelectedCommandTargetSystemId(null);
    setStagedFleetOrders({});
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

  async function handleProduceUnit(
    building: SessionBuilding,
    unitOption: UnitProductionOption
  ) {
    if (!session) {
      return;
    }

    const actionErrorKey = `produce-${building.id}-${unitOption.unit_type}`;

    if (!currentPlayer || building.owner_player_id !== currentPlayer.id) {
      setActionErrors({
        [actionErrorKey]: "Only the current player can use this production building."
      });
      return;
    }

    const resourceError = getResourceShortageMessage(
      currentPlayer,
      unitOption.resourceCost
    );

    if (resourceError) {
      setActionErrors({
        [actionErrorKey]: resourceError
      });
      return;
    }

    try {
      setIsProducingUnit(true);
      setError("");
      setActionErrors({});

      const updatedSession = await produceUnitFromBuilding(
        session.id,
        building.id,
        unitOption.unit_type
      );

      setSession(updatedSession);
      selectCurrentPlayerFromSession(updatedSession);
    } catch (err) {
      setActionErrors({
        [actionErrorKey]: err instanceof Error ? err.message : "Failed to produce unit"
      });
    } finally {
      setIsProducingUnit(false);
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

  function handleSelectCommandFleet(fleetId: number) {
    const fleet = currentPlayer?.fleets.find(
      (candidate) => candidate.id === fleetId
    );

    setSelectedCommandFleetId(fleetId);

    const firstConnectedSystem = fleet
      ? getConnectedSystems(fleet.system_id)[0]
      : null;

    setSelectedCommandTargetSystemId(
      firstConnectedSystem?.system_id ?? null
    );

    setActionErrors((current) => {
      const next = { ...current };
      delete next.fleetCommand;
      return next;
    });
  }

  function handleStageFleetOrder() {
    if (!currentPlayer) {
      setActionErrors({
        fleetCommand: "No current player is active."
      });
      return;
    }

    const availableFleets = currentPlayer.fleets.filter(
      (fleet) => !fleet.has_acted_this_round
    );

    const fleet =
      availableFleets.find(
        (candidate) => candidate.id === selectedCommandFleetId
      ) ?? availableFleets[0];

    if (!fleet) {
      setActionErrors({
        fleetCommand: "No ready fleets are available for this command."
      });
      return;
    }

    const connectedSystems = getConnectedSystems(fleet.system_id);
    const targetSystemId =
      selectedCommandTargetSystemId ??
      connectedSystems[0]?.system_id ??
      null;

    if (!targetSystemId) {
      setActionErrors({
        fleetCommand: "The selected fleet has no connected target system."
      });
      return;
    }

    const isConnected = connectedSystems.some(
      (system) => system.system_id === targetSystemId
    );

    if (!isConnected) {
      setActionErrors({
        fleetCommand: "Select a directly connected target system."
      });
      return;
    }

    setStagedFleetOrders((current) => ({
      ...current,
      [fleet.id]: targetSystemId
    }));

    const remainingFleet = availableFleets.find(
      (candidate) =>
        candidate.id !== fleet.id &&
        stagedFleetOrders[candidate.id] === undefined
    );

    if (remainingFleet) {
      const firstTarget = getConnectedSystems(remainingFleet.system_id)[0];
      setSelectedCommandFleetId(remainingFleet.id);
      setSelectedCommandTargetSystemId(firstTarget?.system_id ?? null);
    }

    setActionErrors((current) => {
      const next = { ...current };
      delete next.fleetCommand;
      return next;
    });
  }

  function handleRemoveStagedFleetOrder(fleetId: number) {
    setStagedFleetOrders((current) => {
      const next = { ...current };
      delete next[fleetId];
      return next;
    });
  }

  function handleClearFleetCommand() {
    setStagedFleetOrders({});
    setActionErrors((current) => {
      const next = { ...current };
      delete next.fleetCommand;
      return next;
    });
  }

  async function handleExecuteFleetCommand() {
    if (!session || !currentPlayer) {
      return;
    }

    const orders = Object.entries(stagedFleetOrders).map(
      ([fleetId, targetSystemId]) => ({
        fleet_id: Number(fleetId),
        order_type: "move_defend" as const,
        target_system_id: Number(targetSystemId)
      })
    );

    if (orders.length === 0) {
      setActionErrors({
        fleetCommand: "Add at least one fleet order before execution."
      });
      return;
    }

    if (currentPlayer.command_points_left <= 0) {
      setActionErrors({
        fleetCommand: "The current player has no command points left."
      });
      return;
    }

    try {
      setIsFleetCommandLoading(true);
      setError("");
      setActionErrors({});

      const updatedSession = await issueFleetCommand(session.id, {
        orders
      });

      setSession(updatedSession);
      selectCurrentPlayerFromSession(updatedSession);
    } catch (err) {
      setActionErrors({
        fleetCommand:
          err instanceof Error ? err.message : "Failed to issue fleet command"
      });
    } finally {
      setIsFleetCommandLoading(false);
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

  function getFleetOwner(fleet: SessionFleet): SessionPlayer | null {
    return (
      session?.players.find((player) => player.id === fleet.owner_player_id) ??
      null
    );
  }

  function getFleetsInSystem(systemId: number): SessionFleet[] {
    if (!session) {
      return [];
    }

    return session.players.flatMap((player) =>
      (player.fleets ?? []).filter((fleet) => fleet.system_id === systemId)
    );
  }

  function getConnectedSystems(systemId: number): SessionSystem[] {
    if (!session || !mapDetails) {
      return [];
    }

    const connectedSystemIds = new Set<number>();

    for (const connection of mapDetails.connections ?? []) {
      if (connection.from_system_id === systemId) {
        connectedSystemIds.add(connection.to_system_id);
      }

      if (connection.to_system_id === systemId) {
        connectedSystemIds.add(connection.from_system_id);
      }
    }

    return session.systems.filter((system) =>
      connectedSystemIds.has(system.system_id)
    );
  }

  function getCorridorLabel(fromSystemId: number, toSystemId: number): string {
    const connection = (mapDetails?.connections ?? []).find(
      (candidate) =>
        (candidate.from_system_id === fromSystemId &&
          candidate.to_system_id === toSystemId) ||
        (candidate.from_system_id === toSystemId &&
          candidate.to_system_id === fromSystemId)
    );

    if (!connection) {
      return "not connected";
    }

    if (connection.is_wraparound) {
      return "wraparound · 2 danger cards";
    }

    if (connection.is_dangerous) {
      return "dangerous · 1 danger card";
    }

    return "safe corridor";
  }


  function getFleetStatusText(fleet: SessionFleet): string {
    if (fleet.is_defensive) {
      return "Defensive position";
    }

    if (fleet.has_acted_this_round) {
      return "Activated";
    }

    return "Ready";
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

  const currentPlayerFleets = currentPlayer?.fleets ?? [];
  const readyCommandFleets = currentPlayerFleets.filter(
    (fleet) => !fleet.has_acted_this_round
  );
  const selectedCommandFleet =
    readyCommandFleets.find(
      (fleet) => fleet.id === selectedCommandFleetId
    ) ?? readyCommandFleets[0] ?? null;
  const selectedCommandConnectedSystems = selectedCommandFleet
    ? getConnectedSystems(selectedCommandFleet.system_id)
    : [];
  const effectiveCommandTargetSystemId =
    selectedCommandTargetSystemId ??
    selectedCommandConnectedSystems[0]?.system_id ??
    null;
  const stagedCommandOrders = Object.entries(stagedFleetOrders)
    .map(([fleetId, targetSystemId]) => {
      const fleet = currentPlayerFleets.find(
        (candidate) => candidate.id === Number(fleetId)
      );
      const targetSystem = getSessionSystemById(Number(targetSystemId));

      if (!fleet || !targetSystem) {
        return null;
      }

      return {
        fleet,
        targetSystem,
        corridorLabel: getCorridorLabel(
          fleet.system_id,
          targetSystem.system_id
        )
      };
    })
    .filter(
      (
        order
      ): order is {
        fleet: SessionFleet;
        targetSystem: SessionSystem;
        corridorLabel: string;
      } => order !== null
    );

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

              <section className="fleet-command-center">
                <div className="fleet-command-center-header">
                  <div>
                    <span className="fleet-command-kicker">Fleet command</span>
                    <h2>Issue coordinated orders</h2>
                    <p>
                      Add orders for any number of ready fleets, then execute the
                      complete command for 1 CP.
                    </p>
                  </div>

                  <div className="fleet-command-cost">
                    <strong>1 CP</strong>
                    <span>
                      {currentPlayer
                        ? `${currentPlayer.faction_name} · ${currentPlayer.command_points_left} CP left`
                        : "No active player"}
                    </span>
                  </div>
                </div>

                {!currentPlayer && (
                  <p className="action-hint">
                    No current player is available to issue fleet orders.
                  </p>
                )}

                {currentPlayer && currentPlayerFleets.length === 0 && (
                  <p className="action-hint">
                    The current player has no active fleets. Produce a unit or
                    pack a Colony into an Ark first.
                  </p>
                )}

                {currentPlayer && currentPlayerFleets.length > 0 && (
                  <div className="fleet-command-workspace">
                    <div className="fleet-command-builder">
                      <div className="fleet-command-step">
                        <span className="fleet-command-step-number">1</span>
                        <label>
                          Fleet
                          <select
                            value={selectedCommandFleet?.id ?? ""}
                            onChange={(event) =>
                              handleSelectCommandFleet(Number(event.target.value))
                            }
                            disabled={
                              isFleetCommandLoading ||
                              readyCommandFleets.length === 0
                            }
                          >
                            {readyCommandFleets.map((fleet) => (
                              <option key={fleet.id} value={fleet.id}>
                                {fleet.name} · {fleet.system_name ?? `System ${fleet.system_id}`} · {fleet.units.length}/5
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="fleet-command-step">
                        <span className="fleet-command-step-number">2</span>
                        <label>
                          Order
                          <select value="move_defend" disabled>
                            <option value="move_defend">
                              Move → Defensive Position
                            </option>
                          </select>
                        </label>
                      </div>

                      <div className="fleet-command-step">
                        <span className="fleet-command-step-number">3</span>
                        <label>
                          Move target
                          <select
                            value={effectiveCommandTargetSystemId ?? ""}
                            onChange={(event) =>
                              setSelectedCommandTargetSystemId(
                                Number(event.target.value)
                              )
                            }
                            disabled={
                              isFleetCommandLoading ||
                              !selectedCommandFleet ||
                              selectedCommandConnectedSystems.length === 0
                            }
                          >
                            {selectedCommandConnectedSystems.map((system) => (
                              <option
                                key={system.system_id}
                                value={system.system_id}
                              >
                                {system.system_name} · {getCorridorLabel(
                                  selectedCommandFleet?.system_id ?? 0,
                                  system.system_id
                                )}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <button
                        type="button"
                        className="fleet-command-add-button"
                        onClick={handleStageFleetOrder}
                        disabled={
                          isFleetCommandLoading ||
                          !selectedCommandFleet ||
                          selectedCommandConnectedSystems.length === 0
                        }
                      >
                        Add order
                      </button>
                    </div>

                    <div className="fleet-command-summary">
                      <div className="fleet-command-summary-header">
                        <div>
                          <h3>Prepared orders</h3>
                          <span>{stagedCommandOrders.length} selected</span>
                        </div>

                        {stagedCommandOrders.length > 0 && (
                          <button
                            type="button"
                            className="fleet-command-text-button"
                            onClick={handleClearFleetCommand}
                            disabled={isFleetCommandLoading}
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {stagedCommandOrders.length === 0 ? (
                        <p className="action-hint">
                          Add one or more fleet orders. The full package costs
                          only 1 CP.
                        </p>
                      ) : (
                        <div className="fleet-command-order-list">
                          {stagedCommandOrders.map(
                            ({ fleet, targetSystem, corridorLabel }) => (
                              <div
                                key={fleet.id}
                                className="fleet-command-order-row"
                              >
                                <div>
                                  <strong>{fleet.name}</strong>
                                  <span>
                                    {fleet.system_name ?? `System ${fleet.system_id}`}
                                    {" → "}
                                    {targetSystem.system_name}
                                  </span>
                                  <small>
                                    Move → Defensive Position · {corridorLabel}
                                  </small>
                                </div>

                                <button
                                  type="button"
                                  aria-label={`Remove order for ${fleet.name}`}
                                  onClick={() =>
                                    handleRemoveStagedFleetOrder(fleet.id)
                                  }
                                  disabled={isFleetCommandLoading}
                                >
                                  ×
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        className="fleet-command-execute-button"
                        onClick={handleExecuteFleetCommand}
                        disabled={
                          isFleetCommandLoading ||
                          stagedCommandOrders.length === 0 ||
                          currentPlayer.command_points_left <= 0
                        }
                      >
                        {isFleetCommandLoading
                          ? "Executing command..."
                          : "Execute Fleet Command · 1 CP"}
                      </button>

                      {actionErrors.fleetCommand && (
                        <p className="inline-action-error">
                          {actionErrors.fleetCommand}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>

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

                                        {getProductionOptionsForBuilding(
                                          buildingType
                                        ).length > 0 && (
                                          <div className="unit-production-panel">
                                            <strong>Production</strong>

                                            <div className="unit-production-list">
                                              {getProductionOptionsForBuilding(
                                                buildingType
                                              ).map((unitOption) => {
                                                const produceErrorKey = `produce-${firstBuilding.id}-${unitOption.unit_type}`;
                                                const unitResourceError =
                                                  getResourceShortageMessage(
                                                    currentPlayer,
                                                    unitOption.resourceCost
                                                  );

                                                return (
                                                  <div
                                                    key={unitOption.unit_type}
                                                    className="unit-production-row"
                                                  >
                                                    <button
                                                      type="button"
                                                      onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleProduceUnit(
                                                          firstBuilding,
                                                          unitOption
                                                        );
                                                      }}
                                                      disabled={
                                                        isProducingUnit ||
                                                        !canControl ||
                                                        Boolean(unitResourceError)
                                                      }
                                                    >
                                                      <span>{unitOption.icon}</span>
                                                      <span>
                                                        Produce {unitOption.name}
                                                        <small>
                                                          {unitOption.costText}
                                                        </small>
                                                        <small>
                                                          {unitOption.statsText}
                                                        </small>
                                                      </span>
                                                    </button>

                                                    {unitResourceError && (
                                                      <p className="inline-action-error">
                                                        {unitResourceError}
                                                      </p>
                                                    )}

                                                    {actionErrors[produceErrorKey] && (
                                                      <p className="inline-action-error">
                                                        {actionErrors[produceErrorKey]}
                                                      </p>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}

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
                      <h3>Fleets in system</h3>

                      {(() => {
                        if (!selectedSystem) {
                          return null;
                        }

                        const fleets = getFleetsInSystem(
                          selectedSystem.system_id
                        );

                        if (fleets.length === 0) {
                          return (
                            <p className="action-hint">
                              No fleets in this system.
                            </p>
                          );
                        }

                        return (
                          <div className="fleet-command-grid">
                            {fleets.map((fleet) => {
                              const owner = getFleetOwner(fleet);
                              const canPrepareOrder =
                                fleet.owner_player_id === currentPlayer?.id &&
                                !fleet.has_acted_this_round &&
                                session.status === "started";

                              return (
                                <div
                                  key={fleet.id}
                                  className="fleet-command-card"
                                >
                                  <div className="fleet-command-card-header">
                                    <strong>{fleet.name}</strong>
                                    <span>{getFleetStatusText(fleet)}</span>
                                  </div>

                                  <p>
                                    Owner: {owner?.faction_name ?? "Unknown"}
                                  </p>
                                  <p>Units: {fleet.units.length}/5</p>

                                  {fleet.units.length > 0 && (
                                    <div className="fleet-unit-strip">
                                      {fleet.units.map((unit) => (
                                        <span key={unit.id}>
                                          {getUnitDisplayName(unit)}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {canPrepareOrder && (
                                    <button
                                      type="button"
                                      className="fleet-command-prepare-button"
                                      onClick={() =>
                                        handleSelectCommandFleet(fleet.id)
                                      }
                                    >
                                      Prepare order
                                    </button>
                                  )}

                                  {fleet.has_acted_this_round && (
                                    <p className="action-hint">
                                      This fleet has already acted this round.
                                    </p>
                                  )}
                                </div>
                              );
                            })}
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
