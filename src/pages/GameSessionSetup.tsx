import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addPlayerToSession,
  deleteCreatedSession,
  getAvailableUsers,
  getCivilizations,
  getFullSession,
  getSessionStartSystems,
  removePlayerFromSession,
  startGameSession
} from "../api/gameApi";
import type {
  AvailableUser,
  Civilization,
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
  const [civilizations, setCivilizations] = useState<Civilization[]>([]);

  const [selectedStartSystemIds, setSelectedStartSystemIds] = useState<
    Record<number, number>
  >({});

  const [selectedCivilizationIds, setSelectedCivilizationIds] = useState<
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

  function isCivilizationSelectedByAnotherUser(
    civilizationId: number,
    currentUserId: number
  ): boolean {
    return Object.entries(selectedCivilizationIds).some(
      ([userId, selectedCivilizationId]) =>
        Number(userId) !== currentUserId &&
        selectedCivilizationId === civilizationId
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
      const civilizationsData = await getCivilizations();

      setSession(sessionData);
      setAvailableUsers(usersData);
      setStartSystems(startSystemsData);
      setCivilizations(civilizationsData);

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
      setCivilizations([]);
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
    const civilizationId = selectedCivilizationIds[user.id];
    const startSystemId = selectedStartSystemIds[user.id];

    if (!factionName) {
      setError(`Enter faction name for ${user.nickname}`);
      return;
    }

    if (!civilizationId) {
      setError(`Select civilization for ${user.nickname}`);
      return;
    }

    if (!startSystemId) {
      setError(`Select start system for ${user.nickname}`);
      return;
    }

    try {
      setError("");

      await addPlayerToSession(
        session.id,
        user.id,
        civilizationId,
        factionName,
        startSystemId
      );

      setSelectedStartSystemIds((currentSelectedStartSystemIds) => {
        const nextSelectedStartSystemIds = { ...currentSelectedStartSystemIds };
        delete nextSelectedStartSystemIds[user.id];
        return nextSelectedStartSystemIds;
      });

      setSelectedCivilizationIds((currentSelectedCivilizationIds) => {
        const nextSelectedCivilizationIds = {
          ...currentSelectedCivilizationIds
        };

        delete nextSelectedCivilizationIds[user.id];

        return nextSelectedCivilizationIds;
      });

      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add player");
    }
  }

  async function handleRemovePlayer(sessionPlayerId: number) {
    if (!session) {
      return;
    }

    const confirmed = window.confirm("Remove this player from session?");

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await removePlayerFromSession(session.id, sessionPlayerId);
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove player");
    }
  }

  async function handleCancelSetup() {
    if (!session) {
      return;
    }

    const confirmed = window.confirm(
      "Cancel setup and delete this created session?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteCreatedSession(session.id);
      navigate("/game/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete session");
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
          <p>
            Add players, choose civilizations, assign starting systems, then
            start the game.
          </p>
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

            <div className="game-actions setup-actions">
  <button
    className="setup-action-button"
    onClick={handleStartSession}
    disabled={session.status !== "created"}
  >
    Start session
  </button>

  {session.status === "created" && (
    <button
      className="setup-action-button danger-button cancel-setup-button"
      onClick={handleCancelSetup}
    >
      Cancel setup
    </button>
  )}

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

                    <p>Player: {player.nickname ?? `User ${player.user_id}`}</p>

                    <p>
                      Civilization:{" "}
                      {player.civilization_name ?? "Not selected"}
                    </p>

                    <p>
                      Start system:{" "}
                      {player.start_system_name ??
                        player.start_system_id ??
                        "Not selected"}
                    </p>

                    <div className="resources">
                      <span>Matter: {player.matter}</span>
                      <span>Energy: {player.energy}</span>
                      <span>Data: {player.data}</span>
                    </div>

                    {session.status === "created" && (
                      <button
                        className="remove-player-button"
                        onClick={() => handleRemovePlayer(player.id)}
                      >
                        Remove player
                      </button>
                    )}
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
                {availableUsers.map((user) => {
                  const selectedCivilization = civilizations.find(
                    (civilization) =>
                      civilization.id === selectedCivilizationIds[user.id]
                  );

                  return (
                    <div className="available-user-card" key={user.id}>
                      <strong>{user.nickname}</strong>

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
                        Civilization
                        <select
                          value={selectedCivilizationIds[user.id] ?? ""}
                          onChange={(event) =>
                            setSelectedCivilizationIds(
                              (currentSelectedCivilizationIds) => ({
                                ...currentSelectedCivilizationIds,
                                [user.id]: Number(event.target.value)
                              })
                            )
                          }
                          disabled={session.status !== "created"}
                        >
                          <option value="">Select civilization</option>

                          {civilizations.map((civilization) => {
                            const isSelectedByAnotherUser =
                              isCivilizationSelectedByAnotherUser(
                                civilization.id,
                                user.id
                              );

                            return (
                              <option
                                key={civilization.id}
                                value={civilization.id}
                                disabled={isSelectedByAnotherUser}
                              >
                                {civilization.name}
                                {isSelectedByAnotherUser ? " / selected" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      {selectedCivilization && (
                        <div className="civilization-preview">
                          <strong>{selectedCivilization.name}</strong>

                          {selectedCivilization.lore_description && (
                            <p>{selectedCivilization.lore_description}</p>
                          )}

                          <div className="resources">
                            <span>
                              Matter: {selectedCivilization.starting_matter}
                            </span>
                            <span>
                              Energy: {selectedCivilization.starting_energy}
                            </span>
                            <span>
                              Data: {selectedCivilization.starting_data}
                            </span>
                          </div>

                          <p>
                            <strong>
                              {selectedCivilization.ability_name}:
                            </strong>{" "}
                            {selectedCivilization.ability_description}
                          </p>
                        </div>
                      )}

                      <label>
                        Start system
                        <select
                          value={selectedStartSystemIds[user.id] ?? ""}
                          onChange={(event) =>
                            setSelectedStartSystemIds(
                              (currentSelectedStartSystemIds) => ({
                                ...currentSelectedStartSystemIds,
                                [user.id]: Number(event.target.value)
                              })
                            )
                          }
                          disabled={session.status !== "created"}
                        >
                          <option value="">Select start system</option>

                          {startSystems.map((system) => {
                            const isSelectedByAnotherUser =
                              isStartSystemSelectedByAnotherUser(
                                system.id,
                                user.id
                              );

                            return (
                              <option
                                key={system.id}
                                value={system.id}
                                disabled={
                                  system.is_occupied || isSelectedByAnotherUser
                                }
                              >
                                #{system.id} — {system.name}
                                {system.is_occupied &&
                                system.occupied_by_faction
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
                  );
                })}
              </div>
            )}
          </section>

          <section className="game-panel">
            <h2>Systems</h2>

            {session.systems.length === 0 ? (
              <p>No systems created for this session yet.</p>
            ) : (
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

                    {system.owner_faction ? (
                      <p>Owner: {system.owner_faction}</p>
                    ) : (
                      <p>Owner: neutral system</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}