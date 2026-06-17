export type PatchNoteType =
  | "game-design"
  | "backend"
  | "frontend"
  | "system"
  | "balance";

export type LocalizedText = {
  en: string;
  ru: string;
};

export type PatchNote = {
  id: string;
  date: string;
  type: PatchNoteType;
  title: LocalizedText;
  summary: LocalizedText;
  changes: LocalizedText[];
};

const text = (en: string, ru: string): LocalizedText => ({ en, ru });

export const patchNotes: PatchNote[] = [
  {
    id: "archont-core-concept",
    date: "2026-06-08",
    type: "game-design",
    title: text("ARCHONT core concept", "Основная концепция ARCHONT"),
    summary: text(
      "The project shifted from a generic board game booking app into a dedicated builder and simulator for the ARCHONT strategy board game.",
      "Проект превратился из универсального приложения для бронирования настольных игр в специализированный конструктор и симулятор стратегической игры ARCHONT."
    ),
    changes: [
      text(
        "Defined ARCHONT as a space strategy game with asymmetric civilizations, colonies, archives, research and a late-game Archont threat.",
        "ARCHONT определён как космическая стратегия с асимметричными цивилизациями, колониями, архивами, исследованиями и угрозой Архонта в поздней игре."
      ),
      text(
        "Established the idea that every player should be able to build their own Archont through blueprint discovery.",
        "Закреплена идея, что каждый игрок может построить собственного Архонта через поиск и исследование чертежей."
      ),
      text(
        "Rejected a simple fragment-collection model in favor of blueprint research and archive competition.",
        "От простой модели сбора фрагментов отказались в пользу исследования чертежей и борьбы за архивы."
      ),
      text(
        "Defined the game as a hybrid between economic development, expansion, conflict and discovery rather than a pure wargame.",
        "Игра определена как сочетание экономики, экспансии, конфликтов и открытий, а не как чистый варгейм."
      )
    ]
  },
  {
    id: "node-map-direction",
    date: "2026-06-08",
    type: "game-design",
    title: text("Node-based galaxy map", "Узловая карта галактики"),
    summary: text(
      "The map direction moved away from a traditional hex grid and toward a node-and-corridor galaxy map.",
      "Карта ушла от традиционной гексагональной сетки к системе узлов и соединяющих их коридоров."
    ),
    changes: [
      text("Systems became map nodes rather than hex cells.", "Системы стали отдельными узлами карты вместо гексагональных клеток."),
      text("Movement is planned as system-to-system travel through corridors.", "Перемещение происходит между системами по коридорам."),
      text("Start positions should have equal distance to the center to avoid unfair openings.", "Стартовые позиции должны находиться на одинаковом расстоянии от центра."),
      text("Archive systems, start systems, normal systems and wraparound corridors became part of the map model.", "В модель карты вошли стартовые, обычные и архивные системы, а также переходы через край карты.")
    ]
  },
  {
    id: "economy-and-colony-foundation",
    date: "2026-06-09",
    type: "game-design",
    title: text("Economy, colonies and Ark foundation", "Основа экономики, колоний и Ковчегов"),
    summary: text(
      "The first economic model was established with Matter, Energy, Data and later Food as core resources.",
      "Создана первая экономическая модель с Материей, Энергией, Данными и позднее Снабжением в качестве основных ресурсов."
    ),
    changes: [
      text("Matter, Energy and Data became the main strategic resources.", "Материя, Энергия и Данные стали основными стратегическими ресурсами."),
      text("Food was added as an upkeep resource for units, Colonies and Arks.", "Снабжение добавлено как ресурс содержания юнитов, колоний и Ковчегов."),
      text("Deployed Colonies generate Matter and Energy each round.", "Развёрнутые колонии производят Материю и Энергию каждый раунд."),
      text("Ark state allows a Colony to move, but it does not generate income while packed.", "Состояние Ковчега позволяет перемещать колонию, но в упакованном виде она не приносит доход."),
      text("Foundation Colony cannot be launched as an Ark to prevent a player from abandoning their last settlement.", "Базовую последнюю колонию нельзя превратить в Ковчег, чтобы игрок не мог полностью покинуть свои владения.")
    ]
  },
  {
    id: "civilizations-system",
    date: "2026-06-11",
    type: "game-design",
    title: text("Civilizations as playable entities", "Цивилизации как игровые сущности"),
    summary: text(
      "Civilizations were promoted from flavor text into a proper game entity selected during session setup.",
      "Цивилизации перестали быть только художественным описанием и стали полноценными игровыми сущностями, выбираемыми при настройке сессии."
    ),
    changes: [
      text("Civilizations are intended to be asymmetric playable factions.", "Цивилизации задуманы как асимметричные игровые фракции."),
      text("Session setup should use civilization selection instead of relying only on a free-text faction name.", "Настройка сессии использует выбор цивилизации, а не только свободно вводимое название фракции."),
      text("Civilization data can control starting resources, abilities and later unique mechanics.", "Данные цивилизации могут определять стартовые ресурсы, способности и уникальные механики."),
      text("Frontend setup displays civilization names and selection data.", "Интерфейс настройки отображает названия и сведения о цивилизациях.")
    ]
  },
  {
    id: "map-editor-v1",
    date: "2026-06-13",
    type: "frontend",
    title: text("Map Editor v1", "Редактор карт v1"),
    summary: text(
      "A dedicated map editor was added to create, save, update and delete playable galaxy maps.",
      "Добавлен отдельный редактор для создания, сохранения, изменения и удаления игровых карт галактики."
    ),
    changes: [
      text("Added support for custom systems, positions, start systems, archive levels and resource slots.", "Добавлена настройка систем, их положения, стартовых систем, уровней архивов и ресурсных слотов."),
      text("Added safe, dangerous and wraparound corridor configuration.", "Добавлена настройка безопасных, опасных и переходящих через край карты коридоров."),
      text("Added saved map list, map loading, update, delete and save-as-new behavior.", "Добавлены список карт, загрузка, обновление, удаление и сохранение новой копии."),
      text("Added ownership and visibility concepts for private, public and official maps.", "Добавлены владение и уровни видимости для приватных, публичных и официальных карт.")
    ]
  },
  {
    id: "profile-and-account-management",
    date: "2026-06-15",
    type: "system",
    title: text("Profile and account management", "Профиль и управление аккаунтом"),
    summary: text(
      "The account layer was improved with profile management, better validation and safer password workflows.",
      "Система аккаунтов получила управление профилем, улучшенную валидацию и более безопасную смену пароля."
    ),
    changes: [
      text("Added Profile page.", "Добавлена страница профиля."),
      text("Added nickname update with field-level validation.", "Добавлено изменение никнейма с валидацией полей."),
      text("Added password update with old password verification.", "Добавлена смена пароля с проверкой старого пароля."),
      text("Added password confirmation and password visibility controls.", "Добавлены подтверждение пароля и управление его видимостью."),
      text("Added clearer error messages and inline validation for user-facing forms.", "Добавлены понятные сообщения об ошибках и встроенная валидация форм.")
    ]
  },
  {
    id: "roles-and-map-permissions",
    date: "2026-06-15",
    type: "backend",
    title: text("Roles and map permissions", "Роли и права доступа к картам"),
    summary: text(
      "Basic roles and map permission rules were introduced to protect official and user-created content.",
      "Введены базовые роли и правила доступа, защищающие официальные и пользовательские карты."
    ),
    changes: [
      text("Added super_admin and registered_user role direction.", "Добавлено направление ролей super_admin и registered_user."),
      text("Added map ownership through created_by_user_id.", "Добавлено владение картами через created_by_user_id."),
      text("Added map visibility: private, public and official.", "Добавлены режимы видимости карт: приватная, публичная и официальная."),
      text("Map editor now exposes can_edit and can_delete instead of exposing raw role logic to the frontend.", "Редактор карт получает can_edit и can_delete вместо передачи логики ролей на фронтенд."),
      text("Official maps are readable by players but protected from normal user edits.", "Официальные карты доступны игрокам для просмотра, но защищены от обычного редактирования.")
    ]
  },
  {
    id: "hotseat-turn-system-v1",
    date: "2026-06-16",
    type: "game-design",
    title: text("Hotseat turn system v1", "Система ходов hotseat v1"),
    summary: text(
      "The game loop direction was fixed as hotseat-first and online-ready, using Command Points to control round tempo.",
      "Игровой цикл закреплён как hotseat-first с готовностью к онлайн-режиму и Командными Очками для управления темпом раунда."
    ),
    changes: [
      text("ARCHONT MVP will start as hotseat mode on one device.", "MVP ARCHONT начинается с режима hotseat на одном устройстве."),
      text("The architecture remains online-ready through sessions, users and session players.", "Архитектура остаётся готовой к онлайн-режиму через сессии, пользователей и игроков сессии."),
      text("A round consists of players taking one action at a time in turn order.", "В раунде игроки по очереди выполняют по одному действию."),
      text("Each player receives 3 Command Points per round.", "Каждый игрок получает 3 Командных Очка на раунд."),
      text("A successful action spends 1 CP and immediately passes control to the next active player.", "Успешное действие тратит 1 КО и сразу передаёт управление следующему активному игроку."),
      text("Pass removes the player from the current round until the next round starts.", "Пас выводит игрока из текущего раунда до начала следующего."),
      text("When all players have passed or spent all CP, the next round begins.", "Когда все игроки сделали пас или потратили все КО, начинается следующий раунд.")
    ]
  },
  {
    id: "hotseat-ui-and-turn-lock",
    date: "2026-06-16",
    type: "frontend",
    title: text("Hotseat UI and action restrictions", "Интерфейс hotseat и ограничения действий"),
    summary: text(
      "The gameplay screen started showing active player state, CP and pass status while restricting actions to the current player.",
      "Игровой экран показывает активного игрока, КО и статус паса, ограничивая действия текущим игроком."
    ),
    changes: [
      text("Added Hotseat mode panel to the GamePlay screen.", "На игровой экран добавлена панель режима hotseat."),
      text("Added current player display and Command Points display.", "Добавлено отображение текущего игрока и Командных Очков."),
      text("Added End turn and Pass actions.", "Добавлены действия завершения хода и паса."),
      text("Removed manual player selection from construction flow because it broke active-player logic.", "Ручной выбор игрока убран из строительства, поскольку он нарушал логику активного игрока."),
      text("Player cards show CP and pass status.", "Карточки игроков показывают КО и статус паса."),
      text("Players can inspect other systems, but actions are restricted to the current player's own systems.", "Игроки могут просматривать чужие системы, но действия доступны только в системах текущего игрока.")
    ]
  },
  {
    id: "patch-notes-page",
    date: "2026-06-16",
    type: "system",
    title: text("Public Patch Notes page", "Публичная страница патч-ноутов"),
    summary: text(
      "A public Patch Notes page was planned to preserve the design and development history of ARCHONT in chronological order.",
      "Публичная страница патч-ноутов сохраняет историю дизайна и разработки ARCHONT в хронологическом порядке."
    ),
    changes: [
      text("Patch Notes will be linked from the Home page.", "Патч-ноуты доступны с главной страницы."),
      text("Entries are stored in frontend data first for simplicity.", "Для простоты записи сначала хранятся во фронтенд-данных."),
      text("The page is public and does not require authentication.", "Страница публичная и не требует авторизации."),
      text("Future versions can move patch notes into the backend and add an admin editor.", "В будущем патч-ноуты можно перенести в бэкенд и добавить редактор для администратора.")
    ]
  },
  {
    id: "fleet-command-production-gameplay-update",
    date: "2026-06-17",
    type: "game-design",
    title: text(
      "Fleet Commands, danger routes and gameplay presentation",
      "Команды флотов, опасные маршруты и новый игровой интерфейс"
    ),
    summary: text(
      "Fleet operations now support planned multi-step movement, unit transfers and corridor hazards, while the gameplay page received a production-ready visual overhaul.",
      "Операции флотов поддерживают запланированное многоэтапное движение, передачу юнитов и опасности коридоров, а игровой экран получил полноценное визуальное обновление."
    ),
    changes: [
      text("Added fleet-based command planning: one Command Point can issue orders to multiple ready fleets.", "Добавлено планирование команд флотов: одно Командное Очко позволяет отдать приказы нескольким готовым флотам."),
      text("Added Move → Defensive Position and Move → Move orders with the complete route selected before execution.", "Добавлены приказы «Движение → Оборона» и «Движение → Движение» с предварительным выбором полного маршрута."),
      text("Added Move → Transfer with visual unit exchange, support for damaged units and one remaining movement for the receiving fleet.", "Добавлен приказ «Движение → Передача» с визуальным обменом юнитов, передачей повреждённых юнитов и оставшимся движением принимающего флота."),
      text("Added a 60-card virtual danger pool for dangerous and wraparound corridors.", "Добавлена виртуальная колода из 60 карт опасности для опасных коридоров и переходов через край карты."),
      text("Redesigned the gameplay page with faction colours, ownership states, fleet and unit identification and health visualization.", "Игровая страница переработана с цветами фракций, отображением владения, идентификацией флотов и юнитов и визуализацией здоровья."),
      text("Optimized the galaxy map by replacing continuous SVG animations and blur-heavy effects with lighter static styling.", "Карта оптимизирована: постоянные SVG-анимации и тяжёлые размытия заменены более лёгкими статичными стилями.")
    ]
  },
  {
    id: "system-capacity-and-russian-localization",
    date: "2026-06-17",
    type: "system",
    title: text(
      "System building limits and Russian localization",
      "Ограничения зданий в системах и русская локализация"
    ),
    summary: text(
      "System information now exposes resource-building capacity, and the complete website interface can be switched between English and Russian.",
      "Информация о системах теперь показывает ограничения ресурсных зданий, а весь интерфейс сайта можно переключать между английским и русским языками."
    ),
    changes: [
      text("Added Mine, Power Plant, Supply Depot and Research Center capacity indicators to System Overview.", "В обзор системы добавлены индикаторы ограничений для шахт, энергоблоков, складов снабжения и исследовательских центров."),
      text("Each indicator shows the number of constructed buildings compared with available system slots.", "Каждый индикатор показывает количество построенных зданий относительно доступных слотов системы."),
      text("Added a persistent EN / RUS language selector in the upper-right corner of every page.", "В правом верхнем углу каждой страницы добавлен сохраняемый переключатель EN / RUS."),
      text("Localized navigation, authentication, registration, session setup, gameplay, map editor, profile and Patch Notes UI.", "Локализованы навигация, вход, регистрация, настройка сессии, игровой экран, редактор карт, профиль и патч-ноуты."),
      text("Custom system names, usernames and session names remain unchanged in both languages.", "Пользовательские названия систем, имена пользователей и названия сессий не переводятся."),
      text("Patch Notes entries now store English and Russian text as first-class localized data.", "Записи патч-ноутов теперь хранят английский и русский тексты как полноценные локализованные данные.")
    ]
  }
];
