"use client";

import Logo from "@/components/ui/Logo";
import StripeRule from "@/components/ui/StripeRule";

const roles = [
  {
    emoji: "🎓",
    title: "Étudiant(e)",
    description:
      "Découvrez des formations, préparez votre visite et suivez votre parcours d'orientation",
    href: "/onboarding?role=student",
    variant: "primary" as const,
    btnLabel: "Commencer →",
  },
  {
    emoji: "👨‍🏫",
    title: "Enseignant(e)",
    description:
      "Gérez votre groupe, inscrivez vos élèves et suivez leur engagement",
    href: "/onboarding?role=teacher",
    variant: "secondary" as const,
    btnLabel: "Commencer →",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "Parent",
    description:
      "Accompagnez votre enfant dans son orientation et suivez son exploration",
    href: "/onboarding?role=parent",
    variant: "secondary" as const,
    btnLabel: "Commencer →",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Hero — full-screen red gradient */}
      <section
        style={{
          background: "linear-gradient(150deg, #E3001B 0%, #C5001A 40%, #8B0016 70%, #003C8F 100%)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px 100px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div aria-hidden="true" style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div aria-hidden="true" style={{ position: "absolute", bottom: "-80px", left: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,209,0,0.07)" }} />
        <div aria-hidden="true" style={{ position: "absolute", top: "20%", left: "4%", width: "140px", height: "140px", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.08)" }} />
        <div aria-hidden="true" style={{ position: "absolute", bottom: "15%", right: "6%", width: "90px", height: "90px", borderRadius: "50%", border: "1.5px solid rgba(255,209,0,0.15)" }} />

        <div style={{ position: "relative", textAlign: "center", maxWidth: "640px", width: "100%" }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "48px" }}>
            <Logo variant="inverted" size="lg" />
          </div>

          {/* Tagline */}
          <h1
            style={{
              fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
              marginBottom: "20px",
            }}
          >
            Votre compagnon des salons
            <br />
            <span style={{ color: "#FFD100" }}>de l&apos;orientation</span>
          </h1>

          <p
            style={{
              fontSize: "1.0625rem",
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.65,
              maxWidth: "480px",
              margin: "0 auto 52px",
            }}
          >
            Préparez, vivez et prolongez votre expérience des salons L&apos;Étudiant.
          </p>

          {/* Role selection cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "48px",
            }}
          >
            {roles.map((role) => (
              <a
                key={role.href}
                href={role.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "#ffffff",
                  border: "2px solid #E8E8E8",
                  borderRadius: "12px",
                  padding: "32px 24px",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.15s ease",
                  gap: "12px",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.boxShadow = "0 8px 32px rgba(227,0,27,0.18)";
                  el.style.borderColor = "#E3001B";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.boxShadow = "none";
                  el.style.borderColor = "#E8E8E8";
                  el.style.transform = "translateY(0)";
                }}
              >
                <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>{role.emoji}</span>
                <h3
                  className="le-h3"
                  style={{ color: "#1A1A1A", textAlign: "center", margin: 0 }}
                >
                  {role.title}
                </h3>
                <p
                  className="le-body"
                  style={{
                    color: "#6B6B6B",
                    textAlign: "center",
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                    margin: 0,
                    flexGrow: 1,
                  }}
                >
                  {role.description}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "8px",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    background: role.variant === "primary" ? "#E3001B" : "transparent",
                    color: role.variant === "primary" ? "#ffffff" : "#E3001B",
                    border: role.variant === "primary" ? "none" : "2px solid #E3001B",
                    transition: "background 0.15s",
                  }}
                >
                  {role.btnLabel}
                </span>
              </a>
            ))}
          </div>

          {/* Secondary links */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <a
              href="/exhibitor/login"
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: "0.9375rem",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Vous êtes un établissement ?
            </a>
            <a
              href="/login"
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Déjà un compte ?{" "}
              <span style={{ color: "#FFD100", fontWeight: 600 }}>Se connecter →</span>
            </a>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          style={{ position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)", opacity: 0.45 }}
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round">
            <path d="M5 8l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* Stats strip */}
      <section
        style={{
          background: "#E3001B",
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "clamp(0.9rem, 2.5vw, 1.125rem)",
            letterSpacing: "0.01em",
            margin: 0,
          }}
        >
          700 000 visiteurs &nbsp;·&nbsp; 130 salons &nbsp;·&nbsp; 8 954 établissements référencés
        </p>
      </section>

      {/* Stripe separator */}
      <StripeRule />

      {/* Footer */}
      <footer
        style={{
          background: "#1A1A1A",
          padding: "36px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Logo variant="mono" size="sm" />
        <p
          style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.3)",
            textAlign: "center",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Saguez &amp; Partners Design · L&apos;Étudiant 2026
        </p>
      </footer>
    </div>
  );
}
