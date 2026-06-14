import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleStartSession() {
    navigate("/game/sessions/new");
  }

  return (
    <div style={{ padding: "32px" }}>
      <h1>Home page</h1>

      <p>Welcome {user?.nickname}</p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "220px"
        }}
      >
        <button onClick={handleStartSession}>
          Start session
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