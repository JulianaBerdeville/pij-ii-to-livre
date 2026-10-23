import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

function getRegistrationErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<{ detail?: unknown }>(error)) {
    return "Não foi possível criar a conta. Tente novamente.";
  }
  if (!error.response) {
    return "Não foi possível conectar à API. Verifique se o servidor está ativo.";
  }
  if (error.response.status === 422) {
    return "Dados inválidos. Confira as informações preenchidas.";
  }
  if (error.response.status < 500 && typeof error.response.data?.detail === "string") {
    return error.response.data.detail;
  }
  return "O servidor não conseguiu criar a conta. Tente novamente.";
}

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      try {
        await register({ full_name: fullName, email, password, phone, role });
      } catch (error) {
        setError(getRegistrationErrorMessage(error));
        return;
      }

      try {
        const user = await login(email, password);
        navigate(user.role === "owner" ? "/owner" : "/client");
      } catch {
        setError("Conta criada, mas não foi possível entrar. Faça login com seu e-mail e senha.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Criar conta</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nome completo
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Telefone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <label>
          Sou:
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="client">Cliente</option>
            <option value="owner">Proprietário</option>
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Enviando..." : "Cadastrar"}
        </button>
      </form>
      <p>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
