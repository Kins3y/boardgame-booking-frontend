export type PatchNoteType =
  | "game-design"
  | "backend"
  | "frontend"
  | "system"
  | "balance"
  | "gameplay";

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
  },

  {
  id: "fleet-combat-and-starting-scout",
  date: "2026-06-17",
  type: "game-design",
  title: text(
    "Fleet combat, defensive positions and starting Scouts",
    "Бой флотов, оборонительные позиции и стартовые Разведчики"
  ),
  summary: text(
    "The fleet command system now covers peaceful movement, defensive positioning and direct attacks, while every player begins the game with one Scout Drone in Fleet 1.",
    "Система команд флотов теперь охватывает мирное перемещение, занятие оборонительной позиции и прямые атаки, а каждый игрок начинает партию с одним Разведывательным дроном во Флоте 1."
  ),
  changes: [
    text(
      "Added a Defensive Position order that lets a ready fleet hold its current system and prepare an ambush.",
      "Добавлен приказ «Оборонительная позиция», позволяющий готовому флоту остаться в текущей системе и подготовить засаду."
    ),
    text(
      "Added Move → Attack with an explicit destination and target enemy fleet.",
      "Добавлен приказ «Движение → Атака» с явным выбором системы назначения и вражеского флота-цели."
    ),
    text(
      "A defensive fleet forces the attacker to resolve one additional danger card before combat; the defensive position is then consumed.",
      "Обороняющийся флот заставляет атакующего разыграть одну дополнительную карту опасности перед боем, после чего оборонительная позиция считается использованной."
    ),
    text(
      "Combat is resolved in simultaneous deterministic rounds using total fleet Attack and Defense, with damage applied to front units in formation order.",
      "Бой проходит одновременными детерминированными раундами с использованием суммарных Атаки и Защиты флотов; урон получают передние юниты согласно порядку построения."
    ),
    text(
      "A defeated or stalled surviving attacker automatically retreats to its origin system without drawing an additional corridor card.",
      "Выживший атакующий при поражении или патовой ситуации автоматически отступает в исходную систему без дополнительной карты коридора."
    ),
    text(
      "Peaceful movement orders can no longer enter a system containing an enemy fleet; such movement must use Move → Attack.",
      "Мирные приказы перемещения больше не могут входить в систему с вражеским флотом — для этого требуется приказ «Движение → Атака»."
    ),
    text(
      "Every player now starts with Fleet 1 containing one free Scout Drone in their starting system.",
      "Теперь каждый игрок начинает партию с Флотом 1, содержащим одного бесплатного Разведывательного дрона в стартовой системе."
    )
  ]
},

{
  id: "interactive-combat-and-hostile-movement",
  date: "2026-06-18",
  type: "gameplay",
  title: {
    en: "Interactive danger resolution and hostile fleet movement",
    ru: "Интерактивное разрешение опасностей и враждебное перемещение флотов",
  },
  summary: {
    en: "Danger cards, combat contact and hostile movement are now resolved through an interactive modal flow. Fleet battles use a single simultaneous damage exchange, surviving fleets remain engaged, and players may later continue combat or retreat.",
    ru: "Карты опасности, боевой контакт и враждебное перемещение теперь разрешаются через интерактивное модальное окно. Сражение состоит из одного одновременного обмена уроном, выжившие флоты остаются в контакте, а игроки позднее могут продолжить бой или отступить.",
  },
  changes: [
    {
      en: "Added a confirmation modal for every movement affected by danger cards, including dangerous and wraparound corridors.",
      ru: "Добавлено окно подтверждения для каждого перемещения, на которое влияют карты опасности, включая опасные и wraparound-коридоры.",
    },
    {
      en: "Danger cards are dealt from a visible deck, placed in a row and revealed one by one with their effects and results.",
      ru: "Карты опасности визуально выкладываются из колоды в ряд и последовательно раскрываются с отображением эффекта и результата.",
    },
    {
      en: "The modal now shows a compact combined danger summary: total cards, fleet HP lost, resources lost and destroyed units.",
      ru: "В модальном окне теперь показывается компактный суммарный результат: количество карт, потерянные HP флота, потерянные ресурсы и уничтоженные юниты.",
    },
    {
      en: "Combat now resolves as one simultaneous damage exchange per action instead of continuing until one fleet is destroyed.",
      ru: "Бой теперь разрешается как один одновременный обмен уроном за действие, а не продолжается автоматически до уничтожения одного из флотов.",
    },
    {
      en: "If both fleets survive, they remain engaged in the same system and may later choose Continue Combat or Retreat.",
      ru: "Если оба флота выжили, они остаются в боевом контакте в одной системе и позднее могут выбрать «Продолжить бой» или «Отступить».",
    },
    {
      en: "Retreating fleets draw pursuit danger cards equal to the positive difference between the largest enemy fleet and the retreating fleet.",
      ru: "Отступающий флот тянет карты преследования в количестве, равном положительной разнице между крупнейшим вражеским флотом и отступающим флотом.",
    },
    {
      en: "Move → Move may now enter a hostile system after either the first or second movement step.",
      ru: "Приказ «Перемещение → Перемещение» теперь может привести во вражескую систему как после первого, так и после второго шага.",
    },
    {
      en: "Before hostile movement is confirmed, the player sees the interception step, enemy fleet owner and estimated one-way damage.",
      ru: "Перед подтверждением враждебного перемещения игрок видит шаг перехвата, владельца вражеского флота и предполагаемый односторонний урон.",
    },
    {
      en: "A fleet intercepted during Move → Move receives one enemy attack without return fire. If interception happens after step one, the second movement is cancelled.",
      ru: "Флот, перехваченный во время «Перемещение → Перемещение», получает одну атаку противника без ответного удара. Если перехват произошёл после первого шага, второе перемещение отменяется.",
    },
    {
      en: "Defensive fleets that survive an attack may make their own combat decision on their next turn instead of remaining permanently activated.",
      ru: "Флот в защитной стойке, переживший атаку, может принять собственное боевое решение в свой следующий ход вместо постоянной блокировки в состоянии Activated.",
    },
    {
      en: "Combat result cards now show the owner, faction, fleet name and battle location for both sides.",
      ru: "Карточка результата боя теперь показывает владельца, фракцию, название флота и место сражения для обеих сторон.",
    },
    {
      en: "Added persistent Game Logs with chronological records of movement, danger cards, combat damage, destroyed units, construction and production.",
      ru: "Добавлен постоянный журнал Game Logs с хронологией перемещений, карт опасности, боевого урона, уничтоженных юнитов, строительства и производства.",
    },
  ],
},

{
  id: "technologies-v1-foundation",
  date: "2026-06-18",
  type: "gameplay",
  title: {
    en: "Technologies v1 foundation",
    ru: "Основа технологий v1",
  },
  summary: {
    en: "Added the first technology framework: players can research permanent upgrades through existing buildings, spend resources and command points, and gain Dominance Points as a fallback victory score.",
    ru: "Добавлена первая основа системы технологий: игроки могут исследовать постоянные улучшения через существующие здания, тратить ресурсы и командные очки, а также получать очки Доминирования как запасной путь победы.",
  },
  changes: [
    {
      en: "Added a 12-round victory framework indicator to the game screen.",
      ru: "На экран игры добавлен индикатор победной рамки на 12 раундов.",
    },
    {
      en: "Added Dominance Points as a fallback victory score if the Archon is not activated before the round limit.",
      ru: "Добавлены очки Доминирования как запасной способ победы, если Архонт не активирован до лимита раундов.",
    },
    {
      en: "Added the first static technology catalog with combat, archive and logistics technologies.",
      ru: "Добавлен первый статический каталог технологий с боевыми, архивными и логистическими улучшениями.",
    },
    {
      en: "Players can research technologies through required buildings such as Barracks, Spaceport, Research Center and Supply Depot.",
      ru: "Игроки могут исследовать технологии через необходимые здания: казармы, космопорт, исследовательский центр и склад снабжения.",
    },
    {
      en: "Technology research costs resources and 1 command point, then advances the turn like other major actions.",
      ru: "Исследование технологии стоит ресурсы и 1 командное очко, после чего передаёт ход как другие крупные действия.",
    },
  ],
},

{
  id: "archive-research-and-archon-core-v1",
  date: "2026-06-19",
  type: "gameplay",
  title: {
    en: "Archive Research and Archon Core v1",
    ru: "Исследование архивов и Ядро Архонта v1",
  },
  summary: {
    en: "Added the first full Ascension path foundation: players can research archive systems for Archon Blueprints, extract Data from already decoded archives, and claim the unique Archon Core after completing all five Blueprints.",
    ru: "Добавлена первая полноценная основа пути Вознесения: игроки могут исследовать архивные системы ради чертежей Архонта, добывать Данные из уже расшифрованных архивов и забрать уникальное Ядро Архонта после сбора всех пяти чертежей.",
  },
  changes: [
    {
      en: "Added Archive Research as a major action that costs Energy and 1 Command Point.",
      ru: "Добавлено исследование архивов как крупное действие, требующее Энергию и 1 Командное Очко.",
    },
    {
      en: "Archive I, II, III, IV and V now provide matching Archon Blueprints for each player.",
      ru: "Архивы I, II, III, IV и V теперь дают соответствующие чертежи Архонта для каждого игрока.",
    },
    {
      en: "Blueprints are player-specific rather than globally unique, allowing multiple players to progress toward Ascension.",
      ru: "Чертежи привязаны к игроку и не являются глобально уникальными, поэтому несколько игроков могут одновременно двигаться к Вознесению.",
    },
    {
      en: "Researching an archive for the first time grants a Blueprint, Data and Dominance Points.",
      ru: "Первое исследование архива даёт чертёж, Данные и Очки Доминирования.",
    },
    {
      en: "Repeating archive research after the matching Blueprint has already been found now extracts Data instead of blocking the action.",
      ru: "Повторное исследование архива после получения соответствующего чертежа теперь добывает Данные вместо блокировки действия.",
    },
    {
      en: "Added the unique Archon Core claim flow: a player with all five Blueprints can claim the Core in Archive V / Heart of the Galaxy.",
      ru: "Добавлен процесс получения уникального Ядра Архонта: игрок со всеми пятью чертежами может забрать Ядро в Архиве V / Сердце Галактики.",
    },
    {
      en: "Claiming the Archon Core marks the claiming player as the Archon Player and moves the session into the archon_activated phase.",
      ru: "Получение Ядра Архонта делает игрока Архонт-игроком и переводит сессию в фазу archon_activated.",
    },
    {
      en: "The game screen now exposes Ascension progress, Core status, Archon Player and Resistance state.",
      ru: "Игровой экран теперь показывает прогресс Вознесения, статус Ядра, Архонт-игрока и состояние Сопротивления.",
    },
  ],
},

{
  id: "gameplay-ui-overhaul-2026-08",
  date: "2026-08-12",
  type: "frontend",
  title: text(
    "Gameplay UI overhaul",
    "Полная переработка игрового интерфейса"
  ),
  summary: text(
    "The gameplay interface was rebuilt into a compact strategy-game HUD focused on the galaxy map, contextual controls and single-screen usability.",
    "Игровой интерфейс полностью переработан в компактный HUD в стиле компьютерной стратегии с акцентом на карту галактики, контекстные действия и работу в пределах одного экрана."
  ),
  changes: [
    text(
      "Rebuilt the gameplay screen around a fullscreen galaxy map with a compact resource, round, Command Point and ARCHONT progress HUD.",
      "Игровой экран перестроен вокруг полноэкранной карты галактики с компактным отображением ресурсов, раунда, Командных Очков и прогресса ARCHONT."
    ),
    text(
      "Added compact player controls, a collapsible map legend, contextual system information and a Main Menu button.",
      "Добавлены компактная панель игроков, сворачиваемая легенда карты, контекстная информация о системах и кнопка выхода в главное меню."
    ),
    text(
      "Redesigned Buildings into dedicated Build, Production and Technologies workspaces.",
      "Раздел зданий переработан в отдельные режимы строительства, производства и технологий."
    ),
    text(
      "Redesigned fleet management and moved Fleet Command into a dedicated command console.",
      "Переработано управление флотами, а Fleet Command вынесен в отдельную командную консоль."
    ),
    text(
      "Improved UI spacing, icon alignment, text wrapping and contextual action presentation across gameplay panels.",
      "Улучшены отступы, выравнивание иконок, перенос текста и отображение контекстных действий во всех игровых панелях."
    ),
    text(
      "Redesigned the Game Logs page for clearer chronological event, movement, danger and combat presentation.",
      "Переработана страница Game Logs для более понятного отображения хронологии событий, перемещений, опасностей и боёв."
    ),
    text(
      "Optimized language controls and removed non-gameplay administrative elements from the active game interface.",
      "Оптимизирован переключатель языка, а административные элементы убраны из активного игрового интерфейса."
    )
  ]
},

{
  id: "backend-rules-ai-lab-v054-2026-09",
  date: "2026-09-02",
  type: "backend",
  title: text(
    "Conquest, Victory Framework & AI Lab v0.5.4",
    "Завоевание, Victory Framework и AI Lab v0.5.4"
  ),
  summary: text(
    "A major backend update consolidating the current ARCHONT conquest rules, Home invasion and elimination flow, Archive interactions, asymmetric ARCHONT endgame, persistent gameplay state and the new AI Lab v0.5.4 neural self-play curriculum.",
    "Крупное обновление бэкенда, объединяющее актуальные правила завоевания ARCHONT, вторжение на Home и устранение игроков, взаимодействие с Архивами, асимметричный эндгейм ARCHONT, сохранение игрового состояния и новую систему нейросетевого self-play в AI Lab v0.5.4."
  ),
  changes: [
    text(
      "Integrated the current conquest rules into the main gameplay backend and synchronized them with the session victory framework.",
      "Актуальные правила завоевания интегрированы в основной игровой бэкенд и синхронизированы с системой определения победы игровой сессии."
    ),

    text(
      "Home Worlds no longer function as conventional combat units with their own attack, defense or normal combat participation.",
      "Home Worlds больше не работают как обычные боевые единицы со своей атакой, защитой или стандартным участием в бою."
    ),

    text(
      "A defending Home must first be cleared of enemy fleets through normal combat before an invasion can be completed.",
      "Перед вторжением на защищённый Home необходимо сначала уничтожить или вытеснить обороняющиеся флоты обычным боем."
    ),

    text(
      "Home conquest is now resolved through a dedicated invasion flow rather than by treating the Home itself as another combat target.",
      "Завоевание Home теперь происходит через отдельную механику вторжения, а не через атаку Home как обычной боевой цели."
    ),

    text(
      "Marine presence is required to complete a Home invasion, making ground-assault capability a strategic requirement for eliminating another player.",
      "Для завершения вторжения на Home требуется Marine, поэтому возможность наземного штурма становится обязательным стратегическим условием полного уничтожения другого игрока."
    ),

    text(
      "Successful Home invasion can eliminate a player from the pre-ARCHONT phase of the game.",
      "Успешное вторжение на Home может полностью устранить игрока из партии до начала фазы ARCHONT."
    ),

    text(
      "Player elimination now propagates through persistent game state instead of existing only as a temporary combat result.",
      "Устранение игрока теперь сохраняется в постоянном состоянии игровой сессии, а не существует только как временный результат боя."
    ),

    text(
      "The backend now tracks Home state per session and player, including destruction status, destruction round and the player responsible for the conquest.",
      "Бэкенд теперь хранит состояние Home отдельно для каждой игровой сессии и игрока, включая факт уничтожения, раунд уничтожения и игрока, совершившего завоевание."
    ),

    text(
      "Extended the persisted Home World model with current HP, maximum HP, destroyed state, destroyed round and destroyed-by-player information for compatibility with the current victory framework.",
      "Модель сохранённого состояния Home World расширена полями текущего HP, максимального HP, состояния уничтожения, раунда уничтожения и информации об уничтожившем игроке для совместимости с актуальным Victory Framework."
    ),

    text(
      "Added database migration support for existing PostgreSQL installations where the session_home_worlds table was created before the latest Home-state fields existed.",
      "Добавлена миграция базы данных для существующих PostgreSQL-инсталляций, в которых таблица session_home_worlds была создана до появления новых полей состояния Home."
    ),

    text(
      "The Home World schema migration is idempotent and can safely add missing columns without deleting existing game sessions or rebuilding the database.",
      "Миграция схемы Home World идемпотентна и может безопасно добавить недостающие колонки без удаления существующих партий или пересоздания базы данных."
    ),

    text(
      "Fixed a backend failure where full session requests returned HTTP 500 because the SQLAlchemy model expected Home World columns that were missing from an older PostgreSQL schema.",
      "Исправлена ошибка бэкенда, из-за которой запрос полной игровой сессии возвращал HTTP 500: SQLAlchemy-модель ожидала новые колонки Home World, отсутствовавшие в старой схеме PostgreSQL."
    ),

    text(
      "Updated the full game-session response to expose the current victory framework state required by the gameplay client.",
      "Обновлён полный ответ игровой сессии: теперь он содержит актуальное состояние Victory Framework, необходимое игровому клиенту."
    ),

    text(
      "Separated normal conquest victory logic from the asymmetric ARCHONT endgame so the game can correctly transition between these two strategic phases.",
      "Логика обычной победы через завоевание отделена от асимметричного эндгейма ARCHONT, чтобы партия корректно переходила между этими двумя стратегическими фазами."
    ),

    text(
      "ARCHONT activation now acts as a structural phase transition: the activating player becomes the ARCHONT while the remaining players become the Resistance.",
      "Активация ARCHONT теперь является полноценным переходом между фазами: активировавший игрок становится ARCHONT, а оставшиеся игроки переходят на сторону Resistance."
    ),

    text(
      "The asymmetric ARCHONT versus Resistance state is preserved separately from normal pre-ARCHONT player-versus-player conquest.",
      "Асимметричное состояние ARCHONT против Resistance теперь обрабатывается отдельно от обычного противостояния игроков до активации ARCHONT."
    ),

    text(
      "The backend keeps the round-limit and fallback victory framework compatible with the current ARCHONT endgame structure.",
      "Бэкенд сохраняет совместимость ограничения по раундам и резервного условия победы с актуальной структурой эндгейма ARCHONT."
    ),

    text(
      "Fleet Ready and Activated states remain part of the authoritative backend game state, preventing unrestricted repeated fleet activation within the same round.",
      "Состояния флота Ready и Activated остаются частью авторитетного состояния игры на бэкенде и предотвращают неограниченное повторное использование одного флота в течение одного раунда."
    ),

    text(
      "Archive systems remain non-colonizable and are handled separately from normal colony systems.",
      "Системы Архивов остаются неколонизируемыми и обрабатываются отдельно от обычных систем, пригодных для создания колоний."
    ),

    text(
      "Archive control is based on fleet presence instead of colony ownership.",
      "Контроль Архива определяется присутствием флота, а не владением колонией."
    ),

    text(
      "Archive Research requires an appropriate ready Scout and consumes the relevant fleet activation.",
      "Исследование Архива требует подходящий готовый Scout и расходует активацию соответствующего флота."
    ),

    text(
      "After Archive Research, the researching fleet can remain in the Archive as persistent Archive Defense instead of disappearing from the strategic board state.",
      "После исследования Архива исследовавший флот может оставаться в системе как постоянная Archive Defense, сохраняя своё присутствие на стратегической карте."
    ),

    text(
      "Updated backend gameplay state handling so Archive research, fleet state, conquest and victory calculations operate on the same authoritative session data.",
      "Обновлена обработка игрового состояния на бэкенде: исследование Архивов, состояния флотов, завоевание и расчёт победы теперь работают с единым авторитетным состоянием игровой сессии."
    ),

    text(
      "AI Lab has been upgraded to v0.5.4 with a redesigned learning curriculum focused on producing more competent self-play agents before large-scale balance testing.",
      "AI Lab обновлён до v0.5.4 с переработанной программой обучения, направленной на получение более компетентных self-play агентов до запуска масштабных тестов баланса."
    ),

    text(
      "The v0.5.4 AI update changes the learning pipeline rather than introducing a separate set of game rules, keeping neural simulations aligned with the current ARCHONT ruleset.",
      "Обновление AI v0.5.4 изменяет процесс обучения, а не создаёт отдельную версию игровых правил, благодаря чему нейросетевые симуляции остаются синхронизированы с актуальным ruleset ARCHONT."
    ),

    text(
      "Teacher imitation data can now be stored as disk-backed replay chunks instead of requiring the complete training dataset to remain in memory.",
      "Данные imitation learning от teacher-ботов теперь могут храниться на диске в виде replay-чанков вместо необходимости удерживать весь обучающий датасет в оперативной памяти."
    ),

    text(
      "Expanded teacher-data collection allows substantially larger imitation datasets to be generated before neural self-play begins.",
      "Расширенный сбор teacher-данных позволяет формировать значительно более крупные imitation-датасеты до начала нейросетевого self-play."
    ),

    text(
      "Teacher replay can be reused across bootstrap attempts, reducing the need to repeatedly regenerate expensive imitation data after a failed candidate.",
      "Teacher replay может повторно использоваться между попытками bootstrap, уменьшая необходимость заново генерировать дорогостоящие imitation-данные после неудачного кандидата."
    ),

    text(
      "Added a stronger bootstrap competence gate so a neural candidate must demonstrate meaningful imitation accuracy before progressing into PPO self-play.",
      "Добавлен более строгий bootstrap competence gate: нейросетевой кандидат должен продемонстрировать достаточную точность imitation learning до перехода к PPO self-play."
    ),

    text(
      "Bootstrap validation now evaluates gameplay safety and behavioral quality in addition to raw supervised-learning accuracy.",
      "Проверка bootstrap теперь оценивает не только точность supervised learning, но также игровую безопасность и качество поведения агента."
    ),

    text(
      "Introduced additional protection against stalled or non-functional neural policies entering the main self-play training lineage.",
      "Добавлена дополнительная защита от попадания зависающих или фактически неиграбельных нейросетевых политик в основную линию self-play обучения."
    ),

    text(
      "Added a teacher-anchor objective to early PPO generations so the policy does not immediately forget useful behavior learned during imitation bootstrap.",
      "В ранние поколения PPO добавлен teacher-anchor objective, чтобы политика не забывала сразу после bootstrap полезное поведение, полученное через imitation learning."
    ),

    text(
      "Teacher-anchor influence gradually decays during training, allowing the neural agent to move from guided behavior toward strategies discovered through self-play.",
      "Влияние teacher anchor постепенно уменьшается в ходе обучения, позволяя нейросетевому агенту переходить от направляемого поведения к стратегиям, самостоятельно найденным через self-play."
    ),

    text(
      "Self-play training keeps zero-sum normalized outcomes so improvements are evaluated around the competitive result of the game rather than absolute reward accumulation.",
      "Self-play обучение сохраняет zero-sum нормализацию результатов, благодаря чему улучшения оцениваются относительно конкурентного исхода партии, а не простого накопления абсолютной награды."
    ),

    text(
      "Candidate evaluation now uses mirrored games to reduce seat, map-position and matchup bias when comparing a new policy against the current champion.",
      "Оценка кандидатов теперь использует зеркальные партии, чтобы уменьшить влияние позиции игрока, стартового места на карте и особенностей matchup при сравнении новой политики с текущим champion."
    ),

    text(
      "Candidate and champion policies can be compared throughout training instead of relying only on a final end-of-run evaluation.",
      "Candidate и champion политики теперь могут сравниваться непосредственно во время обучения, а не только в рамках финальной проверки после завершения всего прогона."
    ),

    text(
      "Champion promotion now requires both competitive performance and acceptable safety behavior, preventing a technically winning but fundamentally broken policy from automatically becoming the new best model.",
      "Повышение нового champion теперь требует одновременно конкурентоспособных результатов и приемлемого безопасного поведения, чтобы формально побеждающая, но фундаментально сломанная политика не становилась автоматически новой лучшей моделью."
    ),

    text(
      "Introduced clearer checkpoint semantics for bootstrap, latest training state, promoted champion and historical Hall of Fame models.",
      "Введено более чёткое разделение checkpoint-файлов для bootstrap, последнего состояния обучения, текущего champion и исторических моделей Hall of Fame."
    ),

    text(
      "bootstrap.pt now represents the validated imitation model that successfully passed the bootstrap gate.",
      "bootstrap.pt теперь представляет проверенную imitation-модель, успешно прошедшую bootstrap gate."
    ),

    text(
      "bootstrap_candidate.pt can preserve a candidate that did not pass validation, making failed bootstrap runs easier to inspect and diagnose.",
      "bootstrap_candidate.pt может сохранять кандидата, не прошедшего проверку, что упрощает анализ и диагностику неудачных bootstrap-прогонов."
    ),

    text(
      "latest.pt represents the latest PPO training state while best.pt represents the promoted champion used as the primary evaluation model.",
      "latest.pt хранит последнее состояние PPO-обучения, тогда как best.pt представляет повышенного champion, используемого как основная модель для оценки."
    ),

    text(
      "Hall of Fame storage is reserved for policies that actually achieved promotion rather than every intermediate training checkpoint.",
      "Hall of Fame теперь предназначен для политик, действительно прошедших повышение, а не для каждого промежуточного checkpoint обучения."
    ),

    text(
      "Older v0.5.2 and v0.5.3 neural training lineages are intentionally rejected for direct v0.5.4 resume to avoid silently mixing incompatible learning semantics.",
      "Старые линии нейросетевого обучения v0.5.2 и v0.5.3 намеренно не принимаются для прямого resume в v0.5.4, чтобы не смешивать несовместимые семантики обучения."
    ),

    text(
      "Improved neural training observability with clearer progress information for teacher collection, bootstrap, generations, evaluation and promotion.",
      "Улучшена наблюдаемость нейросетевого обучения: прогресс сбора teacher-данных, bootstrap, поколений, evaluation и promotion стал значительно прозрачнее."
    ),

    text(
      "Optimized teacher-data collection and neural preprocessing to reduce unnecessary overhead during large automated training runs.",
      "Оптимизированы сбор teacher-данных и нейросетевая предобработка для снижения лишних накладных расходов во время крупных автоматизированных обучающих прогонов."
    ),

    text(
      "Static topology and reusable encoder information can be cached instead of being repeatedly reconstructed for every decision.",
      "Статическая топология и повторно используемая информация энкодера могут кэшироваться вместо повторного построения на каждом отдельном решении."
    ),

    text(
      "Added explicit smoke and fast training profiles for quickly validating the neural pipeline before committing resources to larger experiments.",
      "Добавлены явные профили smoke и fast для быстрой проверки neural pipeline перед запуском более ресурсоёмких экспериментов."
    ),

    text(
      "Generated neural models, teacher replay datasets, training reports and PyTorch checkpoints are treated as runtime artifacts and are not intended to be stored in the application source repository.",
      "Сгенерированные нейросетевые модели, teacher replay датасеты, отчёты обучения и PyTorch checkpoints рассматриваются как runtime-артефакты и не предназначены для хранения в основном репозитории исходного кода."
    ),

    text(
      "Extended backend regression coverage across the core AI Lab, adaptive agents and neural pipeline.",
      "Расширено регрессионное покрытие бэкенда для основного AI Lab, adaptive-агентов и neural pipeline."
    ),

    text(
      "Added rules, audit and map validation to the backend verification workflow so game-rule regressions can be detected separately from conventional application test failures.",
      "В процесс проверки бэкенда добавлены rules, audit и map validation, позволяющие обнаруживать регрессии игровых правил отдельно от обычных ошибок приложения."
    ),

    text(
      "The current update establishes a common backend foundation for human gameplay and automated bot simulations instead of maintaining separate interpretations of the ARCHONT rules.",
      "Текущее обновление формирует единый backend-фундамент для партий людей и автоматизированных симуляций ботов вместо поддержки нескольких различных интерпретаций правил ARCHONT."
    ),

    text(
      "This creates the basis for large-scale automated balance testing where repeated games, edge cases, dominant strategies and abnormal game states can be discovered through simulation rather than relying exclusively on manual playtesting.",
      "Это создаёт основу для масштабного автоматизированного тестирования баланса, где повторяющиеся партии, edge cases, доминирующие стратегии и аномальные игровые состояния могут обнаруживаться через симуляции, а не исключительно через ручные плейтесты."
    )
  ]
},

];
