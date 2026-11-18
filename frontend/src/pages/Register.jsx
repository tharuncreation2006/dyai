
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleRegister}>
        <div className="brand-icon">✦</div>
        <h1>Create your account</h1>
        <p className="muted">Start building AI chatbots</p>

        {error && <p className="error">{String(error)}</p>}

        <label>Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />

        <label>Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          placeholder="Create a password"
          required
        />

        <button disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="muted">
          Already registered? <Link to="/">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
