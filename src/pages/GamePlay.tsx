import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFullSession } from "../api/gameApi";
import type { FullGameSession } from "../types/game";
import "./GameSession.css";

export default function GamePlay() {
  const { sessionId } = useParams();

  const [session, setSession] = useState<FullGameSession | null>(null);
  const [error, setError] = useState<string>("");

  const numericSessionId = Number(sessionId);

  async function loadSession() {
    if (!Number.isInteger(numericSessionId) || numericSessionId < 1) {
      setError("Invalid session ID");
      return;
    }

    try {
      setError("");

      const sessionData = await getFullSession(numericSessionId);
      setSession(sessionData);
    } catch (err) {
      setSession(null);
      setError(err instanceof Error ? err.message : "Failed to load game");
    }
  }

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  return (
    <div className="game-page">
      <header className="game-header">
        <div>
          <h1>ARCHONT Game</h1>
          <p>Simulation screen</p>
        </div>

        <button onClick={loadSession}>Refresh</button>
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