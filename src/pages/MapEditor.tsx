import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type MouseEvent
} from "react";
import {
  createEditorMap,
  deleteEditorMap,
  getEditorMap,
  getEditorMaps,
  updateEditorMap
} from "../api/gameApi";
import type {
  MapEditorConnection,
  MapEditorMapSummary,
  MapEditorSavedMap,
  MapEditorSavePayload,
  MapEditorSystem,
  MapEditorSystemType
} from "../types/game";
import "./MapEditor.css";

type EditorMode = "select" | "add-system" | "connect";
type MapVisibility = "private" | "public" | "official";

const CELL_SIZE = 34;

function createSystemName(index: number): string {
  return `System ${index}`;
}

function createClientId(): string {
  return `system-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeIntegerInput(
  rawValue: string,
  fallbackValue: number,
  min: number,
  max: number
): number {
  const digitsOnly = rawValue.replace(/\D/g, "");

  if (!digitsOnly) {
    return min;
  }

  const withoutLeadingZeroes = digitsOnly.replace(/^0+(?=\d)/, "");
  const parsedValue = Number(withoutLeadingZeroes);

  if (Number.isNaN(parsedValue)) {
    return fallbackValue;
  }

  return Math.min(max, Math.max(min, parsedValue));
}

function normalizeGridDimensionInput(rawValue: string): string {
  const digitsOnly = rawValue.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  const withoutLeadingZeroes = digitsOnly.replace(/^0+(?=\d)/, "");
  const parsedValue = Number(withoutLeadingZeroes);

  if (Number.isNaN(parsedValue)) {
    return "";
  }

  return String(Math.min(99, Math.max(0, parsedValue)));
}

function getGridDimensionValue(rawValue: string): number {
  if (!rawValue.trim()) {
    return 0;
  }

  const parsedValue = Number(rawValue);

  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return Math.min(99, Math.max(0, parsedValue));
}

function handleNumericInputFocus(event: FocusEvent<HTMLInputElement>) {
  event.target.select();
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

function getVisibilityLabel(visibility: MapVisibility): string {
  if (visibility === "official") {
    return "Official";
  }

  if (visibility === "public") {
    return "Public";
  }

  return "Private";
}

function convertSavedMapToEditorSystems(
  savedMap: MapEditorSavedMap
): MapEditorSystem[] {
  return savedMap.systems.map((system) => ({
    client_id: String(system.id),
    name: system.name,
    x: system.x,
    y: system.y,
    system_type: system.system_type,
    archive_level: system.archive_level,
    mineral_slots: system.mineral_slots,
    energy_slots: system.energy_slots,
    storage_slots: system.storage_slots,
    research_center_slots: system.research_center_slots
  }));
}

function convertSavedMapToEditorConnections(
  savedMap: MapEditorSavedMap
): MapEditorConnection[] {
  return savedMap.connections.map((connection) => ({
    from_client_id: String(connection.from_system_id),
    to_client_id: String(connection.to_system_id),
    is_dangerous: connection.is_dangerous,
    is_wraparound: connection.is_wraparound
  }));
}

export default function MapEditor() {
  const [mapName, setMapName] = useState<string>("New Archont Map");
  const [playersCount, setPlayersCount] = useState<number>(2);

  const [gridWidthInput, setGridWidthInput] = useState<string>("20");
  const [gridHeightInput, setGridHeightInput] = useState<string>("20");

  const gridWidth = getGridDimensionValue(gridWidthInput);
  const gridHeight = getGridDimensionValue(gridHeightInput);

  const [savedMaps, setSavedMaps] = useState<MapEditorMapSummary[]>([]);
  const [selectedSavedMapId, setSelectedSavedMapId] = useState<number | null>(
    null
  );
  const [editingMapId, setEditingMapId] = useState<number | null>(null);

  const [openedMapCanEdit, setOpenedMapCanEdit] = useState<boolean>(true);
  const [openedMapCanDelete, setOpenedMapCanDelete] = useState<boolean>(true);
  const [openedMapVisibility, setOpenedMapVisibility] =
    useState<MapVisibility>("private");
  const [openedMapIsMine, setOpenedMapIsMine] = useState<boolean>(true);

  const [isLoadingSavedMaps, setIsLoadingSavedMaps] =
    useState<boolean>(false);
  const [isLoadingMapForEdit, setIsLoadingMapForEdit] =
    useState<boolean>(false);
  const [isDeletingMap, setIsDeletingMap] = useState<boolean>(false);

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

  const boardWidth = gridWidth * CELL_SIZE;
  const boardHeight = gridHeight * CELL_SIZE;

  useEffect(() => {
    loadSavedMaps();
  }, []);

  function getSystemAtPosition(
    x: number,
    y: number
  ): MapEditorSystem | undefined {
    return systems.find((system) => system.x === x && system.y === y);
  }

  function getSystemById(clientId: string): MapEditorSystem | undefined {
    return systems.find((system) => system.client_id === clientId);
  }

  function applyOpenedMapPermissions(savedMap: MapEditorSavedMap) {
    setOpenedMapCanEdit(savedMap.can_edit);
    setOpenedMapCanDelete(savedMap.can_delete);
    setOpenedMapVisibility(savedMap.visibility);
    setOpenedMapIsMine(savedMap.is_owned_by_current_user);
  }

  function resetOpenedMapPermissions() {
    setOpenedMapCanEdit(true);
    setOpenedMapCanDelete(true);
    setOpenedMapVisibility("private");
    setOpenedMapIsMine(true);
  }

  async function loadSavedMaps() {
    try {
      setIsLoadingSavedMaps(true);
      setError("");

      const loadedMaps = await getEditorMaps();
      const activeMaps = loadedMaps.filter((map) => map.is_active);

      setSavedMaps(activeMaps);

      if (activeMaps.length > 0 && selectedSavedMapId === null) {
        setSelectedSavedMapId(activeMaps[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved maps");
    } finally {
      setIsLoadingSavedMaps(false);
    }
  }

  async function openSavedMap(mapId: number) {
    try {
      setIsLoadingMapForEdit(true);
      setError("");
      setSuccessMessage("");

      const savedMap = await getEditorMap(mapId);

      setEditingMapId(savedMap.id);
      setSelectedSavedMapId(savedMap.id);

      applyOpenedMapPermissions(savedMap);

      setMapName(savedMap.name);
      setPlayersCount(savedMap.players_count);

      setGridWidthInput(String(savedMap.grid_width));
      setGridHeightInput(String(savedMap.grid_height));

      setSystems(convertSavedMapToEditorSystems(savedMap));
      setConnections(convertSavedMapToEditorConnections(savedMap));

      setSelectedSystemId(null);
      setSelectedConnectionKey(null);
      setConnectFromId(null);
      setMode("select");

      setSuccessMessage(`Map "${savedMap.name}" opened`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open map");
    } finally {
      setIsLoadingMapForEdit(false);
    }
  }

  function handleResetEditor() {
    setMapName("New Archont Map");
    setPlayersCount(2);
    setGridWidthInput("20");
    setGridHeightInput("20");
    setSystems([]);
    setConnections([]);
    setSelectedSystemId(null);
    setSelectedConnectionKey(null);
    setConnectFromId(null);
    setMode("select");
    setEditingMapId(null);
    resetOpenedMapPermissions();
    setError("");
    setSuccessMessage("");
  }

  async function handleDeleteOpenedMap() {
    if (editingMapId === null) {
      setError("Open a saved map before deleting");
      return;
    }

    if (!openedMapCanDelete) {
      setError("You cannot delete this map");
      return;
    }

    const confirmed = window.confirm(
      "Delete this map? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingMap(true);
      setError("");
      setSuccessMessage("");

      await deleteEditorMap(editingMapId);

      setSuccessMessage("Map deleted successfully");

      handleResetEditor();
      await loadSavedMaps();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete map");
    } finally {
      setIsDeletingMap(false);
    }
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

  function updateSelectedSystem(updates: Partial<MapEditorSystem>) {
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

  function moveSelectedSystem(nextX: number, nextY: number) {
    if (!selectedSystemId) {
      return;
    }

    if (gridWidth === 0 || gridHeight === 0) {
      setError(
        "Grid must have width and height greater than 0 before moving systems"
      );
      return;
    }

    const boundedX = Math.min(gridWidth - 1, Math.max(0, nextX));
    const boundedY = Math.min(gridHeight - 1, Math.max(0, nextY));

    const positionIsOccupied = systems.some(
      (system) =>
        system.client_id !== selectedSystemId &&
        system.x === boundedX &&
        system.y === boundedY
    );

    if (positionIsOccupied) {
      setError("Another system already occupies this position");
      return;
    }

    setSystems((currentSystems) =>
      currentSystems.map((system) => {
        if (system.client_id !== selectedSystemId) {
          return system;
        }

        return {
          ...system,
          x: boundedX,
          y: boundedY
        };
      })
    );

    setError("");
    setSuccessMessage("");
  }

  function updateSelectedConnection(updates: Partial<MapEditorConnection>) {
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
      currentSystems.filter((system) => system.client_id !== selectedSystemId)
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

    if (gridWidth < 5 || gridHeight < 5) {
      return "Grid size must be at least 5x5 before saving";
    }

    if (systems.length === 0) {
      return "Map must contain at least one system";
    }

    if (systems.length > 99) {
      return "Map cannot contain more than 99 systems";
    }

    const outsideSystem = systems.find(
      (system) =>
        system.x < 0 ||
        system.y < 0 ||
        system.x >= gridWidth ||
        system.y >= gridHeight
    );

    if (outsideSystem) {
      return `System "${outsideSystem.name}" is outside the grid`;
    }

    if (startSystemsCount !== playersCount) {
      return `Start systems count must be equal to players count. Expected ${playersCount}, got ${startSystemsCount}`;
    }

    if (systems.length > 1 && connections.length === 0) {
      return "Map with multiple systems must have connections";
    }

    return null;
  }

  function buildSavePayload(
    payloadName: string,
    payloadSystems: MapEditorSystem[],
    payloadConnections: MapEditorConnection[]
  ): MapEditorSavePayload {
    return {
      name: payloadName,
      players_count: playersCount,
      grid_width: gridWidth,
      grid_height: gridHeight,
      systems: payloadSystems.map((system) => ({
        ...system,
        archive_level:
          system.system_type === "archive" ? system.archive_level ?? 1 : null
      })),
      connections: payloadConnections
    };
  }

  async function handleSaveMap() {
    if (editingMapId !== null && !openedMapCanEdit) {
      setError("This map is read-only. Use Save as new to create your copy.");
      setSuccessMessage("");
      return;
    }

    const validationError = validateBeforeSave();

    if (validationError) {
      setError(validationError);
      setSuccessMessage("");
      return;
    }

    const payload = buildSavePayload(mapName.trim(), systems, connections);

    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      if (editingMapId === null) {
        const savedMap = await createEditorMap(payload);

        setEditingMapId(savedMap.id);
        setSelectedSavedMapId(savedMap.id);
        applyOpenedMapPermissions(savedMap);

        setSuccessMessage(`Map saved successfully. Map ID: ${savedMap.id}`);
      } else {
        const updatedMap = await updateEditorMap(editingMapId, payload);

        applyOpenedMapPermissions(updatedMap);

        setSuccessMessage(`Map "${updatedMap.name}" updated successfully`);
      }

      await loadSavedMaps();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save map");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAsNewMap() {
    const validationError = validateBeforeSave();

    if (validationError) {
      setError(validationError);
      setSuccessMessage("");
      return;
    }

    const oldIdToNewId = new Map<string, string>();

    const copiedSystems = systems.map((system) => {
      const newClientId = createClientId();

      oldIdToNewId.set(system.client_id, newClientId);

      return {
        ...system,
        client_id: newClientId
      };
    });

    const copiedConnections = connections.map((connection) => ({
      from_client_id:
        oldIdToNewId.get(connection.from_client_id) ??
        connection.from_client_id,
      to_client_id:
        oldIdToNewId.get(connection.to_client_id) ?? connection.to_client_id,
      is_dangerous: connection.is_dangerous,
      is_wraparound: connection.is_wraparound
    }));

    const copiedMapName = `${mapName.trim()} Copy`;

    const payload = buildSavePayload(
      copiedMapName,
      copiedSystems,
      copiedConnections
    );

    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const savedMap = await createEditorMap(payload);

      setEditingMapId(savedMap.id);
      setSelectedSavedMapId(savedMap.id);
      setMapName(savedMap.name);
      setSystems(convertSavedMapToEditorSystems(savedMap));
      setConnections(convertSavedMapToEditorConnections(savedMap));
      setSelectedSystemId(null);
      setSelectedConnectionKey(null);
      setConnectFromId(null);
      applyOpenedMapPermissions(savedMap);

      setSuccessMessage(`Map saved as new map. Map ID: ${savedMap.id}`);

      await loadSavedMaps();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save map as new");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="map-editor-page">
      <header className="map-editor-header">
        <div>
          <h1>Map Editor</h1>
          <p>Create playable maps for future Archont simulations.</p>
        </div>

        <div className="map-editor-header-actions">
          <button onClick={handleResetEditor}>New map</button>

          {editingMapId !== null && (
            <button onClick={handleSaveAsNewMap} disabled={isSaving}>
              Save as new
            </button>
          )}

          {editingMapId !== null && openedMapCanDelete && (
            <button
              className="danger-button"
              onClick={handleDeleteOpenedMap}
              disabled={isDeletingMap}
            >
              {isDeletingMap ? "Deleting..." : "Delete map"}
            </button>
          )}

          <button
            className="primary-button"
            onClick={handleSaveMap}
            disabled={isSaving || (editingMapId !== null && !openedMapCanEdit)}
          >
            {isSaving
              ? "Saving..."
              : editingMapId === null
                ? "Save map"
                : "Update map"}
          </button>

          {editingMapId !== null && !openedMapCanEdit && (
            <div className="map-editor-readonly-note">
              This map is read-only. Use “Save as new” to create your editable
              copy.
            </div>
          )}
        </div>
      </header>

      {error && <div className="map-editor-error">{error}</div>}

      {successMessage && (
        <div className="map-editor-success">{successMessage}</div>
      )}

      <section className="map-editor-layout">
        <aside className="map-editor-panel">
          <h2>Saved maps</h2>

          <div className="map-editor-saved-maps">
            <select
              value={selectedSavedMapId ?? ""}
              onChange={(event) =>
                setSelectedSavedMapId(Number(event.target.value))
              }
              disabled={isLoadingSavedMaps || savedMaps.length === 0}
            >
              {savedMaps.length === 0 && (
                <option value="">
                  {isLoadingSavedMaps ? "Loading maps..." : "No saved maps"}
                </option>
              )}

              {savedMaps.map((savedMap) => (
                <option key={savedMap.id} value={savedMap.id}>
                  #{savedMap.id} · {savedMap.name} · {savedMap.players_count}P ·{" "}
                  {getVisibilityLabel(savedMap.visibility)}
                  {savedMap.is_owned_by_current_user ? " · Mine" : ""}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (selectedSavedMapId !== null) {
                  openSavedMap(selectedSavedMapId);
                }
              }}
              disabled={
                selectedSavedMapId === null ||
                isLoadingMapForEdit ||
                savedMaps.length === 0
              }
            >
              {isLoadingMapForEdit ? "Opening..." : "Open selected map"}
            </button>

            {editingMapId !== null && (
              <div className="map-editor-editing-badge">
                Editing map ID: {editingMapId}
                <br />
                Visibility: {getVisibilityLabel(openedMapVisibility)}
                <br />
                {openedMapIsMine ? "Owned by you" : "Shared map"}
              </div>
            )}
          </div>

          <hr className="map-editor-panel-divider" />

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
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={gridWidthInput}
                onFocus={handleNumericInputFocus}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setGridWidthInput(
                    normalizeGridDimensionInput(event.target.value)
                  )
                }
              />
            </label>

            <label>
              Height
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={gridHeightInput}
                onFocus={handleNumericInputFocus}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setGridHeightInput(
                    normalizeGridDimensionInput(event.target.value)
                  )
                }
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

              <div className="map-editor-grid-size">
                <label>
                  X position
                  <input
                    type="text"
                    inputMode="numeric"
                    value={String(selectedSystem.x)}
                    onFocus={handleNumericInputFocus}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      moveSelectedSystem(
                        normalizeIntegerInput(
                          event.target.value,
                          selectedSystem.x,
                          0,
                          Math.max(0, gridWidth - 1)
                        ),
                        selectedSystem.y
                      )
                    }
                  />
                </label>

                <label>
                  Y position
                  <input
                    type="text"
                    inputMode="numeric"
                    value={String(selectedSystem.y)}
                    onFocus={handleNumericInputFocus}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      moveSelectedSystem(
                        selectedSystem.x,
                        normalizeIntegerInput(
                          event.target.value,
                          selectedSystem.y,
                          0,
                          Math.max(0, gridHeight - 1)
                        )
                      )
                    }
                  />
                </label>
              </div>

              <h3>Building slots</h3>

              <label>
                Mine slots
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(selectedSystem.mineral_slots)}
                  onFocus={handleNumericInputFocus}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateSelectedSystem({
                      mineral_slots: normalizeIntegerInput(
                        event.target.value,
                        selectedSystem.mineral_slots,
                        0,
                        9
                      )
                    })
                  }
                />
              </label>

              <label>
                Power plant slots
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(selectedSystem.energy_slots)}
                  onFocus={handleNumericInputFocus}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateSelectedSystem({
                      energy_slots: normalizeIntegerInput(
                        event.target.value,
                        selectedSystem.energy_slots,
                        0,
                        9
                      )
                    })
                  }
                />
              </label>

              <label>
                Supply depot slots
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(selectedSystem.storage_slots)}
                  onFocus={handleNumericInputFocus}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateSelectedSystem({
                      storage_slots: normalizeIntegerInput(
                        event.target.value,
                        selectedSystem.storage_slots,
                        0,
                        9
                      )
                    })
                  }
                />
              </label>

              <label>
                Research center slots
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(selectedSystem.research_center_slots)}
                  onFocus={handleNumericInputFocus}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateSelectedSystem({
                      research_center_slots: normalizeIntegerInput(
                        event.target.value,
                        selectedSystem.research_center_slots,
                        0,
                        9
                      )
                    })
                  }
                />
              </label>

              <button className="danger-button" onClick={deleteSelectedSystem}>
                Delete system
              </button>
            </div>
          )}

          {!selectedSystem && selectedConnection && (
            <div className="map-editor-selected-card">
              <h3>Connection</h3>

              <div className="map-editor-checkbox-group">
                <label className="map-editor-checkbox-row">
                  <span>Dangerous corridor</span>

                  <input
                    type="checkbox"
                    checked={selectedConnection.is_dangerous}
                    onChange={(event) =>
                      updateSelectedConnection({
                        is_dangerous: event.target.checked
                      })
                    }
                  />
                </label>

                <label className="map-editor-checkbox-row">
                  <span>Wraparound through map edge</span>

                  <input
                    type="checkbox"
                    checked={selectedConnection.is_wraparound}
                    onChange={(event) =>
                      updateSelectedConnection({
                        is_wraparound: event.target.checked
                      })
                    }
                  />
                </label>
              </div>

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