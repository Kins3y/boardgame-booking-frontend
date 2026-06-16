import { Routes, Route, Link, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProtectedRoute from "./auth/ProtectedRoute";
import Register from "./pages/Register";
import GameSession from "./pages/GameSession";
import GameSessionSetup from "./pages/GameSessionSetup";
import GamePlay from "./pages/GamePlay";
import SessionsList from "./pages/SessionsList";
import MapEditor from "./pages/MapEditor";
import CreateSession from "./pages/CreateSession";
import { useAuth } from "./auth/AuthContext";
import Profile from "./pages/Profile";
import PatchNotes from "./pages/PatchNotes";
import "./App.css";

export default function App() {
  const location = useLocation();
  const { user } = useAuth();

  const isLoginPage = location.pathname === "/login";
  const isHomePage = location.pathname === "/";
  const isRegisterPage = location.pathname === "/register";
  const isProfilePage = location.pathname === "/profile";
  const isPatchNotesPage = location.pathname === "/patch-notes";

  const shouldShowNavigationButton =
    !isLoginPage &&
    !isHomePage &&
    !isRegisterPage &&
    !isProfilePage &&
    !isPatchNotesPage;

  const navigationButtonTarget = "/";
  const navigationButtonText = "Back to Home page";

  return (
    <div className="app-shell">
      {user?.admin_badge && (
        <div className="admin-top-badge">
          {user.admin_badge}
        </div>
      )}

      {shouldShowNavigationButton && (
        <nav className="global-navigation">
          <Link to={navigationButtonTarget} className="global-home-button">
            {navigationButtonText}
          </Link>
        </nav>
      )}

      <main className="app-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/patch-notes" element={<PatchNotes />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game/sessions/new"
            element={
              <ProtectedRoute>
                <CreateSession />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game/session"
            element={
              <ProtectedRoute>
                <GameSession />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game/sessions"
            element={
              <ProtectedRoute>
                <SessionsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game/sessions/:sessionId/setup"
            element={
              <ProtectedRoute>
                <GameSessionSetup />
              </ProtectedRoute>
            }
          />

          <Route
            path="/map-editor"
            element={
              <ProtectedRoute>
                <MapEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game/sessions/:sessionId/play"
            element={
              <ProtectedRoute>
                <GamePlay />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}