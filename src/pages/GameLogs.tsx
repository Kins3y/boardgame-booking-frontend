import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getGameSessionLogs } from "../api/gameLogsApi";
import { useI18n } from "../i18n/I18nContext";
import type {
  DangerCardResult,
  FleetCommandOrderReport,
  GameLogEntry,
  GameLogsResponse,
} from "../types/game";
import "./GameLogs.css";

const ORDER_LABELS: Record<string, { en: string; ru: string }> = {
  defend: { en: "Defensive Position", ru: "Оборонительная позиция" },
  move_defend: {
    en: "Move → Defensive Position",
    ru: "Движение → Оборона",
  },
  move_move: { en: "Move → Move", ru: "Движение → Движение" },
  move_transfer: {
    en: "Move → Transfer",
    ru: "Движение → Передача",
  },
  transfer_move: {
    en: "Transfer → Move",
    ru: "Передача → Движение",
  },
  split_move: {
    en: "Split → Move",
    ru: "Разделение → Движение",
  },
  move_attack: { en: "Move → Attack", ru: "Движение → Атака" },
};

const EVENT_LABELS: Record<string, { en: string; ru: string }> = {
  game_started: { en: "Game started", ru: "Игра началась" },
  round_started: { en: "New round", ru: "Новый раунд" },
  turn_ended: { en: "Turn ended", ru: "Ход завершён" },
  player_passed: { en: "Player passed", ru: "Игрок спасовал" },
  building_constructed: {
    en: "Building constructed",
    ru: "Построено здание",
  },
  unit_produced: { en: "Unit produced", ru: "Произведён юнит" },
  colony_packed: {
    en: "Colony packed into Ark",
    ru: "Колония упакована в Ковчег",
  },
  system_colonized: { en: "System colonized", ru: "Система колонизирована" },
  fleet_command_resolved: {
    en: "Fleet command resolved",
    ru: "Команда флотов выполнена",
  },
  game_finished: { en: "Game finished", ru: "Игра завершена" },
};

const BUILDING_LABELS: Record<string, { en: string; ru: string }> = {
  mine: { en: "Mine", ru: "Шахта" },
  power_plant: { en: "Power Plant", ru: "Энергоблок" },
  storage: { en: "Supply Depot", ru: "Склад снабжения" },
  barracks: { en: "Barracks", ru: "Казармы" },
  spaceport: { en: "Spaceport", ru: "Космопорт" },
  colony: { en: "Colony", ru: "Колония" },
};

const UNIT_LABELS: Record<string, { en: string; ru: string }> = {
  scout: { en: "Scout Drone", ru: "Разведывательный дрон" },
  marine: { en: "Marine Squad", ru: "Отряд морпехов" },
  ark: { en: "Ark", ru: "Ковчег" },
  frigate: { en: "Frigate", ru: "Фрегат" },
  cruiser: { en: "Cruiser", ru: "Крейсер" },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getActorName(entry: GameLogEntry, language: "en" | "ru"): string {
  const actor = asRecord(entry.payload.actor);
  const factionName = asString(actor.faction_name);
  const nickname = asString(actor.nickname);

  if (factionName) {
    return factionName;
  }

  if (nickname) {
    return nickname;
  }

  return language === "ru" ? "Система" : "System";
}

function getEventLabel(eventType: string, language: "en" | "ru"): string {
  return EVENT_LABELS[eventType]?.[language] ?? eventType;
}

function getOrderLabel(orderType: string, language: "en" | "ru"): string {
  return ORDER_LABELS[orderType]?.[language] ?? orderType;
}

function getBuildingLabel(buildingType: string, language: "en" | "ru"): string {
  return BUILDING_LABELS[buildingType]?.[language] ?? buildingType;
}

function getUnitLabel(unitType: string, language: "en" | "ru"): string {
  return UNIT_LABELS[unitType]?.[language] ?? unitType;
}

function formatTimestamp(value: string | null, language: "en" | "ru"): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function collectDangerCards(order: FleetCommandOrderReport): DangerCardResult[] {
  const cards: DangerCardResult[] = [];

  order.steps.forEach((step) => cards.push(...step.drawn_cards));

  if (order.transfer?.partner_movement_step) {
    cards.push(...order.transfer.partner_movement_step.drawn_cards);
  }

  if (order.transfer?.continuing_movement_step) {
    cards.push(...order.transfer.continuing_movement_step.drawn_cards);
  }

  if (order.split?.source_movement_step) {
    cards.push(...order.split.source_movement_step.drawn_cards);
  }

  if (order.split?.new_fleet_movement_step) {
    cards.push(...order.split.new_fleet_movement_step.drawn_cards);
  }

  if (order.combat) {
    cards.push(...order.combat.ambush_cards);
  }

  return cards;
}

function collectDestroyedUnits(order: FleetCommandOrderReport): Array<{
  id: number;
  name: string;
  side: "attacker" | "defender" | "danger";
}> {
  const destroyed = new Map<number, { id: number; name: string; side: "attacker" | "defender" | "danger" }>();

  collectDangerCards(order).forEach((card) => {
    if (card.unit_destroyed && card.target_unit_id !== null) {
      destroyed.set(card.target_unit_id, {
        id: card.target_unit_id,
        name: card.target_unit_name ?? `Unit ${card.target_unit_id}`,
        side: "danger",
      });
    }
  });

  const exchange = order.combat?.exchange ?? order.combat?.rounds[0] ?? null;

  exchange?.attacker_damage_events.forEach((event) => {
    if (event.destroyed) {
      destroyed.set(event.unit_id, {
        id: event.unit_id,
        name: event.unit_name,
        side: "attacker",
      });
    }
  });

  exchange?.defender_damage_events.forEach((event) => {
    if (event.destroyed) {
      destroyed.set(event.unit_id, {
        id: event.unit_id,
        name: event.unit_name,
        side: "defender",
      });
    }
  });

  return [...destroyed.values()];
}

function EventSummary({
  entry,
  language,
}: {
  entry: GameLogEntry;
  language: "en" | "ru";
}) {
  const payload = asRecord(entry.payload);

  if (entry.event_type === "building_constructed") {
    const buildingType = asString(payload.building_type) ?? "building";
    const systemId = asNumber(payload.system_id);

    return (
      <p>
        {language === "ru" ? "Построено:" : "Built:"}{" "}
        <strong>{getBuildingLabel(buildingType, language)}</strong>
        {systemId !== null &&
          ` ${language === "ru" ? "в системе" : "in system"} #${systemId}`}
      </p>
    );
  }

  if (entry.event_type === "unit_produced") {
    const unitType = asString(payload.unit_type) ?? "unit";
    const fleetId = asNumber(payload.fleet_id);

    return (
      <p>
        {language === "ru" ? "Произведён:" : "Produced:"}{" "}
        <strong>{getUnitLabel(unitType, language)}</strong>
        {fleetId !== null &&
          ` · ${language === "ru" ? "флот" : "fleet"} #${fleetId}`}
      </p>
    );
  }

  if (entry.event_type === "colony_packed") {
    return (
      <p>
        {language === "ru"
          ? "Колония преобразована в Ковчег и добавлена во флот."
          : "A Colony was converted into an Ark and added to a fleet."}
      </p>
    );
  }

  if (entry.event_type === "system_colonized") {
    const systemId = asNumber(payload.system_id);
    return (
      <p>
        {language === "ru" ? "Колонизирована система" : "Colonized system"}{" "}
        <strong>#{systemId ?? "?"}</strong>.
      </p>
    );
  }

  if (entry.event_type === "turn_ended") {
    return (
      <p>
        {language === "ru"
          ? "Игрок потратил 1 КО и передал ход."
          : "The player spent 1 CP and passed control to the next player."}
      </p>
    );
  }

  if (entry.event_type === "player_passed") {
    return (
      <p>
        {language === "ru"
          ? "Игрок вышел из очереди действий до следующего раунда."
          : "The player left the action order until the next round."}
      </p>
    );
  }

  if (entry.event_type === "round_started") {
    return (
      <p>
        {language === "ru"
          ? "Начался новый раунд. Командные очки и готовность флотов обновлены."
          : "A new round started. Command points and fleet readiness were refreshed."}
      </p>
    );
  }

  if (entry.event_type === "game_started") {
    return (
      <p>
        {language === "ru"
          ? "Каждый игрок получил стартовую Колонию, Флот 1 и Разведывательный дрон."
          : "Each player received a starting Colony, Fleet 1 and Scout Drone."}
      </p>
    );
  }

  if (entry.event_type === "game_finished") {
    return <p>{language === "ru" ? "Сессия завершена." : "The session was finished."}</p>;
  }

  return null;
}

function FleetCommandDetails({
  entry,
  language,
}: {
  entry: GameLogEntry;
  language: "en" | "ru";
}) {
  const payload = asRecord(entry.payload);
  const orders = Array.isArray(payload.orders)
    ? (payload.orders as FleetCommandOrderReport[])
    : [];

  if (orders.length === 0) {
    return <p>{language === "ru" ? "Нет данных о приказах." : "No order data."}</p>;
  }

  return (
    <div className="game-log-orders">
      {orders.map((order, index) => {
        const dangerCards = collectDangerCards(order);
        const destroyed = collectDestroyedUnits(order);
        const route = order.steps.length
          ? order.steps
              .map(
                (step) =>
                  `${step.from_system_name ?? step.from_system_id} → ${step.to_system_name ?? step.to_system_id}`,
              )
              .join(" · ")
          : language === "ru"
            ? "Без перемещения"
            : "No movement";

        return (
          <article key={`${entry.id}-${order.fleet_id}-${index}`} className="game-log-order-card">
            <header>
              <div>
                <span>{getOrderLabel(order.order_type, language)}</span>
                <h3>{order.fleet_name}</h3>
              </div>
              <b className={order.order_completed ? "is-complete" : "is-incomplete"}>
                {order.order_completed
                  ? language === "ru"
                    ? "ВЫПОЛНЕНО"
                    : "COMPLETE"
                  : language === "ru"
                    ? "ПРЕРВАНО"
                    : "INTERRUPTED"}
              </b>
            </header>

            <p className="game-log-route">{route}</p>

            <div className="game-log-order-metrics">
              <span>
                <small>{language === "ru" ? "Карты опасности" : "Danger cards"}</small>
                <strong>{dangerCards.length}</strong>
              </span>
              <span>
                <small>{language === "ru" ? "Потеряно юнитов" : "Units lost"}</small>
                <strong>{destroyed.length}</strong>
              </span>
              <span>
                <small>{language === "ru" ? "Финальная система" : "Final system"}</small>
                <strong>{order.final_system_name ?? order.final_system_id}</strong>
              </span>
            </div>

            {dangerCards.length > 0 && (
              <details>
                <summary>{language === "ru" ? "Вскрытые карты" : "Revealed cards"}</summary>
                <div className="game-log-card-list">
                  {dangerCards.map((card, cardIndex) => (
                    <div key={`${card.card_key}-${cardIndex}`}>
                      <strong>{card.name}</strong>
                      <span>{card.effect_summary}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {order.interception && (
              <div className="game-log-combat-result">
                <span>
                  {language === "ru" ? "Огонь перехвата" : "Interception fire"}
                </span>
                <strong>
                  {order.interception.interceptor_fleet_name
                    ? `${order.interception.interceptor_owner_name ?? (language === "ru" ? "Соперник" : "Rival")} · ${order.interception.interceptor_fleet_name}`
                    : language === "ru"
                      ? "Без защищающегося флота"
                      : "No defending fleet"}
                </strong>
                <small>
                  {language === "ru"
                    ? `Односторонний урон: ${order.interception.damage} · Потери: ${order.interception.damage_events.filter((event) => event.destroyed).length}`
                    : `One-way damage: ${order.interception.damage} · Units lost: ${order.interception.damage_events.filter((event) => event.destroyed).length}`}
                </small>
              </div>
            )}

            {order.combat && (() => {
              const exchange =
                order.combat.exchange ?? order.combat.rounds[0] ?? null;

              return (
                <div className="game-log-combat-result">
                  <span>{language === "ru" ? "Результат боя" : "Combat result"}</span>
                  <strong>{order.combat.outcome.replaceAll("_", " ")}</strong>
                  {exchange && (
                    <small>
                      {language === "ru"
                        ? `Нанесено: ${exchange.damage_to_defender} · Получено: ${exchange.damage_to_attacker}`
                        : `Dealt: ${exchange.damage_to_defender} · Received: ${exchange.damage_to_attacker}`}
                    </small>
                  )}
                  {order.combat.engagement_continues && (
                    <small>
                      {language === "ru"
                        ? "Флоты остаются в боевом контакте"
                        : "Fleets remain engaged"}
                    </small>
                  )}
                </div>
              );
            })()}

            {destroyed.length > 0 && (
              <details>
                <summary>{language === "ru" ? "Уничтоженные юниты" : "Destroyed units"}</summary>
                <ul className="game-log-loss-list">
                  {destroyed.map((unit) => (
                    <li key={unit.id}>
                      <strong>{unit.name}</strong>
                      <span>{unit.side}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default function GameLogs() {
  const { sessionId } = useParams();
  const { language } = useI18n();
  const numericSessionId = Number(sessionId);

  const [data, setData] = useState<GameLogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadLogs() {
    if (!Number.isInteger(numericSessionId) || numericSessionId < 1) {
      setError(language === "ru" ? "Некорректный ID сессии." : "Invalid session ID.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setData(await getGameSessionLogs(numericSessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load game logs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [numericSessionId]);

  const statistics = useMemo(() => {
    const logs = data?.logs ?? [];
    let combats = 0;
    let dangerCards = 0;
    let unitsLost = 0;

    logs.forEach((entry) => {
      if (entry.event_type !== "fleet_command_resolved") return;
      const payload = asRecord(entry.payload);
      const orders = Array.isArray(payload.orders)
        ? (payload.orders as FleetCommandOrderReport[])
        : [];

      orders.forEach((order) => {
        dangerCards += collectDangerCards(order).length;
        unitsLost += collectDestroyedUnits(order).length;
        if (order.combat) combats += 1;
      });
    });

    return { events: logs.length, combats, dangerCards, unitsLost };
  }, [data]);

  return (
    <main className="game-logs-page">
      <header className="game-logs-header">
        <div>
          <span>ARCHONT · {language === "ru" ? "ХРОНОЛОГИЯ СЕССИИ" : "SESSION CHRONOLOGY"}</span>
          <h1>{language === "ru" ? "Игровой журнал" : "Game logs"}</h1>
          <p>{data?.session_name ?? `Session ${numericSessionId}`}</p>
        </div>

        <div className="game-logs-header-actions">
          <Link to={`/game/sessions/${numericSessionId}/play`}>
            {language === "ru" ? "Вернуться к игре" : "Back to game"}
          </Link>
          <button type="button" onClick={loadLogs} disabled={isLoading}>
            {isLoading
              ? language === "ru"
                ? "Обновление..."
                : "Refreshing..."
              : language === "ru"
                ? "Обновить"
                : "Refresh"}
          </button>
        </div>
      </header>

      <section className="game-logs-stat-grid">
        <article><span>{language === "ru" ? "События" : "Events"}</span><strong>{statistics.events}</strong></article>
        <article><span>{language === "ru" ? "Бои" : "Combats"}</span><strong>{statistics.combats}</strong></article>
        <article><span>{language === "ru" ? "Карты опасности" : "Danger cards"}</span><strong>{statistics.dangerCards}</strong></article>
        <article><span>{language === "ru" ? "Потери юнитов" : "Units lost"}</span><strong>{statistics.unitsLost}</strong></article>
      </section>

      {error && <div className="game-logs-error">{error}</div>}

      {!isLoading && data && data.logs.length === 0 && (
        <section className="game-logs-empty">
          <h2>{language === "ru" ? "Журнал пока пуст" : "No events yet"}</h2>
          <p>
            {language === "ru"
              ? "Новые игровые действия появятся здесь в хронологическом порядке."
              : "New game actions will appear here in chronological order."}
          </p>
        </section>
      )}

      <section className="game-logs-timeline">
        {(data?.logs ?? []).map((entry) => (
          <article key={entry.id} className={`game-log-event event-${entry.event_type}`}>
            <div className="game-log-timeline-marker">
              <span>{entry.round_number}</span>
            </div>

            <div className="game-log-event-body">
              <header>
                <div>
                  <span>{getActorName(entry, language)}</span>
                  <h2>{getEventLabel(entry.event_type, language)}</h2>
                </div>
                <time>{formatTimestamp(entry.created_at, language)}</time>
              </header>

              {entry.event_type === "fleet_command_resolved" ? (
                <FleetCommandDetails entry={entry} language={language} />
              ) : (
                <EventSummary entry={entry} language={language} />
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
