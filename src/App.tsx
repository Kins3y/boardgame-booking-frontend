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

  const isLoginPage = location.pathname === "/login";
  const isHomePage = location.pathname === "/";
  const isRegisterPage = location.pathname === "/register";

  const shouldShowNavigationButton = !isLoginPage && !isHomePage;

  const navigationButtonTarget = isRegisterPage ? "/login" : "/";
  const navigationButtonText = isRegisterPage
    ? "Back to Login"
    : "Back to Home page";

  return (
    <div className="app-shell">
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