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
};

export type SessionBuilding = {
  id: number;
  building_type: string;
  building_name?: string;
  system_id?: number;
  system_name?: string | null;
  owner_player_id: number;
};

export type SessionUnit = {
  id: number;
  unit_type: string;
  state: string;
  system_id: number;
  owner_player_id: number;

  attack: number;
  defense: number;

  current_hp: number | null;
  max_hp: number | null;

  food_upkeep: number;
  is_foundation: boolean;
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
};

export type SessionOverviewItem = {
  id: number;
  map_id: number;
  name: string;
  status: string;
  current_round: number;
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
  ability_name: string;
  ability_description: string;
  mechanic_key: string;
  is_active: boolean;
};

export type BuildingType = "mine" | "power_plant" | "storage";