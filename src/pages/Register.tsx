import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import PasswordInput from "../components/PasswordInput";
import "./MarketingPages.css";

type RegisterFieldErrors = {
  email?: string;
  nickname?: string;
  password?: string;
  passwordConfirm?: string;
};

function getApiErrorDetail(error: unknown): string {
  const possibleError = error as {
    response?: {
      data?: {
        detail?: string | Array<{ msg?: string }>;
      };
    };
  };

  const detail = possibleError.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg)
      .filter(Boolean)
      .join(". ");
  }

  return detail ?? "";
}

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");

  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  function validateRegisterForm(): boolean {
    const nextErrors: RegisterFieldErrors = {};

    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    }

    if (!trimmedNickname) {
      nextErrors.nickname = "Nickname is required.";
    } else if (!/^[A-Za-z0-9_]{3,32}$/.test(trimmedNickname)) {
      nextErrors.nickname =
        "Nickname may contain only Latin letters, numbers and underscore. Spaces are not allowed.";
    }

    if (password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters.";
    }

    if (!passwordConfirm) {
      nextErrors.passwordConfirm = "Repeat password is required.";
    } else if (password !== passwordConfirm) {
      nextErrors.passwordConfirm = "Passwords do not match.";
    }

    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateRegisterForm()) {
      setError("");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();

    try {
      setIsSubmitting(true);
      setError("");
      setFieldErrors({});

      await api.post("/user/create/", {
        email: trimmedEmail,
        nickname: trimmedNickname,
        password,
        password_confirm: passwordConfirm
      });

      navigate("/login");
    } catch (err) {
      console.error("Register error", err);

      const detail = getApiErrorDetail(err);
      const normalizedDetail = detail.toLowerCase();

      if (normalizedDetail.includes("email")) {
        setFieldErrors({
          email: detail || "Email is invalid or already registered."
        });
        setError("");
        return;
      }

      if (normalizedDetail.includes("nickname")) {
        setFieldErrors({
          nickname: detail || "Nickname is invalid or already registered."
        });
        setError("");
        return;
      }

      if (normalizedDetail.includes("password")) {
        setFieldErrors({
          password: detail || "Password is invalid."
        });
        setError("");
        return;
      }

      setError(
        detail || "Registration failed. Check fields or try another nickname/email."
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

            <label
              className={`archont-field ${
                fieldErrors.email ? "has-error" : ""
              }`}
            >
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((currentErrors) => ({
                    ...currentErrors,
                    email: undefined
                  }));
                }}
                placeholder="commander@archont.net"
                autoComplete="email"
              />
              {fieldErrors.email && (
                <span className="archont-field-error">
                  {fieldErrors.email}
                </span>
              )}
            </label>

            <label
              className={`archont-field ${
                fieldErrors.nickname ? "has-error" : ""
              }`}
            >
              Nickname
              <input
                value={nickname}
                onChange={(event) => {
                  setNickname(event.target.value);
                  setFieldErrors((currentErrors) => ({
                    ...currentErrors,
                    nickname: undefined
                  }));
                }}
                placeholder="Your commander name"
                autoComplete="nickname"
              />
              {fieldErrors.nickname ? (
                <span className="archont-field-error">
                  {fieldErrors.nickname}
                </span>
              ) : (
                <span className="archont-field-error">
                  Use Latin letters, numbers or underscore. Spaces are not
                  allowed.
                </span>
              )}
            </label>

            <label
              className={`archont-field ${
                fieldErrors.password ? "has-error" : ""
              }`}
            >
              Password
              <PasswordInput
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setFieldErrors((currentErrors) => ({
                    ...currentErrors,
                    password: undefined
                  }));
                }}
                placeholder="Create password"
                autoComplete="new-password"
                preventClipboard
              />
              {fieldErrors.password && (
                <span className="archont-field-error">
                  {fieldErrors.password}
                </span>
              )}
            </label>

            <label
              className={`archont-field ${
                fieldErrors.passwordConfirm ? "has-error" : ""
              }`}
            >
              Repeat password
              <PasswordInput
                value={passwordConfirm}
                onChange={(value) => {
                  setPasswordConfirm(value);
                  setFieldErrors((currentErrors) => ({
                    ...currentErrors,
                    passwordConfirm: undefined
                  }));
                }}
                placeholder="Repeat password"
                autoComplete="new-password"
                preventClipboard
              />
              {fieldErrors.passwordConfirm && (
                <span className="archont-field-error">
                  {fieldErrors.passwordConfirm}
                </span>
              )}
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
