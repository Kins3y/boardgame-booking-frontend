import { useMemo, useState, type MouseEvent } from "react";
import { createEditorMap } from "../api/gameApi";
import type {
  MapEditorConnection,
  MapEditorSavePayload,
  MapEditorSystem,
  MapEditorSystemType
} from "../types/game";
import "./MapEditor.css";

type EditorMode = "select" | "add-system" | "connect";

const CELL_SIZE = 34;

function createSystemName(index: number): string {
  return `System ${index}`;
}

function createClientId(): string {
  return `system-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getConnectionKey(connection: MapEditorConnection): string {
  return [connection.from_client_id, connection.to_client_id]
    .sort()
    .join("__");
}

function getSystemIcon(system: MapEditorSystem): string {
  if (system.system_type === "start") {
    return "🏠";
  }

  if (system.system_type === "archive") {
    return `📚${system.archive_level ?? 1}`;
  }

  return "⭐";
}

export default function MapEditor() {
  const [mapName, setMapName] = useState<string>("New Archont Map");
  const [playersCount, setPlayersCount] = useState<number>(2);
  const [gridWidth, setGridWidth] = useState<number>(20);
  const [gridHeight, setGridHeight] = useState<number>(20);

  const [mode, setMode] = useState<EditorMode>("select");

  const [systems, setSystems] = useState<MapEditorSystem[]>([]);
  const [connections, setConnections] = useState<MapEditorConnection[]>([]);

  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedConnectionKey, setSelectedConnectionKey] =
    useState<string | null>(null);

  const [connectFromId, setConnectFromId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const selectedSystem = useMemo(() => {
    if (!selectedSystemId) {
      return null;
    }

    return (
      systems.find((system) => system.client_id === selectedSystemId) ?? null
    );
  }, [systems, selectedSystemId]);

  const selectedConnection = useMemo(() => {
    if (!selectedConnectionKey) {
      return null;
    }

    return (
      connections.find(
        (connection) => getConnectionKey(connection) === selectedConnectionKey
      ) ?? null
    );
  }, [connections, selectedConnectionKey]);

  const startSystemsCount = systems.filter(
    (system) => system.system_type === "start"
  ).length;

  const archiveSystemsCount = systems.filter(
    (system) => system.system_type === "archive"
  ).length;

  function getSystemAtPosition(
    x: number,
    y: number
  ): MapEditorSystem | undefined {
    return systems.find((system) => system.x === x && system.y === y);
  }

  function getSystemById(clientId: string): MapEditorSystem | undefined {
    return systems.find((system) => system.client_id === clientId);
  }

  function handleGridCellClick(x: number, y: number) {
    const existingSystem = getSystemAtPosition(x, y);

    setError("");
    setSuccessMessage("");

    if (existingSystem) {
      setSelectedSystemId(existingSystem.client_id);
      setSelectedConnectionKey(null);
      return;
    }

    if (mode !== "add-system") {
      return;
    }

    if (systems.length >= 99) {
      setError("Map cannot contain more than 99 systems");
      return;
    }

    const newSystem: MapEditorSystem = {
      client_id: createClientId(),
      name: createSystemName(systems.length + 1),
      x,
      y,
      system_type: "normal",
      archive_level: null,
      mineral_slots: 1,
      energy_slots: 1,
      storage_slots: 1,
      research_center_slots: 0
    };

    setSystems((currentSystems) => [...currentSystems, newSystem]);
    setSelectedSystemId(newSystem.client_id);
    setSelectedConnectionKey(null);
    setMode("select");
  }

  function handleSystemClick(
    system: MapEditorSystem,
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation();

    setError("");
    setSuccessMessage("");

    if (mode !== "connect") {
      setSelectedSystemId(system.client_id);
      setSelectedConnectionKey(null);
      return;
    }

    if (!connectFromId) {
      setConnectFromId(system.client_id);
      setSelectedSystemId(system.client_id);
      setSelectedConnectionKey(null);
      return;
    }

    if (connectFromId === system.client_id) {
      setError("System cannot be connected to itself");
      return;
    }

    const newConnection: MapEditorConnection = {
      from_client_id: connectFromId,
      to_client_id: system.client_id,
      is_dangerous: false,
      is_wraparound: false
    };

    const newConnectionKey = getConnectionKey(newConnection);

    const alreadyExists = connections.some(
      (connection) => getConnectionKey(connection) === newConnectionKey
    );

    if (alreadyExists) {
      setError("Connection already exists");
      setConnectFromId(null);
      return;
    }

    setConnections((currentConnections) => [
      ...currentConnections,
      newConnection
    ]);

    setSelectedConnectionKey(newConnectionKey);
    setSelectedSystemId(null);
    setConnectFromId(null);
  }

  function updateSelectedSystem(
    updates: Partial<MapEditorSystem>
  ) {
    if (!selectedSystemId) {
      return;
    }

    setSystems((currentSystems) =>
      currentSystems.map((system) => {
        if (system.client_id !== selectedSystemId) {
          return system;
        }

        const nextSystem = {
          ...system,
          ...updates
        };

        if (nextSystem.system_type !== "archive") {
          nextSystem.archive_level = null;
        }

        if (
          nextSystem.system_type === "archive" &&
          nextSystem.archive_level === null
        ) {
          nextSystem.archive_level = 1;
        }

        return nextSystem;
      })
    );
  }

  function updateSelectedConnection(
    updates: Partial<MapEditorConnection>
  ) {
    if (!selectedConnectionKey) {
      return;
    }

    setConnections((currentConnections) =>
      currentConnections.map((connection) => {
        if (getConnectionKey(connection) !== selectedConnectionKey) {
          return connection;
        }

        return {
          ...connection,
          ...updates
        };
      })
    );
  }

  function deleteSelectedSystem() {
    if (!selectedSystemId) {
      return;
    }

    setSystems((currentSystems) =>
      currentSystems.filter(
        (system) => system.client_id !== selectedSystemId
      )
    );

    setConnections((currentConnections) =>
      currentConnections.filter(
        (connection) =>
          connection.from_client_id !== selectedSystemId &&
          connection.to_client_id !== selectedSystemId
      )
    );

    setSelectedSystemId(null);
    setSelectedConnectionKey(null);
  }

  function deleteSelectedConnection() {
    if (!selectedConnectionKey) {
      return;
    }

    setConnections((currentConnections) =>
      currentConnections.filter(
        (connection) => getConnectionKey(connection) !== selectedConnectionKey
      )
    );

    setSelectedConnectionKey(null);
  }

  function validateBeforeSave(): string | null {
    if (!mapName.trim()) {
      return "Map name is required";
    }

    if (systems.length === 0) {
      return "Map must contain at least one system";
    }

    if (systems.length > 99) {
      return "Map cannot contain more than 99 systems";
    }

    if (startSystemsCount !== playersCount) {
      return `Start systems count must be equal to players count. Expected ${playersCount}, got ${startSystemsCount}`;
    }

    if (systems.length > 1 && connections.length === 0) {
      return "Map with multiple systems must have connections";
    }

    return null;
  }

  async function handleSaveMap() {
    const validationError = validateBeforeSave();

    if (validationError) {
      setError(validationError);
      setSuccessMessage("");
      return;
    }

    const payload: MapEditorSavePayload = {
      name: mapName.trim(),
      players_count: playersCount,
      grid_width: gridWidth,
      grid_height: gridHeight,
      systems: systems.map((system) => ({
        ...system,
        archive_level:
          system.system_type === "archive" ? system.archive_level ?? 1 : null
      })),
      connections
    };

    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const savedMap = await createEditorMap(payload);

      setSuccessMessage(`Map saved successfully. Map ID: ${savedMap.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save map");
    } finally {
      setIsSaving(false);
    }
  }

  function handleResetEditor() {
    setMapName("New Archont Map");
    setPlayersCount(2);
    setGridWidth(20);
    setGridHeight(20);
    setSystems([]);
    setConnections([]);
    setSelectedSystemId(null);
    setSelectedConnectionKey(null);
    setConnectFromId(null);
    setMode("select");
    setError("");
    setSuccessMessage("");
  }

  const boardWidth = gridWidth * CELL_SIZE;
  const boardHeight = gridHeight * CELL_SIZE;

  return (
    <div className="map-editor-page">
      <header className="map-editor-header">
        <div>
          <h1>Map Editor</h1>
          <p>Create playable maps for future Archont simulations.</p>
        </div>

        <div className="map-editor-header-actions">
          <button onClick={handleResetEditor}>Reset</button>

          <button
            className="primary-button"
            onClick={handleSaveMap}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save map"}
          </button>
        </div>
      </header>

      {error && <div className="map-editor-error">{error}</div>}

      {successMessage && (
        <div className="map-editor-success">{successMessage}</div>
      )}

      <section className="map-editor-layout">
        <aside className="map-editor-panel">
          <h2>Map settings</h2>

          <label>
            Map name
            <input
              value={mapName}
              onChange={(event) => setMapName(event.target.value)}
            />
          </label>

          <label>
            Players
            <select
              value={playersCount}
              onChange={(event) => setPlayersCount(Number(event.target.value))}
            >
              {[2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count} players
                </option>
              ))}
            </select>
          </label>

          <div className="map-editor-grid-size">
            <label>
              Width
              <input
                type="number"
                min={5}
                max={99}
                value={gridWidth}
                onChange={(event) => setGridWidth(Number(event.target.value))}
              />
            </label>

            <label>
              Height
              <input
                type="number"
                min={5}
                max={99}
                value={gridHeight}
                onChange={(event) => setGridHeight(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="map-editor-stats">
            <span>Systems: {systems.length} / 99</span>
            <span>
              Start systems: {startSystemsCount} / {playersCount}
            </span>
            <span>Archives: {archiveSystemsCount}</span>
            <span>Connections: {connections.length}</span>
          </div>

          <h2>Tool</h2>

          <div className="map-editor-tools">
            <button
              className={mode === "select" ? "selected" : ""}
              onClick={() => {
                setMode("select");
                setConnectFromId(null);
              }}
            >
              Select
            </button>

            <button
              className={mode === "add-system" ? "selected" : ""}
              onClick={() => {
                setMode("add-system");
                setConnectFromId(null);
              }}
            >
              Add system
            </button>

            <button
              className={mode === "connect" ? "selected" : ""}
              onClick={() => setMode("connect")}
            >
              Connect
            </button>
          </div>

          {mode === "add-system" && (
            <p className="map-editor-hint">
              Click an empty grid cell to place a new system.
            </p>
          )}

          {mode === "connect" && (
            <p className="map-editor-hint">
              Click two systems to create a corridor.
              {connectFromId && (
                <>
                  <br />
                  First system selected. Click another one.
                </>
              )}
            </p>
          )}
        </aside>

        <main className="map-editor-board-wrapper">
          <div
            className="map-editor-board"
            style={{
              width: boardWidth,
              height: boardHeight
            }}
          >
            <svg
              className="map-editor-connections-svg"
              width={boardWidth}
              height={boardHeight}
              viewBox={`0 0 ${boardWidth} ${boardHeight}`}
            >
              {connections.map((connection) => {
                const fromSystem = getSystemById(connection.from_client_id);
                const toSystem = getSystemById(connection.to_client_id);

                if (!fromSystem || !toSystem) {
                  return null;
                }

                const key = getConnectionKey(connection);

                return (
                  <line
                    key={key}
                    x1={(fromSystem.x + 0.5) * CELL_SIZE}
                    y1={(fromSystem.y + 0.5) * CELL_SIZE}
                    x2={(toSystem.x + 0.5) * CELL_SIZE}
                    y2={(toSystem.y + 0.5) * CELL_SIZE}
                    className={[
                      "map-editor-connection-line",
                      connection.is_dangerous ? "dangerous" : "safe",
                      connection.is_wraparound ? "wraparound" : "",
                      selectedConnectionKey === key ? "selected" : ""
                    ].join(" ")}
                  />
                );
              })}
            </svg>

            <div
              className="map-editor-grid"
              style={{
                gridTemplateColumns: `repeat(${gridWidth}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${gridHeight}, ${CELL_SIZE}px)`
              }}
            >
              {Array.from({ length: gridWidth * gridHeight }).map(
                (_, index) => {
                  const x = index % gridWidth;
                  const y = Math.floor(index / gridWidth);
                  const system = getSystemAtPosition(x, y);

                  return (
                    <button
                      key={`${x}-${y}`}
                      className={[
                        "map-editor-cell",
                        system ? "has-system" : ""
                      ].join(" ")}
                      onClick={() => handleGridCellClick(x, y)}
                    >
                      {system && (
                        <span
                          className={[
                            "map-editor-system-node",
                            system.system_type,
                            selectedSystemId === system.client_id
                              ? "selected"
                              : "",
                            connectFromId === system.client_id
                              ? "connect-from"
                              : ""
                          ].join(" ")}
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();

                            handleSystemClick(
  system,
  event as unknown as MouseEvent<HTMLButtonElement>
);
                          }}
                        >
                          <span>{getSystemIcon(system)}</span>
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </main>

        <aside className="map-editor-panel">
          <h2>Selected</h2>

          {selectedSystem && (
            <div className="map-editor-selected-card">
              <h3>System</h3>

              <label>
                Name
                <input
                  value={selectedSystem.name}
                  onChange={(event) =>
                    updateSelectedSystem({ name: event.target.value })
                  }
                />
              </label>

              <label>
                Type
                <select
                  value={selectedSystem.system_type}
                  onChange={(event) =>
                    updateSelectedSystem({
                      system_type: event.target.value as MapEditorSystemType
                    })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="start">Start</option>
                  <option value="archive">Archive</option>
                </select>
              </label>

              {selectedSystem.system_type === "archive" && (
                <label>
                  Archive level
                  <select
                    value={selectedSystem.archive_level ?? 1}
                    onChange={(event) =>
                      updateSelectedSystem({
                        archive_level: Number(event.target.value)
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5].map((level) => (
                      <option key={level} value={level}>
                        Level {level}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="map-editor-coordinate-row">
                <span>X: {selectedSystem.x}</span>
                <span>Y: {selectedSystem.y}</span>
              </div>

              <h3>Building slots</h3>

              <label>
                Mine slots
                <input
                  type="number"
                  min={0}
                  max={9}
                  value={selectedSystem.mineral_slots}
                  onChange={(event) =>
                    updateSelectedSystem({
                      mineral_slots: Number(event.target.value)
                    })
                  }
                />
              </label>

              <label>
                Power plant slots
                <input
                  type="number"
                  min={0}
                  max={9}
                  value={selectedSystem.energy_slots}
                  onChange={(event) =>
                    updateSelectedSystem({
                      energy_slots: Number(event.target.value)
                    })
                  }
                />
              </label>

              <label>
                Supply depot slots
                <input
                  type="number"
                  min={0}
                  max={9}
                  value={selectedSystem.storage_slots}
                  onChange={(event) =>
                    updateSelectedSystem({
                      storage_slots: Number(event.target.value)
                    })
                  }
                />
              </label>

              <label>
                Research center slots
                <input
                  type="number"
                  min={0}
                  max={9}
                  value={selectedSystem.research_center_slots}
                  onChange={(event) =>
                    updateSelectedSystem({
                      research_center_slots: Number(event.target.value)
                    })
                  }
                />
              </label>

              <button
                className="danger-button"
                onClick={deleteSelectedSystem}
              >
                Delete system
              </button>
            </div>
          )}

          {!selectedSystem && selectedConnection && (
            <div className="map-editor-selected-card">
              <h3>Connection</h3>

              <label className="map-editor-checkbox">
                <input
                  type="checkbox"
                  checked={selectedConnection.is_dangerous}
                  onChange={(event) =>
                    updateSelectedConnection({
                      is_dangerous: event.target.checked
                    })
                  }
                />
                Dangerous corridor
              </label>

              <label className="map-editor-checkbox">
                <input
                  type="checkbox"
                  checked={selectedConnection.is_wraparound}
                  onChange={(event) =>
                    updateSelectedConnection({
                      is_wraparound: event.target.checked
                    })
                  }
                />
                Wraparound through map edge
              </label>

              <button
                className="danger-button"
                onClick={deleteSelectedConnection}
              >
                Delete connection
              </button>
            </div>
          )}

          {!selectedSystem && !selectedConnection && (
            <p className="map-editor-hint">
              Select a system or create a connection.
            </p>
          )}

          {connections.length > 0 && (
            <>
              <h2>Connections</h2>

              <div className="map-editor-connections-list">
                {connections.map((connection) => {
                  const fromSystem = getSystemById(connection.from_client_id);
                  const toSystem = getSystemById(connection.to_client_id);
                  const key = getConnectionKey(connection);

                  return (
                    <button
                      key={key}
                      className={
                        selectedConnectionKey === key ? "selected" : ""
                      }
                      onClick={() => {
                        setSelectedConnectionKey(key);
                        setSelectedSystemId(null);
                      }}
                    >
                      {fromSystem?.name ?? "Unknown"} →{" "}
                      {toSystem?.name ?? "Unknown"}
                      {connection.is_dangerous ? " · dangerous" : " · safe"}
                      {connection.is_wraparound ? " · wrap" : ""}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </aside>
      </section>
    </div>
  );
}