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


export type ResourceCost = {
  matter?: number;
  energy?: number;
  data?: number;
  food?: number;
};

export type TechnologyCategory = "combat" | "archive" | "logistics" | "economy";

export type Technology = {
  key: string;
  name: string;
  category: TechnologyCategory;
  building_type: string;
  building_name: string;
  cost: ResourceCost;
  effect_summary: string;
  description: string;
  dominance_points: number;
};


export type ArchonBlueprintCatalogItem = {
  level: number;
  key: string;
  name: string;
  archive_label: string;
  dominance_points: number;
};

export type SessionPlayerArchonBlueprint = ArchonBlueprintCatalogItem & {
  id: number;
  archive_system_id: number | null;
  discovered_round: number;
};

export type ArchonCoreClaim = {
  id: number;
  session_id: number;
  player_id: number;
  player_faction: string | null;
  core_system_id: number | null;
  core_system_name: string | null;
  claimed_round: number;
};

export type SessionArchont = {
  id: number;
  session_id: number;
  owner_player_id: number;
  owner_faction: string | null;
  system_id: number;
  system_name: string | null;
  current_hp: number;
  max_hp: number;
  has_acted_this_round: boolean;
  attack_profile: {
    dice: number;
    hit_min: number;
    damage_per_hit: number;
  };
  occupies_fleet_slot: false;
};

export type SessionHomeWorld = {
  player_id: number;
  player_faction: string | null;
  system_id: number;
  system_name: string | null;
  destroyed: boolean;
  destroyed_round: number | null;
  destroyed_by_player_id: number | null;
  team: "independent" | "archont" | "resistance";
  is_victory_target: boolean;
  eliminated?: boolean;
};

export type FleetOrderType =
  | "move_defend"
  | "move_move"
  | "move_transfer"
  | "transfer_move"
  | "split_move"
  | "defend"
  | "move_attack"
  | "move_attack_home"
  | "continue_combat"
  | "retreat";

export type FleetCommandOrder = {
  fleet_id: number;
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
  corridor_danger_cards?: number;
  pursuit_danger_cards?: number;
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
  continuing_fleet_id?: number;
  continuing_fleet_name?: string;
  continuing_movement_used?: boolean;
  continuing_movement_step?: FleetMovementStepReport | null;
  continuing_final_system_id?: number;
  continuing_final_system_name?: string | null;
  continuing_fleet_destroyed?: boolean;
  completed: boolean;
};


export type FleetSplitReport = {
  new_fleet_id: number;
  new_fleet_number: number;
  new_fleet_name: string;
  moved_to_new_fleet: TransferUnitSummary[];
  source_movement_used: boolean;
  source_movement_step: FleetMovementStepReport | null;
  source_final_system_id: number;
  source_final_system_name: string | null;
  source_fleet_destroyed: boolean;
  new_fleet_movement_used: boolean;
  new_fleet_movement_step: FleetMovementStepReport | null;
  new_fleet_final_system_id: number;
  new_fleet_final_system_name: string | null;
  new_fleet_destroyed: boolean;
  completed: boolean;
};


export type CombatDamageEvent = {
  unit_id: number;
  unit_type: string;
  unit_name: string;
  damage: number;
  hp_before: number;
  hp_after: number;
  destroyed: boolean;
};

export type CombatRoundReport = {
  round: number;
  attacker_attack: number;
  attacker_defense: number;
  defender_attack: number;
  defender_defense: number;
  damage_to_defender: number;
  damage_to_attacker: number;
  defender_damage_events: CombatDamageEvent[];
  attacker_damage_events: CombatDamageEvent[];
};

export type CombatOutcome =
  | "attacker_victory"
  | "defender_victory"
  | "mutual_destruction"
  | "stalemate"
  | "attacker_destroyed_in_transit"
  | "attacker_destroyed_by_ambush"
  | "engagement_continues";

export type FleetCombatReport = {
  defender_fleet_id: number;
  defender_fleet_name: string;
  defender_owner_player_id: number;
  defender_was_defensive: boolean;
  defensive_position_consumed: boolean;
  ambush_cards: DangerCardResult[];
  rounds: CombatRoundReport[];
  exchange?: CombatRoundReport | null;
  outcome: CombatOutcome;
  attacker_destroyed: boolean;
  defender_destroyed: boolean;
  engagement_continues?: boolean;
  defender_response_ready?: boolean;
  attacker_retreat: boolean;
  retreat_reason: string | null;
  attacker_retreat_system_id: number | null;
  attacker_retreat_system_name: string | null;
  hostile_fleets_remaining: number;
};


export type FleetInterceptionDamageEvent = {
  unit_id: number;
  unit_type: string;
  unit_name: string;
  damage: number;
  hp_before: number;
  hp_after: number;
  destroyed: boolean;
};

export type FleetInterceptionReport = {
  interception_step?: 1 | 2;
  movement_ended_early?: boolean;
  hostile_controlled: boolean;
  destination_owner_player_id: number | null;
  destination_owner_name: string | null;
  interceptor_fleet_id: number | null;
  interceptor_fleet_name: string | null;
  interceptor_owner_player_id: number | null;
  interceptor_owner_name: string | null;
  interceptor_was_defensive: boolean;
  attack_power: number;
  target_defense: number;
  damage: number;
  damage_events: FleetInterceptionDamageEvent[];
  moving_fleet_destroyed: boolean;
  engagement_created: boolean;
  no_return_fire: boolean;
};

export type FleetRetreatReport = {
  pursuing_fleet_id: number;
  pursuing_fleet_name: string;
  retreating_unit_count: number;
  pursuing_unit_count: number;
  pursuit_danger_cards: number;
  corridor_danger_cards: number;
  total_danger_cards: number;
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
  split: FleetSplitReport | null;
  retreat?: FleetRetreatReport | null;
  combat: FleetCombatReport | null;
  interception?: FleetInterceptionReport | null;
  destroyed_home_world_player_id?: number | null;
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
  dominance_points?: number;
  technologies?: Technology[];
  archon_blueprints?: SessionPlayerArchonBlueprint[];
  blueprint_count?: number;
  blueprints_required?: number;
  is_archon_player?: boolean;
  is_resistance_player?: boolean;
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
  max_rounds?: number | null;
  victory_framework?: {
    max_rounds: number | null;
    fallback_victory: string;
    archon_state: string;
    core_state: string;
    archon_player_id?: number | null;
    archon_player_faction?: string | null;
    archon_core_claim?: ArchonCoreClaim | null;
    archont?: SessionArchont | null;
    resistance_player_ids?: number[];
    active_resistance_player_ids?: number[];
    home_worlds?: SessionHomeWorld[];
    winner_side?: "conquest" | "archont" | "resistance" | null;
    winner_player_ids?: number[];
    victory_reason?: string | null;
    core_activation_cost?: {
      matter: number;
      energy: number;
      data: number;
      command_points: number;
    };
    endgame_rules?: {
      pre_archont_victory?: string;
      home_destruction_eliminates_player?: boolean;
      archont_occupies_fleet_slot: boolean;
      archont_home_world_is_victory_target: boolean;
      archont_victory: string;
      resistance_victory: string;
      resistance_allied: boolean;
    };
  };
  technology_catalog?: Technology[];
  archon_blueprint_catalog?: ArchonBlueprintCatalogItem[];

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
  | "spaceport"
  | "research_center";

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

export type GameLogActorSnapshot = {
  session_player_id: number;
  user_id: number;
  nickname: string | null;
  faction_name: string;
  civilization_id: number | null;
};

export type GameLogPayload = {
  actor?: GameLogActorSnapshot | null;
  [key: string]: unknown;
};

export type GameLogEntry = {
  id: number;
  session_id: number;
  round_number: number;
  actor_player_id: number | null;
  event_type: string;
  payload: GameLogPayload;
  created_at: string | null;
};

export type GameLogsResponse = {
  session_id: number;
  session_name: string;
  logs: GameLogEntry[];
};
