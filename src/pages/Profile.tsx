import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { updateMyNickname, updateMyPassword } from "../api/userApi";
import { useAuth } from "../auth/AuthContext";
import PasswordInput from "../components/PasswordInput";
import "./Profile.css";

type ProfileFieldErrors = {
  nickname?: string;
  oldPassword?: string;
  newPassword?: string;
  newPasswordConfirm?: string;
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

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [nickname, setNickname] = useState<string>(user?.nickname ?? "");

  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState<string>("");

  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

  const [profileMessage, setProfileMessage] = useState<string>("");
  const [passwordMessage, setPasswordMessage] = useState<string>("");

  const [profileError, setProfileError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const [isSavingNickname, setIsSavingNickname] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);

  async function handleUpdateNickname(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedNickname = nickname.trim();

    if (!/^[A-Za-z0-9_]{3,32}$/.test(trimmedNickname)) {
      setFieldErrors({
        nickname:
          "Nickname may contain only Latin letters, numbers and underscore. Spaces are not allowed."
      });
      setProfileError("");
      setProfileMessage("");
      return;
    }

    if (trimmedNickname === user?.nickname) {
  setFieldErrors({
    nickname: "Seems that nothing changed, commander..."
  });
  setProfileError("");
  setProfileMessage("");
  return;
}

    try {
      setIsSavingNickname(true);
      setProfileError("");
      setProfileMessage("");
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        nickname: undefined
      }));

      await updateMyNickname(trimmedNickname);
      await refreshUser();

      setNickname(trimmedNickname);
      setProfileMessage("Nickname updated successfully.");
    } catch (err) {
      const detail = getApiErrorDetail(err);

      if (detail.toLowerCase().includes("nickname")) {
        setFieldErrors({
          nickname: detail
        });
        setProfileError("");
        return;
      }

      setProfileError(detail || "Failed to update nickname");
    } finally {
      setIsSavingNickname(false);
    }
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: ProfileFieldErrors = {};

    if (!oldPassword) {
      nextErrors.oldPassword = "Old password is required.";
    }

    if (newPassword.length < 8) {
      nextErrors.newPassword =
        "New password must contain at least 8 characters.";
    }

    if (!newPasswordConfirm) {
      nextErrors.newPasswordConfirm = "Repeat new password is required.";
    } else if (newPassword !== newPasswordConfirm) {
      nextErrors.newPasswordConfirm = "New passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setPasswordError("");
      setPasswordMessage("");
      return;
    }

    try {
      setIsSavingPassword(true);
      setPasswordError("");
      setPasswordMessage("");
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        oldPassword: undefined,
        newPassword: undefined,
        newPasswordConfirm: undefined
      }));

      await updateMyPassword(oldPassword, newPassword, newPasswordConfirm);

      setOldPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");

      setPasswordMessage("Password updated successfully.");
    } catch (err) {
      const detail = getApiErrorDetail(err);
      const normalizedDetail = detail.toLowerCase();

      if (normalizedDetail.includes("old password")) {
        setFieldErrors({
          oldPassword: detail || "Old password is incorrect."
        });
        setPasswordError("");
        return;
      }

      if (normalizedDetail.includes("new passwords")) {
        setFieldErrors({
          newPasswordConfirm: detail || "New passwords do not match."
        });
        setPasswordError("");
        return;
      }

      if (normalizedDetail.includes("password")) {
        setFieldErrors({
          newPassword: detail || "Password is invalid."
        });
        setPasswordError("");
        return;
      }

      setPasswordError(detail || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="profile-page">
      <section className="profile-card">
        <div className="profile-card-topbar">
          <Link className="profile-back-button" to="/">
            ← Back to Home page
          </Link>
        </div>

        <div className="profile-header">
          <div>
            <p className="profile-kicker">Commander profile</p>
            <h1>{user?.nickname ?? "Profile"}</h1>
            <p>Manage your Archont account identity and access credentials.</p>
          </div>
        </div>

        <div className="profile-grid">
          <section className="profile-panel">
            <h2>Account information</h2>

            <div className="profile-info-row">
              <span>Email</span>
              <strong>{user?.email}</strong>
            </div>

            <div className="profile-info-row">
              <span>Nickname</span>
              <strong>{user?.nickname}</strong>
            </div>
          </section>

          <section className="profile-panel">
            <h2>Change nickname</h2>

            {profileError && (
              <div className="profile-error">{profileError}</div>
            )}

            {profileMessage && (
              <div className="profile-success">{profileMessage}</div>
            )}

            <form className="profile-form" onSubmit={handleUpdateNickname}>
              <label className={fieldErrors.nickname ? "has-error" : ""}>
                New nickname
                <input
                  value={nickname}
                  onChange={(event) => {
                    setNickname(event.target.value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      nickname: undefined
                    }));
                  }}
                  placeholder="Commander nickname"
                />
                {fieldErrors.nickname ? (
                  <span className="profile-field-error">
                    {fieldErrors.nickname}
                  </span>
                ) : (
                  <span className="profile-field-error">
                    Use Latin letters, numbers or underscore. Spaces are not
                    allowed.
                  </span>
                )}
              </label>

              <button
                className="archont-primary-button"
                type="submit"
                disabled={isSavingNickname}
              >
                {isSavingNickname ? "Saving..." : "Update nickname"}
              </button>
            </form>
          </section>

          <section className="profile-panel profile-panel-wide">
            <h2>Change password</h2>

            {passwordError && (
              <div className="profile-error">{passwordError}</div>
            )}

            {passwordMessage && (
              <div className="profile-success">{passwordMessage}</div>
            )}

            <form className="profile-form" onSubmit={handleUpdatePassword}>
              <label className={fieldErrors.oldPassword ? "has-error" : ""}>
                Old password
                <PasswordInput
                  value={oldPassword}
                  onChange={(value) => {
                    setOldPassword(value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      oldPassword: undefined
                    }));
                  }}
                  placeholder="Enter old password"
                  autoComplete="current-password"
                />
                {fieldErrors.oldPassword && (
                  <span className="profile-field-error">
                    {fieldErrors.oldPassword}
                  </span>
                )}
              </label>

              <label className={fieldErrors.newPassword ? "has-error" : ""}>
                New password
                <PasswordInput
                  value={newPassword}
                  onChange={(value) => {
                    setNewPassword(value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      newPassword: undefined
                    }));
                  }}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  preventClipboard
                />
                {fieldErrors.newPassword && (
                  <span className="profile-field-error">
                    {fieldErrors.newPassword}
                  </span>
                )}
              </label>

              <label
                className={
                  fieldErrors.newPasswordConfirm ? "has-error" : ""
                }
              >
                Repeat new password
                <PasswordInput
                  value={newPasswordConfirm}
                  onChange={(value) => {
                    setNewPasswordConfirm(value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      newPasswordConfirm: undefined
                    }));
                  }}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  preventClipboard
                />
                {fieldErrors.newPasswordConfirm && (
                  <span className="profile-field-error">
                    {fieldErrors.newPasswordConfirm}
                  </span>
                )}
              </label>

              <button
                className="archont-primary-button"
                type="submit"
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Saving..." : "Update password"}
              </button>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}