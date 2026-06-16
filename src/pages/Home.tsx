import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./MarketingPages.css";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleStartSession() {
    navigate("/game/sessions/new");
  }

  return (
    <div className="archont-page">
      <section className="archont-home-card">
        <div className="archont-home-topbar">
  <Link to="/profile" className="archont-profile-link">
    Profile
  </Link>
</div>
        <div className="archont-home-header">
          <div className="archont-home-user">
            COMMAND NODE · {user?.nickname ?? "Player"}
          </div>

          <h1>ARCHONT</h1>

          <p>
            Build civilizations, fight for ancient archives, control routes
            across the galaxy and awaken the Archont before your rivals do.
          </p>
        </div>

        <div className="archont-home-actions">

          <button
            className="archont-primary-button"
            onClick={handleStartSession}
          >
            Start new session
          </button>

          <Link to="/game/sessions">
            <button className="archont-secondary-button">
              Sessions list
            </button>
          </Link>

          <Link to="/map-editor">
            <button className="archont-secondary-button">
              Map editor
            </button>
          </Link>

          <Link to="/patch-notes" className="archont-secondary-button">
              Patch Notes
          </Link>

          <button
            className="archont-danger-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </section>
    </div>
  );
}