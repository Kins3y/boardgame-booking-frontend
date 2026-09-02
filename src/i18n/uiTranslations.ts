import type { AppLanguage } from "./I18nContext";

const RU_EXACT: Record<string, string> = {
  "ENDGAME": "ЭНДГЕЙМ",
  "ARCHONT vs RESISTANCE": "АРХОНТ против СОПРОТИВЛЕНИЯ",
  "ARCHONT HP": "HP АРХОНТА",
  "ARCHONT COMMAND": "КОМАНДА АРХОНТА",
  "RESISTANCE": "СОПРОТИВЛЕНИЕ",
  "All non-ARCHONT players are allied": "Все игроки, кроме АРХОНТА, являются союзниками",
  "Already acted this round": "Уже действовал в этом раунде",
  "Select an adjacent system": "Выберите соседнюю систему",
  "ARCHONT VICTORY": "ПОБЕДА АРХОНТА",
  "RESISTANCE VICTORY": "ПОБЕДА СОПРОТИВЛЕНИЯ",
  "All Resistance Home Worlds were destroyed.": "Все домашние миры Сопротивления уничтожены.",
  "The ARCHONT was destroyed.": "АРХОНТ уничтожен.",
  "ALLIED CONTROL": "КОНТРОЛЬ СОЮЗНИКА",
  "ENEMY CONTROL": "КОНТРОЛЬ ВРАГА",
  "Claim Archon Core · 6/6/6 · 1 CP": "Активировать Ядро Архонта · 6/6/6 · 1 КО",
  "Claim cost: 6 MAT · 6 ENG · 6 DAT · 1 CP · Result: ARCHONT vs Resistance":
    "Цена активации: 6 Материи · 6 Энергии · 6 Данных · 1 КО · Результат: АРХОНТ против Сопротивления",
  "Core activation requires all five Blueprints, control of the Heart, 6 MAT, 6 ENG, 6 DAT and 1 CP.":
    "Для активации Ядра нужны все пять чертежей, контроль Сердца, 6 Материи, 6 Энергии, 6 Данных и 1 КО.",
  "HOSTILE ARRIVAL": "ВРАЖДЕБНОЕ ПРИБЫТИЕ",
  "INTERCEPTION FIRE": "ОГОНЬ ПЕРЕХВАТА",
  "One-way defensive strike": "Односторонний защитный удар",
  "Hostile fleet presence": "Присутствие вражеского флота",
  "Enemy ATK": "АТК противника",
  "Your DEF": "Ваша ЗАЩ",
  "Damage received": "Получено урона",
  "Units lost": "Потеряно юнитов",
  "No defending fleet was present, so no interception damage was dealt.":
    "Защищающегося флота не было, поэтому урон перехвата не нанесён.",
  "No defending fleet is present. The system is hostile-controlled, but no interception fire will occur.":
    "В системе нет защищающегося флота. Система контролируется противником, но огня перехвата не будет.",
  "The defending fleet was attacked while in Defensive Position and is ready to choose Continue Combat or Retreat on its owner's next turn.":
    "Флот был атакован в защитной позиции и на следующем ходу владельца сможет выбрать продолжение боя или отступление.",
  Language: "Язык",
  "CURRENT POSITION": "ТЕКУЩАЯ ПОЗИЦИЯ",
  "BATTLE LOCATION": "МЕСТО СРАЖЕНИЯ",
  "COMBAT EXCHANGE": "БОЕВОЙ ОБМЕН",
  ATTACKER: "АТАКУЮЩИЙ",
  DEFENDER: "ЗАЩИТНИК",
  "Neutral system": "Нейтральная система",
  "Unknown player": "Неизвестный игрок",
  "Unknown faction": "Неизвестная фракция",
  "Back to Login": "Назад ко входу",
  "Back to Home page": "На главную",
  "Home page": "Главная",
  Welcome: "Добро пожаловать",
  Profile: "Профиль",
  Logout: "Выйти",
  "Start new session": "Начать новую сессию",
  "Start session": "Начать сессию",
  "Sessions list": "Список сессий",
  "Map editor": "Редактор карт",
  "Patch Notes": "Патч-ноуты",
  "COMMAND NODE": "КОМАНДНЫЙ УЗЕЛ",
  "Build civilizations, fight for ancient archives, control routes across the galaxy and awaken the Archont before your rivals do.":
    "Развивайте цивилизации, сражайтесь за древние архивы, контролируйте галактические маршруты и пробудите Архонта раньше соперников.",

  "NEW COMMANDER": "НОВЫЙ КОМАНДИР",
  "Join the table": "Присоединиться к партии",
  "Claim your civilization among the stars.":
    "Займите место своей цивилизации среди звёзд.",
  "Create a profile, enter the strategic layer and prepare for the race to awaken the Archont.":
    "Создайте профиль, войдите в стратегический слой и подготовьтесь к гонке за пробуждение Архонта.",
  "Create maps": "Создавать карты",
  "Start sessions": "Запускать сессии",
  "Fight for archives": "Сражаться за архивы",
  "Create profile": "Создать профиль",
  "Register your commander identity and prepare for deployment.":
    "Зарегистрируйте личность командира и подготовьтесь к развёртыванию.",
  Email: "Электронная почта",
  Nickname: "Никнейм",
  Password: "Пароль",
  "Repeat password": "Повторите пароль",
  "Your commander name": "Имя вашего командира",
  "Create password": "Создайте пароль",
  "Create commander": "Создать командира",
  "Creating...": "Создание...",
  "Already have access?": "Уже есть доступ?",
  "Return to login": "Вернуться ко входу",
  "Use Latin letters, numbers or underscore. Spaces are not allowed.":
    "Используйте латинские буквы, цифры или подчёркивание. Пробелы запрещены.",
  "Email is required.": "Укажите электронную почту.",
  "Nickname is required.": "Укажите никнейм.",
  "Nickname may contain only Latin letters, numbers and underscore. Spaces are not allowed.":
    "Никнейм может содержать только латинские буквы, цифры и подчёркивание. Пробелы запрещены.",
  "Password must contain at least 8 characters.":
    "Пароль должен содержать не менее 8 символов.",
  "Repeat password is required.": "Повторите пароль.",
  "Passwords do not match.": "Пароли не совпадают.",
  "Email is invalid or already registered.":
    "Некорректная почта или такой адрес уже зарегистрирован.",
  "Nickname is invalid or already registered.":
    "Некорректный никнейм или он уже занят.",
  "Password is invalid.": "Некорректный пароль.",
  "Registration failed. Check fields or try another nickname/email.":
    "Регистрация не удалась. Проверьте поля или используйте другой никнейм/адрес.",

  "Welcome back, commander.": "С возвращением, командир.",
  "Enter your credentials to access the ARCHONT command layer.":
    "Введите учётные данные для доступа к командному слою ARCHONT.",
  "Email or nickname": "Почта или никнейм",
  "Enter password": "Введите пароль",
  Login: "Войти",
  "Logging in...": "Вход...",
  "No account yet?": "Ещё нет аккаунта?",
  "Create one": "Создать аккаунт",
  "Invalid credentials": "Неверные учётные данные",
  "Login failed": "Не удалось войти",

  "Search, filter, inspect players, and finish active sessions.":
    "Ищите и фильтруйте сессии, просматривайте игроков и завершайте активные партии.",
  Refresh: "Обновить",
  "Loading...": "Загрузка...",
  "Search by session ID": "Поиск по ID сессии",
  "Session ID": "ID сессии",
  "All statuses": "Все статусы",
  Created: "Создана",
  Started: "Запущена",
  Finished: "Завершена",
  created: "создана",
  started: "запущена",
  finished: "завершена",
  "No sessions found.": "Сессии не найдены.",
  "Open setup": "Открыть настройку",
  "Open game": "Открыть игру",
  Finish: "Завершить",
  Players: "Игроки",
  Status: "Статус",
  Round: "Раунд",
  Map: "Карта",

  "Session setup": "Настройка сессии",
  "Add players, choose civilizations, assign starting systems, then start the game.":
    "Добавьте игроков, выберите цивилизации, назначьте стартовые системы и начните игру.",
  "Session name": "Название сессии",
  "Enter Session's name": "Введите название сессии",
  "Saving session name...": "Сохранение названия...",
  "Cancel setup": "Отменить настройку",
  "This session has already been started or finished.":
    "Эта сессия уже запущена или завершена.",
  "Players in this session": "Игроки в сессии",
  "No players added yet.": "Игроки ещё не добавлены.",
  Player: "Игрок",
  Civilization: "Цивилизация",
  "Start system": "Стартовая система",
  "Not selected": "Не выбрано",
  "Remove player": "Удалить игрока",
  "Available users": "Доступные пользователи",
  "No available users.": "Нет доступных пользователей.",
  "Faction name": "Название фракции",
  "Choose civilization": "Выберите цивилизацию",
  "Choose start system": "Выберите стартовую систему",
  "Add player": "Добавить игрока",
  Occupied: "Занято",
  "Starting resources": "Стартовые ресурсы",
  Ability: "Способность",
  "Remove this player from session?": "Удалить этого игрока из сессии?",
  "Cancel setup and delete this created session?":
    "Отменить настройку и удалить созданную сессию?",

  "Profile and account": "Профиль и аккаунт",
  "Account information": "Данные аккаунта",
  "Update nickname": "Изменить никнейм",
  "Current password": "Текущий пароль",
  "New password": "Новый пароль",
  "Confirm new password": "Подтвердите новый пароль",
  "Update password": "Изменить пароль",
  Save: "Сохранить",
  "Saving...": "Сохранение...",

  "Map Editor": "Редактор карт",
  "Create map": "Создать карту",
  "Save map": "Сохранить карту",
  "Save as new": "Сохранить как новую",
  "Delete map": "Удалить карту",
  "Map name": "Название карты",
  "Players count": "Количество игроков",
  "Grid width": "Ширина сетки",
  "Grid height": "Высота сетки",
  Systems: "Системы",
  Connections: "Соединения",
  "Normal system": "Обычная система",
  "Archive system": "Архивная система",
  "Archive level": "Уровень архива",
  "Mineral slots": "Слоты шахт",
  "Energy slots": "Слоты энергоблоков",
  "Storage slots": "Слоты складов",
  "Research center slots": "Слоты исследовательских центров",
  "Safe corridor": "Безопасный коридор",
  "Dangerous corridor": "Опасный коридор",
  "Wraparound corridor": "Переход через край карты",
  Private: "Приватная",
  Public: "Публичная",
  Official: "Официальная",
  Load: "Загрузить",
  Delete: "Удалить",

  ARCHONT: "ARCHONT",
  "Tabletop command interface": "Командный интерфейс настольной игры",
  "Lead a civilization through the ruins of a fractured galaxy.":
    "Проведите цивилизацию сквозь руины расколотой галактики.",
  "Synchronize board": "Синхронизировать поле",
  "Game status": "Статус игры",
  "Operational cycle": "Игровой цикл",
  "Controlled systems": "Контролируемые системы",
  "Active commander": "Активный командир",
  "Command points": "Командные очки",
  "End turn · 1 CP": "Завершить ход · 1 КО",
  "Pass round": "Пас до конца раунда",
  ACTIVE: "АКТИВЕН",
  STANDBY: "ОЖИДАЕТ",
  PASSED: "ПАС",
  Structures: "Постройки",
  Fleets: "Флоты",
  Ready: "Готов",
  Activated: "Активирован",
  Defensive: "Оборона",
  "Galactic map": "Галактическая карта",
  "Galactic corridor network": "Сеть галактических коридоров",
  "Your control": "Ваш контроль",
  "Rival control": "Контроль соперника",
  Uncharted: "Неизведано",
  "YOUR CONTROL": "ВАШ КОНТРОЛЬ",
  "RIVAL CONTROL": "КОНТРОЛЬ СОПЕРНИКА",
  UNCHARTED: "НЕИЗВЕДАНО",
  "Unknown owner": "Неизвестный владелец",
  Construction: "Строительство",
  "Acting player": "Действующий игрок",
  "Select system": "Выберите систему",
  "Select a controlled system.": "Выберите контролируемую систему.",
  "Build · 1 CP": "Построить · 1 КО",
  Mine: "Шахта",
  "Power Plant": "Энергоблок",
  "Energy Plant": "Энергоблок",
  "Supply Depot": "Склад снабжения",
  "Research Center": "Исследовательский центр",
  Barracks: "Казармы",
  Spaceport: "Космопорт",
  "Orbital Defense": "Орбитальная оборона",
  Colony: "Колония",
  "Basic matter production building.": "Базовая постройка для добычи материи.",
  "Basic energy production building.":
    "Базовая постройка для производства энергии.",
  "Alternative energy production building.":
    "Альтернативная постройка для производства энергии.",
  "Supply building. Up to 2 Supply Depots can be built in one system.":
    "Постройка снабжения. В одной системе можно построить до двух складов снабжения.",
  "Allows research actions and technology progression.":
    "Открывает исследовательские действия и развитие технологий.",
  "Light-unit and Ark production building.":
    "Производит лёгкие юниты и Ковчеги.",
  "Orbital production building for medium and heavy fleet units.":
    "Орбитальная верфь для средних и тяжёлых кораблей.",
  "Defensive orbital structure.": "Оборонительная орбитальная постройка.",
  "A deployed colony makes the system colonized. It has no HP.":
    "Развёрнутая колония делает систему колонизированной и не имеет очков здоровья.",
  "Produces light units / Ark": "Производит лёгкие юниты / Ковчег",
  "Produces medium / heavy units": "Производит средние / тяжёлые корабли",

  Buildings: "Здания",
  "Infrastructure command": "Управление инфраструктурой",
  "Buildings across your systems": "Здания в ваших системах",
  "Review existing infrastructure, select a controlled system and construct a new building.":
    "Просматривайте существующую инфраструктуру, выбирайте подконтрольную систему и стройте новые здания.",
  "No structures built in this system yet.":
    "В этой системе пока нет построек.",
  "Fleet registry": "Реестр флотов",
  "Fleet slots and active formations": "Слоты флотов и активные формирования",
  "Select a fleet slot to inspect its units and prepare coordinated orders.":
    "Выберите слот флота, чтобы просмотреть его юниты и подготовить согласованные приказы.",
  "Empty fleet slot": "Пустой слот флота",
  "Produce a unit in a controlled system to activate this slot.":
    "Произведите юнит в подконтрольной системе, чтобы активировать этот слот.",
  "Territory command": "Управление территориями",
  "Systems under your control": "Системы под вашим контролем",
  "Select a system to review its capacity, infrastructure, fleets and units.":
    "Выберите систему, чтобы просмотреть её ограничения, инфраструктуру, флоты и юниты.",
  "The active player does not control any systems.":
    "Активный игрок не контролирует ни одной системы.",
  "CONTROLLED SYSTEM": "ПОДКОНТРОЛЬНАЯ СИСТЕМА",
  "Player command sections": "Разделы командования игрока",
  "No direct income": "Нет прямого дохода",

  "Fleet command": "Командование флотами",
  "Issue coordinated orders": "Отдайте согласованные приказы",
  "Prepared orders": "Подготовленные приказы",
  "No ready fleets are available for this command.":
    "Для этой команды нет готовых флотов.",
  "Your fleets": "Ваши флоты",
  "Rival fleets": "Флоты соперника",
  "Move → Move": "Движение → Движение",
  "Move → Defensive Position": "Движение → Оборонительная позиция",
  "Move → Transfer": "Движение → Передача",
  "Defensive position": "Оборонительная позиция",
  "Selected path": "Выбранный маршрут",
  "Select at least one unit to transfer.":
    "Выберите хотя бы один юнит для передачи.",
  "Choose the partner fleet": "Выберите флот-партнёр",
  "Arriving fleet": "Прибывающий флот",
  "Receiving fleet": "Принимающий флот",
  "RECEIVING FLEET": "ПРИНИМАЮЩИЙ ФЛОТ",
  "TRANSFER PHASE": "ФАЗА ПЕРЕДАЧИ",
  Exchange: "Обмен",
  "After transfer": "После передачи",
  "Click unit cards to change side":
    "Нажимайте на карточки юнитов, чтобы менять сторону",
  "1 movement remains after transfer":
    "После передачи остаётся одно перемещение",
  "Hold position": "Остаться на месте",
  "Do not use the remaining move": "Не использовать оставшееся перемещение",
  "Execute Fleet Command · 1 CP": "Выполнить команду флотов · 1 КО",
  "Executing command...": "Выполнение команды...",
  "Command report": "Отчёт команды",
  "Danger cards resolved": "Карты опасности разыграны",
  "Fleet destroyed": "Флот уничтожен",

  "Buildings & Colonies": "Постройки и колонии",
  "Building capacity": "Ограничения строительства",
  "Built structures compared with this system's available resource slots.":
    "Количество построек относительно доступных ресурсных слотов этой системы.",
  Mines: "Шахты",
  "Power Plants": "Энергоблоки",
  "Supply Depots": "Склады снабжения",
  "Research Centers": "Исследовательские центры",
  Unavailable: "Недоступно",
  "PER ROUND": "ЗА РАУНД",
  "NO DIRECT INCOME": "НЕТ ПРЯМОГО ДОХОДА",
  "Can produce:": "Может производить:",
  "Technologies:": "Технологии:",
  "Nothing yet": "Пока ничего",
  "No technologies yet": "Технологий пока нет",
  Production: "Производство",
  "Scout Drone": "Разведывательный дрон",
  "Marine Squad": "Отряд морской пехоты",
  Ark: "Ковчег",
  Frigate: "Фрегат",
  Cruiser: "Крейсер",
  "Pack into Ark · 1 CP · 3 ⚡": "Упаковать в Ковчег · 1 КО · 3 ⚡",
  "Colonize System · 1 CP · 3 ⚡": "Колонизировать систему · 1 КО · 3 ⚡",
  Units: "Юниты",
  "Deployed assets": "Развёрнутые силы",
  "Fleets in system": "Флоты в системе",
  "No buildings or colonies.": "В системе нет построек и колоний.",
  "No active player": "Нет активного игрока",
  "No active player selected.": "Активный игрок не выбран.",
  "No current player is active.": "Сейчас нет активного игрока.",
  "The current player has no command points left.":
    "У текущего игрока не осталось командных очков.",
  "You can build only in the current player's systems.":
    "Строить можно только в системах текущего игрока.",
  "Only the current player can control this colony.":
    "Только текущий игрок может управлять этой колонией.",
  "Only the current player can control this ark.":
    "Только текущий игрок может управлять этим Ковчегом.",
  "Only the current player can use this production building.":
    "Только текущий игрок может использовать эту производственную постройку.",
  "Player cannot pack the last Colony into Ark.":
    "Нельзя упаковать последнюю колонию игрока в Ковчег.",
  "Failed to load game": "Не удалось загрузить игру",
  "Failed to build building": "Не удалось построить здание",
  "Failed to produce unit": "Не удалось произвести юнит",
  "Failed to issue fleet command": "Не удалось выполнить команду флотов",
  "Failed to end turn": "Не удалось завершить ход",
  "Failed to pass": "Не удалось сделать пас",
  "Failed to colonize system": "Не удалось колонизировать систему",
  "Failed to pack colony into ark": "Не удалось упаковать колонию в Ковчег",
  "Invalid session ID": "Некорректный ID сессии",

  "ARCHONT development log": "Журнал разработки ARCHONT",
  "A public chronological record of gameplay decisions, system changes, development milestones and design direction.":
    "Публичная хронология игровых решений, изменений систем, этапов разработки и развития проекта.",
  "Game design": "Геймдизайн",
  Backend: "Бэкенд",
  Frontend: "Фронтенд",
  System: "Система",
  Balance: "Баланс",

  "Zero Star Cult": "Культ Нулевой Звезды",
  "Heliophage Dominion": "Доминион Гелиофагов",
  "Ash Orbit Syndicate": "Синдикат Пепельной Орбиты",
  "Rift Archivists": "Архивисты Разлома",

  "Transfer → Move": "Передача → Перемещение",
  "Movement destination": "Система назначения",
  "Exchange units before movement": "Обменяйте юниты перед перемещением",
  "Choose which fleet continues after the exchange.":
    "Выберите, какой флот продолжит движение после обмена.",
  "CONTINUING FLEET": "ПРОДОЛЖАЮЩИЙ ФЛОТ",
  "Choose the fleet that moves after the exchange":
    "Выберите флот, который переместится после обмена",
  "Both fleets become activated. Only the selected fleet moves and resolves corridor danger.":
    "Оба флота активируются. Только выбранный флот перемещается и разыгрывает опасности коридора.",
  "Select a ready friendly fleet in the same system.":
    "Выберите готовый дружественный флот в той же системе.",
  "The fleet selected to continue movement must contain at least one unit after transfer.":
    "После передачи в продолжающем движение флоте должен остаться хотя бы один юнит.",

  "Split → Move": "Разделение → Перемещение",
  "SPLIT PHASE": "ФАЗА РАЗДЕЛЕНИЯ",
  "Create one new fleet": "Создать один новый флот",
  "Move one or more units into one free fleet slot. At least one unit must remain in the source fleet. Both fleets may then move once or hold position.":
    "Переместите один или несколько юнитов в один свободный слот флота. В исходном флоте должен остаться хотя бы один юнит. После этого оба флота могут переместиться один раз или остаться на месте.",
  "SOURCE FLEET": "ИСХОДНЫЙ ФЛОТ",
  "NEW FLEET SLOT": "НОВЫЙ СЛОТ ФЛОТА",
  "No free slot": "Нет свободного слота",
  "All four fleet slots are already occupied or reserved by prepared split orders.":
    "Все четыре слота флотов уже заняты или зарезервированы подготовленными приказами разделения.",
  "The selected fleet needs at least 2 units to split.":
    "Для разделения в выбранном флоте должно быть минимум 2 юнита.",
  "NEW FLEET →": "→ НОВЫЙ ФЛОТ",
  "Source fleet movement": "Перемещение исходного флота",
  "Select one connected system or keep the fleet in place.":
    "Выберите одну связанную систему или оставьте флот на месте.",
  "No danger cards": "Без карт опасности",
  "New fleet": "Новый флот",
  "New fleet movement": "Перемещение нового флота",
  "The new fleet may take a different route from the source fleet.":
    "Новый флот может выбрать маршрут, отличный от маршрута исходного флота.",
  "Split result": "Результат разделения",
  "Split resolved": "Разделение выполнено",
  "A resulting fleet was destroyed while resolving corridor danger.":
    "Один из образовавшихся флотов был уничтожен при розыгрыше опасности коридора.",
  "No free fleet slot is available for Split → Move.":
    "Для приказа «Разделение → Перемещение» нет свободного слота флота.",
  "Split → Move requires at least 2 units.":
    "Для приказа «Разделение → Перемещение» требуется минимум 2 юнита.",
  "Move at least one unit to the new fleet and leave at least one unit in the source fleet.":
    "Переместите хотя бы один юнит в новый флот и оставьте хотя бы один юнит в исходном флоте.",
  "Every split unit must belong to the selected fleet.":
    "Все отделяемые юниты должны принадлежать выбранному флоту.",
  "The source fleet movement must use a connected corridor.":
    "Исходный флот должен перемещаться по связанному коридору.",
  "The new fleet movement must use a connected corridor.":
    "Новый флот должен перемещаться по связанному коридору.",

  "Enemy fleet": "Вражеский флот",
  "Defensive ambush": "Оборонительная засада",
  "Defensive ambush: the attacker draws 1 additional danger card before combat.":
    "Оборонительная засада: перед боем атакующий разыгрывает 1 дополнительную карту опасности.",
  "Hold current system": "Остаться в текущей системе",
  "Hold and prepare defensive ambush":
    "Остаться на месте и подготовить оборонительную засаду",
  "Select an enemy fleet in the attack destination.":
    "Выберите вражеский флот в системе атаки.",
  "The selected enemy fleet is already targeted by another prepared attack.":
    "Выбранный вражеский флот уже является целью другой подготовленной атаки.",
  "COMBAT RESULT": "РЕЗУЛЬТАТ БОЯ",
  "ATTACKER VICTORY": "ПОБЕДА АТАКУЮЩЕГО",
  "DEFENDER VICTORY": "ПОБЕДА ЗАЩИТНИКА",
  "MUTUAL DESTRUCTION": "ВЗАИМНОЕ УНИЧТОЖЕНИЕ",
  "STALEMATE": "ПАТОВАЯ СИТУАЦИЯ",
  "ATTACKER DESTROYED IN TRANSIT": "АТАКУЮЩИЙ УНИЧТОЖЕН В ПУТИ",
  "ATTACKER DESTROYED BY AMBUSH": "АТАКУЮЩИЙ УНИЧТОЖЕН ЗАСАДОЙ",
  "The defender consumed its defensive position and the attacker drew 1 danger card.":
    "Защитник использовал оборонительную позицию, а атакующий разыграл 1 карту опасности.",
  "Game logs": "Игровой журнал",
  "ACTION CONFIRMATION": "ПОДТВЕРЖДЕНИЕ ДЕЙСТВИЯ",
  "Resolve fleet command?": "Выполнить команду флотов?",
  "Review every movement, expected danger card and attack target before the command is committed.":
    "Проверьте все перемещения, ожидаемые карты опасности и цели атаки перед выполнением команды.",
  "Danger cards": "Карты опасности",
  "Dismiss": "Отмена",
  "Confirm · 1 CP": "Подтвердить · 1 КО",
  "COMMAND LOCKED": "КОМАНДА ПРИНЯТА",
  "Resolving movement...": "Разрешение перемещения...",
  "The board is calculating corridor hazards and combat.":
    "Поле рассчитывает опасности коридоров и результат боя.",
  "BATTLE RESOLUTION": "РАЗРЕШЕНИЕ БОЯ",
  "DANGER CARD": "КАРТА ОПАСНОСТИ",
  "RESULT": "РЕЗУЛЬТАТ",
  "COMMAND RESOLVED": "КОМАНДА ВЫПОЛНЕНА",
  "Resolution complete": "Разрешение завершено",
  "All corridor hazards and combat results have been applied. Continue when the next player is ready to receive the board.":
    "Все опасности коридоров и результаты боя применены. Продолжайте, когда следующий игрок будет готов принять игровое поле.",
  "OK · Pass to next player": "ОК · Передать следующему игроку",
  "MOVEMENT RESOLUTION": "РАЗРЕШЕНИЕ ПЕРЕМЕЩЕНИЯ",
  "Combat encounter": "Боевое столкновение",
  "Drawing danger cards": "Розыгрыш карт опасности",
  "Cards remaining": "Осталось карт",
  "Awaiting reveal": "Ожидает вскрытия",
  "No danger cards were drawn": "Карты опасности не разыгрываются",
  "The attack route was safe. Proceeding to combat.":
    "Маршрут атаки безопасен. Переходим к бою.",
  "All corridor hazards are resolved. The battle result is now revealed.":
    "Все опасности коридоров разрешены. Теперь раскрывается результат боя.",
  "Review every movement, revealed danger card, unit loss and combat round before passing the board to the next player.":
    "Просмотрите все перемещения, вскрытые карты опасности, потери юнитов и боевые раунды перед передачей поля следующему игроку.",
  "Safe passage": "Безопасный проход",
  "No gameplay effect": "Без игрового эффекта",
  "Energy lost": "Потеря энергии",
  "Supply lost": "Потеря снабжения",
  "SPLIT RESULT": "РЕЗУЛЬТАТ РАЗДЕЛЕНИЯ",
  "TRANSFER RESULT": "РЕЗУЛЬТАТ ПЕРЕДАЧИ",
  "Sent": "Передано",
  "Received": "Получено",
  "None": "Нет",

  "Retreat destination": "Система отступления",
  "Combat target": "Цель боя",
  "Combat engagement": "Боевое столкновение",
  "One simultaneous combat exchange. Surviving fleets remain in the system.":
    "Один одновременный обмен уроном. Выжившие флоты остаются в системе.",
  "No corridor movement": "Без перемещения по коридору",
  "One simultaneous exchange": "Один одновременный обмен уроном",
  "Continue combat": "Продолжить бой",
  "DANGER SUMMARY": "ИТОГ КАРТ ОПАСНОСТИ",
  "Total danger-card effect": "Суммарный эффект карт опасности",
  Cards: "Карты",
  "Fleet HP lost": "Потеряно ОЗ флота",
  "ENG lost": "Потеряно ENG",
  "SUP lost": "Потеряно SUP",
  "Destroyed by danger": "Уничтожены картами опасности",
  "No units were destroyed by danger cards.":
    "Карты опасности не уничтожили ни одного юнита.",
  "Retreat completed": "Отступление завершено",
  "Retreat failed": "Отступление не удалось",
  "Corridor cards": "Карты коридора",
  "Pursuit cards": "Карты преследования",
  "Engagement Continues": "Бой продолжается",
  "Damage dealt": "Нанесено урона",
  "Enemy units lost": "Потери противника",
  "Own units lost": "Собственные потери",
  "Both fleets survived and remain engaged. On a later action choose Continue Combat or Retreat.":
    "Оба флота выжили и остаются в боевом контакте. В следующее доступное действие выберите продолжение боя или отступление.",
  "Fleet destroyed during resolution.": "Флот уничтожен во время разрешения действия.",
  "Review the final danger-card totals, fleet damage and combat outcome before passing the board to the next player.":
    "Просмотрите итог карт опасности, урон флотам и результат боя перед передачей хода следующему игроку.",
  "Select an enemy fleet in the current system.":
    "Выберите вражеский флот в текущей системе.",

  // HUD v1.5 — compact gameplay workspaces
  Infrastructure: "Инфраструктура",
  Build: "Строительство",
  Technologies: "Технологии",
  "Selected system": "Выбранная система",
  "Available buildings": "Доступные здания",
  "Select one blueprint": "Выберите здание",
  "Selected building": "Выбранное здание",
  "Selected technology": "Выбранная технология",
  "Ready to construct.": "Можно строить.",
  "Ready to research.": "Можно исследовать.",
  "Already researched.": "Уже исследовано.",
  "Research · 1 CP": "Исследовать · 1 КО",
  "Researching…": "Исследование…",
  "No technologies available.": "Нет доступных технологий.",
  "No production available": "Нет доступного производства",
  "Build Barracks or Spaceport in this system, or select another controlled system.":
    "Постройте Казармы или Космопорт в этой системе либо выберите другую подконтрольную систему.",
  "Fleet slots": "Слоты флотов",
  "Select a ready fleet to prepare an order.": "Выберите готовый флот и подготовьте приказ.",
  "Select a ready fleet": "Выберите готовый флот",
  "Movement, defense, transfer and attack": "Движение, оборона, передача и атака",
  "COMMAND FLEET": "ОТДАТЬ ПРИКАЗ",
  "Prepare orders": "Подготовка приказов",
  "Choose a fleet, order and destination. The whole command package costs 1 CP.":
    "Выберите флот, приказ и цель. Весь пакет приказов стоит 1 КО.",
  Fleet: "Флот",
  Order: "Приказ",
  "First movement": "Первое перемещение",
  "Continue Combat": "Продолжить бой",
  Retreat: "Отступить",
  "Defensive Position": "Оборонительная позиция",
  "Move → Attack": "Движение → Атака",
  Clear: "Очистить",
  "Add at least one fleet order. The full package costs 1 CP.":
    "Добавьте хотя бы один приказ. Весь пакет стоит 1 КО.",
  "COMMAND": "КОМАНДА",
  "SLOT 1": "СЛОТ 1",
  "SLOT 2": "СЛОТ 2",
  "SLOT 3": "СЛОТ 3",
  "SLOT 4": "СЛОТ 4",
  "Choose a building to construct": "Выберите здание для строительства",
  "Built here": "Построено в системе",
  "No buildings yet.": "Зданий пока нет.",
  "Production in": "Производство в системе",
  "Only production structures in this system are shown.": "Показаны только производственные здания выбранной системы.",
  "Production structures": "Производственные здания",
  "No production structures here.": "В этой системе нет производственных зданий.",
  "Available actions": "Доступные действия",
  "Each action costs 1 CP": "Каждое действие стоит 1 КО",
  Produce: "Произвести",
  Pack: "Упаковать",
  "Pack into Ark": "Упаковать в Ковчег",
  "Convert this Colony into a mobile Ark.": "Преобразовать Колонию в мобильный Ковчег.",

  Combat: "Бой",
  Archive: "Архив",
  Logistics: "Логистика",
  "Reinforced Marine Armor": "Усиленная броня пехоты",
  "Marine squads gain +1 max HP in future combat calculations.":
    "Отряды морской пехоты получают +1 к максимальным ОЗ в последующих боях.",
  "Frigate Targeting Protocol": "Протокол наведения фрегатов",
  "Frigates gain +1 attack in future combat calculations.":
    "Фрегаты получают +1 к атаке в последующих боях.",
  "Archive Decoding": "Декодирование архивов",
  "Archive research actions will cost -1 Energy once archive research is implemented.":
    "Исследование архивов будет стоить на 1 Энергию меньше.",
  "Supply Chain Stabilizers": "Стабилизаторы снабжения",
  "Future logistics upgrades may reduce retreat and danger-card penalties.":
    "Логистические улучшения снижают штрафы от отступления и карт опасности.",
  "Requires Barracks": "Требуются Казармы",
  "Requires Barracks.": "Требуются Казармы.",
  "Requires Spaceport": "Требуется Космопорт",
  "Requires Spaceport.": "Требуется Космопорт.",
  "Requires Research Center": "Требуется Исследовательский центр",
  "Requires Research Center.": "Требуется Исследовательский центр.",
  "Requires Supply Depot": "Требуется Склад снабжения",
  "Requires Supply Depot.": "Требуется Склад снабжения.",

};

const UNIT_NAMES: Record<string, string> = {
  Ark: "Ковчег",
  Frigate: "Фрегат",
  Cruiser: "Крейсер",

  "INTERCEPTION AFTER STEP 1": "ПЕРЕХВАТ ПОСЛЕ ШАГА 1",
  "This fleet will fire once without return fire.": "Этот флот один раз откроет огонь без ответного удара.",
  "If your fleet survives, it remains in the first destination and the second movement is lost.": "Если ваш флот выживет, он останется в первой системе, а второе перемещение будет потеряно.",
  "Movement ends in this system and the second move is lost.": "Перемещение заканчивается в этой системе, а второй шаг теряется.",
  "HOSTILE ARRIVAL · STEP 1": "ВХОД ВО ВРАЖЕСКУЮ СИСТЕМУ · ШАГ 1",
  "HOSTILE ARRIVAL · STEP 2": "ВХОД ВО ВРАЖЕСКУЮ СИСТЕМУ · ШАГ 2",
};

function applyPatterns(value: string): string {
  let match = value.match(/^Round\s+(\d+)$/i);
  if (match) return `Раунд ${match[1]}`;

  match = value.match(/^Session ID:\s*(.+)$/i);
  if (match) return `ID сессии: ${match[1]}`;

  match = value.match(/^Map ID:\s*(.+)$/i);
  if (match) return `ID карты: ${match[1]}`;

  match = value.match(/^Players:\s*(.+)$/i);
  if (match) return `Игроки: ${match[1]}`;

  match = value.match(/^Status:\s*(.+)$/i);
  if (match) return `Статус: ${match[1]}`;

  match = value.match(/^Round:\s*(.+)$/i);
  if (match) return `Раунд: ${match[1]}`;

  match = value.match(/^CP:\s*(\d+)\/(\d+)$/i);
  if (match) return `КО: ${match[1]}/${match[2]}`;

  match = value.match(/^Fleet\s+(\d+)$/i);
  if (match) return `Флот ${match[1]}`;

  match = value.match(/^(.+)\s+·\s+Neutral$/i);
  if (match) return `${match[1]} · Нейтральная`;

  match = value.match(/^Produce\s+(.+)\s+·\s+1 CP$/i);
  if (match) {
    const originalUnitName = match[1].trim();
    const unitName = UNIT_NAMES[originalUnitName] ?? originalUnitName;
    return `Произвести: ${unitName} · 1 КО`;
  }

  match = value.match(/^Finish session #(\d+)\?$/i);
  if (match) return `Завершить сессию #${match[1]}?`;

  match = value.match(/^User\s+(\d+)$/i);
  if (match) return `Пользователь ${match[1]}`;

  match = value.match(/^Need\s+(\d+),\s+have\s+(\d+)$/i);
  if (match) return `Нужно ${match[1]}, доступно ${match[2]}`;

  match = value.match(/^(\d+)\s+controlled$/i);
  if (match) return `${match[1]} под контролем`;

  match = value.match(/^(\d+)\s+constructed$/i);
  if (match) return `${match[1]} построено`;

  match = value.match(/^(\d+)\/4\s+active slots$/i);
  if (match) return `${match[1]}/4 активных слота`;

  match = value.match(/^(\d+)\s+structures$/i);
  if (match) return `${match[1]} построек`;

  match = value.match(/^SLOT\s+(\d+)$/i);
  if (match) return `СЛОТ ${match[1]}`;

  match = value.match(/^(\d+)\/5 units after transfer$/i);
  if (match) return `${match[1]}/5 юнитов после передачи`;

  match = value.match(/^(.+) continues movement to (.+)$/i);
  if (match) return `${match[1]} продолжает движение в ${match[2]}`;

  match = value.match(/^(.+) continued movement and finished in (.+)\.$/i);
  if (match) return `${match[1]} продолжил движение и завершил его в системе ${match[2]}.`;

  match = value.match(/^Split (\d+) unit(s)?$/i);
  if (match) return `Отделить юнитов: ${match[1]}`;

  match = value.match(/^Created Fleet (\d+)$/i);
  if (match) return `Создан Флот ${match[1]}`;

  match = value.match(/^Detached:\s*(.+)$/i);
  if (match) return `Отделены: ${match[1]}`;

  match = value.match(/^Source:\s*(.+)$/i);
  if (match) return `Исходный флот: ${match[1]}`;

  match = value.match(/^New fleet:\s*(.+)$/i);
  if (match) return `Новый флот: ${match[1]}`;

  match = value.match(/^(.+): held position$/i);
  if (match) return `${match[1]}: остался на месте`;

  match = value.match(/^(.+): moved to (.+)$/i);
  if (match) return `${match[1]}: переместился в ${match[2]}`;


  match = value.match(/^Attack target:\s*(.+)$/i);
  if (match) return `Цель атаки: ${match[1]}`;

  match = value.match(/^Combat target:\s*(.+)$/i);
  if (match) return `Цель боя: ${match[1]}`;

  match = value.match(/^Pursued by (.+): (\d+) vs (\d+) units\.$/i);
  if (match) return `Преследование флотом ${match[1]}: ${match[2]} против ${match[3]} юнитов.`;

  match = value.match(/^Corridor cards: (\d+) · Pursuit cards: (\d+)$/i);
  if (match) return `Карты коридора: ${match[1]} · Карты преследования: ${match[2]}`;

  match = value.match(/^Own losses: (.+)$/i);
  if (match) return `Собственные потери: ${match[1]}`;

  match = value.match(/^Enemy losses: (.+)$/i);
  if (match) return `Потери противника: ${match[1]}`;

  match = value.match(/^Fleet finished in (.+)\.$/i);
  if (match) return `Флот завершил действие в системе ${match[1]}.`;

  match = value.match(/^Pursuit: (.+) · (\d+) additional danger card(?:s)?$/i);
  if (match) return `Преследование: ${match[1]} · дополнительных карт опасности: ${match[2]}`;

  match = value.match(/^Controlled by (.+)$/i);
  if (match) return `Под контролем: ${match[1]}`;

  match = value.match(/^Engaged with (.+)$/i);
  if (match) return `В боевом контакте с: ${match[1]}`;

  match = value.match(/^Target:\s*(.+)$/i);
  if (match) return `Цель: ${match[1]}`;

  match = value.match(/^Damage:\s*(\d+) to defender · (\d+) to attacker$/i);
  if (match) return `Урон: ${match[1]} защитнику · ${match[2]} атакующему`;

  match = value.match(/^Attacker (\d+) ATK \/ (\d+) DEF · Defender (\d+) ATK \/ (\d+) DEF$/i);
  if (match) {
    return `Атакующий ${match[1]} АТК / ${match[2]} ЗАЩ · Защитник ${match[3]} АТК / ${match[4]} ЗАЩ`;
  }

  match = value.match(/^Attacker retreated to (.+)\.$/i);
  if (match) return `Атакующий отступил в систему ${match[1]}.`;

  match = value.match(/^(.+): (\d+) → (\d+) HP · Destroyed$/i);
  if (match) return `${match[1]}: ${match[2]} → ${match[3]} ОЗ · Уничтожен`;

  match = value.match(/^(.+): (\d+) → (\d+) HP$/i);
  if (match) return `${match[1]}: ${match[2]} → ${match[3]} ОЗ`;


  match = value.match(/^CARD\s+(\d+)$/i);
  if (match) return `КАРТА ${match[1]}`;

  match = value.match(/^Arrived:\s*(.+)$/i);
  if (match) return `Прибыл: ${match[1]}`;

  match = value.match(/^Step\s+(\d+)$/i);
  if (match) return `Шаг ${match[1]}`;

  match = value.match(/^(.+)\. Cards are dealt from the danger deck and resolved from left to right\.$/i);
  if (match) {
    return `${match[1]}. Карты выкладываются из колоды опасности и разрешаются слева направо.`;
  }

  match = value.match(/^Resolution\s+(\d+)\s+\/\s+(\d+)$/i);
  if (match) return `Разрешение ${match[1]} / ${match[2]}`;

  match = value.match(/^(.+)\s+·\s+Source → (.+)\s+·\s+New fleet → (.+)$/i);
  if (match) return `${match[1]} · Исходный флот → ${match[2]} · Новый флот → ${match[3]}`;

  match = value.match(/^(.+)\s+·\s+Partner → (.+)$/i);
  if (match) return `${match[1]} · Партнёр → ${match[2]}`;

  match = value.match(/^Attacker losses:\s*(\d+)\. Defender losses:\s*(\d+)\.(.*)$/i);
  if (match) return `Потери атакующего: ${match[1]}. Потери защитника: ${match[2]}.${match[3]}`;

  match = value.match(/^(\d+) combat rounds resolved\.$/i);
  if (match) return `Разрешено боевых раундов: ${match[1]}.`;

  match = value.match(/^(.+) · Controlled by (.+)$/i);
  if (match) return `${match[1]} · Под контролем ${match[2]}`;

  match = value.match(/^(.+) · (.+) will fire once without return fire\. Estimated damage: (\d+)\.$/i);
  if (match) {
    return `${match[1]} · ${match[2]} нанесёт один удар без ответного огня. Ожидаемый урон: ${match[3]}.`;
  }

  match = value.match(/^(.+) · (.+) fired on (.+)\. The moving fleet did not return fire\.$/i);
  if (match) {
    return `${match[1]} · ${match[2]} открыл огонь по ${match[3]}. Перемещающийся флот не ответил.`;
  }

  match = value.match(/^Damage: (.+)$/i);
  if (match) return `Урон: ${match[1]}`;

  return value;
}

export function translateUiText(value: string, language: AppLanguage): string {
  if (language === "en") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return value;
  }

  const translated = RU_EXACT[trimmed] ?? applyPatterns(trimmed);

  if (translated === trimmed) {
    return value;
  }

  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";

  return `${leading}${translated}${trailing}`;
}