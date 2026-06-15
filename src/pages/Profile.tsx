import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import PasswordInput from "../components/PasswordInput";
import { updateMyNickname, updateMyPassword } from "../api/userApi";
import { Link } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [nickname, setNickname] = useState<string>(user?.nickname ?? "");

  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState<string>("");

  const [profileMessage, setProfileMessage] = useState<string>("");
  const [passwordMessage, setPasswordMessage] = useState<string>("");

  const [profileError, setProfileError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const [isSavingNickname, setIsSavingNickname] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);

  async function handleUpdateNickname(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSavingNickname(true);
      setProfileError("");
      setProfileMessage("");

      await updateMyNickname(nickname);
      await refreshUser();

      setProfileMessage("Nickname updated successfully.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to update nickname"
      );
    } finally {
      setIsSavingNickname(false);
    }
  }

  async function handleUpdatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== newPasswordConfirm) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must contain at least 8 characters.");
      return;
    }

    try {
      setIsSavingPassword(true);
      setPasswordError("");
      setPasswordMessage("");

      await updateMyPassword(oldPassword, newPassword, newPasswordConfirm);

      setOldPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");

      setPasswordMessage("Password updated successfully.");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to update password"
      );
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
              <label>
                New nickname
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="Commander nickname"
                />
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
              <label>
                Old password
                <PasswordInput
                  value={oldPassword}
                  onChange={setOldPassword}
                  placeholder="Enter old password"
                  autoComplete="current-password"
                />
              </label>

              <label>
                New password
                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  preventClipboard
                />
              </label>

              <label>
                Repeat new password
                <PasswordInput
                  value={newPasswordConfirm}
                  onChange={setNewPasswordConfirm}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  preventClipboard
                />
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