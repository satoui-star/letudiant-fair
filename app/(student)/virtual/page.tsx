"use client";
export const dynamic = 'force-dynamic'

import { useState } from "react";

const MOCK_VIRTUAL_EVENTS = [
  {
    id: "v1",
    title: "Salon virtuel — Grandes Écoles",
    date: "12 mai 2026",
    exhibitors: 48,
  },
  {
    id: "v2",
    title: "Salon virtuel — Universités",
    date: "26 mai 2026",
    exhibitors: 62,
  },
  {
    id: "v3",
    title: "Salon virtuel — BTS / BUT",
    date: "9 juin 2026",
    exhibitors: 35,
  },
];

const BENEFITS = [
  "Accès à tous les exposants depuis votre domicile",
  "Rendez-vous vidéo avec les conseillers d'admission",
  "Documents téléchargeables en illimité",
  "Replays des conférences disponibles 30 jours",
  "Idéal si vous ne pouvez pas vous déplacer",
];

export default function VirtualFairPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }
    setError("");
    setSubmitted(true);
  }

  return (
    <div
      className="page-with-nav"
      style={{ background: "#F4F4F4", minHeight: "100vh", paddingBottom: 40 }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "24px 20px 20px",
          borderBottom: "1px solid #E8E8E8",
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <span
            className="le-tag le-tag-yellow"
            style={{
              display: "inline-block",
              padding: "4px 12px",
              background: "#FCD716",
              color: "#1A1A1A",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Bientôt disponible
          </span>
        </div>
        <h1
          className="le-h1"
          style={{ margin: "0 0 8px", color: "#1A1A1A" }}
        >
          Salon en ligne L&apos;Étudiant
        </h1>
        <p
          className="le-body"
          style={{ color: "#6B6B6B", margin: 0 }}
        >
          Participez aux salons depuis chez vous — sans vous déplacer
        </p>
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        {/* Hero card */}
        <div
          style={{
            background: "linear-gradient(135deg, #1A1A1A 0%, #0066CC 100%)",
            borderRadius: 16,
            padding: "32px 24px",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative circles */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -20,
              left: -20,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(255,209,0,0.1)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                marginBottom: 20,
              }}
            >
              🖥️
            </div>
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#fff",
                margin: "0 0 8px",
              }}
            >
              Vivez le salon en ligne
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>
              Une expérience immersive avec des stands virtuels, des conférences en direct
              et des rendez-vous vidéo avec les conseillers.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "20px",
            marginBottom: 24,
            border: "1px solid #E8E8E8",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            Ce que vous pourrez faire
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {BENEFITS.map((benefit, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#FFF0F1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 6L4.5 8.5L10 3"
                      stroke="#EC1F27"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p style={{ fontSize: 14, color: "#1A1A1A", margin: 0, lineHeight: 1.5 }}>
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming virtual events — locked */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#6B6B6B",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 12,
          }}
        >
          Prochains salons en ligne
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {MOCK_VIRTUAL_EVENTS.map((event) => (
            <div
              key={event.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "16px",
                border: "1px solid #E8E8E8",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Lock overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(244,244,244,0.85)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                  borderRadius: 12,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🔒</div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", margin: 0 }}>
                    Disponible bientôt
                  </p>
                </div>
              </div>
              {/* Card content (blurred) */}
              <div style={{ filter: "blur(2px)" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px" }}>
                  {event.title}
                </p>
                <p style={{ fontSize: 13, color: "#6B6B6B", margin: "0 0 8px" }}>
                  {event.date} · {event.exhibitors} exposants
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Waitlist form */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "24px 20px",
            border: "2px solid #EC1F27",
          }}
        >
          {submitted ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#DCFCE7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: 28,
                }}
              >
                ✓
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#16A34A", margin: "0 0 6px" }}>
                Merci !
              </p>
              <p style={{ fontSize: 14, color: "#3D3D3D", margin: 0 }}>
                Vous serez parmi les premiers informés à l&apos;ouverture du salon virtuel.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: "0 0 6px" }}>
                Être notifié(e) à l&apos;ouverture
              </p>
              <p style={{ fontSize: 13, color: "#6B6B6B", margin: "0 0 16px" }}>
                Laissez votre email pour être prévenu(e) en avant-première.
              </p>
              <form onSubmit={handleSubmit} noValidate>
                <input
                  type="email"
                  className="le-input"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", marginBottom: 8, boxSizing: "border-box" }}
                  aria-label="Adresse email"
                />
                {error && (
                  <p style={{ fontSize: 12, color: "#EC1F27", margin: "0 0 8px" }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="le-btn-primary"
                  style={{
                    width: "100%",
                    padding: "13px",
                    background: "#EC1F27",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  S&apos;inscrire sur la liste d&apos;attente
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
