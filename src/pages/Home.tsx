import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { createGameSession } from "../api/gameApi";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string>("");
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);

  async function handleCreateSession() {
    try {
      setIsCreatingSession(true);
      setError("");

      const newSession = await createGameSession(1, "Untitled session");

      navigate(`/game/sessions/${newSession.id}/setup`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setIsCreatingSession(false);
    }
  }

  return (
    <div style={{ padding: "32px" }}>
      <h1>Home page</h1>

      <p>Welcome {user?.nickname}</p>

      {error && (
        <div style={{ color: "red", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "220px"
  }}
>
  <button onClick={handleCreateSession} disabled={isCreatingSession}>
    {isCreatingSession ? "Creating..." : "Start session"}
  </button>

  <Link to="/game/sessions">
    <button style={{ width: "100%" }}>Sessions list</button>
  </Link>

  <Link to="/map-editor">
    <button style={{ width: "100%" }}>Map editor</button>
  </Link>

  <div style={{ marginTop: "24px" }}>
    <button onClick={logout}>Logout</button>
  </div>
</div>
    </div>
  );
}