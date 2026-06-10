import { useEffect, useState } from "react";
import {
  addPlayerToSession,
  getAvailableUsers,
  getFullSession,
  startGameSession
} from "../api/gameApi";
import type { AvailableUser, FullGameSession } from "../types/game";
import "./GameSession.css";

export default function GameSession() {
  const [sessionIdInput, setSessionIdInput] = useState<string>("5");
  const [session, setSession] = useState<FullGameSession | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  function handleSessionIdChange(value: string) {
    const onlyDigits = value.replace(/\D/g, "");

    if (onlyDigits === "") {
      setSessionIdInput("");
      return;
    }

    const numericValue = Number(onlyDigits);

    if (numericValue > 999999999) {
      setSessionIdInput("999999999");
      return;
    }

    setSessionIdInput(onlyDigits);
  }

  function getSessionId(): number | null {
    if (sessionIdInput === "") {
      return null;
    }

    const sessionId = Number(sessionIdInput);

    if (!Number.isInteger(sessionId) || sessionId < 1 || sessionId > 999999999) {
      return null;
    }

    return sessionId;
  }

  async function loadSession() {
    const sessionId = getSessionId();

    if (sessionId === null) {
      setError("Session ID must be a positive integer from 1 to 999999999");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const sessionData = await getFullSession(sessionId);
      const usersData = await getAvailableUsers(sessionId);

      setSession(sessionData);
      setAvailableUsers(usersData);
    } catch (err) {
      setSession(null);
      setAvailableUsers([]);
      setError(err instanceof Error ? err.message : "Failed to load game session");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartSession() {
    const sessionId = getSessionId();

    if (sessionId === null) {
      setError("Session ID must be a positive integer from 1 to 999999999");
      return;
    }

    try {
      setError("");
      await startGameSession(sessionId);
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    }
  }

  async function handleAddUser(user: AvailableUser) {
    const sessionId = getSessionId();

    if (sessionId === null) {
      setError("Session ID must be a positive integer from 1 to 999999999");
      return;
    }

    const factionName = window.prompt(
      `Enter faction name for ${user.nickname}:`,
      user.nickname
    );

    if (!factionName) {
      return;
    }

    const startSystemIdValue = window.prompt(
      `Enter start system ID for ${user.nickname}:`
    );

    if (!startSystemIdValue) {
      return;
    }

    const startSystemId = Number(startSystemIdValue);

    if (Number.isNaN(startSystemId) || !Number.isInteger(startSystemId) || startSystemId < 1) {
      setError("Start system ID must be a positive integer");
      return;
    }

    try {
      setError("");
      await addPlayerToSession(sessionId, user.id, factionName, startSystemId);
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add player");
    }
  }

  useEffect(() => {
    loadSession();
  }, []);

  return (
    <div className="game-page">
      <header className="game-header">
        <div>
          <h1>ARCHONT</h1>
          <p>Game session visual screen</p>
        </div>

        <div className="session-loader">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Session ID"
            value={sessionIdInput}
            onChange={(event) => handleSessionIdChange(event.target.value)}
          />

          <button onClick={loadSession} disabled={sessionIdInput === "" || isLoading}>
            {isLoading ? "Loading..." : "Load session"}
          </button>
        </div>
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
                Start session
              </button>

              {session.status !== "created" && (
                <span className="action-hint">
                  Players can be added only before the session starts
                </span>
              )}
            </div>
          </section>

          <section className="game-panel">
            <h2>Players</h2>

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
          </section>

          <section className="game-panel">
            <h2>Available Users</h2>

            {availableUsers.length === 0 ? (
              <p>No users available outside active sessions.</p>
            ) : (
              <div className="available-users-grid">
                {availableUsers.map((user) => (
                  <div className="available-user-card" key={user.id}>
                    <strong>{user.nickname}</strong>
                    <span>User ID: {user.id}</span>
                    <span>{user.email}</span>

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
            <h2>Systems</h2>

            <div className="systems-grid">
              {session.systems.map((system) => {
                const buildings = system.buildings ?? [];

                return (
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

                    <div className="buildings">
                      <strong>Buildings:</strong>

                      {buildings.length === 0 ? (
                        <p>No buildings</p>
                      ) : (
                        <ul>
                          {buildings.map((building) => (
                            <li key={building.id}>
                              {building.building_type} #{building.id}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}