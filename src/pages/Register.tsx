import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import PasswordInput from "../components/PasswordInput";
import "./MarketingPages.css";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (!trimmedNickname) {
      setError("Nickname is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await api.post("/user/create/", {
        email: trimmedEmail,
        nickname: trimmedNickname,
        password,
        password_confirm: passwordConfirm
      });

      navigate("/login");
    } catch (err) {
      console.error("Register error", err);

      setError(
        "Registration failed. Check fields or try another nickname/email."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="archont-page">
      <section className="archont-card">
        <div className="archont-hero">
          <div className="archont-logo">NEW COMMANDER</div>

          <div className="archont-hero-content">
            <p className="archont-kicker">Join the table</p>

            <h1 className="archont-title">
              Claim your civilization among the stars.
            </h1>

            <p className="archont-description">
              Create a profile, enter the strategic layer and prepare for the
              race to awaken the Archont.
            </p>
          </div>

          <div className="archont-features">
            <span className="archont-feature-pill">Create maps</span>
            <span className="archont-feature-pill">Start sessions</span>
            <span className="archont-feature-pill">Fight for archives</span>
          </div>
        </div>

        <div className="archont-form-side">
          <div className="archont-form-header">
            <h1>Create profile</h1>
            <p>Register your commander identity and prepare for deployment.</p>
          </div>

          <form className="archont-form" onSubmit={handleRegister}>
            {error && <div className="archont-error">{error}</div>}

            <label className="archont-field">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="commander@archont.net"
                autoComplete="email"
              />
            </label>

            <label className="archont-field">
              Nickname
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Your commander name"
                autoComplete="nickname"
              />
            </label>

            <label className="archont-field">
              Password
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="Create password"
                autoComplete="new-password"
                preventClipboard
              />
            </label>

            <label className="archont-field">
              Repeat password
              <PasswordInput
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                placeholder="Repeat password"
                autoComplete="new-password"
                preventClipboard
              />
            </label>

            <button
              className="archont-primary-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create commander"}
            </button>
          </form>

          <div className="archont-form-footer">
            Already have access? <Link to="/login">Return to login</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
