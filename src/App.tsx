import { Routes, Route, Link, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProtectedRoute from "./auth/ProtectedRoute";
import Register from "./pages/Register";
import GameSession from "./pages/GameSession";
import GameSessionSetup from "./pages/GameSessionSetup";
import GamePlay from "./pages/GamePlay";
import SessionsList from "./pages/SessionsList";
import "./App.css";

export default function App() {
  const location = useLocation();

  const shouldShowHomeButton = location.pathname !== "/";

  return (
    <div className="app-shell">
      {shouldShowHomeButton && (
        <nav className="global-navigation">
          <Link to="/" className="global-home-button">
            Return to Home page
          </Link>
        </nav>
      )}

      <main className="app-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
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