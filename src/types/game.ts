export type SessionUnit = {
  id: number;
  unit_type: string;
  state: string;
  system_id: number;
  fleet_id: number | null;
  slot_index: number | null;
  owner_player_id: number;

  attack: number;
  defense: number;

  current_hp: number | null;
  max_hp: number | null;

  food_upkeep: number;
  is_foundation: boolean;
  is_combat: boolean;
  formation_weight: number;
  built_order: number;
};

export type SessionFleet = {
  id: number;
  session_id: number;
  owner_player_id: number;
  system_id: number;
  system_name: string | null;
  fleet_number: number;
  name: string;
  is_defensive: boolean;
  has_acted_this_round: boolean;
  units: SessionUnit[];
};


export type FleetOrderType =
  | "move_defend"
  | "move_move"
  | "move_transfer";

export type FleetCommandOrder = {
  fleet_id: number;
  order_type: FleetOrderType;
  target_system_id: number;
  second_target_system_id?: number;
  transfer_fleet_id?: number;
  transfer_fleet_target_system_id?: number;
  unit_ids_to_transfer_fleet?: number[];
  unit_ids_to_command_fleet?: number[];
};

export type FleetCommandPayload = {
  orders: FleetCommandOrder[];
};

export type DangerCardEffectType =
  | "none"
  | "damage_front_unit"
  | "lose_energy"
  | "lose_food";

export type DangerCardResult = {
  card_key: string;
  name: string;
  description: string;
  effect_type: DangerCardEffectType;
  amount: number;
  effect_summary: string;
  target_unit_id: number | null;
  target_unit_name: string | null;
  unit_hp_before: number | null;
  unit_hp_after: number | null;
  unit_destroyed: boolean;
  resource: "energy" | "food" | null;
  resource_lost: number;
};

export type FleetMovementStepReport = {
  step: number;
  from_system_id: number;
  from_system_name: string | null;
  to_system_id: number;
  to_system_name: string | null;
  corridor_type: "safe" | "dangerous" | "wraparound";
  danger_cards: number;
  drawn_cards: DangerCardResult[];
};

export type TransferUnitSummary = {
  id: number;
  unit_type: string;
  unit_name: string;
  current_hp: number | null;
  max_hp: number | null;
  is_damaged: boolean;
};

export type FleetTransferReport = {
  partner_fleet_id: number;
  partner_fleet_name: string;
  moved_to_partner: TransferUnitSummary[];
  moved_to_command_fleet: TransferUnitSummary[];
  missing_unit_ids: number[];
  source_fleet_deleted: boolean;
  partner_fleet_deleted: boolean;
  partner_movement_available: boolean;
  partner_movement_used: boolean;
  partner_movement_step: FleetMovementStepReport | null;
  partner_final_system_id: number;
  partner_final_system_name: string | null;
  partner_fleet_destroyed: boolean;
  completed: boolean;
};

export type FleetCommandOrderReport = {
  fleet_id: number;
  fleet_name: string;
  order_type: FleetOrderType;
  steps: FleetMovementStepReport[];
  final_system_id: number;
  final_system_name: string | null;
  total_danger_cards: number;
  is_defensive: boolean;
  fleet_destroyed: boolean;
  order_completed: boolean;
  transfer: FleetTransferReport | null;
};

export type FleetCommandResponse = {
  message: string;
  session: FullGameSession;
  command_report: FleetCommandOrderReport[];
};

export type SessionPlayer = {
  id: number;
  session_id: number;
  user_id: number;

  nickname: string | null;
  email: string | null;

  civilization_id: number | null;
  civilization_name: string | null;

  faction_name: string;

  matter: number;
  energy: number;
  data: number;
  food: number;

  start_system_id: number | null;
  start_system_name: string | null;

  command_points_left: number;
  has_passed: boolean;
  fleets: SessionFleet[];
};

export type SessionBuilding = {
  id: number;
  building_type: string;
  building_name?: string;
  system_id?: number;
  system_name?: string | null;
  owner_player_id: number;
};

export type SessionSystem = {
  system_id: number;
  system_name: string;
  x?: number;
  y?: number;
  owner_player_id: number | null;
  owner_faction: string | null;

  buildings?: SessionBuilding[];
  units?: SessionUnit[];
};

export type FullGameSession = {
  id: number;
  map_id: number;
  name: string;
  status: string;
  current_round: number;

  play_mode: string;
  round_phase: string;
  current_player_id: number | null;
  current_turn_index: number;

  players_count: number;
  players: SessionPlayer[];
  systems: SessionSystem[];
};

export type AvailableUser = {
  id: number;
  email: string;
  nickname: string;
};

export type SessionOverviewPlayer = {
  session_player_id: number;
  user_id: number;
  nickname: string | null;
  email: string | null;

  civilization_id: number | null;
  civilization_name: string | null;

  faction_name: string;
  start_system_id: number | null;

  command_points_left?: number;
  has_passed?: boolean;
};

export type SessionOverviewItem = {
  id: number;
  map_id: number;
  name: string;
  status: string;
  current_round: number;

  play_mode?: string;
  round_phase?: string;
  current_player_id?: number | null;
  current_turn_index?: number;

  players_count: number;
  players: SessionOverviewPlayer[];
};

export type StartSystemOption = {
  id: number;
  name: string;
  x: number;
  y: number;
  is_occupied: boolean;
  occupied_by_player_id: number | null;
  occupied_by_faction: string | null;
};

export type Civilization = {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  lore_description: string | null;
  starting_matter: number;
  starting_energy: number;
  starting_data: number;
  starting_food: number;
  ability_name: string;
  ability_description: string;
  mechanic_key: string;
  is_active: boolean;
};

export type BuildingType =
  | "mine"
  | "power_plant"
  | "storage"
  | "barracks"
  | "spaceport";

export type UnitType = "scout" | "marine" | "ark" | "frigate" | "cruiser";

export type MapEditorSystemType = "normal" | "start" | "archive";

export type MapVisibility = "private" | "public" | "official";

export type MapEditorSystem = {
  client_id: string;
  name: string;
  x: number;
  y: number;
  system_type: MapEditorSystemType;
  archive_level: number | null;
  mineral_slots: number;
  energy_slots: number;
  storage_slots: number;
  research_center_slots: number;
};

export type MapEditorConnection = {
  from_client_id: string;
  to_client_id: string;
  is_dangerous: boolean;
  is_wraparound: boolean;
};

export type MapEditorSavePayload = {
  name: string;
  players_count: number;
  grid_width: number;
  grid_height: number;
  systems: MapEditorSystem[];
  connections: MapEditorConnection[];
};

export type MapEditorSavedSystem = {
  id: number;
  name: string;
  x: number;
  y: number;
  system_type: MapEditorSystemType;
  archive_level: number | null;
  mineral_slots: number;
  energy_slots: number;
  storage_slots: number;
  research_center_slots: number;
};

export type MapEditorSavedConnection = {
  id: number;
  from_system_id: number;
  to_system_id: number;
  is_dangerous: boolean;
  is_wraparound: boolean;
};

export type MapEditorMapSummary = {
  id: number;
  name: string;
  players_count: number;
  grid_width: number;
  grid_height: number;
  is_active: boolean;
  visibility: MapVisibility;
  is_owned_by_current_user: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export type MapEditorSavedMap = {
  id: number;
  name: string;
  players_count: number;
  grid_width: number;
  grid_height: number;
  is_active: boolean;
  visibility: MapVisibility;
  is_owned_by_current_user: boolean;
  can_edit: boolean;
  can_delete: boolean;
  systems: MapEditorSavedSystem[];
  connections: MapEditorSavedConnection[];
};
