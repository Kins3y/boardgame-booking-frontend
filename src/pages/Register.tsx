import { useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post("/user/create/", {
        email,
        password,
        nickname,
      });

      navigate("/login");
   } catch (err: any) {
  if (err.response?.data?.detail) {
    setError(err.response.data.detail);
  } else {
    setError("Registration failed");
  }
} finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h1>Register</h1>

      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleRegister} disabled={loading}>
        {loading ? "Creating..." : "Create account"}
      </button>


      {error && (
        <p style={{ color: "red", marginTop: 10 }}>
          {error}
        </p>
      )}
    </div>
  );
}