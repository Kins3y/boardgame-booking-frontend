import { useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
  try {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    const { access_token, refresh_token } = res.data;

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);

    await login(access_token);

    navigate("/");
  } catch (err) {
    console.error("Login error", err);
  }
};

  return (
  <div>
    <h1>Login</h1>

    <input
      placeholder="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />

    <input
      placeholder="password"
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />

    <button onClick={handleLogin}>Login</button>

    <p>
      No account? <Link to="/register">Register</Link>
    </p>
  </div>
);
}