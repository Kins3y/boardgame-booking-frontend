import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  finishGameSession,
  getSessionsOverview
} from "../api/gameApi";
import type { SessionOverviewItem } from "../types/game";
import "./SessionsList.css";

const ACTIVE_STATUSES = ["created", "started"];

export default function SessionsList() {
  const [sessions, setSessions] = useState<SessionOverviewItem[]>([]);
  const [searchId, setSearchId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  function handleSearchIdChange(value: string) {
    const onlyDigits = value.replace(/\D/g, "");

    if (onlyDigits === "") {
      setSearchId("");
      return;
    }

    const numericValue = Number(onlyDigits);

    if (numericValue > 999999999) {
      setSearchId("999999999");
      return;
    }

    setSearchId(onlyDigits);
  }

  async function loadSessions() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getSessionsOverview();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFinishSession(sessionId: number) {
    const confirmed = window.confirm(
      `Finish session #${sessionId}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await finishGameSession(sessionId);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish session");
    }
  }

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesId =
        searchId === "" || String(session.id).includes(searchId);

      const matchesStatus =
        statusFilter === "all" || session.status === statusFilter;

      return matchesId && matchesStatus;
    });
  }, [sessions, searchId, statusFilter]);

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div className="sessions-page">
      <header className="sessions-header">
        <div>
          <h1>Sessions list</h1>
          <p>Search, filter, inspect players, and finish active sessions.</p>
        </div>

        <button onClick={loadSessions} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {error && <div className="sessions-error">{error}</div>}

      <section className="sessions-controls">
        <div className="control-group">
          <label>Search by session ID</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Session ID"
            value={searchId}
            onChange={(event) => handleSearchIdChange(event.target.value)}
          />
        </div>

        <div className="control-group">
          <label>Status filter</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="created">Created</option>
            <option value="started">Started</option>
            <option value="finished">Finished</option>
          </select>
        </div>
      </section>

      <section className="sessions-table-wrapper">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Round</th>
              <th>Players</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  No sessions found.
                </td>
              </tr>
            ) : (
              filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td>#{session.id}</td>

                  <td>
                    <div className="session-name-cell">
                      <strong>{session.name}</strong>
                      <span>Map ID: {session.map_id}</span>
                    </div>
                  </td>

                  <td>
                    <span className={`status-pill status-${session.status}`}>
                      {session.status}
                    </span>
                  </td>

                  <td>{session.current_round}</td>

                  <td>
                    {session.players.length === 0 ? (
                      <span className="muted-text">No players</span>
                    ) : (
                      <div className="players-list-cell">
                        {session.players.map((player) => (
                          <div
                            className="session-player-row"
                            key={player.session_player_id}
                          >
                            <strong>
                              {player.faction_name}
                            </strong>

                            <span>
                              User: {player.nickname ?? `#${player.user_id}`}
                            </span>

                            <span>
                              Start system: {player.start_system_id ?? "none"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td>
                    <div className="session-actions-cell">
                      <Link to={`/game/sessions/${session.id}/setup`}>
                        <button>Setup</button>
                      </Link>

                      <Link to={`/game/sessions/${session.id}/play`}>
                        <button>Play</button>
                      </Link>

                      {ACTIVE_STATUSES.includes(session.status) && (
                        <button
                          className="finish-button"
                          onClick={() => handleFinishSession(session.id)}
                        >
                          Finish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}