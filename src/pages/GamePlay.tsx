import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
  FleetCommandOrderReport,
  FleetOrderType,
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


type PlayerVisual = {
  color: string;
  soft: string;
  glow: string;
  deep: string;
};

const PLAYER_VISUAL_PALETTE: PlayerVisual[] = [
  {
    color: "#9b7cff",
    soft: "rgba(155, 124, 255, 0.18)",
    glow: "rgba(155, 124, 255, 0.42)",
    deep: "#24194a"
  },
  {
    color: "#43d9ff",
    soft: "rgba(67, 217, 255, 0.16)",
    glow: "rgba(67, 217, 255, 0.4)",
    deep: "#103447"
  },
  {
    color: "#ff6d8d",
    soft: "rgba(255, 109, 141, 0.16)",
    glow: "rgba(255, 109, 141, 0.4)",
    deep: "#481a2a"
  },
  {
    color: "#ffcf5a",
    soft: "rgba(255, 207, 90, 0.16)",
    glow: "rgba(255, 207, 90, 0.38)",
    deep: "#463714"
  },
  {
    color: "#64e6a3",
    soft: "rgba(100, 230, 163, 0.16)",
    glow: "rgba(100, 230, 163, 0.38)",
    deep: "#123b2a"
  },
  {
    color: "#ff985f",
    soft: "rgba(255, 152, 95, 0.16)",
    glow: "rgba(255, 152, 95, 0.4)",
    deep: "#452719"
  }
];

const NEUTRAL_PLAYER_VISUAL: PlayerVisual = {
  color: "#9aa4bb",
  soft: "rgba(154, 164, 187, 0.14)",
  glow: "rgba(154, 164, 187, 0.24)",
  deep: "#222938"
};

function getFactionInitials(name: string | null | undefined): string {
  if (!name) {
    return "◇";
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "◇";
}

function getUnitIcon(unit: SessionUnit): string {
  if (unit.unit_type === "ark" || unit.state === "ark") {
    return "🚀";
  }

  const icons: Record<string, string> = {
    scout: "🛸",
    marine: "🪖",
    frigate: "🚢",
    cruiser: "🛳️"
  };

  return icons[unit.unit_type] ?? "◆";
}

function getFleetCombatRating(fleet: SessionFleet): number {
  return fleet.units.reduce(
    (total, unit) => total + unit.attack + unit.defense,
    0
  );
}

type ResourceCost = {
  matter?: number;
  energy?: number;
  data?: number;
  food?: number;
};

type ResourceKind = "matter" | "energy" | "data" | "food";

type ResourceBadgeProps = {
  kind: ResourceKind;
  value: number;
  compact?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
};

const RESOURCE_ORDER: ResourceKind[] = [
  "matter",
  "energy",
  "food",
  "data"
];

const RESOURCE_INFO: Record<
  ResourceKind,
  { label: string; shortLabel: string; icon: string }
> = {
  matter: {
    label: "Matter",
    shortLabel: "MAT",
    icon: "◆"
  },
  energy: {
    label: "Energy",
    shortLabel: "ENG",
    icon: "ϟ"
  },
  data: {
    label: "Data",
    shortLabel: "DAT",
    icon: "⌁"
  },
  food: {
    label: "Supply",
    shortLabel: "SUP",
    icon: "▰"
  }
};

function ResourceBadge({
  kind,
  value,
  compact = false,
  valuePrefix = "",
  valueSuffix = ""
}: ResourceBadgeProps) {
  const resource = RESOURCE_INFO[kind];

  return (
    <span
      className={[
        "archont-resource-badge",
        `archont-resource-${kind}`,
        compact ? "archont-resource-badge-compact" : ""
      ].join(" ")}
      title={`${resource.label}: ${valuePrefix}${value}${valueSuffix}`}
    >
      <i className="archont-resource-symbol" aria-hidden="true">
        {resource.icon}
      </i>
      <small className="archont-resource-label">
        {resource.shortLabel}
      </small>
      <strong className="archont-resource-value">
        {valuePrefix}{value}{valueSuffix}
      </strong>
    </span>
  );
}

type StagedFleetOrder = {
  order_type: FleetOrderType;
  target_system_id: number;
  second_target_system_id?: number;
  transfer_fleet_id?: number;
  transfer_fleet_target_system_id?: number;
  unit_ids_to_transfer_fleet?: number[];
  unit_ids_to_command_fleet?: number[];
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
    missingResources.push(`MAT: need ${cost.matter}, have ${player.matter}`);
  }

  if ((cost.energy ?? 0) > player.energy) {
    missingResources.push(`ENG: need ${cost.energy}, have ${player.energy}`);
  }

  if ((cost.data ?? 0) > player.data) {
    missingResources.push(`DAT: need ${cost.data}, have ${player.data}`);
  }

  if ((cost.food ?? 0) > player.food) {
    missingResources.push(`SUP: need ${cost.food}, have ${player.food}`);
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
    cost: "6 MAT / 2 ENG",
    income: "+2 MAT / round"
  },
  {
    type: "power_plant",
    name: "Power Plant",
    icon: "⚡",
    cost: "6 MAT / 3 ENG",
    income: "+2 ENG / round"
  },
  {
    type: "storage",
    name: "Supply Depot",
    icon: "📦",
    cost: "3 MAT / 2 ENG",
    income: "+1 SUP / round"
  },
  {
    type: "barracks",
    name: "Barracks",
    icon: "🛡️",
    cost: "8 MAT / 3 ENG",
    income: "Produces light units / Ark"
  },
  {
    type: "spaceport",
    name: "Spaceport",
    icon: "🛰️",
    cost: "10 MAT / 4 ENG / 1 DAT",
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
    income: "+2 MAT / round",
    produces: [],
    technologies: [],
    description: "Basic matter production building."
  },
  power_plant: {
    income: "+2 ENG / round",
    produces: [],
    technologies: [],
    description: "Basic energy production building."
  },
  energy_plant: {
    income: "+2 ENG / round",
    produces: [],
    technologies: [],
    description: "Alternative energy production building."
  },
  storage: {
    income: "+1 SUP / round",
    produces: [],
    technologies: [],
    description:
      "Supply building. Up to 2 Supply Depots can be built in one system."
  },
  research_center: {
    income: "+1 DAT / round",
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
    income: "+2 MAT / round, +2 ENG / round",
    produces: [],
    technologies: [],
    description: "A deployed colony makes the system colonized. It has no HP."
  }
};

type BuildingIncomeResource = {
  kind: ResourceKind;
  value: number;
};

const BUILDING_OVERVIEW_ICONS: Record<string, string> = {
  mine: "◆",
  power_plant: "ϟ",
  energy_plant: "ϟ",
  storage: "▰",
  research_center: "⌁",
  barracks: "⌬",
  spaceport: "◈",
  orbital_defense: "⬡",
  colony: "🏛"
};

function getBuildingOverviewIcon(buildingType: string): string {
  return BUILDING_OVERVIEW_ICONS[buildingType] ?? "◇";
}

function getBuildingIncomeResources(
  buildingType: string,
  buildingCount: number
): BuildingIncomeResource[] {
  const multiplier = Math.max(buildingCount, 1);

  switch (buildingType) {
    case "mine":
      return [{ kind: "matter", value: 2 * multiplier }];
    case "power_plant":
    case "energy_plant":
      return [{ kind: "energy", value: 2 * multiplier }];
    case "storage":
      return [{ kind: "food", value: 1 * multiplier }];
    case "research_center":
      return [{ kind: "data", value: 1 * multiplier }];
    case "colony":
      return [
        { kind: "matter", value: 2 * multiplier },
        { kind: "energy", value: 2 * multiplier }
      ];
    default:
      return [];
  }
}

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

function isUnitDamaged(unit: SessionUnit): boolean {
  return (
    unit.current_hp !== null &&
    unit.max_hp !== null &&
    unit.current_hp < unit.max_hp
  );
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
  const [selectedCommandOrderType, setSelectedCommandOrderType] =
    useState<FleetOrderType>("move_defend");
  const [selectedCommandTargetSystemId, setSelectedCommandTargetSystemId] =
    useState<number | null>(null);
  const [
    selectedCommandSecondTargetSystemId,
    setSelectedCommandSecondTargetSystemId
  ] = useState<number | null>(null);
  const [stagedFleetOrders, setStagedFleetOrders] = useState<
    Record<number, StagedFleetOrder>
  >({});
  const [selectedTransferFleetId, setSelectedTransferFleetId] =
    useState<number | null>(null);
  const [selectedUnitsToTransferFleet, setSelectedUnitsToTransferFleet] =
    useState<number[]>([]);
  const [selectedUnitsToCommandFleet, setSelectedUnitsToCommandFleet] =
    useState<number[]>([]);
  const [
    selectedTransferFleetMoveTargetSystemId,
    setSelectedTransferFleetMoveTargetSystemId
  ] = useState<number | null>(null);

  const [lastFleetCommandReport, setLastFleetCommandReport] = useState<
    FleetCommandOrderReport[]
  >([]);

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
    setSelectedCommandOrderType("move_defend");
    setSelectedCommandTargetSystemId(null);
    setSelectedCommandSecondTargetSystemId(null);
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

  function getDefaultSecondTargetSystemId(
    firstTargetSystemId: number | null
  ): number | null {
    if (!firstTargetSystemId) {
      return null;
    }

    return getConnectedSystems(firstTargetSystemId)[0]?.system_id ?? null;
  }

  function getReadyTransferFleets(
    systemId: number | null,
    sourceFleetId: number | null
  ): SessionFleet[] {
    if (!currentPlayer || systemId === null) {
      return [];
    }

    return currentPlayer.fleets.filter(
      (fleet) =>
        fleet.id !== sourceFleetId &&
        fleet.system_id === systemId &&
        !fleet.has_acted_this_round
    );
  }

  function resetTransferSelection(
    targetSystemId: number | null,
    sourceFleetId: number | null
  ) {
    const defaultTransferFleet = getReadyTransferFleets(
      targetSystemId,
      sourceFleetId
    )[0];

    setSelectedTransferFleetId(defaultTransferFleet?.id ?? null);
    setSelectedUnitsToTransferFleet([]);
    setSelectedUnitsToCommandFleet([]);
    setSelectedTransferFleetMoveTargetSystemId(null);
  }

  function toggleUnitSelection(
    unitId: number,
    selectedIds: number[],
    setSelectedIds: (value: number[]) => void
  ) {
    if (selectedIds.includes(unitId)) {
      setSelectedIds(selectedIds.filter((id) => id !== unitId));
      return;
    }

    setSelectedIds([...selectedIds, unitId]);
  }

  function handleSelectCommandFleet(fleetId: number) {
    const fleet = currentPlayer?.fleets.find(
      (candidate) => candidate.id === fleetId
    );

    setSelectedCommandFleetId(fleetId);

    const firstConnectedSystem = fleet
      ? getConnectedSystems(fleet.system_id)[0]
      : null;
    const firstTargetSystemId = firstConnectedSystem?.system_id ?? null;

    setSelectedCommandTargetSystemId(firstTargetSystemId);
    setSelectedCommandSecondTargetSystemId(
      selectedCommandOrderType === "move_move"
        ? getDefaultSecondTargetSystemId(firstTargetSystemId)
        : null
    );
    resetTransferSelection(firstTargetSystemId, fleetId);

    setActionErrors((current) => {
      const next = { ...current };
      delete next.fleetCommand;
      return next;
    });
  }

  function handleSelectCommandOrderType(orderType: FleetOrderType) {
    setSelectedCommandOrderType(orderType);

    if (orderType === "move_move") {
      setSelectedCommandSecondTargetSystemId(
        getDefaultSecondTargetSystemId(selectedCommandTargetSystemId)
      );
    } else {
      setSelectedCommandSecondTargetSystemId(null);
    }

    if (orderType === "move_transfer") {
      resetTransferSelection(
        selectedCommandTargetSystemId,
        selectedCommandFleetId
      );
    } else {
      setSelectedTransferFleetId(null);
      setSelectedUnitsToTransferFleet([]);
      setSelectedUnitsToCommandFleet([]);
      setSelectedTransferFleetMoveTargetSystemId(null);
    }

    setActionErrors((current) => {
      const next = { ...current };
      delete next.fleetCommand;
      return next;
    });
  }

  function handleSelectFirstMoveTarget(systemId: number) {
    setSelectedCommandTargetSystemId(systemId);

    if (selectedCommandOrderType === "move_move") {
      setSelectedCommandSecondTargetSystemId(
        getDefaultSecondTargetSystemId(systemId)
      );
    } else {
      setSelectedCommandSecondTargetSystemId(null);
    }

    if (selectedCommandOrderType === "move_transfer") {
      resetTransferSelection(systemId, selectedCommandFleetId);
    }

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

    const firstStepSystems = getConnectedSystems(fleet.system_id);
    const firstTargetSystemId =
      selectedCommandTargetSystemId ??
      firstStepSystems[0]?.system_id ??
      null;

    if (!firstTargetSystemId) {
      setActionErrors({
        fleetCommand: "The selected fleet has no connected target system."
      });
      return;
    }

    if (
      !firstStepSystems.some(
        (system) => system.system_id === firstTargetSystemId
      )
    ) {
      setActionErrors({
        fleetCommand: "Select a valid first movement corridor."
      });
      return;
    }

    let secondTargetSystemId: number | undefined;
    let transferFleetId: number | undefined;
    let transferFleetTargetSystemId: number | undefined;
    let unitIdsToTransferFleet: number[] | undefined;
    let unitIdsToCommandFleet: number[] | undefined;

    if (selectedCommandOrderType === "move_move") {
      const secondStepSystems = getConnectedSystems(firstTargetSystemId);
      const selectedSecondTarget =
        selectedCommandSecondTargetSystemId ??
        secondStepSystems[0]?.system_id ??
        null;

      if (!selectedSecondTarget) {
        setActionErrors({
          fleetCommand:
            "Select the second movement system before adding the order."
        });
        return;
      }

      if (
        !secondStepSystems.some(
          (system) => system.system_id === selectedSecondTarget
        )
      ) {
        setActionErrors({
          fleetCommand:
            "The second movement must use a corridor connected to the first selected system."
        });
        return;
      }

      secondTargetSystemId = selectedSecondTarget;
    }

    if (selectedCommandOrderType === "move_transfer") {
      const transferFleet = availableFleets.find(
        (candidate) => candidate.id === selectedTransferFleetId
      );

      if (
        !transferFleet ||
        transferFleet.id === fleet.id ||
        transferFleet.system_id !== firstTargetSystemId
      ) {
        setActionErrors({
          fleetCommand:
            "Select a ready friendly fleet in the destination system."
        });
        return;
      }

      const reservedFleetIds = new Set<number>();

      for (const [stagedFleetId, stagedOrder] of Object.entries(
        stagedFleetOrders
      )) {
        if (Number(stagedFleetId) === fleet.id) {
          continue;
        }

        reservedFleetIds.add(Number(stagedFleetId));

        if (stagedOrder.transfer_fleet_id !== undefined) {
          reservedFleetIds.add(stagedOrder.transfer_fleet_id);
        }
      }

      if (reservedFleetIds.has(transferFleet.id)) {
        setActionErrors({
          fleetCommand:
            "The transfer fleet already participates in another prepared order."
        });
        return;
      }

      if (
        selectedUnitsToTransferFleet.length === 0 &&
        selectedUnitsToCommandFleet.length === 0
      ) {
        setActionErrors({
          fleetCommand: "Select at least one unit to transfer."
        });
        return;
      }

      const sourceProjectedCount =
        fleet.units.length -
        selectedUnitsToTransferFleet.length +
        selectedUnitsToCommandFleet.length;
      const transferProjectedCount =
        transferFleet.units.length -
        selectedUnitsToCommandFleet.length +
        selectedUnitsToTransferFleet.length;

      if (sourceProjectedCount > 5 || transferProjectedCount > 5) {
        setActionErrors({
          fleetCommand:
            "The selected transfer would exceed the 5-unit fleet limit."
        });
        return;
      }

      transferFleetId = transferFleet.id;
      unitIdsToTransferFleet = [...selectedUnitsToTransferFleet];
      unitIdsToCommandFleet = [...selectedUnitsToCommandFleet];

      if (selectedTransferFleetMoveTargetSystemId !== null) {
        const remainingMoveSystems = getConnectedSystems(
          transferFleet.system_id
        );

        if (
          !remainingMoveSystems.some(
            (system) =>
              system.system_id ===
              selectedTransferFleetMoveTargetSystemId
          )
        ) {
          setActionErrors({
            fleetCommand:
              "The receiving fleet's remaining move must use a connected corridor."
          });
          return;
        }

        if (transferProjectedCount <= 0) {
          setActionErrors({
            fleetCommand:
              "The receiving fleet cannot move because it would contain no units after transfer."
          });
          return;
        }

        transferFleetTargetSystemId =
          selectedTransferFleetMoveTargetSystemId;
      }
    }

    setStagedFleetOrders((current) => ({
      ...current,
      [fleet.id]: {
        order_type: selectedCommandOrderType,
        target_system_id: firstTargetSystemId,
        second_target_system_id: secondTargetSystemId,
        transfer_fleet_id: transferFleetId,
        transfer_fleet_target_system_id: transferFleetTargetSystemId,
        unit_ids_to_transfer_fleet: unitIdsToTransferFleet,
        unit_ids_to_command_fleet: unitIdsToCommandFleet
      }
    }));

    const additionallyReservedFleetId = transferFleetId;
    const remainingFleet = availableFleets.find(
      (candidate) =>
        candidate.id !== fleet.id &&
        candidate.id !== additionallyReservedFleetId &&
        stagedFleetOrders[candidate.id] === undefined
    );

    if (remainingFleet) {
      const firstTarget = getConnectedSystems(remainingFleet.system_id)[0];
      const firstTargetSystemIdForNextFleet = firstTarget?.system_id ?? null;

      setSelectedCommandFleetId(remainingFleet.id);
      setSelectedCommandTargetSystemId(firstTargetSystemIdForNextFleet);
      setSelectedCommandSecondTargetSystemId(
        selectedCommandOrderType === "move_move"
          ? getDefaultSecondTargetSystemId(firstTargetSystemIdForNextFleet)
          : null
      );
      resetTransferSelection(
        firstTargetSystemIdForNextFleet,
        remainingFleet.id
      );
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
      ([fleetId, order]) => ({
        fleet_id: Number(fleetId),
        order_type: order.order_type,
        target_system_id: order.target_system_id,
        ...(order.second_target_system_id !== undefined
          ? {
              second_target_system_id: order.second_target_system_id
            }
          : {}),
        ...(order.transfer_fleet_id !== undefined
          ? {
              transfer_fleet_id: order.transfer_fleet_id,
              ...(order.transfer_fleet_target_system_id !== undefined
                ? {
                    transfer_fleet_target_system_id:
                      order.transfer_fleet_target_system_id
                  }
                : {}),
              unit_ids_to_transfer_fleet:
                order.unit_ids_to_transfer_fleet ?? [],
              unit_ids_to_command_fleet:
                order.unit_ids_to_command_fleet ?? []
            }
          : {})
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

      const result = await issueFleetCommand(session.id, {
        orders
      });

      setSession(result.session);
      setLastFleetCommandReport(result.command_report);
      setStagedFleetOrders({});
      selectCurrentPlayerFromSession(result.session);
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


  function getPlayerById(playerId: number | null | undefined): SessionPlayer | null {
    if (playerId === null || playerId === undefined) {
      return null;
    }

    return session?.players.find((player) => player.id === playerId) ?? null;
  }

  function getPlayerVisual(playerId: number | null | undefined): PlayerVisual {
    if (!session || playerId === null || playerId === undefined) {
      return NEUTRAL_PLAYER_VISUAL;
    }

    const playerIndex = session.players.findIndex(
      (player) => player.id === playerId
    );

    if (playerIndex < 0) {
      return NEUTRAL_PLAYER_VISUAL;
    }

    return PLAYER_VISUAL_PALETTE[
      playerIndex % PLAYER_VISUAL_PALETTE.length
    ] ?? NEUTRAL_PLAYER_VISUAL;
  }

  function getPlayerVisualStyle(
    playerId: number | null | undefined
  ): CSSProperties {
    const visual = getPlayerVisual(playerId);

    return {
      "--player-color": visual.color,
      "--player-color-soft": visual.soft,
      "--player-color-glow": visual.glow,
      "--player-color-deep": visual.deep
    } as CSSProperties;
  }

  function getOwnershipRelation(
    ownerPlayerId: number | null | undefined
  ): "friendly" | "hostile" | "neutral" {
    if (ownerPlayerId === null || ownerPlayerId === undefined) {
      return "neutral";
    }

    if (currentPlayer && ownerPlayerId === currentPlayer.id) {
      return "friendly";
    }

    return "hostile";
  }

  function getOwnershipLabel(
    ownerPlayerId: number | null | undefined
  ): string {
    const relation = getOwnershipRelation(ownerPlayerId);

    if (relation === "friendly") {
      return "YOUR CONTROL";
    }

    if (relation === "hostile") {
      return "RIVAL CONTROL";
    }

    return "UNCHARTED";
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

  function getCorridorDangerCards(
    fromSystemId: number,
    toSystemId: number
  ): number {
    const connection = (mapDetails?.connections ?? []).find(
      (candidate) =>
        (candidate.from_system_id === fromSystemId &&
          candidate.to_system_id === toSystemId) ||
        (candidate.from_system_id === toSystemId &&
          candidate.to_system_id === fromSystemId)
    );

    if (!connection) {
      return 0;
    }

    if (connection.is_wraparound) {
      return 2;
    }

    return connection.is_dangerous ? 1 : 0;
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
  const selectedCommandSecondStepSystems =
    selectedCommandOrderType === "move_move" &&
    effectiveCommandTargetSystemId !== null
      ? getConnectedSystems(effectiveCommandTargetSystemId)
      : [];
  const effectiveCommandSecondTargetSystemId =
    selectedCommandOrderType === "move_move"
      ? selectedCommandSecondTargetSystemId ??
        selectedCommandSecondStepSystems[0]?.system_id ??
        null
      : null;
  const availableTransferFleets =
    selectedCommandOrderType === "move_transfer"
      ? getReadyTransferFleets(
          effectiveCommandTargetSystemId,
          selectedCommandFleet?.id ?? null
        )
      : [];
  const effectiveTransferFleet =
    availableTransferFleets.find(
      (fleet) => fleet.id === selectedTransferFleetId
    ) ?? availableTransferFleets[0] ?? null;
  const projectedCommandFleetCount = selectedCommandFleet
    ? selectedCommandFleet.units.length -
      selectedUnitsToTransferFleet.length +
      selectedUnitsToCommandFleet.length
    : 0;
  const projectedTransferFleetCount = effectiveTransferFleet
    ? effectiveTransferFleet.units.length -
      selectedUnitsToCommandFleet.length +
      selectedUnitsToTransferFleet.length
    : 0;
  const transferCapacityInvalid =
    projectedCommandFleetCount > 5 || projectedTransferFleetCount > 5;
  const transferFleetRemainingMoveSystems = effectiveTransferFleet
    ? getConnectedSystems(effectiveTransferFleet.system_id)
    : [];
  const selectedTransferFleetMoveDangerCards =
    effectiveTransferFleet &&
    selectedTransferFleetMoveTargetSystemId !== null
      ? getCorridorDangerCards(
          effectiveTransferFleet.system_id,
          selectedTransferFleetMoveTargetSystemId
        )
      : 0;
  const selectedRouteFirstDangerCards =
    selectedCommandFleet && effectiveCommandTargetSystemId
      ? getCorridorDangerCards(
          selectedCommandFleet.system_id,
          effectiveCommandTargetSystemId
        )
      : 0;
  const selectedRouteSecondDangerCards =
    selectedCommandOrderType === "move_move" &&
    effectiveCommandTargetSystemId &&
    effectiveCommandSecondTargetSystemId
      ? getCorridorDangerCards(
          effectiveCommandTargetSystemId,
          effectiveCommandSecondTargetSystemId
        )
      : 0;
  const selectedRouteTotalDangerCards =
    selectedRouteFirstDangerCards +
    selectedRouteSecondDangerCards +
    selectedTransferFleetMoveDangerCards;

  const stagedCommandOrders = Object.entries(stagedFleetOrders)
    .map(([fleetId, order]) => {
      const fleet = currentPlayerFleets.find(
        (candidate) => candidate.id === Number(fleetId)
      );
      const firstTargetSystem = getSessionSystemById(order.target_system_id);
      const secondTargetSystem =
        order.second_target_system_id !== undefined
          ? getSessionSystemById(order.second_target_system_id)
          : null;
      const transferFleet =
        order.transfer_fleet_id !== undefined
          ? currentPlayerFleets.find(
              (candidate) => candidate.id === order.transfer_fleet_id
            ) ?? null
          : null;
      const transferFleetTargetSystem =
        order.transfer_fleet_target_system_id !== undefined
          ? getSessionSystemById(
              order.transfer_fleet_target_system_id
            )
          : null;

      if (
        !fleet ||
        !firstTargetSystem ||
        (order.order_type === "move_move" && !secondTargetSystem) ||
        (order.order_type === "move_transfer" && !transferFleet)
      ) {
        return null;
      }

      const firstCorridorLabel = getCorridorLabel(
        fleet.system_id,
        firstTargetSystem.system_id
      );
      const secondCorridorLabel = secondTargetSystem
        ? getCorridorLabel(
            firstTargetSystem.system_id,
            secondTargetSystem.system_id
          )
        : null;
      const totalDangerCards =
        getCorridorDangerCards(
          fleet.system_id,
          firstTargetSystem.system_id
        ) +
        (secondTargetSystem
          ? getCorridorDangerCards(
              firstTargetSystem.system_id,
              secondTargetSystem.system_id
            )
          : 0) +
        (transferFleet && transferFleetTargetSystem
          ? getCorridorDangerCards(
              transferFleet.system_id,
              transferFleetTargetSystem.system_id
            )
          : 0);

      return {
        fleet,
        orderType: order.order_type,
        firstTargetSystem,
        secondTargetSystem,
        transferFleet,
        transferFleetTargetSystem,
        unitsToTransferFleetCount:
          order.unit_ids_to_transfer_fleet?.length ?? 0,
        unitsToCommandFleetCount:
          order.unit_ids_to_command_fleet?.length ?? 0,
        firstCorridorLabel,
        secondCorridorLabel,
        totalDangerCards
      };
    })
    .filter((order) => order !== null);

  const totalFleetCount = session
    ? session.players.reduce(
        (total, player) => total + (player.fleets?.length ?? 0),
        0
      )
    : 0;
  const totalUnitCount = session
    ? session.systems.reduce(
        (total, system) => total + (system.units?.length ?? 0),
        0
      )
    : 0;
  const currentPlayerOwnedSystems = session && currentPlayer
    ? session.systems.filter(
        (system) => system.owner_player_id === currentPlayer.id
      ).length
    : 0;
  const selectedSystemOwner = selectedSystem
    ? getPlayerById(selectedSystem.owner_player_id)
    : null;
  const selectedSystemRelation = selectedSystem
    ? getOwnershipRelation(selectedSystem.owner_player_id)
    : "neutral";

  return (
    <div
      className="game-page game-simulation-page archont-gameplay-shell"
      style={getPlayerVisualStyle(currentPlayer?.id)}
    >
      <header className="game-header archont-command-header">
        <div className="archont-brand-lockup">
          <div className="archont-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div>
            <span className="archont-eyebrow">Tabletop command interface</span>
            <h1>ARCHONT</h1>
            <p>Lead a civilization through the ruins of a fractured galaxy.</p>
          </div>
        </div>

        <button
          className="archont-sync-button"
          onClick={loadSession}
          disabled={isLoading}
        >
          <span aria-hidden="true">↻</span>
          {isLoading ? "Synchronizing..." : "Synchronize board"}
        </button>
      </header>

      {error && <div className="game-error archont-alert">{error}</div>}

      {session && (
        <>
          <section
            className="game-panel archont-session-command-deck"
            style={getPlayerVisualStyle(currentPlayer?.id)}
          >
            <div className="archont-session-identity">
              <span className="archont-eyebrow">
                Session {session.id} · {session.play_mode}
              </span>
              <h2>{session.name}</h2>
              <div className="archont-session-tags">
                <span>{session.status}</span>
                <span>{session.round_phase} phase</span>
                <span>{session.players_count} commanders</span>
              </div>
            </div>

            <div className="archont-command-stats" aria-label="Game status">
              <article>
                <span>ROUND</span>
                <strong>{session.current_round}</strong>
                <small>Operational cycle</small>
              </article>
              <article>
                <span>CONTROL</span>
                <strong>{currentPlayerOwnedSystems}</strong>
                <small>Your systems</small>
              </article>
              <article>
                <span>FLEETS</span>
                <strong>{totalFleetCount}</strong>
                <small>Across the board</small>
              </article>
              <article>
                <span>UNITS</span>
                <strong>{totalUnitCount}</strong>
                <small>Deployed assets</small>
              </article>
            </div>

            <div className="archont-active-commander">
              <div className="archont-commander-emblem">
                {getFactionInitials(currentPlayer?.faction_name)}
              </div>

              <div className="archont-commander-copy">
                <span>Active commander</span>
                <strong>
                  {currentPlayer?.faction_name ?? "No active player"}
                </strong>
                <small>
                  {currentPlayer?.civilization_name ?? "No civilization"}
                </small>
              </div>

              <div className="archont-cp-display">
                <span>Command points</span>
                <div className="archont-cp-pips">
                  {Array.from({ length: COMMAND_POINTS_PER_ROUND }).map(
                    (_, index) => (
                      <i
                        key={index}
                        className={
                          index < (currentPlayer?.command_points_left ?? 0)
                            ? "active"
                            : ""
                        }
                      />
                    )
                  )}
                </div>
                <strong>
                  {currentPlayer?.command_points_left ?? 0}/
                  {COMMAND_POINTS_PER_ROUND}
                </strong>
              </div>

              <div className="turn-actions archont-turn-actions">
                <button
                  type="button"
                  onClick={handleEndTurn}
                  disabled={
                    isTurnActionLoading ||
                    session.status !== "started" ||
                    !currentPlayer
                  }
                >
                  {isTurnActionLoading ? "Processing..." : "End turn · 1 CP"}
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={handlePassTurn}
                  disabled={
                    isTurnActionLoading ||
                    session.status !== "started" ||
                    !currentPlayer
                  }
                >
                  {isTurnActionLoading ? "Processing..." : "Pass round"}
                </button>
              </div>
            </div>
          </section>

          <section className="simulation-layout archont-game-board-layout archont-board-stack">
            <aside className="simulation-sidebar players-sidebar archont-players-ribbon">
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
                      className={[
                        "compact-player-card",
                        "archont-player-card",
                        isSelected ? "selected" : "",
                        isCurrentPlayer ? "current" : "",
                        player.has_passed ? "passed" : ""
                      ].join(" ")}
                      style={getPlayerVisualStyle(player.id)}
                      key={player.id}
                      onClick={() => handleSelectPlayer(player)}
                    >
                      <span className="archont-player-accent" />

                      <div className="compact-player-header archont-player-header">
                        <span className="archont-player-emblem">
                          {getFactionInitials(player.faction_name)}
                        </span>

                        <span className="archont-player-identity">
                          <strong>{player.faction_name}</strong>
                          <small>
                            {player.civilization_name ?? "Unknown civilization"}
                          </small>
                        </span>

                        <span className="archont-player-state-badge">
                          {isCurrentPlayer
                            ? "ACTIVE"
                            : player.has_passed
                              ? "PASSED"
                              : "STANDBY"}
                        </span>
                      </div>

                      <div className="resource-icons archont-resource-grid">
                        <ResourceBadge kind="matter" value={player.matter} />
                        <ResourceBadge kind="energy" value={player.energy} />
                        <ResourceBadge kind="food" value={player.food} />
                        <ResourceBadge kind="data" value={player.data} />
                      </div>

                      <div className="archont-player-operational-row">
                        <span>
                          <small>Systems</small>
                          <strong>
                            {session.systems.filter(
                              (system) => system.owner_player_id === player.id
                            ).length}
                          </strong>
                        </span>
                        <span>
                          <small>Structures</small>
                          <strong>{playerBuildings.length}</strong>
                        </span>
                        <span>
                          <small>Fleets</small>
                          <strong>{player.fleets?.length ?? 0}/4</strong>
                        </span>
                      </div>

                      <div className="archont-player-cp-row">
                        <span>{player.nickname ?? `User ${player.user_id}`}</span>
                        <span className="archont-mini-cp-pips">
                          {Array.from({ length: COMMAND_POINTS_PER_ROUND }).map(
                            (_, index) => (
                              <i
                                key={index}
                                className={
                                  index < player.command_points_left
                                    ? "active"
                                    : ""
                                }
                              />
                            )
                          )}
                        </span>
                      </div>

                      {(player.fleets?.length ?? 0) > 0 && (
                        <div className="compact-fleet-list archont-compact-fleet-list">
                          {player.fleets.map((fleet) => (
                            <div key={fleet.id} className="compact-fleet-row">
                              <span>
                                <strong>{fleet.name}</strong>
                                <small>
                                  {fleet.system_name ?? `System ${fleet.system_id}`}
                                </small>
                              </span>
                              <span className="archont-fleet-mini-status">
                                <b>{fleet.units.length}/5</b>
                                <i>{getFleetStatusText(fleet)}</i>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="map-panel archont-map-stage">
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
    className="game-map-connections archont-corridor-layer"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    aria-label="Galactic corridor network"
  >
    {(mapDetails?.connections ?? []).map((connection) => {
      const fromSystem = getSessionSystemById(connection.from_system_id);
      const toSystem = getSessionSystemById(connection.to_system_id);

      if (!fromSystem || !toSystem) {
        return null;
      }

      const fromPoint = getSystemPoint(fromSystem, mapDetails);
      const toPoint = getSystemPoint(toSystem, mapDetails);
      const corridorType = connection.is_wraparound
        ? "wraparound"
        : connection.is_dangerous
          ? "dangerous"
          : "safe";
      const corridorTitle = `${fromSystem.system_name} ↔ ${toSystem.system_name} · ${corridorType} corridor`;

      const renderCorridorSegment = (
        segment: { x1: number; y1: number; x2: number; y2: number },
        segmentKey: string
      ) => {
        const markerX = (segment.x1 + segment.x2) / 2;
        const markerY = (segment.y1 + segment.y2) / 2;

        return (
          <g
            key={segmentKey}
            className={`archont-corridor archont-corridor-${corridorType}`}
          >
            <title>{corridorTitle}</title>

            <line
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              className="game-map-connection corridor-track"
            />

            <line
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              className="game-map-connection corridor-core"
            />

            {corridorType === "dangerous" && (
              <g
                className="corridor-risk-marker corridor-risk-marker-dangerous"
                transform={`translate(${markerX} ${markerY})`}
              >
                <polygon points="0,-1.55 1.55,0 0,1.55 -1.55,0" />
                <circle r="0.34" />
              </g>
            )}

            {corridorType === "wraparound" && (
              <g
                className="corridor-risk-marker corridor-risk-marker-wraparound"
                transform={`translate(${markerX} ${markerY})`}
              >
                <circle r="1.62" />
                <circle r="0.62" />
              </g>
            )}
          </g>
        );
      };

      if (connection.is_wraparound) {
        const segments = getWraparoundLineSegments(fromPoint, toPoint);

        return (
          <g key={connection.id}>
            {segments.map((segment, index) =>
              renderCorridorSegment(
                segment,
                `${connection.id}-${index}`
              )
            )}
          </g>
        );
      }

      return renderCorridorSegment(
        {
          x1: fromPoint.x,
          y1: fromPoint.y,
          x2: toPoint.x,
          y2: toPoint.y
        },
        String(connection.id)
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
    const systemFleets = getFleetsInSystem(system.system_id);
    const friendlyFleetCount = currentPlayer
      ? systemFleets.filter(
          (fleet) => fleet.owner_player_id === currentPlayer.id
        ).length
      : 0;
    const hostileFleetCount = currentPlayer
      ? systemFleets.filter(
          (fleet) => fleet.owner_player_id !== currentPlayer.id
        ).length
      : systemFleets.length;
    const ownerPlayer = getPlayerById(system.owner_player_id);
    const ownershipRelation = getOwnershipRelation(system.owner_player_id);

    const systemVisualClass = getGameplaySystemVisualClass(system.system_id);
    const systemTypeLabel = getSystemTypeLabel(system.system_id);

    return (
      <button
        key={system.system_id}
        className={[
          "map-system-node",
          "compact-map-system-node",
          "archont-system-node",
          system.owner_player_id ? "owned" : "neutral",
          `ownership-${ownershipRelation}`,
          systemVisualClass,
          isSelected ? "selected" : "",
          isControlledBySelectedPlayer ? "selectable" : ""
        ].join(" ")}
        style={{
          left: position.left,
          top: position.top,
          ...getPlayerVisualStyle(system.owner_player_id)
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
        <span className="archont-system-orbit" />
        <span className="archont-system-core">
          {getFactionInitials(ownerPlayer?.faction_name)}
        </span>

        <span className="archont-system-content">
          {systemTypeLabel && (
            <span className="compact-system-type-badge">
              {systemTypeLabel}
            </span>
          )}

          <span className="compact-system-title">
            {system.system_name}
          </span>

          <span className="compact-system-owner">
            {getOwnershipLabel(system.owner_player_id)}
          </span>

          <span className="compact-system-icons">
            {buildingsCount > 0 && (
              <span title="Structures">▦ {buildingsCount}</span>
            )}
            {unitsCount > 0 && <span title="Units">◆ {unitsCount}</span>}
            {friendlyFleetCount > 0 && (
              <span className="friendly-presence" title="Your fleets">
                ▲ {friendlyFleetCount}
              </span>
            )}
            {hostileFleetCount > 0 && (
              <span className="hostile-presence" title="Rival fleets">
                ⚠ {hostileFleetCount}
              </span>
            )}
          </span>
        </span>
      </button>
    );
  })}
</div>

<div className="game-map-legend archont-map-legend">
    <span className="legend-line-safe">Safe corridor</span>
    <span className="legend-line-dangerous">Dangerous corridor</span>
    <span className="legend-line-wraparound">Wraparound corridor</span>
    <span className="legend-ownership-friendly">Your control</span>
    <span className="legend-ownership-hostile">Rival control</span>
    <span className="legend-ownership-neutral">Uncharted</span>
  </div>

              <aside
                className="simulation-sidebar build-sidebar archont-construction-ribbon"
                style={getPlayerVisualStyle(currentPlayer?.id)}
              >
              <h2>Construction</h2>
              <div className="acting-player-card">
                <span>Acting player</span>
                <strong>{currentPlayer?.faction_name ?? "No active player"}</strong>
                <small>
                  {currentPlayer
                    ? `CP: ${currentPlayer.command_points_left}/${COMMAND_POINTS_PER_ROUND}`
                    : "No turn state"}
                </small>

                {currentPlayer && (
                  <div
                    className="archont-construction-resource-grid"
                    aria-label="Active player resources"
                  >
                    <ResourceBadge
                      kind="matter"
                      value={currentPlayer.matter}
                      compact
                    />
                    <ResourceBadge
                      kind="energy"
                      value={currentPlayer.energy}
                      compact
                    />
                    <ResourceBadge
                      kind="food"
                      value={currentPlayer.food}
                      compact
                    />
                    <ResourceBadge
                      kind="data"
                      value={currentPlayer.data}
                      compact
                    />
                  </div>
                )}
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

                      <span
                        className="building-cost-resources"
                        aria-label={`${building.name} resource cost`}
                      >
                        {RESOURCE_ORDER.map((kind) => {
                          const amount = BUILDING_COSTS[building.type][kind] ?? 0;

                          return amount > 0 ? (
                            <ResourceBadge
                              key={kind}
                              kind={kind}
                              value={amount}
                              compact
                            />
                          ) : null;
                        })}
                      </span>

                      <small className="building-effect">{building.income}</small>
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
                {isBuilding ? "Building..." : "Build · 1 CP"}
              </button>
              </aside>

              <section className="fleet-command-center">
                <div className="fleet-command-center-header">
                  <div>
                    <span className="fleet-command-kicker">Fleet command</span>
                    <h2>Issue coordinated orders</h2>
                    <p>
                      Select every movement step manually. The interface shows
                      each corridor and its danger before the command is added.
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
                          <select
                            value={selectedCommandOrderType}
                            onChange={(event) =>
                              handleSelectCommandOrderType(
                                event.target.value as FleetOrderType
                              )
                            }
                            disabled={isFleetCommandLoading}
                          >
                            <option value="move_defend">
                              Move → Defensive Position
                            </option>
                            <option value="move_move">
                              Move → Move
                            </option>
                            <option value="move_transfer">
                              Move → Transfer
                            </option>
                          </select>
                        </label>
                      </div>

                      <div className="fleet-command-step">
                        <span className="fleet-command-step-number">3</span>
                        <label>
                          First movement
                          <select
                            value={effectiveCommandTargetSystemId ?? ""}
                            onChange={(event) =>
                              handleSelectFirstMoveTarget(
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

                      {selectedCommandOrderType === "move_move" && (
                        <div className="fleet-command-step">
                          <span className="fleet-command-step-number">4</span>
                          <label>
                            Second movement
                            <select
                              value={
                                effectiveCommandSecondTargetSystemId ?? ""
                              }
                              onChange={(event) =>
                                setSelectedCommandSecondTargetSystemId(
                                  Number(event.target.value)
                                )
                              }
                              disabled={
                                isFleetCommandLoading ||
                                effectiveCommandTargetSystemId === null ||
                                selectedCommandSecondStepSystems.length === 0
                              }
                            >
                              {selectedCommandSecondStepSystems.map((system) => (
                                <option
                                  key={system.system_id}
                                  value={system.system_id}
                                >
                                  {system.system_name} · {getCorridorLabel(
                                    effectiveCommandTargetSystemId ?? 0,
                                    system.system_id
                                  )}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}

                      {selectedCommandOrderType === "move_transfer" && (
                        <div className="fleet-transfer-workspace">
                          <div className="fleet-transfer-section-heading">
                            <div>
                              <span>TRANSFER PHASE</span>
                              <strong>Choose the partner fleet</strong>
                            </div>
                            <p>
                              Transfer does not repair units. Damaged units remain
                              selectable and keep their current HP.
                            </p>
                          </div>

                          {availableTransferFleets.length > 0 ? (
                            <div className="fleet-transfer-fleet-picker">
                              {availableTransferFleets.map((fleet) => {
                                const isSelected =
                                  effectiveTransferFleet?.id === fleet.id;

                                return (
                                  <button
                                    key={fleet.id}
                                    type="button"
                                    className={
                                      isSelected
                                        ? "fleet-transfer-fleet-card fleet-transfer-fleet-card-selected"
                                        : "fleet-transfer-fleet-card"
                                    }
                                    onClick={() => {
                                      setSelectedTransferFleetId(fleet.id);
                                      setSelectedUnitsToTransferFleet([]);
                                      setSelectedUnitsToCommandFleet([]);
                                      setSelectedTransferFleetMoveTargetSystemId(
                                        null
                                      );
                                    }}
                                    disabled={isFleetCommandLoading}
                                  >
                                    <strong>{fleet.name}</strong>
                                    <span>{fleet.units.length}/5 units</span>
                                    <small>
                                      {fleet.system_name ??
                                        `System ${fleet.system_id}`}
                                    </small>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="inline-action-error">
                              No ready friendly fleet is waiting in the selected
                              destination system.
                            </p>
                          )}

                          {effectiveTransferFleet && selectedCommandFleet && (
                            <>
                              <div className="fleet-transfer-board">
                                <div className="fleet-transfer-side">
                                  <div className="fleet-transfer-side-title">
                                    <strong>{selectedCommandFleet.name}</strong>
                                    <span>Arriving fleet</span>
                                  </div>

                                  <div className="fleet-transfer-unit-grid">
                                    {selectedCommandFleet.units.map((unit) => {
                                      const isSelected =
                                        selectedUnitsToTransferFleet.includes(
                                          unit.id
                                        );
                                      const damaged = isUnitDamaged(unit);

                                      return (
                                        <button
                                          key={unit.id}
                                          type="button"
                                          className={[
                                            "fleet-transfer-unit-card",
                                            isSelected
                                              ? "fleet-transfer-unit-card-selected"
                                              : "",
                                            damaged
                                              ? "fleet-transfer-unit-card-damaged"
                                              : ""
                                          ]
                                            .filter(Boolean)
                                            .join(" ")}
                                          onClick={() =>
                                            toggleUnitSelection(
                                              unit.id,
                                              selectedUnitsToTransferFleet,
                                              setSelectedUnitsToTransferFleet
                                            )
                                          }
                                          disabled={isFleetCommandLoading}
                                        >
                                          <span className="fleet-transfer-unit-direction">
                                            {isSelected ? "SEND →" : "STAY"}
                                          </span>
                                          <strong>
                                            {getUnitDisplayName(unit)}
                                          </strong>
                                          <small>{getUnitHpText(unit)}</small>
                                          {damaged && <em>DAMAGED · transferable</em>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="fleet-transfer-flow">
                                  <span>⇄</span>
                                  <strong>Exchange</strong>
                                  <small>Click unit cards to change side</small>
                                </div>

                                <div className="fleet-transfer-side">
                                  <div className="fleet-transfer-side-title">
                                    <strong>{effectiveTransferFleet.name}</strong>
                                    <span>Receiving fleet</span>
                                  </div>

                                  <div className="fleet-transfer-unit-grid">
                                    {effectiveTransferFleet.units.map((unit) => {
                                      const isSelected =
                                        selectedUnitsToCommandFleet.includes(
                                          unit.id
                                        );
                                      const damaged = isUnitDamaged(unit);

                                      return (
                                        <button
                                          key={unit.id}
                                          type="button"
                                          className={[
                                            "fleet-transfer-unit-card",
                                            isSelected
                                              ? "fleet-transfer-unit-card-selected fleet-transfer-unit-card-reverse"
                                              : "",
                                            damaged
                                              ? "fleet-transfer-unit-card-damaged"
                                              : ""
                                          ]
                                            .filter(Boolean)
                                            .join(" ")}
                                          onClick={() =>
                                            toggleUnitSelection(
                                              unit.id,
                                              selectedUnitsToCommandFleet,
                                              setSelectedUnitsToCommandFleet
                                            )
                                          }
                                          disabled={isFleetCommandLoading}
                                        >
                                          <span className="fleet-transfer-unit-direction">
                                            {isSelected ? "← SEND" : "STAY"}
                                          </span>
                                          <strong>
                                            {getUnitDisplayName(unit)}
                                          </strong>
                                          <small>{getUnitHpText(unit)}</small>
                                          {damaged && <em>DAMAGED · transferable</em>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              <div
                                className={`fleet-transfer-capacity ${
                                  transferCapacityInvalid
                                    ? "fleet-transfer-capacity-invalid"
                                    : ""
                                }`}
                              >
                                <span>
                                  {selectedCommandFleet.name}: {projectedCommandFleetCount}/5
                                </span>
                                <strong>After transfer</strong>
                                <span>
                                  {effectiveTransferFleet.name}: {projectedTransferFleetCount}/5
                                </span>
                              </div>

                              <div className="fleet-transfer-remaining-move">
                                <div>
                                  <span>RECEIVING FLEET</span>
                                  <strong>1 movement remains after transfer</strong>
                                  <p>
                                    Choose one connected system now, or hold
                                    position and forfeit the unused movement.
                                  </p>
                                </div>

                                <div className="fleet-transfer-move-options">
                                  <button
                                    type="button"
                                    className={
                                      selectedTransferFleetMoveTargetSystemId ===
                                      null
                                        ? "fleet-transfer-move-option fleet-transfer-move-option-selected"
                                        : "fleet-transfer-move-option"
                                    }
                                    onClick={() =>
                                      setSelectedTransferFleetMoveTargetSystemId(
                                        null
                                      )
                                    }
                                    disabled={isFleetCommandLoading}
                                  >
                                    <strong>Hold position</strong>
                                    <span>Do not use the remaining move</span>
                                  </button>

                                  {transferFleetRemainingMoveSystems.map(
                                    (system) => (
                                      <button
                                        key={system.system_id}
                                        type="button"
                                        className={
                                          selectedTransferFleetMoveTargetSystemId ===
                                          system.system_id
                                            ? "fleet-transfer-move-option fleet-transfer-move-option-selected"
                                            : "fleet-transfer-move-option"
                                        }
                                        onClick={() =>
                                          setSelectedTransferFleetMoveTargetSystemId(
                                            system.system_id
                                          )
                                        }
                                        disabled={
                                          isFleetCommandLoading ||
                                          projectedTransferFleetCount <= 0
                                        }
                                      >
                                        <strong>
                                          → {system.system_name}
                                        </strong>
                                        <span>
                                          {getCorridorLabel(
                                            effectiveTransferFleet.system_id,
                                            system.system_id
                                          )}
                                        </span>
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {selectedCommandFleet &&
                        effectiveCommandTargetSystemId !== null && (
                          <div className="fleet-route-preview">
                            <strong>Selected path</strong>
                            <span>
                              {selectedCommandFleet.system_name ??
                                `System ${selectedCommandFleet.system_id}`}
                              {" → "}
                              {getSessionSystemById(
                                effectiveCommandTargetSystemId
                              )?.system_name ??
                                `System ${effectiveCommandTargetSystemId}`}
                              {selectedCommandOrderType === "move_move" &&
                                effectiveCommandSecondTargetSystemId !== null && (
                                  <>
                                    {" → "}
                                    {getSessionSystemById(
                                      effectiveCommandSecondTargetSystemId
                                    )?.system_name ??
                                      `System ${effectiveCommandSecondTargetSystemId}`}
                                  </>
                                )}
                            </span>
                            <small>
                              Step 1:{" "}
                              {getCorridorLabel(
                                selectedCommandFleet.system_id,
                                effectiveCommandTargetSystemId
                              )}
                              {selectedCommandOrderType === "move_move" &&
                                effectiveCommandSecondTargetSystemId !== null && (
                                  <>
                                    {" · Step 2: "}
                                    {getCorridorLabel(
                                      effectiveCommandTargetSystemId,
                                      effectiveCommandSecondTargetSystemId
                                    )}
                                  </>
                                )}
                            </small>
                            {selectedCommandOrderType === "move_transfer" &&
                              effectiveTransferFleet && (
                                <small>
                                  Transfer with {effectiveTransferFleet.name}: {selectedUnitsToTransferFleet.length} out / {selectedUnitsToCommandFleet.length} in
                                </small>
                              )}
                            <em>
                              Total danger cards:{" "}
                              {selectedRouteTotalDangerCards}
                            </em>
                          </div>
                        )}

                      <button
                        type="button"
                        className="fleet-command-add-button"
                        onClick={handleStageFleetOrder}
                        disabled={
                          isFleetCommandLoading ||
                          !selectedCommandFleet ||
                          selectedCommandConnectedSystems.length === 0 ||
                          (selectedCommandOrderType === "move_move" &&
                            selectedCommandSecondStepSystems.length === 0) ||
                          (selectedCommandOrderType === "move_transfer" &&
                            (!effectiveTransferFleet ||
                              (selectedUnitsToTransferFleet.length === 0 &&
                                selectedUnitsToCommandFleet.length === 0) ||
                              transferCapacityInvalid))
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
                            ({
                              fleet,
                              orderType,
                              firstTargetSystem,
                              secondTargetSystem,
                              transferFleet,
                              transferFleetTargetSystem,
                              unitsToTransferFleetCount,
                              unitsToCommandFleetCount,
                              firstCorridorLabel,
                              secondCorridorLabel,
                              totalDangerCards
                            }) => (
                              <div
                                key={fleet.id}
                                className="fleet-command-order-row"
                              >
                                <div>
                                  <strong>{fleet.name}</strong>
                                  <span>
                                    {fleet.system_name ??
                                      `System ${fleet.system_id}`}
                                    {" → "}
                                    {firstTargetSystem.system_name}
                                    {secondTargetSystem && (
                                      <>
                                        {" → "}
                                        {secondTargetSystem.system_name}
                                      </>
                                    )}
                                  </span>
                                  <small>
                                    {orderType === "move_move"
                                      ? "Move → Move"
                                      : orderType === "move_transfer"
                                        ? "Move → Transfer"
                                        : "Move → Defensive Position"}
                                    {" · "}
                                    Step 1: {firstCorridorLabel}
                                    {secondCorridorLabel && (
                                      <>
                                        {" · Step 2: "}
                                        {secondCorridorLabel}
                                      </>
                                    )}
                                  </small>
                                  {transferFleet && (
                                    <>
                                      <small>
                                        Transfer with {transferFleet.name}: {unitsToTransferFleetCount} out / {unitsToCommandFleetCount} in
                                      </small>
                                      <small>
                                        {transferFleetTargetSystem
                                          ? `${transferFleet.name} then moves to ${transferFleetTargetSystem.system_name}`
                                          : `${transferFleet.name} holds position after transfer`}
                                      </small>
                                    </>
                                  )}
                                  <em>
                                    Total danger cards: {totalDangerCards}
                                  </em>
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

                {lastFleetCommandReport.length > 0 && (
                  <div className="fleet-command-results">
                    <div className="fleet-command-results-header">
                      <div>
                        <span className="game-section-kicker">Command report</span>
                        <h3>Danger cards resolved</h3>
                      </div>

                      <button
                        type="button"
                        className="fleet-command-text-button"
                        onClick={() => setLastFleetCommandReport([])}
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="fleet-command-results-list">
                      {lastFleetCommandReport.map((orderReport) => (
                        <article
                          key={orderReport.fleet_id}
                          className={`fleet-command-result-card ${
                            orderReport.fleet_destroyed
                              ? "fleet-command-result-destroyed"
                              : ""
                          }`}
                        >
                          <div className="fleet-command-result-title">
                            <div>
                              <strong>{orderReport.fleet_name}</strong>
                              <span>
                                {orderReport.order_type === "move_move"
                                  ? "Move → Move"
                                  : orderReport.order_type === "move_transfer"
                                    ? "Move → Transfer"
                                    : "Move → Defensive Position"}
                              </span>
                            </div>

                            <em>
                              {orderReport.fleet_destroyed
                                ? "Fleet destroyed"
                                : orderReport.is_defensive
                                  ? "Defensive position"
                                  : `Arrived: ${
                                      orderReport.final_system_name ??
                                      `System ${orderReport.final_system_id}`
                                    }`}
                            </em>
                          </div>

                          <div className="fleet-command-step-results">
                            {orderReport.steps.map((step) => (
                              <div
                                key={`${orderReport.fleet_id}-${step.step}`}
                                className="fleet-command-step-result"
                              >
                                <div className="fleet-command-step-route">
                                  <strong>Step {step.step}</strong>
                                  <span>
                                    {step.from_system_name ??
                                      `System ${step.from_system_id}`}
                                    {" → "}
                                    {step.to_system_name ??
                                      `System ${step.to_system_id}`}
                                  </span>
                                  <small>
                                    {step.corridor_type} corridor · {
                                      step.drawn_cards.length
                                    } danger card
                                    {step.drawn_cards.length === 1 ? "" : "s"}
                                  </small>
                                </div>

                                {step.drawn_cards.length === 0 ? (
                                  <p className="action-hint">
                                    Safe passage. No danger card was drawn.
                                  </p>
                                ) : (
                                  <div className="danger-card-result-list">
                                    {step.drawn_cards.map((card, cardIndex) => (
                                      <div
                                        key={`${orderReport.fleet_id}-${
                                          step.step
                                        }-${cardIndex}`}
                                        className={`danger-card-result danger-card-effect-${
                                          card.effect_type
                                        }`}
                                      >
                                        <div>
                                          <strong>{card.name}</strong>
                                          <span>{card.description}</span>
                                        </div>
                                        <p>{card.effect_summary}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {orderReport.transfer && (
                            <div className="fleet-transfer-report">
                              <strong>
                                Transfer with {orderReport.transfer.partner_fleet_name}
                              </strong>
                              <span>
                                Sent: {orderReport.transfer.moved_to_partner.length > 0
                                  ? orderReport.transfer.moved_to_partner
                                      .map((unit) =>
                                        `${unit.unit_name}${
                                          unit.current_hp !== null &&
                                          unit.max_hp !== null
                                            ? ` (${unit.current_hp}/${unit.max_hp} HP)`
                                            : ""
                                        }`
                                      )
                                      .join(", ")
                                  : "none"}
                              </span>
                              <span>
                                Received: {orderReport.transfer.moved_to_command_fleet.length > 0
                                  ? orderReport.transfer.moved_to_command_fleet
                                      .map((unit) =>
                                        `${unit.unit_name}${
                                          unit.current_hp !== null &&
                                          unit.max_hp !== null
                                            ? ` (${unit.current_hp}/${unit.max_hp} HP)`
                                            : ""
                                        }`
                                      )
                                      .join(", ")
                                  : "none"}
                              </span>
                              <span>
                                {orderReport.transfer.partner_movement_used
                                  ? `${orderReport.transfer.partner_fleet_name} used its remaining movement and finished in ${
                                      orderReport.transfer.partner_final_system_name ??
                                      `System ${orderReport.transfer.partner_final_system_id}`
                                    }.`
                                  : `${orderReport.transfer.partner_fleet_name} held position and forfeited its remaining movement.`}
                              </span>
                              {orderReport.transfer.partner_movement_step && (
                                <small>
                                  Remaining move: {orderReport.transfer.partner_movement_step.corridor_type} corridor · {orderReport.transfer.partner_movement_step.drawn_cards.length} danger card{orderReport.transfer.partner_movement_step.drawn_cards.length === 1 ? "" : "s"}
                                </small>
                              )}
                              {orderReport.transfer.missing_unit_ids.length > 0 && (
                                <em>
                                  Some selected units were destroyed before transfer.
                                </em>
                              )}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {selectedSystem && (
                <section
                  className="system-overview-panel"
                  style={getPlayerVisualStyle(selectedSystem.owner_player_id)}
                >
                  <div
                    className={`system-overview-header archont-system-overview-header ownership-${selectedSystemRelation}`}
                    style={getPlayerVisualStyle(selectedSystem.owner_player_id)}
                  >
                    <div className="archont-system-overview-identity">
                      <span className="archont-system-overview-emblem">
                        {getFactionInitials(selectedSystemOwner?.faction_name)}
                      </span>

                      <div>
                        <span className="archont-eyebrow">
                          {getOwnershipLabel(selectedSystem.owner_player_id)}
                        </span>
                        <h2>{selectedSystem.system_name}</h2>
                        <p>
                          {selectedSystem.owner_faction
                            ? selectedSystem.owner_faction
                            : "Neutral system"}
                        </p>
                      </div>
                    </div>

                    <div className="archont-system-overview-metrics">
                      <span><small>ID</small><strong>{selectedSystem.system_id}</strong></span>
                      <span><small>STRUCTURES</small><strong>{selectedSystem.buildings?.length ?? 0}</strong></span>
                      <span><small>UNITS</small><strong>{selectedSystem.units?.length ?? 0}</strong></span>
                      <span><small>FLEETS</small><strong>{getFleetsInSystem(selectedSystem.system_id).length}</strong></span>
                    </div>
                  </div>

                  {(() => {
                    const mapSystem = mapDetails?.systems.find(
                      (system) => system.id === selectedSystem.system_id
                    );

                    if (!mapSystem) {
                      return null;
                    }

                    const systemBuildings = selectedSystem.buildings ?? [];
                    const countBuildings = (...buildingTypes: string[]) =>
                      systemBuildings.filter((building) =>
                        buildingTypes.includes(building.building_type)
                      ).length;

                    const capacityItems = [
                      {
                        key: "mine",
                        icon: "◆",
                        label: "Mines",
                        current: countBuildings("mine"),
                        maximum: mapSystem.mineral_slots
                      },
                      {
                        key: "energy",
                        icon: "ϟ",
                        label: "Power Plants",
                        current: countBuildings("power_plant", "energy_plant"),
                        maximum: mapSystem.energy_slots
                      },
                      {
                        key: "storage",
                        icon: "▰",
                        label: "Supply Depots",
                        current: countBuildings("storage"),
                        maximum: mapSystem.storage_slots
                      },
                      {
                        key: "research",
                        icon: "⌁",
                        label: "Research Centers",
                        current: countBuildings("research_center"),
                        maximum: mapSystem.research_center_slots
                      }
                    ];

                    return (
                      <section className="system-building-capacity">
                        <div className="system-building-capacity-heading">
                          <div>
                            <span className="archont-eyebrow">System infrastructure</span>
                            <h3>Building capacity</h3>
                          </div>
                          <p>
                            Built structures compared with this system's available resource slots.
                          </p>
                        </div>

                        <div className="system-building-capacity-grid">
                          {capacityItems.map((item) => {
                            const ratio =
                              item.maximum > 0
                                ? Math.min(100, (item.current / item.maximum) * 100)
                                : 0;
                            const isFull =
                              item.maximum > 0 && item.current >= item.maximum;
                            const isUnavailable = item.maximum <= 0;

                            return (
                              <article
                                className={[
                                  "system-building-capacity-card",
                                  isFull ? "is-full" : "",
                                  isUnavailable ? "is-unavailable" : ""
                                ].join(" ")}
                                key={item.key}
                              >
                                <span className="system-building-capacity-icon">
                                  {item.icon}
                                </span>

                                <span className="system-building-capacity-copy">
                                  <strong>{item.label}</strong>
                                  <small>
                                    {isUnavailable
                                      ? "Unavailable"
                                      : `${item.current} / ${item.maximum}`}
                                  </small>
                                </span>

                                <span className="system-building-capacity-meter">
                                  <i style={{ width: `${ratio}%` }} />
                                </span>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })()}

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
                                const incomeResources = getBuildingIncomeResources(
                                  buildingType,
                                  buildingGroup.length
                                );
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
                                    style={getPlayerVisualStyle(firstBuilding.owner_player_id)}
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
                                    <div className="overview-structure-header">
                                      <span
                                        className="overview-structure-icon"
                                        aria-hidden="true"
                                      >
                                        {getBuildingOverviewIcon(buildingType)}
                                      </span>

                                      <span className="overview-structure-copy">
                                        <strong>
                                          {getBuildingDisplayName(firstBuilding)}
                                        </strong>
                                        <small>
                                          {isColony ? "COLONY" : "STRUCTURE"}
                                        </small>
                                      </span>

                                      <span className="overview-structure-count">
                                        ×{buildingGroup.length}
                                      </span>
                                    </div>

                                    {incomeResources.length > 0 ? (
                                      <div className="overview-structure-income">
                                        <small className="overview-income-caption">
                                          PER ROUND
                                        </small>

                                        <div className="overview-resource-income-row">
                                          {incomeResources.map((incomeResource) => (
                                            <ResourceBadge
                                              key={incomeResource.kind}
                                              kind={incomeResource.kind}
                                              value={incomeResource.value}
                                              valuePrefix="+"
                                              compact
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="overview-no-income">
                                        NO DIRECT INCOME
                                      </span>
                                    )}

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
                                                        Produce {unitOption.name} · 1 CP
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
                                              Pack into Ark · 1 CP ·{" "}
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

                              const fleetRelation = getOwnershipRelation(
                                fleet.owner_player_id
                              );

                              return (
                                <div
                                  key={fleet.id}
                                  className={`fleet-command-card archont-fleet-card ownership-${fleetRelation}`}
                                  style={getPlayerVisualStyle(fleet.owner_player_id)}
                                >
                                  <div className="fleet-command-card-header archont-fleet-card-header">
                                    <span className="archont-fleet-emblem">
                                      {getFactionInitials(owner?.faction_name)}
                                    </span>
                                    <span className="archont-fleet-identity">
                                      <strong>{fleet.name}</strong>
                                      <small>{owner?.faction_name ?? "Unknown"}</small>
                                    </span>
                                    <span className="archont-fleet-status">
                                      {getFleetStatusText(fleet)}
                                    </span>
                                  </div>

                                  <div className="archont-fleet-metrics">
                                    <span><small>CAPACITY</small><strong>{fleet.units.length}/5</strong></span>
                                    <span><small>COMBAT</small><strong>{getFleetCombatRating(fleet)}</strong></span>
                                    <span><small>POSITION</small><strong>{fleet.is_defensive ? "DEF" : "OPEN"}</strong></span>
                                  </div>

                                  {fleet.units.length > 0 && (
                                    <div className="fleet-unit-strip archont-fleet-unit-strip">
                                      {fleet.units.map((unit) => (
                                        <span
                                          key={unit.id}
                                          className={isUnitDamaged(unit) ? "damaged" : ""}
                                          title={`${getUnitDisplayName(unit)} · ${getUnitHpText(unit)}`}
                                        >
                                          <i>{getUnitIcon(unit)}</i>
                                          <b>{getUnitDisplayName(unit)}</b>
                                          <small>{getUnitHpText(unit)}</small>
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
                                      Open command console
                                    </button>
                                  )}

                                  {fleet.has_acted_this_round && (
                                    <p className="action-hint">
                                      Fleet command already resolved this round.
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
                              const unitOwner = getPlayerById(unit.owner_player_id);
                              const unitRelation = getOwnershipRelation(
                                unit.owner_player_id
                              );
                              const resourceError = getResourceShortageMessage(
                                currentPlayer,
                                { energy: UNIT_ACTION_ENERGY_COST }
                              );
                              const actionErrorKey = `unit-${unit.id}`;

                              return (
                                <div
                                  key={unit.id}
                                  className={[
                                    "overview-card",
                                    "archont-unit-card",
                                    `ownership-${unitRelation}`,
                                    isSelected ? "selected" : "",
                                    isUnitDamaged(unit) ? "damaged" : ""
                                  ].join(" ")}
                                  style={getPlayerVisualStyle(unit.owner_player_id)}
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
                                  <div className="archont-unit-card-heading">
                                    <span className="archont-unit-icon">
                                      {getUnitIcon(unit)}
                                    </span>
                                    <span>
                                      <strong>{getUnitDisplayName(unit)}</strong>
                                      <small>{unitOwner?.faction_name ?? "Unknown owner"}</small>
                                    </span>
                                    <span className="archont-entity-relation">
                                      {unitRelation === "friendly"
                                        ? "YOURS"
                                        : unitRelation === "hostile"
                                          ? "RIVAL"
                                          : "NEUTRAL"}
                                    </span>
                                  </div>

                                  <div className="archont-unit-stat-grid">
                                    <span><small>ATK</small><strong>{unit.attack}</strong></span>
                                    <span><small>DEF</small><strong>{unit.defense}</strong></span>
                                    <span><small>HP</small><strong>{unit.current_hp ?? "—"}/{unit.max_hp ?? "—"}</strong></span>
                                  </div>

                                  {unit.current_hp !== null && unit.max_hp !== null && (
                                    <span className="archont-hp-track">
                                      <i
                                        style={{
                                          width: `${Math.max(
                                            0,
                                            Math.min(
                                              100,
                                              (unit.current_hp / unit.max_hp) * 100
                                            )
                                          )}%`
                                        }}
                                      />
                                    </span>
                                  )}

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
                                            Colonize System · 1 CP ·{" "}
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


          </section>
        </>
      )}
    </div>
  );
}
