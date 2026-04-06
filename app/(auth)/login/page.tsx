"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

function IconGoogle() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Mock: call /api/auth/login — redirect to student home for now
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push("/student/home");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #E8E8E8",
          padding: "40px 36px",
          boxShadow: "0 4px 24px rgba(26,26,26,0.07)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "32px",
          }}
        >
          <Logo variant="default" size="md" />
        </div>

        {/* Title */}
        <h1
          className="le-h2"
          style={{ textAlign: "center", marginBottom: "8px" }}
        >
          Se connecter
        </h1>
        <p
          className="le-body"
          style={{ textAlign: "center", marginBottom: "32px" }}
        >
          Accédez à votre espace salon
        </p>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              background: "#FDEAEA",
              border: "1px solid #E3001B",
              borderRadius: "6px",
              padding: "10px 14px",
              marginBottom: "20px",
              fontSize: "14px",
              color: "#B0001A",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <Input
              id="email"
              type="email"
              label="Adresse email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div style={{ textAlign: "right" }}>
              <a
                href="/forgot-password"
                style={{
                  fontSize: "13px",
                  color: "#E3001B",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Mot de passe oublié ?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </div>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "24px 0",
          }}
        >
          <div
            style={{ flex: 1, height: "1px", background: "#E8E8E8" }}
            aria-hidden="true"
          />
          <span
            style={{ fontSize: "12px", color: "#6B6B6B", whiteSpace: "nowrap" }}
          >
            ou continuer avec
          </span>
          <div
            style={{ flex: 1, height: "1px", background: "#E8E8E8" }}
            aria-hidden="true"
          />
        </div>

        {/* Google button */}
        <button
          type="button"
          className="le-btn-base le-btn-ghost"
          style={{ width: "100%", gap: "10px" }}
        >
          <IconGoogle />
          Continuer avec Google
        </button>

        {/* Links */}
        <div
          style={{
            marginTop: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "14px", color: "#3D3D3D" }}>
            Pas encore de compte ?{" "}
            <a
              href="/register"
              style={{
                color: "#E3001B",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              S&apos;inscrire
            </a>
          </p>
          <a
            href="/exhibitor/login"
            style={{
              fontSize: "13px",
              color: "#6B6B6B",
              textDecoration: "none",
            }}
          >
            Accès établissement →
          </a>
        </div>
      </div>
    </div>
  );
}
