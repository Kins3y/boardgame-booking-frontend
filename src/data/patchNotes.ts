export type PatchNoteType =
  | "game-design"
  | "backend"
  | "frontend"
  | "system"
  | "balance"
  | "gameplay";

export type PatchNote = {
  id: string;
  date: string;
  type: PatchNoteType;
  title: string;
  summary: string;
  changes: string[];
};

export const patchNotes: PatchNote[] = [
  {
    id: "archont-core-concept",
    date: "2026-06-08",
    type: "game-design",
    title: "ARCHONT core concept",
    summary:
      "The project shifted from a generic board game booking app into a dedicated builder and simulator for the ARCHONT strategy board game.",
    changes: [
      "Defined ARCHONT as a space strategy game with asymmetric civilizations, colonies, archives, research and a late-game Archont threat.",
      "Established the idea that every player should be able to build their own Archont through blueprint discovery.",
      "Rejected a simple fragment-collection model in favor of blueprint research and archive competition.",
      "Defined the game as a hybrid between economic development, expansion, conflict and discovery rather than a pure wargame."
    ]
  },
  {
    id: "node-map-direction",
    date: "2026-06-08",
    type: "game-design",
    title: "Node-based galaxy map",
    summary:
      "The map direction moved away from a traditional hex grid and toward a node-and-corridor galaxy map.",
    changes: [
      "Systems became map nodes rather than hex cells.",
      "Movement is planned as system-to-system travel through corridors.",
      "Start positions should have equal distance to the center to avoid unfair openings.",
      "Archive systems, start systems, normal systems and wraparound corridors became part of the map model."
    ]
  },
  {
    id: "economy-and-colony-foundation",
    date: "2026-06-09",
    type: "game-design",
    title: "Economy, colonies and Ark foundation",
    summary:
      "The first economic model was established with Matter, Energy, Data and later Food as core resources.",
    changes: [
      "Matter, Energy and Data became the main strategic resources.",
      "Food was added as an upkeep resource for units, Colonies and Arks.",
      "Deployed Colonies generate Matter and Energy each round.",
      "Ark state allows a Colony to move, but it does not generate income while packed.",
      "Foundation Colony cannot be launched as an Ark to prevent a player from abandoning their last settlement."
    ]
  },
  {
    id: "civilizations-system",
    date: "2026-06-11",
    type: "game-design",
    title: "Civilizations as playable entities",
    summary:
      "Civilizations were promoted from flavor text into a proper game entity selected during session setup.",
    changes: [
      "Civilizations are intended to be asymmetric playable factions.",
      "Session setup should use civilization selection instead of relying only on a free-text faction name.",
      "Civilization data can control starting resources, abilities and later unique mechanics.",
      "Frontend setup displays civilization names and selection data."
    ]
  },
  {
    id: "map-editor-v1",
    date: "2026-06-13",
    type: "frontend",
    title: "Map Editor v1",
    summary:
      "A dedicated map editor was added to create, save, update and delete playable galaxy maps.",
    changes: [
      "Added support for custom systems, positions, start systems, archive levels and resource slots.",
      "Added safe, dangerous and wraparound corridor configuration.",
      "Added saved map list, map loading, update, delete and save-as-new behavior.",
      "Added ownership and visibility concepts for private, public and official maps."
    ]
  },
  {
    id: "profile-and-account-management",
    date: "2026-06-15",
    type: "system",
    title: "Profile and account management",
    summary:
      "The account layer was improved with profile management, better validation and safer password workflows.",
    changes: [
      "Added Profile page.",
      "Added nickname update with field-level validation.",
      "Added password update with old password verification.",
      "Added password confirmation and password visibility controls.",
      "Added clearer error messages and inline validation for user-facing forms."
    ]
  },
  {
    id: "roles-and-map-permissions",
    date: "2026-06-15",
    type: "backend",
    title: "Roles and map permissions",
    summary:
      "Basic roles and map permission rules were introduced to protect official and user-created content.",
    changes: [
      "Added super_admin and registered_user role direction.",
      "Added map ownership through created_by_user_id.",
      "Added map visibility: private, public and official.",
      "Map editor now exposes can_edit and can_delete instead of exposing raw role logic to the frontend.",
      "Official maps are readable by players but protected from normal user edits."
    ]
  },
  {
    id: "hotseat-turn-system-v1",
    date: "2026-06-16",
    type: "game-design",
    title: "Hotseat turn system v1",
    summary:
      "The game loop direction was fixed as hotseat-first and online-ready, using Command Points to control round tempo.",
    changes: [
      "ARCHONT MVP will start as hotseat mode on one device.",
      "The architecture remains online-ready through sessions, users and session players.",
      "A round consists of players taking one action at a time in turn order.",
      "Each player receives 3 Command Points per round.",
      "A successful action spends 1 CP and immediately passes control to the next active player.",
      "Pass removes the player from the current round until the next round starts.",
      "When all players have passed or spent all CP, the next round begins."
    ]
  },
  {
    id: "hotseat-ui-and-turn-lock",
    date: "2026-06-16",
    type: "frontend",
    title: "Hotseat UI and action restrictions",
    summary:
      "The gameplay screen started showing active player state, CP and pass status while restricting actions to the current player.",
    changes: [
      "Added Hotseat mode panel to the GamePlay screen.",
      "Added current player display and Command Points display.",
      "Added End turn and Pass actions.",
      "Removed manual player selection from construction flow because it broke active-player logic.",
      "Player cards show CP and pass status.",
      "Players can inspect other systems, but actions are restricted to the current player's own systems."
    ]
  },
  {
    id: "patch-notes-page",
    date: "2026-06-16",
    type: "system",
    title: "Public Patch Notes page",
    summary:
      "A public Patch Notes page was planned to preserve the design and development history of ARCHONT in chronological order.",
    changes: [
      "Patch Notes will be linked from the Home page.",
      "Entries are stored in frontend data first for simplicity.",
      "The page is public and does not require authentication.",
      "Future versions can move patch notes into the backend and add an admin editor."
    ]
  },
  {
    id: "animated-pixel-space-background-v2",
    date: "2026-06-16",
    type: "frontend",
    title: "Animated pixel space background v2",
    summary:
      "The public entry pages received a more dynamic pixel-space background with stronger battle ambience.",
    changes: [
      "Added multiple background battle zones with small ship squadrons, missiles and pixel explosions.",
      "Increased ship brightness and size so the battles are easier to read behind the foreground UI.",
      "Reduced missile size so weapon fire feels sharper and less bulky.",
      "Kept the animated background decorative and non-interactive so it does not affect gameplay controls."
    ]
  },

  {
    id: "fleet-command-production-gameplay-update",
    date: "2026-06-17",
    type: "gameplay",
    title: "Fleet Commands, danger routes and gameplay presentation",
    summary:
      "Fleet operations now support planned multi-step movement, unit transfers and corridor hazards, while the gameplay page received a production-ready visual overhaul.",
    changes: [
      "Added fleet-based command planning: one Command Point can issue orders to multiple ready fleets.",
      "Added Move → Defensive Position and Move → Move orders with the complete route selected before execution.",
      "Added Move → Transfer with visual unit exchange, support for damaged units and one remaining movement for the receiving fleet.",
      "Added a 60-card virtual danger pool for dangerous and wraparound corridors, including hull damage, resource losses and harmless navigation events.",
      "Danger cards are resolved after each movement step, and destroyed units or fleets are removed immediately.",
      "Separated deployed Colonies from mobile Arks: Colonies are buildings, while Arks occupy real fleet capacity.",
      "Added Barracks and Spaceport production with strict limits of 4 active fleets and 5 units per fleet.",
      "Redesigned the gameplay page with faction colours, ownership states, fleet and unit identification, health visualization and a unified Fleet Command console.",
      "Improved corridor readability: safe, dangerous and wraparound routes now use distinct colours, line patterns and risk markers.",
      "Optimized the galaxy map by replacing continuous SVG animations and blur-heavy effects with lighter static styling."
  ]
},

];
