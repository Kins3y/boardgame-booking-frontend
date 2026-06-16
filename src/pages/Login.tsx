import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import PasswordInput from "../components/PasswordInput";
import PixelSpaceBackground from "../components/PixelSpaceBackground";
import "./MarketingPages.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");

      const response = await api.post("/auth/login", {
        email,
        password
      });

      await login(response.data.access_token);

      navigate("/");
    } catch (err) {
      console.error("Login error", err);
      setError("Invalid credentials. Check your email/nickname and password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="archont-page archont-space-page">
      <PixelSpaceBackground />
      <section className="archont-card">
        <div className="archont-hero">
          <div className="archont-logo">ARCHONT PROTOCOL</div>

          <div className="archont-hero-content">
            <p className="archont-kicker">Board game command system</p>

            <h1 className="archont-title">
              Enter the war for the ancient archives.
            </h1>

            <p className="archont-description">
              Prepare maps, launch sessions, choose civilizations and turn the
              galaxy into a strategic battlefield.
            </p>
          </div>

          <div className="archont-features">
            <span className="archont-feature-pill">Asymmetric factions</span>
            <span className="archont-feature-pill">Archive race</span>
            <span className="archont-feature-pill">Strategic map editor</span>
          </div>
        </div>

        <div className="archont-form-side">
          <div className="archont-form-header">
            <h1>Login</h1>
            <p>Resume command and continue building your Archont session.</p>
          </div>

          <form className="archont-form" onSubmit={handleLogin}>
            {error && <div className="archont-error">{error}</div>}

            <label className="archont-field">
              Email or nickname
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="commander@archont.net"
                autoComplete="username"
              />
            </label>

            <label className="archont-field">
  Password
  <PasswordInput
    value={password}
    onChange={setPassword}
    placeholder="Enter password"
    autoComplete="current-password"
  />
</label>

            <button
              className="archont-primary-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entering..." : "Enter command deck"}
            </button>
          </form>

          <div className="archont-form-footer">
            No account yet? <Link to="/register">Create commander profile</Link>
          </div>
        </div>
      </section>
    </div>
  );
}