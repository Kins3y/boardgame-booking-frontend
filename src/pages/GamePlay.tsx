import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import {
  buildBuilding,
  colonizeSystemWithArk,
  endTurn,
  getEditorMap,
  getFullSession,
  issueFleetCommand,
  packColonyBuildingIntoArk,
  produceUnitFromBuilding,
  passTurn,
} from "../api/gameApi";
import type {
  BuildingType,
  DangerCardResult,
  FleetCommandOrder,
  FleetCommandOrderReport,
  FleetCommandResponse,
  FleetOrderType,
  FullGameSession,
  MapEditorSavedMap,
  SessionBuilding,
  SessionFleet,
  SessionPlayer,
  SessionSystem,
  SessionUnit,
  UnitType,
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
    deep: "#24194a",
  },
  {
    color: "#43d9ff",
    soft: "rgba(67, 217, 255, 0.16)",
    glow: "rgba(67, 217, 255, 0.4)",
    deep: "#103447",
  },
  {
    color: "#ff6d8d",
    soft: "rgba(255, 109, 141, 0.16)",
    glow: "rgba(255, 109, 141, 0.4)",
    deep: "#481a2a",
  },
  {
    color: "#ffcf5a",
    soft: "rgba(255, 207, 90, 0.16)",
    glow: "rgba(255, 207, 90, 0.38)",
    deep: "#463714",
  },
  {
    color: "#64e6a3",
    soft: "rgba(100, 230, 163, 0.16)",
    glow: "rgba(100, 230, 163, 0.38)",
    deep: "#123b2a",
  },
  {
    color: "#ff985f",
    soft: "rgba(255, 152, 95, 0.16)",
    glow: "rgba(255, 152, 95, 0.4)",
    deep: "#452719",
  },
];

const NEUTRAL_PLAYER_VISUAL: PlayerVisual = {
  color: "#9aa4bb",
  soft: "rgba(154, 164, 187, 0.14)",
  glow: "rgba(154, 164, 187, 0.24)",
  deep: "#222938",
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
    cruiser: "🛳️",
  };

  return icons[unit.unit_type] ?? "◆";
}

function getFleetCombatRating(fleet: SessionFleet): number {
  return fleet.units.reduce(
    (total, unit) => total + unit.attack + unit.defense,
    0,
  );
}

type ResourceCost = {
  matter?: number;
  energy?: number;
  data?: number;
  food?: number;
};

type ResourceKind = "matter" | "energy" | "data" | "food";

type WorkspaceTab = "systems" | "buildings" | "fleets";

type ResolutionPreview = {
  fleetId: number;
  fleetName: string;
  route: string;
  dangerCards: number;
  pursuitCards: number;
  isCombat: boolean;
  isRetreat: boolean;
  attackTargetName: string | null;
  isHostileEntry: boolean;
  hostileStepNumber: 1 | 2 | null;
  movementEndsAtInterception: boolean;
  hostileSystemName: string | null;
  hostileOwnerName: string | null;
  interceptorFleetName: string | null;
  interceptorOwnerName: string | null;
  estimatedInterceptionDamage: number;
};

type ResolutionRevealItem = {
  id: string;
  kind: "danger";
  title: string;
  subtitle: string;
  description: string;
  result: string;
  tone: "safe" | "danger" | "combat";
  card: DangerCardResult | null;
};

type ResolutionModalState = {
  phase: "confirm" | "executing" | "reveal" | "result";
  orders: FleetCommandOrder[];
  previews: ResolutionPreview[];
  response: FleetCommandResponse | null;
  revealItems: ResolutionRevealItem[];
  revealIndex: number;
  error: string | null;
};

type ResourceBadgeProps = {
  kind: ResourceKind;
  value: number;
  compact?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
};

const RESOURCE_ORDER: ResourceKind[] = ["matter", "energy", "food", "data"];

const RESOURCE_INFO: Record<
  ResourceKind,
  { label: string; shortLabel: string; icon: string }
> = {
  matter: {
    label: "Matter",
    shortLabel: "MAT",
    icon: "◆",
  },
  energy: {
    label: "Energy",
    shortLabel: "ENG",
    icon: "ϟ",
  },
  data: {
    label: "Data",
    shortLabel: "DAT",
    icon: "⌁",
  },
  food: {
    label: "Supply",
    shortLabel: "SUP",
    icon: "▰",
  },
};

function ResourceBadge({
  kind,
  value,
  compact = false,
  valuePrefix = "",
  valueSuffix = "",
}: ResourceBadgeProps) {
  const resource = RESOURCE_INFO[kind];

  return (
    <span
      className={[
        "archont-resource-badge",
        `archont-resource-${kind}`,
        compact ? "archont-resource-badge-compact" : "",
      ].join(" ")}
      title={`${resource.label}: ${valuePrefix}${value}${valueSuffix}`}
    >
      <i className="archont-resource-symbol" aria-hidden="true">
        {resource.icon}
      </i>
      <small className="archont-resource-label">{resource.shortLabel}</small>
      <strong className="archont-resource-value">
        {valuePrefix}
        {value}
        {valueSuffix}
      </strong>
    </span>
  );
}

type StagedFleetOrder = {
  order_type: FleetOrderType;
  target_system_id?: number;
  second_target_system_id?: number;
  transfer_fleet_id?: number;
  transfer_fleet_target_system_id?: number;
  continuing_fleet_id?: number;
  target_fleet_id?: number;
  split_fleet_target_system_id?: number;
  split_unit_ids?: number[];
  unit_ids_to_transfer_fleet?: number[];
  unit_ids_to_command_fleet?: number[];
};

const BUILDING_COSTS: Record<BuildingType, ResourceCost> = {
  mine: {
    matter: 6,
    energy: 2,
  },
  power_plant: {
    matter: 6,
    energy: 3,
  },
  storage: {
    matter: 3,
    energy: 2,
  },
  barracks: {
    matter: 8,
    energy: 3,
  },
  spaceport: {
    matter: 10,
    energy: 4,
    data: 1,
  },
};

function getResourceShortageMessage(
  player: SessionPlayer | null,
  cost: ResourceCost,
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
    income: "+2 MAT / round",
  },
  {
    type: "power_plant",
    name: "Power Plant",
    icon: "⚡",
    cost: "6 MAT / 3 ENG",
    income: "+2 ENG / round",
  },
  {
    type: "storage",
    name: "Supply Depot",
    icon: "📦",
    cost: "3 MAT / 2 ENG",
    income: "+1 SUP / round",
  },
  {
    type: "barracks",
    name: "Barracks",
    icon: "🛡️",
    cost: "8 MAT / 3 ENG",
    income: "Produces light units / Ark",
  },
  {
    type: "spaceport",
    name: "Spaceport",
    icon: "🛰️",
    cost: "10 MAT / 4 ENG / 1 DAT",
    income: "Produces medium / heavy units",
  },
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
  colony: "Colony",
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
    description: "Basic matter production building.",
  },
  power_plant: {
    income: "+2 ENG / round",
    produces: [],
    technologies: [],
    description: "Basic energy production building.",
  },
  energy_plant: {
    income: "+2 ENG / round",
    produces: [],
    technologies: [],
    description: "Alternative energy production building.",
  },
  storage: {
    income: "+1 SUP / round",
    produces: [],
    technologies: [],
    description:
      "Supply building. Up to 2 Supply Depots can be built in one system.",
  },
  research_center: {
    income: "+1 DAT / round",
    produces: [],
    technologies: ["Blueprint research", "Civilization upgrades"],
    description: "Allows research actions and technology progression.",
  },
  barracks: {
    income: "No direct income",
    produces: ["Scout Drone", "Marine Squad", "Ark"],
    technologies: ["Light unit tactics", "Expansion logistics"],
    description: "Light-unit and Ark production building.",
  },
  spaceport: {
    income: "No direct income",
    produces: ["Frigate", "Cruiser"],
    technologies: ["Fleet warfare", "Heavy ship construction"],
    description:
      "Orbital production building for medium and heavy fleet units.",
  },
  orbital_defense: {
    income: "No direct income",
    produces: [],
    technologies: ["Defense protocols"],
    description: "Defensive orbital structure.",
  },
  colony: {
    income: "+2 MAT / round, +2 ENG / round",
    produces: [],
    technologies: [],
    description: "A deployed colony makes the system colonized. It has no HP.",
  },
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
  colony: "🏛",
};

function getBuildingOverviewIcon(buildingType: string): string {
  return BUILDING_OVERVIEW_ICONS[buildingType] ?? "◇";
}

function getBuildingIncomeResources(
  buildingType: string,
  buildingCount: number,
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
        { kind: "energy", value: 2 * multiplier },
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
      energy: 2,
    },
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
      energy: 2,
    },
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
      data: 1,
    },
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
      data: 1,
    },
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
      data: 2,
    },
  },
];

function getProductionOptionsForBuilding(
  buildingType: string,
): UnitProductionOption[] {
  return UNIT_PRODUCTION_OPTIONS.filter(
    (unitOption) => unitOption.producedBy === buildingType,
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
    {},
  );
}

function getBuildingsForPlayer(
  session: FullGameSession,
  playerId: number,
): SessionBuilding[] {
  const playerBuildings: SessionBuilding[] = [];

  for (const system of session.systems) {
    const buildings = system.buildings ?? [];

    for (const building of buildings) {
      if (building.owner_player_id === playerId) {
        playerBuildings.push({
          ...building,
          system_id: building.system_id ?? system.system_id,
          system_name: building.system_name ?? system.system_name,
        });
      }
    }
  }

  return playerBuildings;
}

function getPlayerColonyCount(
  session: FullGameSession,
  playerId: number,
): number {
  return getBuildingsForPlayer(session, playerId).filter(
    (building) => building.building_type === "colony",
  ).length;
}

function getSystemPosition(
  system: SessionSystem,
  mapDetails: MapEditorSavedMap | null,
): { left: string; top: string } {
  const gridWidth = Math.max(1, mapDetails?.grid_width ?? 20);
  const gridHeight = Math.max(1, mapDetails?.grid_height ?? 20);

  const left = (((system.x ?? 0) + 0.5) / gridWidth) * 100;
  const top = (((system.y ?? 0) + 0.5) / gridHeight) * 100;

  return {
    left: `${left}%`,
    top: `${top}%`,
  };
}

function getSystemPoint(
  system: SessionSystem,
  mapDetails: MapEditorSavedMap | null,
): { x: number; y: number } {
  const gridWidth = Math.max(1, mapDetails?.grid_width ?? 20);
  const gridHeight = Math.max(1, mapDetails?.grid_height ?? 20);

  return {
    x: (((system.x ?? 0) + 0.5) / gridWidth) * 100,
    y: (((system.y ?? 0) + 0.5) / gridHeight) * 100,
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
  toPoint: MapPoint,
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
          y2: fromPoint.y,
        },
        {
          x1: 100,
          y1: toPoint.y,
          x2: toPoint.x,
          y2: toPoint.y,
        },
      ];
    }

    return [
      {
        x1: fromPoint.x,
        y1: fromPoint.y,
        x2: 100,
        y2: fromPoint.y,
      },
      {
        x1: 0,
        y1: toPoint.y,
        x2: toPoint.x,
        y2: toPoint.y,
      },
    ];
  }

  if (fromPoint.y < toPoint.y) {
    return [
      {
        x1: fromPoint.x,
        y1: fromPoint.y,
        x2: fromPoint.x,
        y2: 0,
      },
      {
        x1: toPoint.x,
        y1: 100,
        x2: toPoint.x,
        y2: toPoint.y,
      },
    ];
  }

  return [
    {
      x1: fromPoint.x,
      y1: fromPoint.y,
      x2: fromPoint.x,
      y2: 100,
    },
    {
      x1: toPoint.x,
      y1: 0,
      x2: toPoint.x,
      y2: toPoint.y,
    },
  ];
}

export default function GamePlay() {
  const { sessionId } = useParams();

  const [session, setSession] = useState<FullGameSession | null>(null);
  const [mapDetails, setMapDetails] = useState<MapEditorSavedMap | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] =
    useState<WorkspaceTab>("systems");
  const [selectedBuildingType, setSelectedBuildingType] =
    useState<BuildingType>("mine");
  const [selectedSystemId, setSelectedSystemId] = useState<number | null>(null);
  const [selectedStructureKey, setSelectedStructureKey] = useState<
    string | null
  >(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedCommandFleetId, setSelectedCommandFleetId] = useState<
    number | null
  >(null);
  const [selectedCommandOrderType, setSelectedCommandOrderType] =
    useState<FleetOrderType>("move_defend");
  const [selectedCommandTargetSystemId, setSelectedCommandTargetSystemId] =
    useState<number | null>(null);
  const [
    selectedCommandSecondTargetSystemId,
    setSelectedCommandSecondTargetSystemId,
  ] = useState<number | null>(null);
  const [stagedFleetOrders, setStagedFleetOrders] = useState<
    Record<number, StagedFleetOrder>
  >({});
  const [selectedTransferFleetId, setSelectedTransferFleetId] = useState<
    number | null
  >(null);
  const [selectedUnitsToTransferFleet, setSelectedUnitsToTransferFleet] =
    useState<number[]>([]);
  const [selectedUnitsToCommandFleet, setSelectedUnitsToCommandFleet] =
    useState<number[]>([]);
  const [
    selectedTransferFleetMoveTargetSystemId,
    setSelectedTransferFleetMoveTargetSystemId,
  ] = useState<number | null>(null);
  const [selectedContinuingFleetId, setSelectedContinuingFleetId] = useState<
    number | null
  >(null);
  const [selectedAttackTargetFleetId, setSelectedAttackTargetFleetId] =
    useState<number | null>(null);
  const [selectedSplitUnitIds, setSelectedSplitUnitIds] = useState<number[]>([]);
  const [selectedSplitFleetTargetSystemId, setSelectedSplitFleetTargetSystemId] =
    useState<number | null>(null);

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
  const [resolutionModal, setResolutionModal] =
    useState<ResolutionModalState | null>(null);

  const numericSessionId = Number(sessionId);

  const currentPlayer = useMemo(() => {
    if (!session || session.current_player_id === null) {
      return null;
    }

    return (
      session.players.find(
        (player) => player.id === session.current_player_id,
      ) ?? null
    );
  }, [session]);

  useEffect(() => {
    if (!resolutionModal || resolutionModal.phase !== "reveal") {
      return;
    }

    if (resolutionModal.revealItems.length === 0) {
      setResolutionModal((current) =>
        current ? { ...current, phase: "result" } : current,
      );
      return;
    }

    const isLastItem =
      resolutionModal.revealIndex >= resolutionModal.revealItems.length - 1;
    const revealDelay = 2200;

    const timer = window.setTimeout(() => {
      setResolutionModal((current) => {
        if (!current || current.phase !== "reveal") {
          return current;
        }

        if (isLastItem) {
          return { ...current, phase: "result" };
        }

        return { ...current, revealIndex: current.revealIndex + 1 };
      });
    }, revealDelay);

    return () => window.clearTimeout(timer);
  }, [
    resolutionModal?.phase,
    resolutionModal?.revealIndex,
    resolutionModal?.revealItems.length,
  ]);

  const controlledSystems = useMemo(() => {
    if (!session || !currentPlayer) {
      return [];
    }

    return session.systems.filter(
      (system) => system.owner_player_id === currentPlayer.id,
    );
  }, [session, currentPlayer]);

  const currentPlayerBuildings = useMemo(() => {
    if (!session || !currentPlayer) {
      return [];
    }

    return getBuildingsForPlayer(session, currentPlayer.id);
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
    BUILDING_COSTS[selectedBuildingType],
  );

  function openWorkspaceTab(tab: WorkspaceTab) {
    setActiveWorkspaceTab(tab);

    if ((tab === "systems" || tab === "buildings") && currentPlayer) {
      const selectedIsControlled =
        selectedSystem?.owner_player_id === currentPlayer.id;

      if (!selectedIsControlled) {
        const firstControlledSystem = controlledSystems[0];
        setSelectedSystemId(firstControlledSystem?.system_id ?? null);
        setSelectedStructureKey(null);
        setSelectedUnitId(null);
      }
    }
  }

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
          (player) => player.id === sessionData.current_player_id,
        ) ?? sessionData.players[0];

      if (playerToSelect) {
        setSelectedPlayerId(playerToSelect.id);

        const firstControlledSystem = sessionData.systems.find(
          (system) => system.owner_player_id === playerToSelect.id,
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
        build: "No current player is active.",
      });
      return;
    }

    if (!selectedSystemId) {
      setActionErrors({
        build: "Select a controlled system.",
      });
      return;
    }

    if (!canBuildInSelectedSystem) {
      setActionErrors({
        build: "You can build only in the current player's systems.",
      });
      return;
    }

    if (selectedBuildingResourceError) {
      setActionErrors({
        build: selectedBuildingResourceError,
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
        selectedBuildingType,
      );

      await loadSession();
    } catch (err) {
      setActionErrors({
        build: err instanceof Error ? err.message : "Failed to build building",
      });
    } finally {
      setIsBuilding(false);
    }
  }

  function selectCurrentPlayerFromSession(updatedSession: FullGameSession) {
    const nextCurrentPlayer =
      updatedSession.players.find(
        (player) => player.id === updatedSession.current_player_id,
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
      (system) => system.owner_player_id === nextCurrentPlayer.id,
    );

    setSelectedSystemId(firstControlledSystem?.system_id ?? null);
    setSelectedStructureKey(null);
    setSelectedUnitId(null);
    setSelectedCommandFleetId(null);
    setSelectedCommandOrderType("move_defend");
    setSelectedCommandTargetSystemId(null);
    setSelectedCommandSecondTargetSystemId(null);
    setSelectedAttackTargetFleetId(null);
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
    unitOption: UnitProductionOption,
  ) {
    if (!session) {
      return;
    }

    const actionErrorKey = `produce-${building.id}-${unitOption.unit_type}`;

    if (!currentPlayer || building.owner_player_id !== currentPlayer.id) {
      setActionErrors({
        [actionErrorKey]:
          "Only the current player can use this production building.",
      });
      return;
    }

    const resourceError = getResourceShortageMessage(
      currentPlayer,
      unitOption.resourceCost,
    );

    if (resourceError) {
      setActionErrors({
        [actionErrorKey]: resourceError,
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
        unitOption.unit_type,
      );

      setSession(updatedSession);
      selectCurrentPlayerFromSession(updatedSession);
    } catch (err) {
      setActionErrors({
        [actionErrorKey]:
          err instanceof Error ? err.message : "Failed to produce unit",
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
        [actionErrorKey]: "Only the current player can control this colony.",
      });
      return;
    }

    const colonyCount = getPlayerColonyCount(session, currentPlayer.id);

    if (colonyCount <= 1) {
      setActionErrors({
        [actionErrorKey]: "Player cannot pack the last Colony into Ark.",
      });
      return;
    }

    const resourceError = getResourceShortageMessage(currentPlayer, {
      energy: UNIT_ACTION_ENERGY_COST,
    });

    if (resourceError) {
      setActionErrors({
        [actionErrorKey]: resourceError,
      });
      return;
    }

    try {
      setIsUnitActionLoading(true);
      setError("");
      setActionErrors({});

      const updatedSession = await packColonyBuildingIntoArk(
        session.id,
        building.id,
      );

      setSession(updatedSession);
      selectCurrentPlayerFromSession(updatedSession);
    } catch (err) {
      setActionErrors({
        [actionErrorKey]:
          err instanceof Error ? err.message : "Failed to pack colony into ark",
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
        [actionErrorKey]: "Only the current player can control this ark.",
      });
      return;
    }

    const resourceError = getResourceShortageMessage(currentPlayer, {
      energy: UNIT_ACTION_ENERGY_COST,
    });

    if (resourceError) {
      setActionErrors({
        [actionErrorKey]: resourceError,
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
        [actionErrorKey]:
          err instanceof Error ? err.message : "Failed to colonize system",
      });
    } finally {
      setIsUnitActionLoading(false);
    }
  }

  function getDefaultSecondTargetSystemId(
    firstTargetSystemId: number | null,
  ): number | null {
    if (!firstTargetSystemId) {
      return null;
    }

    return getConnectedSystems(firstTargetSystemId)[0]?.system_id ?? null;
  }

  function getEnemyFleetsInSystem(systemId: number | null): SessionFleet[] {
    if (!session || !currentPlayer || systemId === null) {
      return [];
    }

    return session.players.flatMap((player) =>
      player.id === currentPlayer.id
        ? []
        : (player.fleets ?? []).filter(
            (fleet) => fleet.system_id === systemId && fleet.units.length > 0,
          ),
    );
  }

  function getAttackableConnectedSystems(
    fleet: SessionFleet | null | undefined,
  ): SessionSystem[] {
    if (!fleet) {
      return [];
    }

    return getConnectedSystems(fleet.system_id).filter(
      (system) => getEnemyFleetsInSystem(system.system_id).length > 0,
    );
  }

  function getEngagedEnemyFleets(
    fleet: SessionFleet | null | undefined,
  ): SessionFleet[] {
    if (!fleet) {
      return [];
    }

    return getEnemyFleetsInSystem(fleet.system_id);
  }

  function isFleetEngaged(
    fleet: SessionFleet | null | undefined,
  ): boolean {
    return getEngagedEnemyFleets(fleet).length > 0;
  }

  function getLargestEnemyFleetInSystem(
    systemId: number | null,
  ): SessionFleet | null {
    const enemyFleets = getEnemyFleetsInSystem(systemId);

    return (
      [...enemyFleets].sort(
        (left, right) =>
          right.units.length - left.units.length || left.id - right.id,
      )[0] ?? null
    );
  }

  function getStrongestEnemyFleetInSystem(
    systemId: number | null,
  ): SessionFleet | null {
    const enemyFleets = getEnemyFleetsInSystem(systemId);

    return (
      [...enemyFleets].sort((left, right) => {
        const leftAttack = left.units.reduce(
          (total, unit) => total + (unit.is_combat ? Math.max(0, unit.attack) : 0),
          0,
        );
        const rightAttack = right.units.reduce(
          (total, unit) => total + (unit.is_combat ? Math.max(0, unit.attack) : 0),
          0,
        );

        return (
          Number(right.is_defensive) - Number(left.is_defensive) ||
          rightAttack - leftAttack ||
          right.units.length - left.units.length ||
          left.id - right.id
        );
      })[0] ?? null
    );
  }

  function getReadyTransferFleets(
    systemId: number | null,
    sourceFleetId: number | null,
  ): SessionFleet[] {
    if (!currentPlayer || systemId === null) {
      return [];
    }

    return currentPlayer.fleets.filter(
      (fleet) =>
        fleet.id !== sourceFleetId &&
        fleet.system_id === systemId &&
        !fleet.has_acted_this_round,
    );
  }

  function resetTransferSelection(
    targetSystemId: number | null,
    sourceFleetId: number | null,
  ) {
    const defaultTransferFleet = getReadyTransferFleets(
      targetSystemId,
      sourceFleetId,
    )[0];

    setSelectedTransferFleetId(defaultTransferFleet?.id ?? null);
    setSelectedUnitsToTransferFleet([]);
    setSelectedUnitsToCommandFleet([]);
    setSelectedTransferFleetMoveTargetSystemId(null);
    setSelectedContinuingFleetId(sourceFleetId);
  }

  function toggleUnitSelection(
    unitId: number,
    selectedIds: number[],
    setSelectedIds: (value: number[]) => void,
  ) {
    if (selectedIds.includes(unitId)) {
      setSelectedIds(selectedIds.filter((id) => id !== unitId));
      return;
    }

    setSelectedIds([...selectedIds, unitId]);
  }

  function handleSelectCommandFleet(fleetId: number) {
    const fleet = currentPlayer?.fleets.find(
      (candidate) => candidate.id === fleetId,
    );

    setSelectedCommandFleetId(fleetId);

    const engaged = isFleetEngaged(fleet);
    const nextOrderType: FleetOrderType = engaged
      ? selectedCommandOrderType === "retreat" ||
        selectedCommandOrderType === "continue_combat"
        ? selectedCommandOrderType
        : "continue_combat"
      : selectedCommandOrderType === "retreat" ||
          selectedCommandOrderType === "continue_combat"
        ? "move_defend"
        : selectedCommandOrderType;

    setSelectedCommandOrderType(nextOrderType);

    const firstConnectedSystem = fleet
      ? nextOrderType === "move_attack"
        ? getAttackableConnectedSystems(fleet)[0]
        : nextOrderType === "continue_combat"
          ? null
          : nextOrderType === "move_move"
            ? getConnectedSystems(fleet.system_id)[0]
            : getNonHostileConnectedSystems(fleet.system_id)[0]
      : null;
    const firstTargetSystemId = firstConnectedSystem?.system_id ?? null;

    setSelectedCommandTargetSystemId(
      nextOrderType === "split_move" ||
        nextOrderType === "defend" ||
        nextOrderType === "continue_combat"
        ? null
        : firstTargetSystemId,
    );
    setSelectedCommandSecondTargetSystemId(
      nextOrderType === "move_move" &&
      getEnemyFleetsInSystem(firstTargetSystemId).length === 0
        ? getDefaultSecondTargetSystemId(firstTargetSystemId)
        : null,
    );
    resetTransferSelection(
      nextOrderType === "transfer_move"
        ? (fleet?.system_id ?? null)
        : firstTargetSystemId,
      fleetId,
    );
    setSelectedAttackTargetFleetId(
      nextOrderType === "move_attack"
        ? (getEnemyFleetsInSystem(firstTargetSystemId)[0]?.id ?? null)
        : nextOrderType === "continue_combat"
          ? (getEnemyFleetsInSystem(fleet?.system_id ?? null)[0]?.id ?? null)
          : null,
    );
    setSelectedSplitUnitIds([]);
    setSelectedSplitFleetTargetSystemId(null);

    setActionErrors((current) => {
      const next = { ...current };
      delete next.fleetCommand;
      return next;
    });
  }

  function handleSelectCommandOrderType(orderType: FleetOrderType) {
    const selectedFleet = currentPlayer?.fleets.find(
      (fleet) => fleet.id === selectedCommandFleetId,
    );
    const engaged = isFleetEngaged(selectedFleet);

    if (
      (engaged && orderType !== "continue_combat" && orderType !== "retreat") ||
      (!engaged && (orderType === "continue_combat" || orderType === "retreat"))
    ) {
      return;
    }

    setSelectedCommandOrderType(orderType);

    if (
      orderType === "split_move" ||
      orderType === "defend" ||
      orderType === "continue_combat"
    ) {
      setSelectedCommandTargetSystemId(null);
      setSelectedCommandSecondTargetSystemId(null);
      setSelectedAttackTargetFleetId(
        orderType === "continue_combat"
          ? (getEnemyFleetsInSystem(selectedFleet?.system_id ?? null)[0]?.id ??
            null)
          : null,
      );
      setSelectedSplitUnitIds([]);
      setSelectedSplitFleetTargetSystemId(null);
    } else if (orderType === "move_attack") {
      const attackSystem = getAttackableConnectedSystems(selectedFleet)[0] ?? null;
      setSelectedCommandTargetSystemId(attackSystem?.system_id ?? null);
      setSelectedCommandSecondTargetSystemId(null);
      setSelectedAttackTargetFleetId(
        getEnemyFleetsInSystem(attackSystem?.system_id ?? null)[0]?.id ?? null,
      );
    } else if (orderType === "retreat") {
      const retreatSystem = selectedFleet
        ? getNonHostileConnectedSystems(selectedFleet.system_id)[0] ?? null
        : null;
      setSelectedCommandTargetSystemId(retreatSystem?.system_id ?? null);
      setSelectedCommandSecondTargetSystemId(null);
      setSelectedAttackTargetFleetId(null);
    } else if (orderType === "move_move") {
      const firstTargetHasEnemy =
        getEnemyFleetsInSystem(selectedCommandTargetSystemId).length > 0;
      setSelectedCommandSecondTargetSystemId(
        firstTargetHasEnemy
          ? null
          : getDefaultSecondTargetSystemId(selectedCommandTargetSystemId),
      );
      setSelectedAttackTargetFleetId(null);
    } else {
      setSelectedCommandSecondTargetSystemId(null);
      setSelectedAttackTargetFleetId(null);
    }

    if (orderType === "move_transfer" || orderType === "transfer_move") {
      resetTransferSelection(
        orderType === "transfer_move"
          ? (selectedFleet?.system_id ?? null)
          : selectedCommandTargetSystemId,
        selectedCommandFleetId,
      );
    } else {
      setSelectedTransferFleetId(null);
      setSelectedUnitsToTransferFleet([]);
      setSelectedUnitsToCommandFleet([]);
      setSelectedTransferFleetMoveTargetSystemId(null);
      setSelectedContinuingFleetId(null);
    }

    if (orderType !== "split_move") {
      setSelectedSplitUnitIds([]);
      setSelectedSplitFleetTargetSystemId(null);
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
      const firstTargetHasEnemy =
        getEnemyFleetsInSystem(systemId).length > 0;
      setSelectedCommandSecondTargetSystemId(
        firstTargetHasEnemy ? null : getDefaultSecondTargetSystemId(systemId),
      );
    } else {
      setSelectedCommandSecondTargetSystemId(null);
    }

    if (selectedCommandOrderType === "move_transfer") {
      resetTransferSelection(systemId, selectedCommandFleetId);
    }

    if (selectedCommandOrderType === "move_attack") {
      setSelectedAttackTargetFleetId(
        getEnemyFleetsInSystem(systemId)[0]?.id ?? null,
      );
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
        fleetCommand: "No current player is active.",
      });
      return;
    }

    const availableFleets = currentPlayer.fleets.filter(
      (fleet) => !fleet.has_acted_this_round,
    );

    const fleet =
      availableFleets.find(
        (candidate) => candidate.id === selectedCommandFleetId,
      ) ?? availableFleets[0];

    if (!fleet) {
      setActionErrors({
        fleetCommand: "No ready fleets are available for this command.",
      });
      return;
    }

    if (selectedCommandOrderType === "defend") {
      setStagedFleetOrders((current) => ({
        ...current,
        [fleet.id]: {
          order_type: "defend",
        },
      }));

      setActionErrors((current) => {
        const next = { ...current };
        delete next.fleetCommand;
        return next;
      });
      return;
    }

    if (selectedCommandOrderType === "continue_combat") {
      const enemyFleets = getEnemyFleetsInSystem(fleet.system_id);
      const effectiveTargetFleetId =
        selectedAttackTargetFleetId ?? enemyFleets[0]?.id ?? null;
      const targetFleet = enemyFleets.find(
        (candidate) => candidate.id === effectiveTargetFleetId,
      );

      if (!targetFleet) {
        setActionErrors({
          fleetCommand: "Select an enemy fleet in the current system.",
        });
        return;
      }

      setStagedFleetOrders((current) => ({
        ...current,
        [fleet.id]: {
          order_type: "continue_combat",
          target_fleet_id: targetFleet.id,
        },
      }));

      const remainingFleet = availableFleets.find(
        (candidate) =>
          candidate.id !== fleet.id &&
          stagedFleetOrders[candidate.id] === undefined,
      );
      if (remainingFleet) {
        handleSelectCommandFleet(remainingFleet.id);
      }

      setActionErrors((current) => {
        const next = { ...current };
        delete next.fleetCommand;
        return next;
      });
      return;
    }

    if (selectedCommandOrderType === "split_move") {
      const existingPreparedSplits = Object.entries(stagedFleetOrders).filter(
        ([stagedFleetId, stagedOrder]) =>
          Number(stagedFleetId) !== fleet.id &&
          stagedOrder.order_type === "split_move",
      ).length;
      const availableFleetSlots =
        4 - currentPlayer.fleets.length - existingPreparedSplits;

      if (availableFleetSlots <= 0) {
        setActionErrors({
          fleetCommand: "No free fleet slot is available for Split → Move.",
        });
        return;
      }

      if (fleet.units.length < 2) {
        setActionErrors({
          fleetCommand: "Split → Move requires at least 2 units.",
        });
        return;
      }

      if (
        selectedSplitUnitIds.length <= 0 ||
        selectedSplitUnitIds.length >= fleet.units.length
      ) {
        setActionErrors({
          fleetCommand:
            "Move at least one unit to the new fleet and leave at least one unit in the source fleet.",
        });
        return;
      }

      const sourceUnitIds = new Set(fleet.units.map((unit) => unit.id));
      if (selectedSplitUnitIds.some((unitId) => !sourceUnitIds.has(unitId))) {
        setActionErrors({
          fleetCommand: "Every split unit must belong to the selected fleet.",
        });
        return;
      }

      const connectedSystems = getNonHostileConnectedSystems(fleet.system_id);
      const isConnectedTarget = (systemId: number | null) =>
        systemId === null ||
        connectedSystems.some((system) => system.system_id === systemId);

      if (!isConnectedTarget(selectedCommandTargetSystemId)) {
        setActionErrors({
          fleetCommand:
            "The source fleet movement must use a connected corridor.",
        });
        return;
      }

      if (!isConnectedTarget(selectedSplitFleetTargetSystemId)) {
        setActionErrors({
          fleetCommand:
            "The new fleet movement must use a connected corridor.",
        });
        return;
      }

      setStagedFleetOrders((current) => ({
        ...current,
        [fleet.id]: {
          order_type: "split_move",
          ...(selectedCommandTargetSystemId !== null
            ? { target_system_id: selectedCommandTargetSystemId }
            : {}),
          ...(selectedSplitFleetTargetSystemId !== null
            ? {
                split_fleet_target_system_id:
                  selectedSplitFleetTargetSystemId,
              }
            : {}),
          split_unit_ids: [...selectedSplitUnitIds],
        },
      }));

      const remainingFleet = availableFleets.find(
        (candidate) =>
          candidate.id !== fleet.id &&
          stagedFleetOrders[candidate.id] === undefined,
      );

      if (remainingFleet) {
        handleSelectCommandFleet(remainingFleet.id);
      }

      setActionErrors((current) => {
        const next = { ...current };
        delete next.fleetCommand;
        return next;
      });
      return;
    }

    const firstStepSystems =
      selectedCommandOrderType === "move_attack"
        ? getAttackableConnectedSystems(fleet)
        : selectedCommandOrderType === "move_move"
          ? getConnectedSystems(fleet.system_id)
          : getNonHostileConnectedSystems(fleet.system_id);
    const firstTargetSystemId =
      selectedCommandTargetSystemId ?? firstStepSystems[0]?.system_id ?? null;

    if (!firstTargetSystemId) {
      setActionErrors({
        fleetCommand: "The selected fleet has no connected target system.",
      });
      return;
    }

    if (
      !firstStepSystems.some(
        (system) => system.system_id === firstTargetSystemId,
      )
    ) {
      setActionErrors({
        fleetCommand: "Select a valid first movement corridor.",
      });
      return;
    }

    let secondTargetSystemId: number | undefined;
    let transferFleetId: number | undefined;
    let transferFleetTargetSystemId: number | undefined;
    let unitIdsToTransferFleet: number[] | undefined;
    let unitIdsToCommandFleet: number[] | undefined;

    if (selectedCommandOrderType === "move_move") {
      const firstStepInterceptor =
        getStrongestEnemyFleetInSystem(firstTargetSystemId);

      if (!firstStepInterceptor) {
        const secondStepSystems = getConnectedSystems(firstTargetSystemId);
        const selectedSecondTarget =
          selectedCommandSecondTargetSystemId ??
          secondStepSystems[0]?.system_id ??
          null;

        if (!selectedSecondTarget) {
          setActionErrors({
            fleetCommand:
              "Select the second movement system before adding the order.",
          });
          return;
        }

        if (
          !secondStepSystems.some(
            (system) => system.system_id === selectedSecondTarget,
          )
        ) {
          setActionErrors({
            fleetCommand:
              "The second movement must use a corridor connected to the first selected system.",
          });
          return;
        }

        secondTargetSystemId = selectedSecondTarget;
      }
    }

    let continuingFleetId: number | undefined;
    let targetFleetId: number | undefined;

    if (selectedCommandOrderType === "move_attack") {
      const enemyFleets = getEnemyFleetsInSystem(firstTargetSystemId);
      const effectiveTargetFleetId =
        selectedAttackTargetFleetId ?? enemyFleets[0]?.id ?? null;
      const targetFleet = enemyFleets.find(
        (candidate) => candidate.id === effectiveTargetFleetId,
      );

      if (!targetFleet) {
        setActionErrors({
          fleetCommand: "Select an enemy fleet in the attack destination.",
        });
        return;
      }

      const alreadyTargeted = Object.values(stagedFleetOrders).some(
        (order) => order.target_fleet_id === targetFleet.id,
      );

      if (alreadyTargeted) {
        setActionErrors({
          fleetCommand:
            "The selected enemy fleet is already targeted by another prepared attack.",
        });
        return;
      }

      targetFleetId = targetFleet.id;
    }

    if (
      selectedCommandOrderType === "move_transfer" ||
      selectedCommandOrderType === "transfer_move"
    ) {
      const expectedTransferSystemId =
        selectedCommandOrderType === "transfer_move"
          ? fleet.system_id
          : firstTargetSystemId;
      const transferFleet = availableFleets.find(
        (candidate) => candidate.id === selectedTransferFleetId,
      );

      if (
        !transferFleet ||
        transferFleet.id === fleet.id ||
        transferFleet.system_id !== expectedTransferSystemId
      ) {
        setActionErrors({
          fleetCommand:
            selectedCommandOrderType === "transfer_move"
              ? "Select a ready friendly fleet in the same system."
              : "Select a ready friendly fleet in the destination system.",
        });
        return;
      }

      const reservedFleetIds = new Set<number>();

      for (const [stagedFleetId, stagedOrder] of Object.entries(
        stagedFleetOrders,
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
            "The transfer fleet already participates in another prepared order.",
        });
        return;
      }

      if (
        selectedUnitsToTransferFleet.length === 0 &&
        selectedUnitsToCommandFleet.length === 0
      ) {
        setActionErrors({
          fleetCommand: "Select at least one unit to transfer.",
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
            "The selected transfer would exceed the 5-unit fleet limit.",
        });
        return;
      }

      transferFleetId = transferFleet.id;
      unitIdsToTransferFleet = [...selectedUnitsToTransferFleet];
      unitIdsToCommandFleet = [...selectedUnitsToCommandFleet];

      if (selectedCommandOrderType === "move_transfer") {
        if (selectedTransferFleetMoveTargetSystemId !== null) {
          const remainingMoveSystems = getNonHostileConnectedSystems(
            transferFleet.system_id,
          );

          if (
            !remainingMoveSystems.some(
              (system) =>
                system.system_id === selectedTransferFleetMoveTargetSystemId,
            )
          ) {
            setActionErrors({
              fleetCommand:
                "The receiving fleet's remaining move must use a connected corridor.",
            });
            return;
          }

          if (transferProjectedCount <= 0) {
            setActionErrors({
              fleetCommand:
                "The receiving fleet cannot move because it would contain no units after transfer.",
            });
            return;
          }

          transferFleetTargetSystemId =
            selectedTransferFleetMoveTargetSystemId;
        }
      } else {
        const selectedContinuingFleet =
          selectedContinuingFleetId === transferFleet.id
            ? transferFleet
            : fleet;
        const continuingProjectedCount =
          selectedContinuingFleet.id === fleet.id
            ? sourceProjectedCount
            : transferProjectedCount;

        if (continuingProjectedCount <= 0) {
          setActionErrors({
            fleetCommand:
              "The fleet selected to continue movement must contain at least one unit after transfer.",
          });
          return;
        }

        continuingFleetId = selectedContinuingFleet.id;
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
        continuing_fleet_id: continuingFleetId,
        target_fleet_id: targetFleetId,
        split_fleet_target_system_id: undefined,
        split_unit_ids: undefined,
        unit_ids_to_transfer_fleet: unitIdsToTransferFleet,
        unit_ids_to_command_fleet: unitIdsToCommandFleet,
      },
    }));

    const additionallyReservedFleetId = transferFleetId;
    const remainingFleet = availableFleets.find(
      (candidate) =>
        candidate.id !== fleet.id &&
        candidate.id !== additionallyReservedFleetId &&
        stagedFleetOrders[candidate.id] === undefined,
    );

    if (remainingFleet) {
      handleSelectCommandFleet(remainingFleet.id);
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

  function buildFleetCommandOrders(): FleetCommandOrder[] {
    return Object.entries(stagedFleetOrders).map(([fleetId, order]) => ({
      fleet_id: Number(fleetId),
      order_type: order.order_type,
      ...(order.target_system_id !== undefined
        ? { target_system_id: order.target_system_id }
        : {}),
      ...(order.second_target_system_id !== undefined
        ? { second_target_system_id: order.second_target_system_id }
        : {}),
      ...(order.target_fleet_id !== undefined
        ? { target_fleet_id: order.target_fleet_id }
        : {}),
      ...(order.split_unit_ids !== undefined
        ? {
            split_unit_ids: order.split_unit_ids,
            ...(order.split_fleet_target_system_id !== undefined
              ? {
                  split_fleet_target_system_id:
                    order.split_fleet_target_system_id,
                }
              : {}),
          }
        : {}),
      ...(order.transfer_fleet_id !== undefined
        ? {
            transfer_fleet_id: order.transfer_fleet_id,
            ...(order.transfer_fleet_target_system_id !== undefined
              ? {
                  transfer_fleet_target_system_id:
                    order.transfer_fleet_target_system_id,
                }
              : {}),
            ...(order.continuing_fleet_id !== undefined
              ? { continuing_fleet_id: order.continuing_fleet_id }
              : {}),
            unit_ids_to_transfer_fleet:
              order.unit_ids_to_transfer_fleet ?? [],
            unit_ids_to_command_fleet:
              order.unit_ids_to_command_fleet ?? [],
          }
        : {}),
    }));
  }

  function getFleetById(fleetId: number): SessionFleet | null {
    return (
      session?.players
        .flatMap((player) => player.fleets ?? [])
        .find((fleet) => fleet.id === fleetId) ?? null
    );
  }

  function buildResolutionPreviews(
    orders: FleetCommandOrder[],
  ): ResolutionPreview[] {
    return orders.map((order) => {
      const fleet = getFleetById(order.fleet_id);
      const fromName = fleet?.system_name ?? `System ${fleet?.system_id ?? "?"}`;
      const firstTarget =
        order.target_system_id !== undefined
          ? getSessionSystemById(order.target_system_id)
          : null;
      const secondTarget =
        order.second_target_system_id !== undefined
          ? getSessionSystemById(order.second_target_system_id)
          : null;
      const transferTarget =
        order.transfer_fleet_target_system_id !== undefined
          ? getSessionSystemById(order.transfer_fleet_target_system_id)
          : null;
      const splitTarget =
        order.split_fleet_target_system_id !== undefined
          ? getSessionSystemById(order.split_fleet_target_system_id)
          : null;
      const attackTarget =
        order.target_fleet_id !== undefined
          ? getFleetById(order.target_fleet_id)
          : null;

      let dangerCards = 0;
      let pursuitCards = 0;

      if (fleet && firstTarget) {
        dangerCards += getCorridorDangerCards(
          fleet.system_id,
          firstTarget.system_id,
        );
      }

      if (firstTarget && secondTarget) {
        dangerCards += getCorridorDangerCards(
          firstTarget.system_id,
          secondTarget.system_id,
        );
      }

      if (order.transfer_fleet_id !== undefined && transferTarget) {
        const transferFleet = getFleetById(order.transfer_fleet_id);
        if (transferFleet) {
          dangerCards += getCorridorDangerCards(
            transferFleet.system_id,
            transferTarget.system_id,
          );
        }
      }

      if (fleet && splitTarget) {
        dangerCards += getCorridorDangerCards(
          fleet.system_id,
          splitTarget.system_id,
        );
      }

      if (order.order_type === "move_attack" && attackTarget?.is_defensive) {
        dangerCards += 1;
      }

      if (order.order_type === "retreat" && fleet) {
        const pursuer = getLargestEnemyFleetInSystem(fleet.system_id);
        pursuitCards = pursuer
          ? Math.max(0, pursuer.units.length - fleet.units.length)
          : 0;
        dangerCards += pursuitCards;
      }

      let route = fromName;

      if (order.order_type === "defend") {
        route = `${fromName} · Hold position`;
      } else if (order.order_type === "continue_combat") {
        route = `${fromName} · Continue combat`;
      } else if (order.order_type === "split_move") {
        const sourceDestination = firstTarget?.system_name ?? "Hold position";
        const newFleetDestination = splitTarget?.system_name ?? "Hold position";
        route = `${fromName} · Source → ${sourceDestination} · New fleet → ${newFleetDestination}`;
      } else {
        const routeParts = [fromName];
        if (firstTarget) routeParts.push(firstTarget.system_name);
        if (secondTarget) routeParts.push(secondTarget.system_name);
        route = routeParts.join(" → ");

        if (transferTarget) {
          route += ` · Partner → ${transferTarget.system_name}`;
        }
      }

      const firstStepInterceptor =
        order.order_type === "move_move" && firstTarget
          ? getStrongestEnemyFleetInSystem(firstTarget.system_id)
          : null;
      const hostileEntrySystem =
        order.order_type === "move_move"
          ? (firstStepInterceptor ? firstTarget : secondTarget)
          : null;
      const hostileStepNumber: 1 | 2 | null =
        order.order_type === "move_move" && hostileEntrySystem
          ? (firstStepInterceptor ? 1 : 2)
          : null;
      const hostileEntryOwner = hostileEntrySystem
        ? getPlayerById(hostileEntrySystem.owner_player_id)
        : null;
      const interceptor = hostileEntrySystem
        ? getStrongestEnemyFleetInSystem(hostileEntrySystem.system_id)
        : null;
      const interceptorOwner = interceptor ? getFleetOwner(interceptor) : null;
      const isHostileEntry = Boolean(
        hostileEntrySystem &&
          ((hostileEntrySystem.owner_player_id !== null &&
            hostileEntrySystem.owner_player_id !== currentPlayer?.id) ||
            interceptor),
      );
      const interceptorAttack = interceptor
        ? interceptor.units.reduce(
            (total, unit) =>
              total + (unit.is_combat ? Math.max(0, unit.attack) : 0),
            0,
          )
        : 0;
      const movingFleetDefense = fleet
        ? fleet.units.reduce(
            (total, unit) => total + Math.max(0, unit.defense),
            0,
          )
        : 0;
      const estimatedInterceptionDamage =
        interceptorAttack > 0
          ? Math.max(1, interceptorAttack - movingFleetDefense)
          : 0;

      return {
        fleetId: order.fleet_id,
        fleetName: fleet?.name ?? `Fleet ${order.fleet_id}`,
        route,
        dangerCards,
        pursuitCards,
        isCombat:
          order.order_type === "move_attack" ||
          order.order_type === "continue_combat",
        isRetreat: order.order_type === "retreat",
        attackTargetName: attackTarget?.name ?? null,
        isHostileEntry,
        hostileStepNumber,
        movementEndsAtInterception: hostileStepNumber === 1 && Boolean(interceptor),
        hostileSystemName: hostileEntrySystem?.system_name ?? null,
        hostileOwnerName: hostileEntryOwner?.faction_name ?? null,
        interceptorFleetName: interceptor?.name ?? null,
        interceptorOwnerName: interceptorOwner?.faction_name ?? null,
        estimatedInterceptionDamage,
      };
    });
  }

  function humanizeCombatOutcome(outcome: string): string {
    return outcome
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function createDangerRevealItem(
    id: string,
    fleetName: string,
    subtitle: string,
    card: DangerCardResult,
  ): ResolutionRevealItem {
    return {
      id,
      kind: "danger",
      title: card.name,
      subtitle: `${fleetName} · ${subtitle}`,
      description: card.description,
      result: card.effect_summary,
      tone: card.effect_type === "none" ? "safe" : "danger",
      card,
    };
  }

  function buildResolutionRevealItems(
    report: FleetCommandOrderReport[],
  ): ResolutionRevealItem[] {
    const items: ResolutionRevealItem[] = [];

    report.forEach((order, orderIndex) => {
      order.steps.forEach((step) => {
        step.drawn_cards.forEach((card, cardIndex) => {
          items.push(
            createDangerRevealItem(
              `order-${orderIndex}-step-${step.step}-card-${cardIndex}`,
              order.fleet_name,
              `${step.from_system_name ?? step.from_system_id} → ${step.to_system_name ?? step.to_system_id}`,
              card,
            ),
          );
        });
      });

      const transferSteps = [
        order.transfer?.partner_movement_step ?? null,
        order.transfer?.continuing_movement_step ?? null,
      ].filter((step) => step !== null);

      transferSteps.forEach((step, transferStepIndex) => {
        step.drawn_cards.forEach((card, cardIndex) => {
          items.push(
            createDangerRevealItem(
              `order-${orderIndex}-transfer-${transferStepIndex}-${cardIndex}`,
              order.transfer?.partner_fleet_name ?? order.fleet_name,
              `${step.from_system_name ?? step.from_system_id} → ${step.to_system_name ?? step.to_system_id}`,
              card,
            ),
          );
        });
      });

      const splitSteps = [
        order.split?.source_movement_step ?? null,
        order.split?.new_fleet_movement_step ?? null,
      ].filter((step) => step !== null);

      splitSteps.forEach((step, splitStepIndex) => {
        step.drawn_cards.forEach((card, cardIndex) => {
          items.push(
            createDangerRevealItem(
              `order-${orderIndex}-split-${splitStepIndex}-${cardIndex}`,
              splitStepIndex === 0
                ? order.fleet_name
                : (order.split?.new_fleet_name ?? "New fleet"),
              `${step.from_system_name ?? step.from_system_id} → ${step.to_system_name ?? step.to_system_id}`,
              card,
            ),
          );
        });
      });

      order.combat?.ambush_cards.forEach((card, cardIndex) => {
        items.push(
          createDangerRevealItem(
            `order-${orderIndex}-ambush-${cardIndex}`,
            order.fleet_name,
            "Defensive ambush",
            card,
          ),
        );
      });

    });

    return items;
  }

  async function executeFleetCommand(
    orders: FleetCommandOrder[],
    showResolutionModal: boolean,
  ) {
    if (!session) {
      return;
    }

    try {
      setIsFleetCommandLoading(true);
      setError("");
      setActionErrors({});

      if (showResolutionModal) {
        setResolutionModal((current) =>
          current
            ? { ...current, phase: "executing", error: null }
            : current,
        );
      }

      const result = await issueFleetCommand(session.id, { orders });

      setStagedFleetOrders({});

      if (!showResolutionModal) {
        setSession(result.session);
        selectCurrentPlayerFromSession(result.session);
        return;
      }

      const revealItems = buildResolutionRevealItems(result.command_report);

      setResolutionModal((current) =>
        current
          ? {
              ...current,
              phase: revealItems.length > 0 ? "reveal" : "result",
              response: result,
              revealItems,
              revealIndex: 0,
              error: null,
            }
          : current,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to issue fleet command";

      if (showResolutionModal) {
        setResolutionModal((current) =>
          current
            ? { ...current, phase: "confirm", error: message }
            : current,
        );
      } else {
        setActionErrors({ fleetCommand: message });
      }
    } finally {
      setIsFleetCommandLoading(false);
    }
  }

  async function handleExecuteFleetCommand() {
    if (!session || !currentPlayer) {
      return;
    }

    const orders = buildFleetCommandOrders();

    if (orders.length === 0) {
      setActionErrors({
        fleetCommand: "Add at least one fleet order before execution.",
      });
      return;
    }

    if (currentPlayer.command_points_left <= 0) {
      setActionErrors({
        fleetCommand: "The current player has no command points left.",
      });
      return;
    }

    const previews = buildResolutionPreviews(orders);
    const requiresResolutionModal = previews.some(
      (preview) =>
        preview.dangerCards > 0 || preview.isCombat || preview.isHostileEntry,
    );

    if (!requiresResolutionModal) {
      await executeFleetCommand(orders, false);
      return;
    }

    setResolutionModal({
      phase: "confirm",
      orders,
      previews,
      response: null,
      revealItems: [],
      revealIndex: 0,
      error: null,
    });
  }

  async function handleConfirmResolution() {
    if (!resolutionModal || resolutionModal.phase !== "confirm") {
      return;
    }

    await executeFleetCommand(resolutionModal.orders, true);
  }

  function handleDismissResolution() {
    if (resolutionModal?.phase === "executing") {
      return;
    }

    setResolutionModal(null);
  }

  function handleCompleteResolution() {
    const response = resolutionModal?.response;

    if (response) {
      setSession(response.session);
      selectCurrentPlayerFromSession(response.session);
    }

    setResolutionModal(null);
  }

  function handleSelectPlayer(player: SessionPlayer) {
    setSelectedPlayerId(player.id);

    const firstControlledSystem = session?.systems.find(
      (system) => system.owner_player_id === player.id,
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

  function getPlayerById(
    playerId: number | null | undefined,
  ): SessionPlayer | null {
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
      (player) => player.id === playerId,
    );

    if (playerIndex < 0) {
      return NEUTRAL_PLAYER_VISUAL;
    }

    return (
      PLAYER_VISUAL_PALETTE[playerIndex % PLAYER_VISUAL_PALETTE.length] ??
      NEUTRAL_PLAYER_VISUAL
    );
  }

  function getPlayerVisualStyle(
    playerId: number | null | undefined,
  ): CSSProperties {
    const visual = getPlayerVisual(playerId);

    return {
      "--player-color": visual.color,
      "--player-color-soft": visual.soft,
      "--player-color-glow": visual.glow,
      "--player-color-deep": visual.deep,
    } as CSSProperties;
  }

  function getOwnershipRelation(
    ownerPlayerId: number | null | undefined,
  ): "friendly" | "hostile" | "neutral" {
    if (ownerPlayerId === null || ownerPlayerId === undefined) {
      return "neutral";
    }

    if (currentPlayer && ownerPlayerId === currentPlayer.id) {
      return "friendly";
    }

    return "hostile";
  }

  function getOwnershipLabel(ownerPlayerId: number | null | undefined): string {
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
      (player.fleets ?? []).filter((fleet) => fleet.system_id === systemId),
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
      connectedSystemIds.has(system.system_id),
    );
  }

  function getNonHostileConnectedSystems(systemId: number): SessionSystem[] {
    return getConnectedSystems(systemId).filter(
      (system) => getEnemyFleetsInSystem(system.system_id).length === 0,
    );
  }

  function getCorridorLabel(fromSystemId: number, toSystemId: number): string {
    const connection = (mapDetails?.connections ?? []).find(
      (candidate) =>
        (candidate.from_system_id === fromSystemId &&
          candidate.to_system_id === toSystemId) ||
        (candidate.from_system_id === toSystemId &&
          candidate.to_system_id === fromSystemId),
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
    toSystemId: number,
  ): number {
    const connection = (mapDetails?.connections ?? []).find(
      (candidate) =>
        (candidate.from_system_id === fromSystemId &&
          candidate.to_system_id === toSystemId) ||
        (candidate.from_system_id === toSystemId &&
          candidate.to_system_id === fromSystemId),
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
    (fleet) => !fleet.has_acted_this_round,
  );
  const selectedCommandFleet =
    readyCommandFleets.find((fleet) => fleet.id === selectedCommandFleetId) ??
    readyCommandFleets[0] ??
    null;
  const selectedCommandConnectedSystems = selectedCommandFleet
    ? getNonHostileConnectedSystems(selectedCommandFleet.system_id)
    : [];
  const selectedCommandMoveMoveSystems = selectedCommandFleet
    ? getConnectedSystems(selectedCommandFleet.system_id)
    : [];
  const selectedCommandFleetEngaged = isFleetEngaged(selectedCommandFleet);
  const selectedCommandDestinationSystems =
    selectedCommandOrderType === "move_attack"
      ? getAttackableConnectedSystems(selectedCommandFleet)
      : selectedCommandOrderType === "continue_combat"
        ? []
        : selectedCommandOrderType === "move_move"
          ? selectedCommandMoveMoveSystems
          : selectedCommandConnectedSystems;
  const effectiveCommandTargetSystemId =
    selectedCommandOrderType === "split_move" ||
    selectedCommandOrderType === "defend" ||
    selectedCommandOrderType === "continue_combat"
      ? selectedCommandTargetSystemId
      : (selectedCommandTargetSystemId ??
        selectedCommandDestinationSystems[0]?.system_id ??
        null);
  const attackTargetFleets =
    selectedCommandOrderType === "move_attack"
      ? getEnemyFleetsInSystem(effectiveCommandTargetSystemId)
      : selectedCommandOrderType === "continue_combat"
        ? getEnemyFleetsInSystem(selectedCommandFleet?.system_id ?? null)
        : [];
  const effectiveAttackTargetFleet =
    attackTargetFleets.find(
      (fleet) => fleet.id === selectedAttackTargetFleetId,
    ) ??
    attackTargetFleets[0] ??
    null;

  useEffect(() => {
    if (!selectedCommandFleet) {
      return;
    }

    if (selectedCommandFleetId !== selectedCommandFleet.id) {
      setSelectedCommandFleetId(selectedCommandFleet.id);
    }

    if (
      selectedCommandFleetEngaged &&
      selectedCommandOrderType !== "continue_combat" &&
      selectedCommandOrderType !== "retreat"
    ) {
      setSelectedCommandOrderType("continue_combat");
      setSelectedCommandTargetSystemId(null);
      setSelectedAttackTargetFleetId(
        getEnemyFleetsInSystem(selectedCommandFleet.system_id)[0]?.id ?? null,
      );
    }

    if (
      !selectedCommandFleetEngaged &&
      (selectedCommandOrderType === "continue_combat" ||
        selectedCommandOrderType === "retreat")
    ) {
      setSelectedCommandOrderType("move_defend");
      setSelectedCommandTargetSystemId(
        getNonHostileConnectedSystems(selectedCommandFleet.system_id)[0]
          ?.system_id ?? null,
      );
      setSelectedAttackTargetFleetId(null);
    }
  }, [
    selectedCommandFleet?.id,
    selectedCommandFleetEngaged,
    selectedCommandOrderType,
  ]);
  const selectedMoveMoveFirstInterceptor =
    selectedCommandOrderType === "move_move" &&
    effectiveCommandTargetSystemId !== null
      ? getStrongestEnemyFleetInSystem(effectiveCommandTargetSystemId)
      : null;
  const selectedCommandSecondStepSystems =
    selectedCommandOrderType === "move_move" &&
    effectiveCommandTargetSystemId !== null &&
    !selectedMoveMoveFirstInterceptor
      ? getConnectedSystems(effectiveCommandTargetSystemId)
      : [];
  const effectiveCommandSecondTargetSystemId =
    selectedCommandOrderType === "move_move" &&
    !selectedMoveMoveFirstInterceptor
      ? (selectedCommandSecondTargetSystemId ??
        selectedCommandSecondStepSystems[0]?.system_id ??
        null)
      : null;
  const selectedMoveMoveInterceptionAttack =
    selectedMoveMoveFirstInterceptor?.units.reduce(
      (total, unit) =>
        total + (unit.is_combat ? Math.max(0, unit.attack) : 0),
      0,
    ) ?? 0;
  const selectedMoveMoveFleetDefense =
    selectedCommandFleet?.units.reduce(
      (total, unit) => total + Math.max(0, unit.defense),
      0,
    ) ?? 0;
  const selectedMoveMoveEstimatedDamage =
    selectedMoveMoveInterceptionAttack > 0
      ? Math.max(
          1,
          selectedMoveMoveInterceptionAttack - selectedMoveMoveFleetDefense,
        )
      : 0;
  const availableTransferFleets =
    selectedCommandOrderType === "move_transfer" ||
    selectedCommandOrderType === "transfer_move"
      ? getReadyTransferFleets(
          selectedCommandOrderType === "transfer_move"
            ? (selectedCommandFleet?.system_id ?? null)
            : effectiveCommandTargetSystemId,
          selectedCommandFleet?.id ?? null,
        )
      : [];
  const effectiveTransferFleet =
    availableTransferFleets.find(
      (fleet) => fleet.id === selectedTransferFleetId,
    ) ??
    availableTransferFleets[0] ??
    null;
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
  const effectiveContinuingFleet =
    selectedCommandOrderType === "transfer_move"
      ? selectedContinuingFleetId === effectiveTransferFleet?.id
        ? effectiveTransferFleet
        : selectedCommandFleet
      : null;
  const projectedContinuingFleetCount =
    effectiveContinuingFleet?.id === selectedCommandFleet?.id
      ? projectedCommandFleetCount
      : projectedTransferFleetCount;
  const continuingFleetSelectionInvalid =
    selectedCommandOrderType === "transfer_move" &&
    (!effectiveContinuingFleet || projectedContinuingFleetCount <= 0);
  const transferFleetRemainingMoveSystems = effectiveTransferFleet
    ? getNonHostileConnectedSystems(effectiveTransferFleet.system_id)
    : [];
  const selectedTransferFleetMoveDangerCards =
    effectiveTransferFleet && selectedTransferFleetMoveTargetSystemId !== null
      ? getCorridorDangerCards(
          effectiveTransferFleet.system_id,
          selectedTransferFleetMoveTargetSystemId,
        )
      : 0;
  const preparedSplitOrdersCount = Object.entries(stagedFleetOrders).filter(
    ([fleetId, order]) =>
      order.order_type === "split_move" &&
      Number(fleetId) !== selectedCommandFleet?.id,
  ).length;
  const splitHasFreeFleetSlot = currentPlayer
    ? currentPlayer.fleets.length + preparedSplitOrdersCount < 4
    : false;
  const splitSourceProjectedCount = selectedCommandFleet
    ? selectedCommandFleet.units.length - selectedSplitUnitIds.length
    : 0;
  const splitNewFleetProjectedCount = selectedSplitUnitIds.length;
  const splitSelectionInvalid =
    selectedCommandOrderType === "split_move" &&
    (!selectedCommandFleet ||
      selectedCommandFleet.units.length < 2 ||
      !splitHasFreeFleetSlot ||
      splitNewFleetProjectedCount <= 0 ||
      splitSourceProjectedCount <= 0);
  const splitNewFleetDangerCards =
    selectedCommandFleet && selectedSplitFleetTargetSystemId !== null
      ? getCorridorDangerCards(
          selectedCommandFleet.system_id,
          selectedSplitFleetTargetSystemId,
        )
      : 0;
  const usedFleetNumbers = new Set(
    currentPlayerFleets.map((fleet) => fleet.fleet_number),
  );
  const availableSplitFleetNumbers = [1, 2, 3, 4].filter(
    (fleetNumber) => !usedFleetNumbers.has(fleetNumber),
  );
  const nextSplitFleetNumber =
    availableSplitFleetNumbers[preparedSplitOrdersCount];
  const selectedRouteFirstDangerCards =
    selectedCommandFleet && effectiveCommandTargetSystemId
      ? getCorridorDangerCards(
          selectedCommandFleet.system_id,
          effectiveCommandTargetSystemId,
        )
      : 0;
  const selectedRouteSecondDangerCards =
    selectedCommandOrderType === "move_move" &&
    effectiveCommandTargetSystemId &&
    effectiveCommandSecondTargetSystemId
      ? getCorridorDangerCards(
          effectiveCommandTargetSystemId,
          effectiveCommandSecondTargetSystemId,
        )
      : 0;
  const retreatPursuingFleet =
    selectedCommandOrderType === "retreat" && selectedCommandFleet
      ? getLargestEnemyFleetInSystem(selectedCommandFleet.system_id)
      : null;
  const selectedRetreatPursuitCards =
    selectedCommandOrderType === "retreat" &&
    selectedCommandFleet &&
    retreatPursuingFleet
      ? Math.max(
          0,
          retreatPursuingFleet.units.length - selectedCommandFleet.units.length,
        )
      : 0;
  const selectedRouteTotalDangerCards =
    selectedRouteFirstDangerCards +
    selectedRouteSecondDangerCards +
    selectedTransferFleetMoveDangerCards +
    splitNewFleetDangerCards +
    selectedRetreatPursuitCards +
    (selectedCommandOrderType === "move_attack" &&
    effectiveAttackTargetFleet?.is_defensive
      ? 1
      : 0);


  function getFleetOrderDisplayName(orderType: FleetOrderType): string {
    switch (orderType) {
      case "defend":
        return "Defensive Position";
      case "move_attack":
        return "Move → Attack";
      case "continue_combat":
        return "Continue Combat";
      case "retreat":
        return "Retreat";
      case "move_move":
        return "Move → Move";
      case "move_transfer":
        return "Move → Transfer";
      case "transfer_move":
        return "Transfer → Move";
      case "split_move":
        return "Split → Move";
      default:
        return "Move → Defensive Position";
    }
  }

  function renderDangerEffectInfographic(card: DangerCardResult) {
    if (card.effect_type === "damage_front_unit") {
      return (
        <div className="archont-card-effect-graphic is-damage">
          <span className="archont-card-effect-icon">HP</span>
          <span>
            <strong>{card.target_unit_name ?? "Front unit"}</strong>
            <small>
              {card.unit_hp_before ?? "?"} → {card.unit_hp_after ?? "?"} HP
              {card.unit_destroyed ? " · Destroyed" : ""}
            </small>
          </span>
        </div>
      );
    }

    if (card.effect_type === "lose_energy") {
      return (
        <div className="archont-card-effect-graphic is-energy">
          <span className="archont-card-effect-icon">ϟ</span>
          <span>
            <strong>-{card.resource_lost} ENG</strong>
            <small>Energy lost</small>
          </span>
        </div>
      );
    }

    if (card.effect_type === "lose_food") {
      return (
        <div className="archont-card-effect-graphic is-supply">
          <span className="archont-card-effect-icon">▰</span>
          <span>
            <strong>-{card.resource_lost} SUP</strong>
            <small>Supply lost</small>
          </span>
        </div>
      );
    }

    return (
      <div className="archont-card-effect-graphic is-safe">
        <span className="archont-card-effect-icon">✓</span>
        <span>
          <strong>Safe passage</strong>
          <small>No gameplay effect</small>
        </span>
      </div>
    );
  }

  function renderModalCommandReport(report: FleetCommandOrderReport[]) {
    const dangerCards = report.flatMap((order) => [
      ...order.steps.flatMap((step) => step.drawn_cards),
      ...(order.transfer?.partner_movement_step?.drawn_cards ?? []),
      ...(order.transfer?.continuing_movement_step?.drawn_cards ?? []),
      ...(order.split?.source_movement_step?.drawn_cards ?? []),
      ...(order.split?.new_fleet_movement_step?.drawn_cards ?? []),
      ...(order.combat?.ambush_cards ?? []),
    ]);
    const dangerDamage = dangerCards.reduce(
      (total, card) =>
        total +
        (card.effect_type === "damage_front_unit" &&
        card.unit_hp_before !== null &&
        card.unit_hp_after !== null
          ? Math.max(0, card.unit_hp_before - card.unit_hp_after)
          : 0),
      0,
    );
    const energyLost = dangerCards.reduce(
      (total, card) =>
        total + (card.resource === "energy" ? card.resource_lost : 0),
      0,
    );
    const supplyLost = dangerCards.reduce(
      (total, card) =>
        total + (card.resource === "food" ? card.resource_lost : 0),
      0,
    );
    const dangerDestroyed = dangerCards.filter(
      (card) => card.unit_destroyed,
    );

    return (
      <div className="archont-resolution-final-summary">
        <section className="archont-resolution-total-effects">
          <header>
            <span className="archont-eyebrow">DANGER SUMMARY</span>
            <h3>Total danger-card effect</h3>
          </header>
          <div className="archont-resolution-metric-grid">
            <span><strong>{dangerCards.length}</strong><small>Cards</small></span>
            <span><strong>{dangerDamage}</strong><small>Fleet HP lost</small></span>
            <span><strong>{energyLost}</strong><small>ENG lost</small></span>
            <span><strong>{supplyLost}</strong><small>SUP lost</small></span>
          </div>
          {dangerDestroyed.length > 0 ? (
            <div className="archont-resolution-destroyed-units">
              <strong>Destroyed by danger</strong>
              <div>
                {dangerDestroyed.map((card, index) => (
                  <span key={`${card.card_key}-${card.target_unit_id}-${index}`}>
                    {card.target_unit_name ?? "Unit"}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="archont-resolution-no-losses">
              No units were destroyed by danger cards.
            </p>
          )}
        </section>

        <div className="archont-resolution-order-summaries">
          {report.map((order) => {
            const combat = order.combat;
            const exchange = combat?.exchange ?? combat?.rounds[0] ?? null;
            const attackerFleet =
              session?.players
                .flatMap((player) => player.fleets ?? [])
                .find((fleet) => fleet.id === order.fleet_id) ?? null;
            const attackerOwner = attackerFleet
              ? getFleetOwner(attackerFleet)
              : currentPlayer;
            const defenderOwner = combat
              ? getPlayerById(combat.defender_owner_player_id)
              : null;
            const combatSystem = getSessionSystemById(order.final_system_id);
            const combatSystemName =
              order.final_system_name ?? `System ${order.final_system_id}`;
            const combatSystemOwner = getPlayerById(
              combatSystem?.owner_player_id,
            );
            const attackerDestroyed =
              exchange?.attacker_damage_events.filter((event) => event.destroyed) ?? [];
            const defenderDestroyed =
              exchange?.defender_damage_events.filter((event) => event.destroyed) ?? [];

            return (
              <article key={`${order.fleet_id}-${order.order_type}`}>
                <header>
                  <div>
                    <small>{getFleetOrderDisplayName(order.order_type)}</small>
                    <strong>{order.fleet_name}</strong>
                  </div>
                  <span>{order.final_system_name ?? `System ${order.final_system_id}`}</span>
                </header>

                {order.retreat && (
                  <div className="archont-resolution-retreat-summary">
                    <strong>{order.fleet_destroyed ? "Retreat failed" : "Retreat completed"}</strong>
                    <p>
                      Pursued by {order.retreat.pursuing_fleet_name}: {order.retreat.retreating_unit_count} vs {order.retreat.pursuing_unit_count} units.
                    </p>
                    <span>
                      Corridor cards: {order.retreat.corridor_danger_cards} · Pursuit cards: {order.retreat.pursuit_danger_cards}
                    </span>
                  </div>
                )}

                {order.interception && (
                  <section className="archont-resolution-interception-summary">
                    <div className="archont-resolution-combat-heading">
                      <small>INTERCEPTION FIRE</small>
                      <strong>One-way defensive strike</strong>
                    </div>
                    <div className="archont-resolution-combat-location">
                      <span>⚠</span>
                      <div>
                        <small>HOSTILE ARRIVAL</small>
                        <strong>{order.final_system_name ?? `System ${order.final_system_id}`}</strong>
                        <em>
                          {order.interception.destination_owner_name
                            ? `Controlled by ${order.interception.destination_owner_name}`
                            : "Hostile fleet presence"}
                        </em>
                      </div>
                    </div>
                    {order.interception.interceptor_fleet_name ? (
                      <>
                        <p>
                          {order.interception.interceptor_owner_name ?? "Rival"} · {order.interception.interceptor_fleet_name} fired on {order.fleet_name}. The moving fleet did not return fire.
                        </p>
                        <div className="archont-resolution-combat-metrics">
                          <span><strong>{order.interception.attack_power}</strong><small>Enemy ATK</small></span>
                          <span><strong>{order.interception.target_defense}</strong><small>Your DEF</small></span>
                          <span><strong>{order.interception.damage}</strong><small>Damage received</small></span>
                          <span><strong>{order.interception.damage_events.filter((event) => event.destroyed).length}</strong><small>Units lost</small></span>
                        </div>
                        {order.interception.damage_events.length > 0 && (
                          <div className="archont-resolution-combat-losses">
                            <p>
                              Damage: {order.interception.damage_events.map((event) => `${event.unit_name} ${event.hp_before} → ${event.hp_after} HP${event.destroyed ? " · Destroyed" : ""}`).join(", ")}
                            </p>
                          </div>
                        )}
                        {order.interception.engagement_created && (
                          <em>Both fleets remain in the system and are now engaged.</em>
                        )}
                      </>
                    ) : (
                      <p>No defending fleet was present, so no interception damage was dealt.</p>
                    )}
                  </section>
                )}

                {combat && (
                  <section className={`archont-resolution-combat-summary outcome-${combat.outcome}`}>
                    <div className="archont-resolution-combat-heading">
                      <small>COMBAT EXCHANGE</small>
                      <strong>{humanizeCombatOutcome(combat.outcome)}</strong>
                    </div>

                    <div className="archont-resolution-combat-location">
                      <span>⚔</span>
                      <div>
                        <small>BATTLE LOCATION</small>
                        <strong>{combatSystemName}</strong>
                        <em>
                          {combatSystemOwner
                            ? `Controlled by ${combatSystemOwner.faction_name}`
                            : "Neutral system"}
                        </em>
                      </div>
                    </div>

                    <div className="archont-resolution-combat-participants">
                      <article
                        className="archont-resolution-combat-participant attacker"
                        style={getPlayerVisualStyle(attackerOwner?.id)}
                      >
                        <small>ATTACKER</small>
                        <span className="archont-resolution-combat-player">
                          {attackerOwner?.nickname ?? "Unknown player"}
                        </span>
                        <strong>
                          {attackerOwner?.faction_name ?? "Unknown faction"}
                        </strong>
                        <em>{order.fleet_name}</em>
                      </article>

                      <span className="archont-resolution-combat-vs">VS</span>

                      <article
                        className="archont-resolution-combat-participant defender"
                        style={getPlayerVisualStyle(defenderOwner?.id)}
                      >
                        <small>DEFENDER</small>
                        <span className="archont-resolution-combat-player">
                          {defenderOwner?.nickname ?? "Unknown player"}
                        </span>
                        <strong>
                          {defenderOwner?.faction_name ?? "Unknown faction"}
                        </strong>
                        <em>{combat.defender_fleet_name}</em>
                      </article>
                    </div>

                    {exchange && (
                      <div className="archont-resolution-combat-metrics">
                        <span><strong>{exchange.damage_to_defender}</strong><small>Damage dealt</small></span>
                        <span><strong>{exchange.damage_to_attacker}</strong><small>Damage received</small></span>
                        <span><strong>{defenderDestroyed.length}</strong><small>Enemy units lost</small></span>
                        <span><strong>{attackerDestroyed.length}</strong><small>Own units lost</small></span>
                      </div>
                    )}
                    <div className="archont-resolution-combat-losses">
                      {attackerDestroyed.length > 0 && (
                        <p>Own losses: {attackerDestroyed.map((event) => event.unit_name).join(", ")}</p>
                      )}
                      {defenderDestroyed.length > 0 && (
                        <p>Enemy losses: {defenderDestroyed.map((event) => event.unit_name).join(", ")}</p>
                      )}
                    </div>
                    {combat.engagement_continues && (
                      <em>
                        Both fleets survived and remain engaged. On a later action choose Continue Combat or Retreat.
                      </em>
                    )}
                    {combat.defender_response_ready && (
                      <em className="archont-defense-response-ready">
                        The defending fleet was attacked while in Defensive Position and is ready to choose Continue Combat or Retreat on its owner's next turn.
                      </em>
                    )}
                  </section>
                )}

                {!combat && !order.retreat && !order.interception && (
                  <p className="archont-resolution-movement-result">
                    {order.fleet_destroyed
                      ? "Fleet destroyed during resolution."
                      : `Fleet finished in ${order.final_system_name ?? `System ${order.final_system_id}`}.`}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  const stagedCommandOrders = Object.entries(stagedFleetOrders)
    .map(([fleetId, order]) => {
      const fleet = currentPlayerFleets.find(
        (candidate) => candidate.id === Number(fleetId),
      );
      const firstTargetSystem =
        order.target_system_id !== undefined
          ? getSessionSystemById(order.target_system_id)
          : null;
      const secondTargetSystem =
        order.second_target_system_id !== undefined
          ? getSessionSystemById(order.second_target_system_id)
          : null;
      const transferFleet =
        order.transfer_fleet_id !== undefined
          ? (currentPlayerFleets.find(
              (candidate) => candidate.id === order.transfer_fleet_id,
            ) ?? null)
          : null;
      const transferFleetTargetSystem =
        order.transfer_fleet_target_system_id !== undefined
          ? getSessionSystemById(order.transfer_fleet_target_system_id)
          : null;
      const continuingFleet =
        order.continuing_fleet_id !== undefined
          ? (currentPlayerFleets.find(
              (candidate) => candidate.id === order.continuing_fleet_id,
            ) ?? null)
          : null;
      const targetFleet =
        order.target_fleet_id !== undefined
          ? (session?.players
              .flatMap((player) => player.fleets ?? [])
              .find((candidate) => candidate.id === order.target_fleet_id) ??
            null)
          : null;
      const splitFleetTargetSystem =
        order.split_fleet_target_system_id !== undefined
          ? getSessionSystemById(order.split_fleet_target_system_id)
          : null;

      if (
        !fleet ||
        (order.order_type !== "split_move" &&
          order.order_type !== "defend" &&
          order.order_type !== "continue_combat" &&
          !firstTargetSystem) ||
        (order.order_type === "move_move" && !secondTargetSystem) ||
        ((order.order_type === "move_transfer" ||
          order.order_type === "transfer_move") &&
          !transferFleet) ||
        (order.order_type === "transfer_move" && !continuingFleet) ||
        ((order.order_type === "move_attack" ||
          order.order_type === "continue_combat") &&
          !targetFleet)
      ) {
        return null;
      }

      const firstCorridorLabel = firstTargetSystem
        ? getCorridorLabel(fleet.system_id, firstTargetSystem.system_id)
        : null;
      const secondCorridorLabel =
        secondTargetSystem && firstTargetSystem
          ? getCorridorLabel(
              firstTargetSystem.system_id,
              secondTargetSystem.system_id,
            )
          : null;
      const totalDangerCards =
        (firstTargetSystem
          ? getCorridorDangerCards(
              fleet.system_id,
              firstTargetSystem.system_id,
            )
          : 0) +
        (secondTargetSystem && firstTargetSystem
          ? getCorridorDangerCards(
              firstTargetSystem.system_id,
              secondTargetSystem.system_id,
            )
          : 0) +
        (transferFleet && transferFleetTargetSystem
          ? getCorridorDangerCards(
              transferFleet.system_id,
              transferFleetTargetSystem.system_id,
            )
          : 0) +
        (splitFleetTargetSystem
          ? getCorridorDangerCards(
              fleet.system_id,
              splitFleetTargetSystem.system_id,
            )
          : 0) +
        (order.order_type === "retreat"
          ? Math.max(
              0,
              (getLargestEnemyFleetInSystem(fleet.system_id)?.units.length ?? 0) -
                fleet.units.length,
            )
          : 0);

      return {
        fleet,
        orderType: order.order_type,
        firstTargetSystem,
        secondTargetSystem,
        transferFleet,
        transferFleetTargetSystem,
        continuingFleet,
        targetFleet,
        splitFleetTargetSystem,
        splitUnitsCount: order.split_unit_ids?.length ?? 0,
        unitsToTransferFleetCount:
          order.unit_ids_to_transfer_fleet?.length ?? 0,
        unitsToCommandFleetCount: order.unit_ids_to_command_fleet?.length ?? 0,
        firstCorridorLabel,
        secondCorridorLabel,
        totalDangerCards,
      };
    })
    .filter((order) => order !== null);

  const totalFleetCount = session
    ? session.players.reduce(
        (total, player) => total + (player.fleets?.length ?? 0),
        0,
      )
    : 0;
  const totalUnitCount = session
    ? session.systems.reduce(
        (total, system) => total + (system.units?.length ?? 0),
        0,
      )
    : 0;
  const currentPlayerOwnedSystems =
    session && currentPlayer
      ? session.systems.filter(
          (system) => system.owner_player_id === currentPlayer.id,
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

        <div className="archont-header-actions">
          <Link
            to={`/game/sessions/${numericSessionId}/logs`}
            className="archont-sync-button archont-game-logs-button"
          >
            <span aria-hidden="true">☷</span>
            Game logs
          </Link>

          <button
            className="archont-sync-button"
            onClick={loadSession}
            disabled={isLoading}
          >
            <span aria-hidden="true">↻</span>
            {isLoading ? "Synchronizing..." : "Synchronize board"}
          </button>
        </div>
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
                    ),
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
                    player.id,
                  );

                  return (
                    <button
                      className={[
                        "compact-player-card",
                        "archont-player-card",
                        isSelected ? "selected" : "",
                        isCurrentPlayer ? "current" : "",
                        player.has_passed ? "passed" : "",
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
                            {
                              session.systems.filter(
                                (system) =>
                                  system.owner_player_id === player.id,
                              ).length
                            }
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
                        <span>
                          {player.nickname ?? `User ${player.user_id}`}
                        </span>
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
                            ),
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
                                  {fleet.system_name ??
                                    `System ${fleet.system_id}`}
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
                    Select any system to open its overview. Corridors show safe,
                    dangerous and wraparound routes.
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
                    const fromSystem = getSessionSystemById(
                      connection.from_system_id,
                    );
                    const toSystem = getSessionSystemById(
                      connection.to_system_id,
                    );

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
                      segment: {
                        x1: number;
                        y1: number;
                        x2: number;
                        y2: number;
                      },
                      segmentKey: string,
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
                      const segments = getWraparoundLineSegments(
                        fromPoint,
                        toPoint,
                      );

                      return (
                        <g key={connection.id}>
                          {segments.map((segment, index) =>
                            renderCorridorSegment(
                              segment,
                              `${connection.id}-${index}`,
                            ),
                          )}
                        </g>
                      );
                    }

                    return renderCorridorSegment(
                      {
                        x1: fromPoint.x,
                        y1: fromPoint.y,
                        x2: toPoint.x,
                        y2: toPoint.y,
                      },
                      String(connection.id),
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
                        (fleet) => fleet.owner_player_id === currentPlayer.id,
                      ).length
                    : 0;
                  const hostileFleetCount = currentPlayer
                    ? systemFleets.filter(
                        (fleet) => fleet.owner_player_id !== currentPlayer.id,
                      ).length
                    : systemFleets.length;
                  const ownerPlayer = getPlayerById(system.owner_player_id);
                  const ownershipRelation = getOwnershipRelation(
                    system.owner_player_id,
                  );

                  const systemVisualClass = getGameplaySystemVisualClass(
                    system.system_id,
                  );
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
                        isControlledBySelectedPlayer ? "selectable" : "",
                      ].join(" ")}
                      style={{
                        left: position.left,
                        top: position.top,
                        ...getPlayerVisualStyle(system.owner_player_id),
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
                          {unitsCount > 0 && (
                            <span title="Units">◆ {unitsCount}</span>
                          )}
                          {friendlyFleetCount > 0 && (
                            <span
                              className="friendly-presence"
                              title="Your fleets"
                            >
                              ▲ {friendlyFleetCount}
                            </span>
                          )}
                          {hostileFleetCount > 0 && (
                            <span
                              className="hostile-presence"
                              title="Rival fleets"
                            >
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
                <span className="legend-line-dangerous">
                  Dangerous corridor
                </span>
                <span className="legend-line-wraparound">
                  Wraparound corridor
                </span>
                <span className="legend-ownership-friendly">Your control</span>
                <span className="legend-ownership-hostile">Rival control</span>
                <span className="legend-ownership-neutral">Uncharted</span>
              </div>

              <nav
                className="archont-workspace-tabs"
                aria-label="Player command sections"
              >
                <button
                  type="button"
                  className={activeWorkspaceTab === "systems" ? "active" : ""}
                  onClick={() => openWorkspaceTab("systems")}
                >
                  <span
                    className="archont-workspace-tab-icon"
                    aria-hidden="true"
                  >
                    ◎
                  </span>
                  <span>
                    <strong>Systems</strong>
                    <small>{controlledSystems.length} controlled</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={activeWorkspaceTab === "buildings" ? "active" : ""}
                  onClick={() => openWorkspaceTab("buildings")}
                >
                  <span
                    className="archont-workspace-tab-icon"
                    aria-hidden="true"
                  >
                    ▦
                  </span>
                  <span>
                    <strong>Buildings</strong>
                    <small>{currentPlayerBuildings.length} constructed</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={activeWorkspaceTab === "fleets" ? "active" : ""}
                  onClick={() => openWorkspaceTab("fleets")}
                >
                  <span
                    className="archont-workspace-tab-icon"
                    aria-hidden="true"
                  >
                    ▲
                  </span>
                  <span>
                    <strong>Fleets</strong>
                    <small>{currentPlayerFleets.length}/4 active slots</small>
                  </span>
                </button>
              </nav>

              {activeWorkspaceTab === "buildings" && (
                <section className="archont-workspace-panel archont-buildings-workspace">
                  <div className="archont-workspace-heading">
                    <div>
                      <span className="archont-eyebrow">
                        Infrastructure command
                      </span>
                      <h2>Buildings across your systems</h2>
                      <p>
                        Review existing infrastructure, select a controlled
                        system and construct a new building.
                      </p>
                    </div>
                  </div>

                  <div className="archont-building-inventory-grid">
                    {controlledSystems.map((system) => {
                      const groupedBuildings = groupBuildingsByType(
                        (system.buildings ?? []).filter(
                          (building) =>
                            building.owner_player_id === currentPlayer?.id,
                        ),
                      );
                      const buildingGroups = Object.values(groupedBuildings);

                      return (
                        <button
                          type="button"
                          key={system.system_id}
                          className={[
                            "archont-building-system-card",
                            selectedSystemId === system.system_id
                              ? "selected"
                              : "",
                          ].join(" ")}
                          onClick={() => {
                            setSelectedSystemId(system.system_id);
                            setSelectedStructureKey(null);
                            setSelectedUnitId(null);
                          }}
                        >
                          <header>
                            <span className="archont-building-system-emblem">
                              ◎
                            </span>
                            <span>
                              <strong>{system.system_name}</strong>
                              <small>
                                {buildingGroups.reduce(
                                  (sum, group) => sum + group.length,
                                  0,
                                )}{" "}
                                structures
                              </small>
                            </span>
                          </header>

                          <div className="archont-building-inventory-list">
                            {buildingGroups.length > 0 ? (
                              buildingGroups.map((buildings) => {
                                const firstBuilding = buildings[0];
                                const incomeResources =
                                  getBuildingIncomeResources(
                                    firstBuilding.building_type,
                                    buildings.length,
                                  );

                                return (
                                  <div
                                    key={firstBuilding.building_type}
                                    className="archont-building-inventory-row"
                                  >
                                    <span className="archont-building-inventory-icon">
                                      {getBuildingOverviewIcon(
                                        firstBuilding.building_type,
                                      )}
                                    </span>
                                    <span className="archont-building-inventory-copy">
                                      <strong>
                                        {getBuildingDisplayName(firstBuilding)}
                                      </strong>
                                      <small>×{buildings.length}</small>
                                    </span>
                                    <span className="archont-building-inventory-yield">
                                      {incomeResources.length > 0 ? (
                                        incomeResources.map((resource) => (
                                          <ResourceBadge
                                            key={resource.kind}
                                            kind={resource.kind}
                                            value={resource.value}
                                            compact
                                            valuePrefix="+"
                                          />
                                        ))
                                      ) : (
                                        <small>No direct income</small>
                                      )}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="archont-empty-workspace-note">
                                No structures built in this system yet.
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <aside
                    className="simulation-sidebar build-sidebar archont-construction-ribbon"
                    style={getPlayerVisualStyle(currentPlayer?.id)}
                  >
                    <h2>Construction</h2>
                    <div className="acting-player-card">
                      <span>Acting player</span>
                      <strong>
                        {currentPlayer?.faction_name ?? "No active player"}
                      </strong>
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
                              build: "",
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
                                const amount =
                                  BUILDING_COSTS[building.type][kind] ?? 0;

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

                            <small className="building-effect">
                              {building.income}
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>

                    <label>
                      Controlled system
                      <select
                        value={
                          canBuildInSelectedSystem
                            ? (selectedSystemId ?? "")
                            : ""
                        }
                        onChange={(event) => {
                          const value = event.target.value;

                          setSelectedSystemId(value ? Number(value) : null);
                          setSelectedStructureKey(null);
                          setSelectedUnitId(null);
                          setActionErrors((currentErrors) => ({
                            ...currentErrors,
                            build: "",
                          }));
                        }}
                        disabled={
                          !currentPlayer || controlledSystems.length === 0
                        }
                      >
                        <option value="">Select system</option>

                        {controlledSystems.map((system) => (
                          <option
                            key={system.system_id}
                            value={system.system_id}
                          >
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
                        Select a system controlled by the selected player to
                        build here.
                      </p>
                    )}

                    {selectedBuildingResourceError && (
                      <p className="inline-action-error">
                        {selectedBuildingResourceError}
                      </p>
                    )}

                    {actionErrors.build && (
                      <p className="inline-action-error">
                        {actionErrors.build}
                      </p>
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
                </section>
              )}

              {activeWorkspaceTab === "fleets" && (
                <section className="archont-workspace-panel archont-fleets-workspace">
                  <div className="archont-workspace-heading">
                    <div>
                      <span className="archont-eyebrow">Fleet registry</span>
                      <h2>Fleet slots and active formations</h2>
                      <p>
                        Select a fleet slot to inspect its units and prepare
                        coordinated orders.
                      </p>
                    </div>
                  </div>

                  <div className="archont-fleet-slot-grid">
                    {Array.from({ length: 4 }).map((_, index) => {
                      const fleet = currentPlayerFleets[index] ?? null;

                      if (!fleet) {
                        return (
                          <article
                            key={`empty-${index}`}
                            className="archont-fleet-slot-card empty"
                          >
                            <span className="archont-fleet-slot-index">
                              SLOT {index + 1}
                            </span>
                            <span className="archont-fleet-slot-empty-icon">
                              ＋
                            </span>
                            <strong>Empty fleet slot</strong>
                            <small>
                              Produce a unit in a controlled system to activate
                              this slot.
                            </small>
                          </article>
                        );
                      }

                      const isSelectedFleet =
                        selectedCommandFleet?.id === fleet.id;
                      const fleetSystem = getSessionSystemById(fleet.system_id);
                      const engagedEnemyFleets = getEngagedEnemyFleets(fleet);
                      const isEngagedFleet = engagedEnemyFleets.length > 0;
                      const engagedFleetLabels = engagedEnemyFleets
                        .map((enemyFleet) => {
                          const enemyOwner = getFleetOwner(enemyFleet);
                          const enemyPlayerName =
                            enemyOwner?.nickname ?? enemyOwner?.faction_name ?? "Enemy";
                          return `${enemyPlayerName} · ${enemyFleet.name}`;
                        })
                        .join(", ");
                      const fleetSystemOwner = getPlayerById(
                        fleetSystem?.owner_player_id,
                      );

                      return (
                        <button
                          type="button"
                          key={fleet.id}
                          className={[
                            "archont-fleet-slot-card",
                            isSelectedFleet ? "selected" : "",
                            fleet.has_acted_this_round ? "acted" : "",
                            fleet.is_defensive ? "defensive" : "",
                            isEngagedFleet ? "engaged" : "",
                          ].join(" ")}
                          onClick={() => handleSelectCommandFleet(fleet.id)}
                          disabled={fleet.has_acted_this_round}
                        >
                          <span className="archont-fleet-slot-index">
                            SLOT {index + 1}
                          </span>
                          <header>
                            <span className="archont-fleet-emblem">
                              {index + 1}
                            </span>
                            <span>
                              <strong>{fleet.name}</strong>
                              <small>
                                {currentPlayer?.nickname ?? currentPlayer?.faction_name}
                              </small>
                            </span>
                            <b>{getFleetStatusText(fleet)}</b>
                          </header>

                          <div
                            className={[
                              "archont-fleet-location",
                              isEngagedFleet ? "engaged" : "",
                            ].join(" ")}
                          >
                            <span className="archont-fleet-location-icon">
                              {isEngagedFleet ? "⚔" : "◎"}
                            </span>
                            <span className="archont-fleet-location-copy">
                              <small>
                                {isEngagedFleet
                                  ? "BATTLE LOCATION"
                                  : "CURRENT POSITION"}
                              </small>
                              <strong>
                                {fleet.system_name ?? `System ${fleet.system_id}`}
                              </strong>
                              <em>
                                {isEngagedFleet
                                  ? `Engaged with ${engagedFleetLabels}`
                                  : fleetSystemOwner
                                    ? `Controlled by ${fleetSystemOwner.faction_name}`
                                    : "Neutral system"}
                              </em>
                            </span>
                          </div>

                          <div className="archont-fleet-slot-metrics">
                            <span>
                              <small>UNITS</small>
                              <strong>{fleet.units.length}/5</strong>
                            </span>
                            <span>
                              <small>COMBAT</small>
                              <strong>{getFleetCombatRating(fleet)}</strong>
                            </span>
                          </div>

                          <div className="archont-fleet-slot-units">
                            {fleet.units.map((unit) => (
                              <span
                                key={unit.id}
                                title={`${getUnitDisplayName(unit)} · ${getUnitHpText(unit)}`}
                              >
                                {getUnitIcon(unit)}
                                <small>
                                  {unit.current_hp ?? "—"}/{unit.max_hp ?? "—"}
                                </small>
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <section className="fleet-command-center">
                    <div className="fleet-command-center-header">
                      <div>
                        <span className="fleet-command-kicker">
                          Fleet command
                        </span>
                        <h2>Issue coordinated orders</h2>
                        <p>
                          Select every movement step manually. The interface
                          shows each corridor and its danger before the command
                          is added.
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
                        The current player has no active fleets. Produce a unit
                        or pack a Colony into an Ark first.
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
                                  handleSelectCommandFleet(
                                    Number(event.target.value),
                                  )
                                }
                                disabled={
                                  isFleetCommandLoading ||
                                  readyCommandFleets.length === 0
                                }
                              >
                                {readyCommandFleets.map((fleet) => (
                                  <option key={fleet.id} value={fleet.id}>
                                    {fleet.name} ·{" "}
                                    {fleet.system_name ??
                                      `System ${fleet.system_id}`}{" "}
                                    · {fleet.units.length}/5
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
                                    event.target.value as FleetOrderType,
                                  )
                                }
                                disabled={isFleetCommandLoading}
                              >
                                {selectedCommandFleetEngaged ? (
                                  <>
                                    <option value="continue_combat">
                                      Continue Combat
                                    </option>
                                    <option value="retreat">Retreat</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="defend">
                                      Defensive Position
                                    </option>
                                    <option value="move_defend">
                                      Move → Defensive Position
                                    </option>
                                    <option value="move_attack">
                                      Move → Attack
                                    </option>
                                    <option value="move_move">Move → Move</option>
                                    <option value="move_transfer">
                                      Move → Transfer
                                    </option>
                                    <option value="transfer_move">
                                      Transfer → Move
                                    </option>
                                    <option value="split_move">
                                      Split → Move
                                    </option>
                                  </>
                                )}
                              </select>
                            </label>
                          </div>

                          {selectedCommandOrderType !== "split_move" &&
                            selectedCommandOrderType !== "defend" &&
                            selectedCommandOrderType !== "continue_combat" && (
                            <div className="fleet-command-step">
                              <span className="fleet-command-step-number">3</span>
                              <label>
                                {selectedCommandOrderType === "transfer_move"
                                  ? "Movement destination"
                                  : selectedCommandOrderType === "retreat"
                                    ? "Retreat destination"
                                    : "First movement"}
                                <select
                                  value={effectiveCommandTargetSystemId ?? ""}
                                  onChange={(event) =>
                                    handleSelectFirstMoveTarget(
                                      Number(event.target.value),
                                    )
                                  }
                                  disabled={
                                    isFleetCommandLoading ||
                                    !selectedCommandFleet ||
                                    selectedCommandDestinationSystems.length === 0
                                  }
                                >
                                  {selectedCommandDestinationSystems.map(
                                    (system) => (
                                      <option
                                        key={system.system_id}
                                        value={system.system_id}
                                      >
                                        {system.system_name} ·{" "}
                                        {getCorridorLabel(
                                          selectedCommandFleet?.system_id ?? 0,
                                          system.system_id,
                                        )}
                                        {selectedCommandOrderType === "move_move" &&
                                        getEnemyFleetsInSystem(system.system_id).length > 0
                                          ? " · HOSTILE · INTERCEPTION"
                                          : ""}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </label>
                            </div>
                          )}

                          {(selectedCommandOrderType === "move_attack" ||
                            selectedCommandOrderType === "continue_combat") && (
                            <div className="fleet-command-step fleet-command-attack-target">
                              <span className="fleet-command-step-number">
                                {selectedCommandOrderType === "continue_combat" ? 3 : 4}
                              </span>
                              <label>
                                Enemy fleet
                                <select
                                  value={effectiveAttackTargetFleet?.id ?? ""}
                                  onChange={(event) =>
                                    setSelectedAttackTargetFleetId(
                                      Number(event.target.value),
                                    )
                                  }
                                  disabled={
                                    isFleetCommandLoading ||
                                    attackTargetFleets.length === 0
                                  }
                                >
                                  {attackTargetFleets.map((fleet) => {
                                    const owner = getFleetOwner(fleet);
                                    return (
                                      <option key={fleet.id} value={fleet.id}>
                                        {fleet.name} · {owner?.faction_name ?? "Rival"} · {fleet.units.length}/5
                                        {fleet.is_defensive ? " · Defensive" : ""}
                                      </option>
                                    );
                                  })}
                                </select>
                              </label>
                              {selectedCommandOrderType === "move_attack" &&
                                effectiveAttackTargetFleet?.is_defensive && (
                                <small className="fleet-command-ambush-warning">
                                  Defensive ambush: the attacker draws 1 additional danger card before combat.
                                </small>
                              )}
                            </div>
                          )}

                          {selectedCommandOrderType === "move_move" &&
                            selectedMoveMoveFirstInterceptor && (
                              <div className="archont-hostile-first-step-warning">
                                <strong>INTERCEPTION AFTER STEP 1</strong>
                                <span>
                                  {getFleetOwner(selectedMoveMoveFirstInterceptor)
                                    ?.faction_name ?? "Rival"} · {selectedMoveMoveFirstInterceptor.name}
                                </span>
                                <small>
                                  This fleet will fire once without return fire.
                                  Estimated damage: {selectedMoveMoveEstimatedDamage}.
                                  If your fleet survives, it remains in the first
                                  destination and the second movement is lost.
                                </small>
                              </div>
                            )}

                          {selectedCommandOrderType === "move_move" &&
                            !selectedMoveMoveFirstInterceptor && (
                            <div className="fleet-command-step">
                              <span className="fleet-command-step-number">
                                4
                              </span>
                              <label>
                                Second movement
                                <select
                                  value={
                                    effectiveCommandSecondTargetSystemId ?? ""
                                  }
                                  onChange={(event) =>
                                    setSelectedCommandSecondTargetSystemId(
                                      Number(event.target.value),
                                    )
                                  }
                                  disabled={
                                    isFleetCommandLoading ||
                                    effectiveCommandTargetSystemId === null ||
                                    selectedCommandSecondStepSystems.length ===
                                      0
                                  }
                                >
                                  {selectedCommandSecondStepSystems.map(
                                    (system) => (
                                      <option
                                        key={system.system_id}
                                        value={system.system_id}
                                      >
                                        {system.system_name} ·{" "}
                                        {getCorridorLabel(
                                          effectiveCommandTargetSystemId ?? 0,
                                          system.system_id,
                                        )}
                                        {((system.owner_player_id !== null &&
                                          system.owner_player_id !== currentPlayer?.id) ||
                                          getEnemyFleetsInSystem(system.system_id).length > 0)
                                          ? " · HOSTILE"
                                          : ""}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </label>
                            </div>
                          )}

                          {selectedCommandOrderType === "split_move" &&
                            selectedCommandFleet && (
                              <div className="fleet-split-workspace">
                                <div className="fleet-transfer-section-heading">
                                  <div>
                                    <span>SPLIT PHASE</span>
                                    <strong>Create one new fleet</strong>
                                  </div>
                                  <p>
                                    Move one or more units into one free fleet
                                    slot. At least one unit must remain in the
                                    source fleet. Both fleets may then move once
                                    or hold position.
                                  </p>
                                </div>

                                <div className="fleet-split-status-grid">
                                  <article>
                                    <small>SOURCE FLEET</small>
                                    <strong>{selectedCommandFleet.name}</strong>
                                    <span>
                                      {splitSourceProjectedCount}/5 units after
                                      split
                                    </span>
                                  </article>
                                  <span className="fleet-split-arrow">→</span>
                                  <article>
                                    <small>NEW FLEET SLOT</small>
                                    <strong>
                                      {nextSplitFleetNumber
                                        ? `Fleet ${nextSplitFleetNumber}`
                                        : "No free slot"}
                                    </strong>
                                    <span>
                                      {splitNewFleetProjectedCount}/5 units after
                                      split
                                    </span>
                                  </article>
                                </div>

                                {!splitHasFreeFleetSlot && (
                                  <p className="inline-action-error">
                                    All four fleet slots are already occupied or
                                    reserved by prepared split orders.
                                  </p>
                                )}

                                {selectedCommandFleet.units.length < 2 && (
                                  <p className="inline-action-error">
                                    The selected fleet needs at least 2 units to
                                    split.
                                  </p>
                                )}

                                <div className="fleet-split-unit-grid">
                                  {selectedCommandFleet.units.map((unit) => {
                                    const movesToNewFleet =
                                      selectedSplitUnitIds.includes(unit.id);

                                    return (
                                      <button
                                        key={unit.id}
                                        type="button"
                                        className={[
                                          "fleet-transfer-unit-card",
                                          movesToNewFleet
                                            ? "fleet-transfer-unit-card-selected"
                                            : "",
                                          unit.current_hp !== null &&
                                          unit.max_hp !== null &&
                                          unit.current_hp < unit.max_hp
                                            ? "fleet-transfer-unit-card-damaged"
                                            : "",
                                        ].join(" ")}
                                        onClick={() =>
                                          toggleUnitSelection(
                                            unit.id,
                                            selectedSplitUnitIds,
                                            setSelectedSplitUnitIds,
                                          )
                                        }
                                        disabled={isFleetCommandLoading}
                                      >
                                        <span className="fleet-transfer-unit-direction">
                                          {movesToNewFleet
                                            ? "NEW FLEET →"
                                            : "SOURCE FLEET"}
                                        </span>
                                        <strong>
                                          {getUnitIcon(unit)}{" "}
                                          {getUnitDisplayName(unit)}
                                        </strong>
                                        <small>{getUnitHpText(unit)}</small>
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="fleet-split-movement-grid">
                                  <div className="fleet-transfer-remaining-move">
                                    <div>
                                      <span>{selectedCommandFleet.name}</span>
                                      <strong>Source fleet movement</strong>
                                      <p>
                                        Select one connected system or keep the
                                        fleet in place.
                                      </p>
                                    </div>
                                    <div className="fleet-transfer-move-options">
                                      <button
                                        type="button"
                                        className={
                                          selectedCommandTargetSystemId === null
                                            ? "fleet-transfer-move-option fleet-transfer-move-option-selected"
                                            : "fleet-transfer-move-option"
                                        }
                                        onClick={() =>
                                          setSelectedCommandTargetSystemId(null)
                                        }
                                      >
                                        <strong>Hold position</strong>
                                        <span>No danger cards</span>
                                      </button>
                                      {selectedCommandDestinationSystems.map(
                                        (system) => (
                                          <button
                                            key={system.system_id}
                                            type="button"
                                            className={
                                              selectedCommandTargetSystemId ===
                                              system.system_id
                                                ? "fleet-transfer-move-option fleet-transfer-move-option-selected"
                                                : "fleet-transfer-move-option"
                                            }
                                            onClick={() =>
                                              setSelectedCommandTargetSystemId(
                                                system.system_id,
                                              )
                                            }
                                          >
                                            <strong>{system.system_name}</strong>
                                            <span>
                                              {getCorridorLabel(
                                                selectedCommandFleet.system_id,
                                                system.system_id,
                                              )}
                                            </span>
                                          </button>
                                        ),
                                      )}
                                    </div>
                                  </div>

                                  <div className="fleet-transfer-remaining-move">
                                    <div>
                                      <span>
                                        {nextSplitFleetNumber
                                          ? `Fleet ${nextSplitFleetNumber}`
                                          : "New fleet"}
                                      </span>
                                      <strong>New fleet movement</strong>
                                      <p>
                                        The new fleet may take a different route
                                        from the source fleet.
                                      </p>
                                    </div>
                                    <div className="fleet-transfer-move-options">
                                      <button
                                        type="button"
                                        className={
                                          selectedSplitFleetTargetSystemId === null
                                            ? "fleet-transfer-move-option fleet-transfer-move-option-selected"
                                            : "fleet-transfer-move-option"
                                        }
                                        onClick={() =>
                                          setSelectedSplitFleetTargetSystemId(
                                            null,
                                          )
                                        }
                                      >
                                        <strong>Hold position</strong>
                                        <span>No danger cards</span>
                                      </button>
                                      {selectedCommandDestinationSystems.map(
                                        (system) => (
                                          <button
                                            key={system.system_id}
                                            type="button"
                                            className={
                                              selectedSplitFleetTargetSystemId ===
                                              system.system_id
                                                ? "fleet-transfer-move-option fleet-transfer-move-option-selected"
                                                : "fleet-transfer-move-option"
                                            }
                                            onClick={() =>
                                              setSelectedSplitFleetTargetSystemId(
                                                system.system_id,
                                              )
                                            }
                                          >
                                            <strong>{system.system_name}</strong>
                                            <span>
                                              {getCorridorLabel(
                                                selectedCommandFleet.system_id,
                                                system.system_id,
                                              )}
                                            </span>
                                          </button>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          {(selectedCommandOrderType === "move_transfer" ||
                            selectedCommandOrderType === "transfer_move") && (
                            <div className="fleet-transfer-workspace">
                              <div className="fleet-transfer-section-heading">
                                <div>
                                  <span>TRANSFER PHASE</span>
                                  <strong>
                                    {selectedCommandOrderType === "transfer_move"
                                      ? "Exchange units before movement"
                                      : "Choose the partner fleet"}
                                  </strong>
                                </div>
                                <p>
                                  Transfer does not repair units. Damaged units
                                  remain selectable and keep their current HP.
                                  {selectedCommandOrderType === "transfer_move"
                                    ? " Choose which fleet continues after the exchange."
                                    : ""}
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
                                            null,
                                          );
                                          setSelectedContinuingFleetId(
                                            selectedCommandFleet?.id ?? null,
                                          );
                                        }}
                                        disabled={isFleetCommandLoading}
                                      >
                                        <strong>{fleet.name}</strong>
                                        <span>
                                          {fleet.units.length}/5 units
                                        </span>
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
                                  No ready friendly fleet is waiting in the
                                  selected destination system.
                                </p>
                              )}

                              {effectiveTransferFleet &&
                                selectedCommandFleet && (
                                  <>
                                    <div className="fleet-transfer-board">
                                      <div className="fleet-transfer-side">
                                        <div className="fleet-transfer-side-title">
                                          <strong>
                                            {selectedCommandFleet.name}
                                          </strong>
                                          <span>Arriving fleet</span>
                                        </div>

                                        <div className="fleet-transfer-unit-grid">
                                          {selectedCommandFleet.units.map(
                                            (unit) => {
                                              const isSelected =
                                                selectedUnitsToTransferFleet.includes(
                                                  unit.id,
                                                );
                                              const damaged =
                                                isUnitDamaged(unit);

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
                                                      : "",
                                                  ]
                                                    .filter(Boolean)
                                                    .join(" ")}
                                                  onClick={() =>
                                                    toggleUnitSelection(
                                                      unit.id,
                                                      selectedUnitsToTransferFleet,
                                                      setSelectedUnitsToTransferFleet,
                                                    )
                                                  }
                                                  disabled={
                                                    isFleetCommandLoading
                                                  }
                                                >
                                                  <span className="fleet-transfer-unit-direction">
                                                    {isSelected
                                                      ? "SEND →"
                                                      : "STAY"}
                                                  </span>
                                                  <strong>
                                                    {getUnitDisplayName(unit)}
                                                  </strong>
                                                  <small>
                                                    {getUnitHpText(unit)}
                                                  </small>
                                                  {damaged && (
                                                    <em>
                                                      DAMAGED · transferable
                                                    </em>
                                                  )}
                                                </button>
                                              );
                                            },
                                          )}
                                        </div>
                                      </div>

                                      <div className="fleet-transfer-flow">
                                        <span>⇄</span>
                                        <strong>Exchange</strong>
                                        <small>
                                          Click unit cards to change side
                                        </small>
                                      </div>

                                      <div className="fleet-transfer-side">
                                        <div className="fleet-transfer-side-title">
                                          <strong>
                                            {effectiveTransferFleet.name}
                                          </strong>
                                          <span>Receiving fleet</span>
                                        </div>

                                        <div className="fleet-transfer-unit-grid">
                                          {effectiveTransferFleet.units.map(
                                            (unit) => {
                                              const isSelected =
                                                selectedUnitsToCommandFleet.includes(
                                                  unit.id,
                                                );
                                              const damaged =
                                                isUnitDamaged(unit);

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
                                                      : "",
                                                  ]
                                                    .filter(Boolean)
                                                    .join(" ")}
                                                  onClick={() =>
                                                    toggleUnitSelection(
                                                      unit.id,
                                                      selectedUnitsToCommandFleet,
                                                      setSelectedUnitsToCommandFleet,
                                                    )
                                                  }
                                                  disabled={
                                                    isFleetCommandLoading
                                                  }
                                                >
                                                  <span className="fleet-transfer-unit-direction">
                                                    {isSelected
                                                      ? "← SEND"
                                                      : "STAY"}
                                                  </span>
                                                  <strong>
                                                    {getUnitDisplayName(unit)}
                                                  </strong>
                                                  <small>
                                                    {getUnitHpText(unit)}
                                                  </small>
                                                  {damaged && (
                                                    <em>
                                                      DAMAGED · transferable
                                                    </em>
                                                  )}
                                                </button>
                                              );
                                            },
                                          )}
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
                                        {selectedCommandFleet.name}:{" "}
                                        {projectedCommandFleetCount}/5
                                      </span>
                                      <strong>After transfer</strong>
                                      <span>
                                        {effectiveTransferFleet.name}:{" "}
                                        {projectedTransferFleetCount}/5
                                      </span>
                                    </div>

                                    {selectedCommandOrderType ===
                                      "move_transfer" && (
                                      <div className="fleet-transfer-remaining-move">
                                        <div>
                                          <span>RECEIVING FLEET</span>
                                          <strong>
                                            1 movement remains after transfer
                                          </strong>
                                          <p>
                                            Choose one connected system now, or
                                            hold position and forfeit the unused
                                            movement.
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
                                                null,
                                              )
                                            }
                                            disabled={isFleetCommandLoading}
                                          >
                                            <strong>Hold position</strong>
                                            <span>
                                              Do not use the remaining move
                                            </span>
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
                                                    system.system_id,
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
                                                    system.system_id,
                                                  )}
                                                </span>
                                              </button>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {selectedCommandOrderType ===
                                      "transfer_move" && (
                                      <div className="fleet-transfer-remaining-move fleet-transfer-continuing-selector">
                                        <div>
                                          <span>CONTINUING FLEET</span>
                                          <strong>
                                            Choose the fleet that moves after
                                            the exchange
                                          </strong>
                                          <p>
                                            Both fleets become activated. Only
                                            the selected fleet moves and resolves
                                            corridor danger.
                                          </p>
                                        </div>

                                        <div className="fleet-transfer-move-options">
                                          {[
                                            {
                                              fleet: selectedCommandFleet,
                                              projectedCount:
                                                projectedCommandFleetCount,
                                            },
                                            {
                                              fleet: effectiveTransferFleet,
                                              projectedCount:
                                                projectedTransferFleetCount,
                                            },
                                          ].map(({ fleet, projectedCount }) => (
                                            <button
                                              key={fleet.id}
                                              type="button"
                                              className={
                                                effectiveContinuingFleet?.id ===
                                                fleet.id
                                                  ? "fleet-transfer-move-option fleet-transfer-move-option-selected"
                                                  : "fleet-transfer-move-option"
                                              }
                                              onClick={() =>
                                                setSelectedContinuingFleetId(
                                                  fleet.id,
                                                )
                                              }
                                              disabled={
                                                isFleetCommandLoading ||
                                                projectedCount <= 0
                                              }
                                            >
                                              <strong>{fleet.name}</strong>
                                              <span>
                                                {projectedCount}/5 units after
                                                transfer
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                  </>
                                )}
                            </div>
                          )}

                          {selectedCommandOrderType === "split_move" &&
                            selectedCommandFleet && (
                              <div className="fleet-route-preview fleet-split-preview">
                                <strong>Split result</strong>
                                <span>
                                  {selectedCommandFleet.name}: {splitSourceProjectedCount}/5
                                  {" · "}
                                  {nextSplitFleetNumber
                                    ? `Fleet ${nextSplitFleetNumber}`
                                    : "New fleet"}: {splitNewFleetProjectedCount}/5
                                </span>
                                <small>
                                  Source: {selectedCommandTargetSystemId === null
                                    ? "Hold position"
                                    : getSessionSystemById(
                                        selectedCommandTargetSystemId,
                                      )?.system_name ??
                                      `System ${selectedCommandTargetSystemId}`}
                                  {" · New fleet: "}
                                  {selectedSplitFleetTargetSystemId === null
                                    ? "Hold position"
                                    : getSessionSystemById(
                                        selectedSplitFleetTargetSystemId,
                                      )?.system_name ??
                                      `System ${selectedSplitFleetTargetSystemId}`}
                                </small>
                                <em>
                                  Total danger cards: {selectedRouteTotalDangerCards}
                                </em>
                              </div>
                            )}

                          {selectedCommandOrderType === "continue_combat" &&
                            selectedCommandFleet &&
                            effectiveAttackTargetFleet && (
                              <div className="fleet-route-preview is-combat-engagement">
                                <strong>Combat engagement</strong>
                                <span>
                                  {selectedCommandFleet.name} vs {effectiveAttackTargetFleet.name}
                                </span>
                                <small>
                                  One simultaneous combat exchange. Surviving fleets remain in the system.
                                </small>
                                <em>No corridor movement</em>
                              </div>
                            )}

                          {selectedCommandOrderType !== "split_move" &&
                            selectedCommandOrderType !== "continue_combat" &&
                            selectedCommandFleet &&
                            effectiveCommandTargetSystemId !== null && (
                              <div className="fleet-route-preview">
                                <strong>Selected path</strong>
                                <span>
                                  {selectedCommandFleet.system_name ??
                                    `System ${selectedCommandFleet.system_id}`}
                                  {" → "}
                                  {getSessionSystemById(
                                    effectiveCommandTargetSystemId,
                                  )?.system_name ??
                                    `System ${effectiveCommandTargetSystemId}`}
                                  {selectedCommandOrderType === "move_move" &&
                                    effectiveCommandSecondTargetSystemId !==
                                      null && (
                                      <>
                                        {" → "}
                                        {getSessionSystemById(
                                          effectiveCommandSecondTargetSystemId,
                                        )?.system_name ??
                                          `System ${effectiveCommandSecondTargetSystemId}`}
                                      </>
                                    )}
                                </span>
                                <small>
                                  Step 1:{" "}
                                  {getCorridorLabel(
                                    selectedCommandFleet.system_id,
                                    effectiveCommandTargetSystemId,
                                  )}
                                  {selectedCommandOrderType === "move_move" &&
                                    effectiveCommandSecondTargetSystemId !==
                                      null && (
                                      <>
                                        {" · Step 2: "}
                                        {getCorridorLabel(
                                          effectiveCommandTargetSystemId,
                                          effectiveCommandSecondTargetSystemId,
                                        )}
                                      </>
                                    )}
                                </small>
                                {selectedCommandOrderType === "move_attack" &&
                                  effectiveAttackTargetFleet && (
                                    <small>
                                      Attack target: {effectiveAttackTargetFleet.name}
                                      {effectiveAttackTargetFleet.is_defensive
                                        ? " · Defensive ambush"
                                        : ""}
                                    </small>
                                  )}
                                {selectedCommandOrderType === "retreat" && (
                                  <small>
                                    Pursuit: {retreatPursuingFleet?.name ?? "Enemy fleet"} · {selectedRetreatPursuitCards} additional danger card{selectedRetreatPursuitCards === 1 ? "" : "s"}
                                  </small>
                                )}
                                {(selectedCommandOrderType === "move_transfer" ||
                                  selectedCommandOrderType === "transfer_move") &&
                                  effectiveTransferFleet && (
                                    <small>
                                      Transfer with{" "}
                                      {effectiveTransferFleet.name}:{" "}
                                      {selectedUnitsToTransferFleet.length} out
                                      / {selectedUnitsToCommandFleet.length} in
                                      {selectedCommandOrderType ===
                                        "transfer_move" &&
                                        effectiveContinuingFleet && (
                                          <>
                                            {" · Continuing: "}
                                            {effectiveContinuingFleet.name}
                                          </>
                                        )}
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
                              (selectedCommandOrderType !== "split_move" &&
                                selectedCommandOrderType !== "defend" &&
                                selectedCommandOrderType !== "continue_combat" &&
                                selectedCommandDestinationSystems.length === 0) ||
                              ((selectedCommandOrderType === "move_attack" ||
                                selectedCommandOrderType === "continue_combat") &&
                                !effectiveAttackTargetFleet) ||
                              (selectedCommandOrderType === "split_move" &&
                                splitSelectionInvalid) ||
                              (selectedCommandOrderType === "move_move" &&
                                !selectedMoveMoveFirstInterceptor &&
                                selectedCommandSecondStepSystems.length ===
                                  0) ||
                              ((selectedCommandOrderType === "move_transfer" ||
                                selectedCommandOrderType === "transfer_move") &&
                                (!effectiveTransferFleet ||
                                  (selectedUnitsToTransferFleet.length === 0 &&
                                    selectedUnitsToCommandFleet.length === 0) ||
                                  transferCapacityInvalid ||
                                  (selectedCommandOrderType ===
                                    "transfer_move" &&
                                    continuingFleetSelectionInvalid)))
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
                              Add one or more fleet orders. The full package
                              costs only 1 CP.
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
                                  continuingFleet,
                                  targetFleet,
                                  splitFleetTargetSystem,
                                  splitUnitsCount,
                                  unitsToTransferFleetCount,
                                  unitsToCommandFleetCount,
                                  firstCorridorLabel,
                                  secondCorridorLabel,
                                  totalDangerCards,
                                }) => (
                                  <div
                                    key={fleet.id}
                                    className="fleet-command-order-row"
                                  >
                                    <div>
                                      <strong>{fleet.name}</strong>
                                      <span>
                                        {orderType === "defend" ? (
                                          <>Hold current system</>
                                        ) : orderType === "continue_combat" ? (
                                          <>
                                            {fleet.system_name ?? `System ${fleet.system_id}`}
                                            {" · Engaged with "}
                                            {targetFleet?.name ?? "enemy fleet"}
                                          </>
                                        ) : orderType === "split_move" ? (
                                          <>
                                            {fleet.system_name ??
                                              `System ${fleet.system_id}`}
                                            {" · "}
                                            Split {splitUnitsCount} unit
                                            {splitUnitsCount === 1 ? "" : "s"}
                                          </>
                                        ) : (
                                          <>
                                            {fleet.system_name ??
                                              `System ${fleet.system_id}`}
                                            {" → "}
                                            {firstTargetSystem?.system_name}
                                            {secondTargetSystem && (
                                              <>
                                                {" → "}
                                                {secondTargetSystem.system_name}
                                              </>
                                            )}
                                          </>
                                        )}
                                      </span>
                                      <small>
                                        {getFleetOrderDisplayName(orderType)}
                                        {orderType === "defend" ? (
                                          <> · Hold and prepare defensive ambush</>
                                        ) : orderType === "continue_combat" ? (
                                          <> · One simultaneous exchange</>
                                        ) : orderType === "split_move" ? (
                                          <>
                                            {" · Source: "}
                                            {firstTargetSystem
                                              ? firstCorridorLabel
                                              : "Hold"}
                                            {" · New fleet: "}
                                            {splitFleetTargetSystem
                                              ? getCorridorLabel(
                                                  fleet.system_id,
                                                  splitFleetTargetSystem.system_id,
                                                )
                                              : "Hold"}
                                          </>
                                        ) : (
                                          <>
                                            {" · Step 1: "}
                                            {firstCorridorLabel}
                                            {secondCorridorLabel && (
                                              <>
                                                {" · Step 2: "}
                                                {secondCorridorLabel}
                                              </>
                                            )}
                                          </>
                                        )}
                                      </small>
                                      {transferFleet && (
                                        <>
                                          <small>
                                            Transfer with {transferFleet.name}:{" "}
                                            {unitsToTransferFleetCount} out /{" "}
                                            {unitsToCommandFleetCount} in
                                          </small>
                                          <small>
                                            {orderType === "transfer_move" &&
                                            continuingFleet
                                              ? `${continuingFleet.name} continues movement to ${firstTargetSystem?.system_name ?? "selected system"}`
                                              : transferFleetTargetSystem
                                                ? `${transferFleet.name} then moves to ${transferFleetTargetSystem.system_name}`
                                                : `${transferFleet.name} holds position after transfer`}
                                          </small>
                                        </>
                                      )}
                                      {targetFleet && (
                                        <small>
                                          {orderType === "continue_combat"
                                            ? "Combat target"
                                            : "Attack target"}: {targetFleet.name}
                                          {orderType === "move_attack" &&
                                          targetFleet.is_defensive
                                            ? " · Defensive ambush"
                                            : ""}
                                        </small>
                                      )}
                                      <em>
                                        Total danger cards: {
                                          totalDangerCards +
                                          (orderType === "move_attack" &&
                                          targetFleet?.is_defensive
                                            ? 1
                                            : 0)
                                        }
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
                                ),
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
                </section>
              )}

              {activeWorkspaceTab === "systems" && (
                <section className="archont-workspace-panel archont-systems-workspace">
                  <div className="archont-workspace-heading">
                    <div>
                      <span className="archont-eyebrow">Territory command</span>
                      <h2>Systems under your control</h2>
                      <p>
                        Select a system to review its capacity, infrastructure,
                        fleets and units.
                      </p>
                    </div>
                  </div>

                  <div className="archont-controlled-system-grid">
                    {controlledSystems.length > 0 ? (
                      controlledSystems.map((system) => {
                        const systemFleets = getFleetsInSystem(
                          system.system_id,
                        ).filter(
                          (fleet) =>
                            fleet.owner_player_id === currentPlayer?.id,
                        );
                        const mapSystem = getMapSystemDetailsById(
                          system.system_id,
                        );
                        const isSelectedManagedSystem =
                          selectedSystemId === system.system_id;

                        return (
                          <button
                            type="button"
                            key={system.system_id}
                            className={[
                              "archont-controlled-system-card",
                              isSelectedManagedSystem ? "selected" : "",
                            ].join(" ")}
                            onClick={() => {
                              setSelectedSystemId(system.system_id);
                              setSelectedStructureKey(null);
                              setSelectedUnitId(null);
                            }}
                          >
                            <span className="archont-controlled-system-mark">
                              {mapSystem?.system_type === "archive"
                                ? "◇"
                                : mapSystem?.system_type === "start"
                                  ? "⌂"
                                  : "◎"}
                            </span>
                            <span className="archont-controlled-system-copy">
                              <small>
                                {getSystemTypeLabel(system.system_id) ??
                                  "CONTROLLED SYSTEM"}
                              </small>
                              <strong>{system.system_name}</strong>
                              <em>
                                {system.owner_faction ??
                                  currentPlayer?.faction_name}
                              </em>
                            </span>
                            <span className="archont-controlled-system-metrics">
                              <span>
                                <small>BUILDINGS</small>
                                <strong>{system.buildings?.length ?? 0}</strong>
                              </span>
                              <span>
                                <small>UNITS</small>
                                <strong>{system.units?.length ?? 0}</strong>
                              </span>
                              <span>
                                <small>FLEETS</small>
                                <strong>{systemFleets.length}</strong>
                              </span>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="archont-empty-workspace-note">
                        The active player does not control any systems.
                      </p>
                    )}
                  </div>

                  {selectedSystem &&
                    selectedSystem.owner_player_id === currentPlayer?.id && (
                      <section
                        className="system-overview-panel"
                        style={getPlayerVisualStyle(
                          selectedSystem.owner_player_id,
                        )}
                      >
                        <div
                          className={`system-overview-header archont-system-overview-header ownership-${selectedSystemRelation}`}
                          style={getPlayerVisualStyle(
                            selectedSystem.owner_player_id,
                          )}
                        >
                          <div className="archont-system-overview-identity">
                            <span className="archont-system-overview-emblem">
                              {getFactionInitials(
                                selectedSystemOwner?.faction_name,
                              )}
                            </span>

                            <div>
                              <span className="archont-eyebrow">
                                {getOwnershipLabel(
                                  selectedSystem.owner_player_id,
                                )}
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
                            <span>
                              <small>ID</small>
                              <strong>{selectedSystem.system_id}</strong>
                            </span>
                            <span>
                              <small>STRUCTURES</small>
                              <strong>
                                {selectedSystem.buildings?.length ?? 0}
                              </strong>
                            </span>
                            <span>
                              <small>UNITS</small>
                              <strong>
                                {selectedSystem.units?.length ?? 0}
                              </strong>
                            </span>
                            <span>
                              <small>FLEETS</small>
                              <strong>
                                {
                                  getFleetsInSystem(selectedSystem.system_id)
                                    .length
                                }
                              </strong>
                            </span>
                          </div>
                        </div>

                        {(() => {
                          const mapSystem = mapDetails?.systems.find(
                            (system) => system.id === selectedSystem.system_id,
                          );

                          if (!mapSystem) {
                            return null;
                          }

                          const systemBuildings =
                            selectedSystem.buildings ?? [];
                          const countBuildings = (...buildingTypes: string[]) =>
                            systemBuildings.filter((building) =>
                              buildingTypes.includes(building.building_type),
                            ).length;

                          const capacityItems = [
                            {
                              key: "mine",
                              icon: "◆",
                              label: "Mines",
                              current: countBuildings("mine"),
                              maximum: mapSystem.mineral_slots,
                            },
                            {
                              key: "energy",
                              icon: "ϟ",
                              label: "Power Plants",
                              current: countBuildings(
                                "power_plant",
                                "energy_plant",
                              ),
                              maximum: mapSystem.energy_slots,
                            },
                            {
                              key: "storage",
                              icon: "▰",
                              label: "Supply Depots",
                              current: countBuildings("storage"),
                              maximum: mapSystem.storage_slots,
                            },
                            {
                              key: "research",
                              icon: "⌁",
                              label: "Research Centers",
                              current: countBuildings("research_center"),
                              maximum: mapSystem.research_center_slots,
                            },
                          ];

                          return (
                            <section className="system-building-capacity">
                              <div className="system-building-capacity-heading">
                                <div>
                                  <span className="archont-eyebrow">
                                    System infrastructure
                                  </span>
                                  <h3>Building capacity</h3>
                                </div>
                                <p>
                                  Built structures compared with this system's
                                  available resource slots.
                                </p>
                              </div>

                              <div className="system-building-capacity-grid">
                                {capacityItems.map((item) => {
                                  const ratio =
                                    item.maximum > 0
                                      ? Math.min(
                                          100,
                                          (item.current / item.maximum) * 100,
                                        )
                                      : 0;
                                  const isFull =
                                    item.maximum > 0 &&
                                    item.current >= item.maximum;
                                  const isUnavailable = item.maximum <= 0;

                                  return (
                                    <article
                                      className={[
                                        "system-building-capacity-card",
                                        isFull ? "is-full" : "",
                                        isUnavailable ? "is-unavailable" : "",
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
                              const groupedBuildings =
                                groupBuildingsByType(buildings);

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
                                      const details = BUILDING_DETAILS[
                                        buildingType
                                      ] ?? {
                                        income: "No income data",
                                        produces: [],
                                        technologies: [],
                                        description: "No description yet.",
                                      };
                                      const isColony =
                                        buildingType === "colony";
                                      const incomeResources =
                                        getBuildingIncomeResources(
                                          buildingType,
                                          buildingGroup.length,
                                        );
                                      const canControl =
                                        firstBuilding.owner_player_id ===
                                          currentPlayer?.id &&
                                        session.status === "started";
                                      const resourceError =
                                        getResourceShortageMessage(
                                          currentPlayer,
                                          { energy: UNIT_ACTION_ENERGY_COST },
                                        );
                                      const actionErrorKey = `building-${firstBuilding.id}`;
                                      const currentPlayerColonyCount =
                                        currentPlayer
                                          ? getPlayerColonyCount(
                                              session,
                                              currentPlayer.id,
                                            )
                                          : 0;
                                      const isLastPlayerColony =
                                        isColony &&
                                        canControl &&
                                        currentPlayerColonyCount <= 1;

                                      return (
                                        <div
                                          key={structureKey}
                                          className={
                                            isSelected
                                              ? "overview-card selected"
                                              : "overview-card"
                                          }
                                          style={getPlayerVisualStyle(
                                            firstBuilding.owner_player_id,
                                          )}
                                          role="button"
                                          tabIndex={0}
                                          onClick={() => {
                                            setSelectedStructureKey(
                                              structureKey,
                                            );
                                            setSelectedUnitId(null);
                                          }}
                                          onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                              setSelectedStructureKey(
                                                structureKey,
                                              );
                                              setSelectedUnitId(null);
                                            }
                                          }}
                                        >
                                          <div className="overview-structure-header">
                                            <span
                                              className="overview-structure-icon"
                                              aria-hidden="true"
                                            >
                                              {getBuildingOverviewIcon(
                                                buildingType,
                                              )}
                                            </span>

                                            <span className="overview-structure-copy">
                                              <strong>
                                                {getBuildingDisplayName(
                                                  firstBuilding,
                                                )}
                                              </strong>
                                              <small>
                                                {isColony
                                                  ? "COLONY"
                                                  : "STRUCTURE"}
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
                                                {incomeResources.map(
                                                  (incomeResource) => (
                                                    <ResourceBadge
                                                      key={incomeResource.kind}
                                                      kind={incomeResource.kind}
                                                      value={
                                                        incomeResource.value
                                                      }
                                                      valuePrefix="+"
                                                      compact
                                                    />
                                                  ),
                                                )}
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
                                                  ? details.technologies.join(
                                                      ", ",
                                                    )
                                                  : "No technologies yet"}
                                              </p>

                                              {getProductionOptionsForBuilding(
                                                buildingType,
                                              ).length > 0 && (
                                                <div className="unit-production-panel">
                                                  <strong>Production</strong>

                                                  <div className="unit-production-list">
                                                    {getProductionOptionsForBuilding(
                                                      buildingType,
                                                    ).map((unitOption) => {
                                                      const produceErrorKey = `produce-${firstBuilding.id}-${unitOption.unit_type}`;
                                                      const unitResourceError =
                                                        getResourceShortageMessage(
                                                          currentPlayer,
                                                          unitOption.resourceCost,
                                                        );

                                                      return (
                                                        <div
                                                          key={
                                                            unitOption.unit_type
                                                          }
                                                          className="unit-production-row"
                                                        >
                                                          <button
                                                            type="button"
                                                            onClick={(
                                                              event,
                                                            ) => {
                                                              event.stopPropagation();
                                                              handleProduceUnit(
                                                                firstBuilding,
                                                                unitOption,
                                                              );
                                                            }}
                                                            disabled={
                                                              isProducingUnit ||
                                                              !canControl ||
                                                              Boolean(
                                                                unitResourceError,
                                                              )
                                                            }
                                                          >
                                                            <span>
                                                              {unitOption.icon}
                                                            </span>
                                                            <span>
                                                              Produce{" "}
                                                              {unitOption.name}{" "}
                                                              · 1 CP
                                                              <small>
                                                                {
                                                                  unitOption.costText
                                                                }
                                                              </small>
                                                              <small>
                                                                {
                                                                  unitOption.statsText
                                                                }
                                                              </small>
                                                            </span>
                                                          </button>

                                                          {unitResourceError && (
                                                            <p className="inline-action-error">
                                                              {
                                                                unitResourceError
                                                              }
                                                            </p>
                                                          )}

                                                          {actionErrors[
                                                            produceErrorKey
                                                          ] && (
                                                            <p className="inline-action-error">
                                                              {
                                                                actionErrors[
                                                                  produceErrorKey
                                                                ]
                                                              }
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
                                                        firstBuilding,
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
                                                      Last Colony cannot be
                                                      packed into Ark.
                                                    </p>
                                                  )}

                                                  {resourceError && (
                                                    <p className="inline-action-error">
                                                      {resourceError}
                                                    </p>
                                                  )}

                                                  {actionErrors[
                                                    actionErrorKey
                                                  ] && (
                                                    <p className="inline-action-error">
                                                      {
                                                        actionErrors[
                                                          actionErrorKey
                                                        ]
                                                      }
                                                    </p>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    },
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
                                selectedSystem.system_id,
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
                                      fleet.owner_player_id ===
                                        currentPlayer?.id &&
                                      !fleet.has_acted_this_round &&
                                      session.status === "started";

                                    const fleetRelation = getOwnershipRelation(
                                      fleet.owner_player_id,
                                    );

                                    return (
                                      <div
                                        key={fleet.id}
                                        className={`fleet-command-card archont-fleet-card ownership-${fleetRelation}`}
                                        style={getPlayerVisualStyle(
                                          fleet.owner_player_id,
                                        )}
                                      >
                                        <div className="fleet-command-card-header archont-fleet-card-header">
                                          <span className="archont-fleet-emblem">
                                            {getFactionInitials(
                                              owner?.faction_name,
                                            )}
                                          </span>
                                          <span className="archont-fleet-identity">
                                            <strong>{fleet.name}</strong>
                                            <small>
                                              {owner?.faction_name ?? "Unknown"}
                                            </small>
                                          </span>
                                          <span className="archont-fleet-status">
                                            {getFleetStatusText(fleet)}
                                          </span>
                                        </div>

                                        <div className="archont-fleet-metrics">
                                          <span>
                                            <small>CAPACITY</small>
                                            <strong>
                                              {fleet.units.length}/5
                                            </strong>
                                          </span>
                                          <span>
                                            <small>COMBAT</small>
                                            <strong>
                                              {getFleetCombatRating(fleet)}
                                            </strong>
                                          </span>
                                          <span>
                                            <small>POSITION</small>
                                            <strong>
                                              {fleet.is_defensive
                                                ? "DEF"
                                                : "OPEN"}
                                            </strong>
                                          </span>
                                        </div>

                                        {fleet.units.length > 0 && (
                                          <div className="fleet-unit-strip archont-fleet-unit-strip">
                                            {fleet.units.map((unit) => (
                                              <span
                                                key={unit.id}
                                                className={
                                                  isUnitDamaged(unit)
                                                    ? "damaged"
                                                    : ""
                                                }
                                                title={`${getUnitDisplayName(unit)} · ${getUnitHpText(unit)}`}
                                              >
                                                <i>{getUnitIcon(unit)}</i>
                                                <b>
                                                  {getUnitDisplayName(unit)}
                                                </b>
                                                <small>
                                                  {getUnitHpText(unit)}
                                                </small>
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
                                            Fleet command already resolved this
                                            round.
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
                                    const isSelected =
                                      selectedUnitId === unit.id;
                                    const canControl =
                                      unit.owner_player_id ===
                                        currentPlayer?.id &&
                                      session.status === "started";
                                    const unitOwner = getPlayerById(
                                      unit.owner_player_id,
                                    );
                                    const unitRelation = getOwnershipRelation(
                                      unit.owner_player_id,
                                    );
                                    const resourceError =
                                      getResourceShortageMessage(
                                        currentPlayer,
                                        { energy: UNIT_ACTION_ENERGY_COST },
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
                                          isUnitDamaged(unit) ? "damaged" : "",
                                        ].join(" ")}
                                        style={getPlayerVisualStyle(
                                          unit.owner_player_id,
                                        )}
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
                                            <strong>
                                              {getUnitDisplayName(unit)}
                                            </strong>
                                            <small>
                                              {unitOwner?.faction_name ??
                                                "Unknown owner"}
                                            </small>
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
                                          <span>
                                            <small>ATK</small>
                                            <strong>{unit.attack}</strong>
                                          </span>
                                          <span>
                                            <small>DEF</small>
                                            <strong>{unit.defense}</strong>
                                          </span>
                                          <span>
                                            <small>HP</small>
                                            <strong>
                                              {unit.current_hp ?? "—"}/
                                              {unit.max_hp ?? "—"}
                                            </strong>
                                          </span>
                                        </div>

                                        {unit.current_hp !== null &&
                                          unit.max_hp !== null && (
                                            <span className="archont-hp-track">
                                              <i
                                                style={{
                                                  width: `${Math.max(
                                                    0,
                                                    Math.min(
                                                      100,
                                                      (unit.current_hp /
                                                        unit.max_hp) *
                                                        100,
                                                    ),
                                                  )}%`,
                                                }}
                                              />
                                            </span>
                                          )}

                                        {isSelected && (
                                          <div className="overview-card-details">
                                            <p>
                                              Food upkeep: {unit.food_upkeep}
                                            </p>

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
                </section>
              )}
            </main>
          </section>
        </>
      )}

      {resolutionModal && (
        <div
          className="archont-resolution-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Fleet command resolution"
        >
          <section
            className={`archont-resolution-modal phase-${resolutionModal.phase}`}
            style={getPlayerVisualStyle(currentPlayer?.id)}
          >
            {resolutionModal.phase === "confirm" && (
              <>
                <header className="archont-resolution-header">
                  <span className="archont-eyebrow">ACTION CONFIRMATION</span>
                  <h2>Resolve fleet command?</h2>
                  <p>
                    Review every movement, expected danger card and attack target
                    before the command is committed.
                  </p>
                </header>

                <div className="archont-resolution-preview-list">
                  {resolutionModal.previews.map((preview) => (
                    <article
                      key={preview.fleetId}
                      className="archont-resolution-preview-card"
                    >
                      <div>
                        <strong>{preview.fleetName}</strong>
                        <span>{preview.route}</span>
                        {preview.isCombat && preview.attackTargetName && (
                          <small>Combat target: {preview.attackTargetName}</small>
                        )}
                        {preview.isRetreat && preview.pursuitCards > 0 && (
                          <small>Pursuit cards: {preview.pursuitCards}</small>
                        )}
                        {preview.isHostileEntry && (
                          <div className="archont-hostile-entry-warning">
                            <strong>HOSTILE ARRIVAL</strong>
                            <span>
                              {preview.hostileSystemName ?? "Enemy system"}
                              {preview.hostileOwnerName
                                ? ` · Controlled by ${preview.hostileOwnerName}`
                                : ""}
                            </span>
                            {preview.interceptorFleetName ? (
                              <small>
                                {preview.interceptorOwnerName ?? "Rival"} · {preview.interceptorFleetName} will fire once without return fire. Estimated damage: {preview.estimatedInterceptionDamage}.
                                {preview.movementEndsAtInterception
                                  ? " Movement ends in this system and the second move is lost."
                                  : ""}
                              </small>
                            ) : (
                              <small>
                                No defending fleet is present. The system is hostile-controlled, but no interception fire will occur.
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                      <span
                        className={`archont-danger-count ${
                          preview.dangerCards > 0 ? "has-danger" : "is-safe"
                        }`}
                      >
                        <b>{preview.dangerCards}</b>
                        <small>Danger cards</small>
                      </span>
                    </article>
                  ))}
                </div>

                {resolutionModal.error && (
                  <p className="inline-action-error">{resolutionModal.error}</p>
                )}

                <footer className="archont-resolution-actions">
                  <button
                    type="button"
                    className="archont-resolution-dismiss"
                    onClick={handleDismissResolution}
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    className="archont-resolution-confirm"
                    onClick={handleConfirmResolution}
                    disabled={isFleetCommandLoading}
                  >
                    Confirm · 1 CP
                  </button>
                </footer>
              </>
            )}

            {resolutionModal.phase === "executing" && (
              <div className="archont-resolution-loading">
                <span className="archont-resolution-spinner" />
                <span className="archont-eyebrow">COMMAND LOCKED</span>
                <h2>Resolving movement...</h2>
                <p>The board is calculating corridor hazards and combat.</p>
              </div>
            )}

            {resolutionModal.phase === "reveal" &&
              resolutionModal.revealItems[resolutionModal.revealIndex] &&
              (() => {
                const currentItem =
                  resolutionModal.revealItems[resolutionModal.revealIndex];
                const dangerItems = resolutionModal.revealItems.filter(
                  (item) => item.kind === "danger",
                );
                const revealedItemIds = new Set(
                  resolutionModal.revealItems
                    .slice(0, resolutionModal.revealIndex + 1)
                    .map((item) => item.id),
                );
                const revealedDangerCount = dangerItems.filter((item) =>
                  revealedItemIds.has(item.id),
                ).length;
                const cardsRemaining = Math.max(
                  0,
                  dangerItems.length - revealedDangerCount,
                );

                return (
                  <div className="archont-resolution-table">
                    <header className="archont-resolution-table-header">
                      <div>
                        <span className="archont-eyebrow">
                          MOVEMENT RESOLUTION
                        </span>
                        <h2>
                          Drawing danger cards
                        </h2>
                        <p>
                          {`${currentItem.subtitle}. Cards are dealt from the danger deck and resolved from left to right.`}
                        </p>
                      </div>
                      <span className="archont-reveal-counter">
                        {resolutionModal.revealIndex + 1} /{" "}
                        {resolutionModal.revealItems.length}
                      </span>
                    </header>

                    {dangerItems.length > 0 ? (
                      <div className="archont-danger-deal-layout">
                        <aside className="archont-danger-deck-zone">
                          <div className="archont-danger-deck-stack">
                            <span>ARCHONT</span>
                            <strong>DANGER</strong>
                          </div>
                          <div className="archont-danger-deck-copy">
                            <strong>{cardsRemaining}</strong>
                            <span>Cards remaining</span>
                          </div>
                        </aside>

                        <div className="archont-danger-card-row">
                          {dangerItems.map((dangerItem, dangerIndex) => {
                            const globalIndex =
                              resolutionModal.revealItems.findIndex(
                                (item) => item.id === dangerItem.id,
                              );
                            const isRevealed =
                              globalIndex < resolutionModal.revealIndex;
                            const isDealing =
                              globalIndex === resolutionModal.revealIndex;
                            const isQueued =
                              globalIndex > resolutionModal.revealIndex;
                            const card = dangerItem.card;

                            return (
                              <article
                                key={dangerItem.id}
                                className={[
                                  "archont-dealt-danger-card",
                                  `tone-${dangerItem.tone}`,
                                  isRevealed ? "is-revealed" : "",
                                  isDealing ? "is-dealing" : "",
                                  isQueued ? "is-queued" : "",
                                ].join(" ")}
                              >
                                {isQueued ? (
                                  <div className="archont-danger-card-slot">
                                    <span>#{dangerIndex + 1}</span>
                                    <small>Awaiting reveal</small>
                                  </div>
                                ) : (
                                  <div className="archont-dealt-card-inner">
                                    <div className="archont-dealt-card-back">
                                      <span>ARCHONT</span>
                                      <strong>DANGER</strong>
                                      <small>#{dangerIndex + 1}</small>
                                    </div>

                                    <div className="archont-dealt-card-front">
                                      <span className="archont-card-number">
                                        CARD {dangerIndex + 1}
                                      </span>
                                      <h3>{dangerItem.title}</h3>
                                      <small className="archont-card-route">
                                        {dangerItem.subtitle}
                                      </small>
                                      <p>{dangerItem.description}</p>
                                      {card
                                        ? renderDangerEffectInfographic(card)
                                        : null}
                                    </div>
                                  </div>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="archont-no-danger-cards">
                        <span>✓</span>
                        <strong>No danger cards were drawn</strong>
                        <p>The attack route was safe. Proceeding to combat.</p>
                      </div>
                    )}

                  </div>
                );
              })()}

            {resolutionModal.phase === "result" && (
              <>
                <header className="archont-resolution-header">
                  <span className="archont-eyebrow">COMMAND RESOLVED</span>
                  <h2>Resolution complete</h2>
                  <p>
                    Review the final danger-card totals, fleet damage and combat outcome before passing the board to the next player.
                  </p>
                </header>

                {resolutionModal.revealItems.length > 0 && (
                  <div className="archont-danger-deal-layout is-complete">
                    <aside className="archont-danger-deck-zone">
                      <div className="archont-danger-deck-stack">
                        <span>ARCHONT</span>
                        <strong>DANGER</strong>
                      </div>
                      <div className="archont-danger-deck-copy">
                        <strong>0</strong>
                        <span>Cards remaining</span>
                      </div>
                    </aside>
                    <div className="archont-danger-card-row">
                      {resolutionModal.revealItems.map((dangerItem, dangerIndex) => (
                        <article
                          key={dangerItem.id}
                          className={`archont-dealt-danger-card tone-${dangerItem.tone} is-revealed`}
                        >
                          <div className="archont-dealt-card-inner">
                            <div className="archont-dealt-card-front">
                              <span className="archont-card-number">CARD {dangerIndex + 1}</span>
                              <h3>{dangerItem.title}</h3>
                              <small className="archont-card-route">{dangerItem.subtitle}</small>
                              <p>{dangerItem.description}</p>
                              {dangerItem.card
                                ? renderDangerEffectInfographic(dangerItem.card)
                                : null}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {resolutionModal.response &&
                  renderModalCommandReport(
                    resolutionModal.response.command_report,
                  )}

                <footer className="archont-resolution-actions is-final">
                  <button
                    type="button"
                    className="archont-resolution-confirm"
                    onClick={handleCompleteResolution}
                  >
                    OK · Pass to next player
                  </button>
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
