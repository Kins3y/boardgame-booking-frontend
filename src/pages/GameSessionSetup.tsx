import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addPlayerToSession,
  getAvailableUsers,
  getFullSession,
  startGameSession
} from "../api/gameApi";
import type { AvailableUser, FullGameSession } from "../types/game";
import "./GameSession.css";

export default function GameSessionSetup() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<FullGameSession | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const numericSessionId = Number(sessionId);

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

      setSession(sessionData);
      setAvailableUsers(usersData);
    } catch (err) {
      setSession(null);
      setAvailableUsers([]);
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddUser(user: AvailableUser) {
    if (!session) {
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

    if (
      Number.isNaN(startSystemId) ||
      !Number.isInteger(startSystemId) ||
      startSystemId < 1
    ) {
      setError("Start system ID must be a positive integer");
      return;
    }

    try {
      setError("");
      await addPlayerToSession(session.id, user.id, factionName, startSystemId);
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