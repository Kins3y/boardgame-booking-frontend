import type { AppLanguage } from "./I18nContext";

const RU_EXACT: Record<string, string> = {
  "Language": "Язык",
  "Back to Login": "Назад ко входу",
  "Back to Home page": "На главную",
  "Home page": "Главная",
  "Welcome": "Добро пожаловать",
  "Profile": "Профиль",
  "Logout": "Выйти",
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
  "Claim your civilization among the stars.": "Займите место своей цивилизации среди звёзд.",
  "Create a profile, enter the strategic layer and prepare for the race to awaken the Archont.":
    "Создайте профиль, войдите в стратегический слой и подготовьтесь к гонке за пробуждение Архонта.",
  "Create maps": "Создавать карты",
  "Start sessions": "Запускать сессии",
  "Fight for archives": "Сражаться за архивы",
  "Create profile": "Создать профиль",
  "Register your commander identity and prepare for deployment.":
    "Зарегистрируйте личность командира и подготовьтесь к развёртыванию.",
  "Email": "Электронная почта",
  "Nickname": "Никнейм",
  "Password": "Пароль",
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
  "Password must contain at least 8 characters.": "Пароль должен содержать не менее 8 символов.",
  "Repeat password is required.": "Повторите пароль.",
  "Passwords do not match.": "Пароли не совпадают.",
  "Email is invalid or already registered.": "Некорректная почта или такой адрес уже зарегистрирован.",
  "Nickname is invalid or already registered.": "Некорректный никнейм или он уже занят.",
  "Password is invalid.": "Некорректный пароль.",
  "Registration failed. Check fields or try another nickname/email.":
    "Регистрация не удалась. Проверьте поля или используйте другой никнейм/адрес.",

  "Welcome back, commander.": "С возвращением, командир.",
  "Enter your credentials to access the ARCHONT command layer.":
    "Введите учётные данные для доступа к командному слою ARCHONT.",
  "Email or nickname": "Почта или никнейм",
  "Enter password": "Введите пароль",
  "Login": "Войти",
  "Logging in...": "Вход...",
  "No account yet?": "Ещё нет аккаунта?",
  "Create one": "Создать аккаунт",
  "Invalid credentials": "Неверные учётные данные",
  "Login failed": "Не удалось войти",

  "Search, filter, inspect players, and finish active sessions.":
    "Ищите и фильтруйте сессии, просматривайте игроков и завершайте активные партии.",
  "Refresh": "Обновить",
  "Loading...": "Загрузка...",
  "Search by session ID": "Поиск по ID сессии",
  "Session ID": "ID сессии",
  "All statuses": "Все статусы",
  "Created": "Создана",
  "Started": "Запущена",
  "Finished": "Завершена",
  "created": "создана",
  "started": "запущена",
  "finished": "завершена",
  "No sessions found.": "Сессии не найдены.",
  "Open setup": "Открыть настройку",
  "Open game": "Открыть игру",
  "Finish": "Завершить",
  "Players": "Игроки",
  "Status": "Статус",
  "Round": "Раунд",
  "Map": "Карта",

  "Session setup": "Настройка сессии",
  "Add players, choose civilizations, assign starting systems, then start the game.":
    "Добавьте игроков, выберите цивилизации, назначьте стартовые системы и начните игру.",
  "Session name": "Название сессии",
  "Enter Session's name": "Введите название сессии",
  "Saving session name...": "Сохранение названия...",
  "Cancel setup": "Отменить настройку",
  "This session has already been started or finished.": "Эта сессия уже запущена или завершена.",
  "Players in this session": "Игроки в сессии",
  "No players added yet.": "Игроки ещё не добавлены.",
  "Player": "Игрок",
  "Civilization": "Цивилизация",
  "Start system": "Стартовая система",
  "Not selected": "Не выбрано",
  "Remove player": "Удалить игрока",
  "Available users": "Доступные пользователи",
  "No available users.": "Нет доступных пользователей.",
  "Faction name": "Название фракции",
  "Choose civilization": "Выберите цивилизацию",
  "Choose start system": "Выберите стартовую систему",
  "Add player": "Добавить игрока",
  "Occupied": "Занято",
  "Starting resources": "Стартовые ресурсы",
  "Ability": "Способность",
  "Remove this player from session?": "Удалить этого игрока из сессии?",
  "Cancel setup and delete this created session?": "Отменить настройку и удалить созданную сессию?",

  "Profile and account": "Профиль и аккаунт",
  "Account information": "Данные аккаунта",
  "Update nickname": "Изменить никнейм",
  "Current password": "Текущий пароль",
  "New password": "Новый пароль",
  "Confirm new password": "Подтвердите новый пароль",
  "Update password": "Изменить пароль",
  "Save": "Сохранить",
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
  "Systems": "Системы",
  "Connections": "Соединения",
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
  "Private": "Приватная",
  "Public": "Публичная",
  "Official": "Официальная",
  "Load": "Загрузить",
  "Delete": "Удалить",

  "ARCHONT": "ARCHONT",
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
  "ACTIVE": "АКТИВЕН",
  "STANDBY": "ОЖИДАЕТ",
  "PASSED": "ПАС",
  "Structures": "Постройки",
  "Fleets": "Флоты",
  "Ready": "Готов",
  "Activated": "Активирован",
  "Defensive": "Оборона",
  "Galactic map": "Галактическая карта",
  "Galactic corridor network": "Сеть галактических коридоров",
  "Your control": "Ваш контроль",
  "Rival control": "Контроль соперника",
  "Uncharted": "Неизведано",
  "YOUR CONTROL": "ВАШ КОНТРОЛЬ",
  "RIVAL CONTROL": "КОНТРОЛЬ СОПЕРНИКА",
  "UNCHARTED": "НЕИЗВЕДАНО",
  "Neutral system": "Нейтральная система",
  "Unknown owner": "Неизвестный владелец",
  "Construction": "Строительство",
  "Acting player": "Действующий игрок",
  "Select system": "Выберите систему",
  "Select a controlled system.": "Выберите контролируемую систему.",
  "Build · 1 CP": "Построить · 1 КО",
  "Mine": "Шахта",
  "Power Plant": "Энергоблок",
  "Energy Plant": "Энергоблок",
  "Supply Depot": "Склад снабжения",
  "Research Center": "Исследовательский центр",
  "Barracks": "Казармы",
  "Spaceport": "Космопорт",
  "Orbital Defense": "Орбитальная оборона",
  "Colony": "Колония",
  "Basic matter production building.": "Базовая постройка для добычи материи.",
  "Basic energy production building.": "Базовая постройка для производства энергии.",
  "Alternative energy production building.": "Альтернативная постройка для производства энергии.",
  "Supply building. Up to 2 Supply Depots can be built in one system.":
    "Постройка снабжения. В одной системе можно построить до двух складов снабжения.",
  "Allows research actions and technology progression.":
    "Открывает исследовательские действия и развитие технологий.",
  "Light-unit and Ark production building.": "Производит лёгкие юниты и Ковчеги.",
  "Orbital production building for medium and heavy fleet units.":
    "Орбитальная верфь для средних и тяжёлых кораблей.",
  "Defensive orbital structure.": "Оборонительная орбитальная постройка.",
  "A deployed colony makes the system colonized. It has no HP.":
    "Развёрнутая колония делает систему колонизированной и не имеет очков здоровья.",
  "Produces light units / Ark": "Производит лёгкие юниты / Ковчег",
  "Produces medium / heavy units": "Производит средние / тяжёлые корабли",

  "Fleet command": "Командование флотами",
  "Issue coordinated orders": "Отдайте согласованные приказы",
  "Prepared orders": "Подготовленные приказы",
  "No ready fleets are available for this command.": "Для этой команды нет готовых флотов.",
  "Your fleets": "Ваши флоты",
  "Rival fleets": "Флоты соперника",
  "Move → Move": "Движение → Движение",
  "Move → Defensive Position": "Движение → Оборонительная позиция",
  "Move → Transfer": "Движение → Передача",
  "Defensive position": "Оборонительная позиция",
  "Selected path": "Выбранный маршрут",
  "Select at least one unit to transfer.": "Выберите хотя бы один юнит для передачи.",
  "Choose the partner fleet": "Выберите флот-партнёр",
  "Arriving fleet": "Прибывающий флот",
  "Receiving fleet": "Принимающий флот",
  "RECEIVING FLEET": "ПРИНИМАЮЩИЙ ФЛОТ",
  "TRANSFER PHASE": "ФАЗА ПЕРЕДАЧИ",
  "Exchange": "Обмен",
  "After transfer": "После передачи",
  "Click unit cards to change side": "Нажимайте на карточки юнитов, чтобы менять сторону",
  "1 movement remains after transfer": "После передачи остаётся одно перемещение",
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
  "Mines": "Шахты",
  "Power Plants": "Энергоблоки",
  "Supply Depots": "Склады снабжения",
  "Research Centers": "Исследовательские центры",
  "Unavailable": "Недоступно",
  "PER ROUND": "ЗА РАУНД",
  "NO DIRECT INCOME": "НЕТ ПРЯМОГО ДОХОДА",
  "Can produce:": "Может производить:",
  "Technologies:": "Технологии:",
  "Nothing yet": "Пока ничего",
  "No technologies yet": "Технологий пока нет",
  "Production": "Производство",
  "Scout Drone": "Разведывательный дрон",
  "Marine Squad": "Отряд морской пехоты",
  "Ark": "Ковчег",
  "Frigate": "Фрегат",
  "Cruiser": "Крейсер",
  "Pack into Ark · 1 CP · 3 ⚡": "Упаковать в Ковчег · 1 КО · 3 ⚡",
  "Colonize System · 1 CP · 3 ⚡": "Колонизировать систему · 1 КО · 3 ⚡",
  "Units": "Юниты",
  "Deployed assets": "Развёрнутые силы",
  "Fleets in system": "Флоты в системе",
  "No buildings or colonies.": "В системе нет построек и колоний.",
  "No active player": "Нет активного игрока",
  "No active player selected.": "Активный игрок не выбран.",
  "No current player is active.": "Сейчас нет активного игрока.",
  "The current player has no command points left.": "У текущего игрока не осталось командных очков.",
  "You can build only in the current player's systems.":
    "Строить можно только в системах текущего игрока.",
  "Only the current player can control this colony.": "Только текущий игрок может управлять этой колонией.",
  "Only the current player can control this ark.": "Только текущий игрок может управлять этим Ковчегом.",
  "Only the current player can use this production building.":
    "Только текущий игрок может использовать эту производственную постройку.",
  "Player cannot pack the last Colony into Ark.": "Нельзя упаковать последнюю колонию игрока в Ковчег.",
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
  "Backend": "Бэкенд",
  "Frontend": "Фронтенд",
  "System": "Система",
  "Balance": "Баланс",

  "Zero Star Cult": "Культ Нулевой Звезды",
  "Heliophage Dominion": "Доминион Гелиофагов",
  "Ash Orbit Syndicate": "Синдикат Пепельной Орбиты",
  "Rift Archivists": "Архивисты Разлома"
};

const UNIT_NAMES: Record<string, string> = {
  "Scout Drone": "Разведывательный дрон",
  "Marine Squad": "Отряд морской пехоты",
  Ark: "Ковчег",
  Frigate: "Фрегат",
  Cruiser: "Крейсер"
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
