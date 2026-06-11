import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addPlayerToSession,
  getAvailableUsers,
  getFullSession,
  getSessionStartSystems,
  startGameSession
} from "../api/gameApi";
import type {
  AvailableUser,
  FullGameSession,
  StartSystemOption
} from "../types/game";
import "./GameSession.css";

export default function GameSessionSetup() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<FullGameSession | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [startSystems, setStartSystems] = useState<StartSystemOption[]>([]);
  const [selectedStartSystemIds, setSelectedStartSystemIds] = useState<
    Record<number, number>
  >({});
  const [factionNames, setFactionNames] = useState<Record<number, string>>({});
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const numericSessionId = Number(sessionId);

  function isStartSystemSelectedByAnotherUser(
  systemId: number,
  currentUserId: number
): boolean {
  return Object.entries(selectedStartSystemIds).some(
    ([userId, selectedSystemId]) =>
      Number(userId) !== currentUserId && selectedSystemId === systemId
  );
}

  async function loadSession() {
  if (!Number.isInteger(numericSessionId) || numericSessionId < 1) {
    setError("Invalid session ID");
    return;
  }

  try {
    setIsLoading(true);
    setError("");

    const sessionData = await getFullSession(numericSessionId);
    const usersData = await getAvailableUsers(numericSessionId);
    const startSystemsData = await getSessionStartSystems(numericSessionId);

    setSession(sessionData);
    setAvailableUsers(usersData);
    setStartSystems(startSystemsData);

    setFactionNames((currentFactionNames) => {
      const nextFactionNames = { ...currentFactionNames };

      for (const user of usersData) {
        if (!nextFactionNames[user.id]) {
          nextFactionNames[user.id] = user.nickname;
        }
      }

      return nextFactionNames;
    });
  } catch (err) {
    setSession(null);
    setAvailableUsers([]);
    setStartSystems([]);
    setError(err instanceof Error ? err.message : "Failed to load session");
  } finally {
    setIsLoading(false);
  }
}

  async function handleAddUser(user: AvailableUser) {
  if (!session) {
    return;
  }

  const factionName = factionNames[user.id]?.trim();
  const startSystemId = selectedStartSystemIds[user.id];

  if (!factionName) {
    setError(`Enter faction name for ${user.nickname}`);
    return;
  }

  if (!startSystemId) {
    setError(`Select start system for ${user.nickname}`);
    return;
  }

  try {
    setError("");
    await addPlayerToSession(session.id, user.id, factionName, startSystemId);

    setSelectedStartSystemIds((currentSelectedStartSystemIds) => {
      const nextSelectedStartSystemIds = { ...currentSelectedStartSystemIds };
      delete nextSelectedStartSystemIds[user.id];
      return nextSelectedStartSystemIds;
    });

    await loadSession();
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to add player");
  }
}

  async function handleStartSession() {
    if (!session) {
      return;
    }

    try {
      setError("");
      await startGameSession(session.id);
      navigate(`/game/sessions/${session.id}/play`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    }
  }

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  return (
    <div className="game-page">
      <header className="game-header">
        <div>
          <h1>Session setup</h1>
          <p>Add players, assign starting systems, then start the game.</p>
        </div>

        <button onClick={loadSession} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {error && <div className="game-error">{error}</div>}

      {session && (
        <>
          <section className="game-panel">
            <h2>{session.name}</h2>

            <div className="session-info">
              <span>Session ID: {session.id}</span>
              <span>Status: {session.status}</span>
              <span>Round: {session.current_round}</span>
              <span>Players: {session.players_count}</span>
              <span>Map ID: {session.map_id}</span>
            </div>

            <div className="game-actions">
              <button
                onClick={handleStartSession}
                disabled={session.status !== "created"}
              >
                Start
              </button>

              {session.status !== "created" && (
                <span className="action-hint">
                  This session has already been started or finished.
                </span>
              )}
            </div>
          </section>

          <section className="game-panel">
            <h2>Players in this session</h2>

            {session.players.length === 0 ? (
              <p>No players added yet.</p>
            ) : (
              <div className="players-grid">
                {session.players.map((player) => (
                  <div className="player-card" key={player.id}>
                    <h3>{player.faction_name}</h3>

                    <p>Session Player ID: {player.id}</p>
                    <p>User ID: {player.user_id}</p>
                    <p>Start System ID: {player.start_system_id}</p>

                    <div className="resources">
                      <span>Matter: {player.matter}</span>
                      <span>Energy: {player.energy}</span>
                      <span>Data: {player.data}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="game-panel">
  <h2>Available users</h2>

  {availableUsers.length === 0 ? (
    <p>No available users outside active sessions.</p>
  ) : (
    <div className="available-users-grid">
      {availableUsers.map((user) => (
        <div className="available-user-card" key={user.id}>
          <strong>{user.nickname}</strong>
          <span>User ID: {user.id}</span>
          <span>{user.email}</span>

          <label>
            Faction name
            <input
              type="text"
              value={factionNames[user.id] ?? ""}
              onChange={(event) =>
                setFactionNames((currentFactionNames) => ({
                  ...currentFactionNames,
                  [user.id]: event.target.value
                }))
              }
              disabled={session.status !== "created"}
            />
          </label>

          <label>
            Start system
            <select
              value={selectedStartSystemIds[user.id] ?? ""}
              onChange={(event) =>
                setSelectedStartSystemIds((currentSelectedStartSystemIds) => ({
                  ...currentSelectedStartSystemIds,
                  [user.id]: Number(event.target.value)
                }))
              }
              disabled={session.status !== "created"}
            >
              <option value="">Select start system</option>

              {startSystems.map((system) => {
  const isSelectedByAnotherUser = isStartSystemSelectedByAnotherUser(
    system.id,
    user.id
  );

  return (
    <option
      key={system.id}
      value={system.id}
      disabled={system.is_occupied || isSelectedByAnotherUser}
    >
      #{system.id} — {system.name}
      {system.is_occupied && system.occupied_by_faction
        ? ` / ${system.occupied_by_faction}`
        : ""}
      {!system.is_occupied && isSelectedByAnotherUser
        ? " / selected"
        : ""}
    </option>
  );
})}
            </select>
          </label>

          <button
            onClick={() => handleAddUser(user)}
            disabled={session.status !== "created"}
          >
            Add user
          </button>
        </div>
      ))}
    </div>
  )}
</section>

          <section className="game-panel">
            <h2>Map systems</h2>

            <div className="systems-grid">
              {session.systems.map((system) => (
                <div
                  className={
                    system.owner_player_id
                      ? "system-card owned"
                      : "system-card neutral"
                  }
                  key={system.system_id}
                >
                  <h3>{system.system_name}</h3>
                  <p>System ID: {system.system_id}</p>

                  {system.owner_faction ? (
                    <p>Owner: {system.owner_faction}</p>
                  ) : (
                    <p>Owner: neutral system</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}