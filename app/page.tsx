"use client";
export const dynamic = 'force-dynamic'

import Logo from "@/components/ui/Logo";

const C = {
  tomate: "#EC1F27",
  tomateDark: "#C41520",
  piscine: "#0066CC",
  citron: "#FCD716",
  spirit: "#FF6B35",
  framboise: "#E91E63",
  menthe: "#4DB8A8",
  tropical: "#00BFB3",
  pourpre: "#932D99",
  nuit: "#191829",
  blanc: "#F8F7F2",
  gray500: "#6B6B6B",
  gray300: "#D4D4D4",
  gray200: "#E8E8E8",
};

const roles = [
  {
    glyph: "◆",
    eyebrow: "01 — Étudiant·e",
    title: "Trouvez votre voie",
    description: "Explorez les formations, scannez les stands et construisez votre projet d'orientation.",
    href: "/onboarding?role=student",
    accent: C.tomate,
    accentLight: "#FFF0F1",
  },
  {
    glyph: "✦",
    eyebrow: "02 — Enseignant·e",
    title: "Guidez vos élèves",
    description: "Suivez l'engagement de votre groupe et analysez leurs parcours de découverte.",
    href: "/onboarding?role=teacher",
    accent: C.piscine,
    accentLight: "#E6F0FF",
  },
  {
    glyph: "●",
    eyebrow: "03 — Parent",
    title: "Accompagnez votre enfant",
    description: "Restez connecté·e à l'exploration et ouvrez le dialogue sur son avenir.",
    href: "/onboarding?role=parent",
    accent: C.menthe,
    accentLight: "#E0F2EF",
  },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.blanc, color: C.nuit }}>
      {/* Signature multicolor stripe */}
      <div
        style={{
          height: 6,
          background: `linear-gradient(90deg, ${C.tomate} 0 16.66%, ${C.piscine} 16.66% 33.33%, ${C.citron} 33.33% 50%, ${C.spirit} 50% 66.66%, ${C.menthe} 66.66% 83.33%, ${C.pourpre} 83.33% 100%)`,
        }}
      />

      {/* Nav bar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 48px",
          borderBottom: `1px solid ${C.gray200}`,
          background: "#fff",
        }}
      >
        <Logo variant="default" size="sm" />
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <a
            href="/exhibitor/login"
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.gray500,
              textDecoration: "none",
            }}
          >
            Espace Établissement
          </a>
          <a
            href="/login"
            style={{
              padding: "10px 18px",
              background: C.nuit,
              color: "#fff",
              border: "none",
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Se connecter →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          position: "relative",
          padding: "80px 48px 100px",
          maxWidth: 1400,
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        {/* Decorative dots */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 60,
            right: 48,
            display: "flex",
            gap: 6,
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.tomate }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.piscine }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.citron }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.menthe }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            {/* Eyebrow */}
            <div style={{ display: "inline-block", position: "relative", paddingBottom: 8, marginBottom: 24 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: C.tomate,
                }}
              >
                L'Étudiant Fair — 2026
              </span>
              <div style={{ position: "absolute", left: 0, bottom: 0, width: 28, height: 3, background: C.tomate }} />
            </div>

            {/* Headline — editorial */}
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(3rem, 7vw, 6rem)",
                fontWeight: 900,
                color: C.nuit,
                textTransform: "uppercase",
                lineHeight: 0.9,
                letterSpacing: "-0.04em",
              }}
            >
              Votre
              <br />
              compagnon
              <br />
              <span style={{ color: C.tomate, fontStyle: "italic" }}>d'orientation</span>.
            </h1>

            <p
              style={{
                margin: "32px 0 0",
                fontSize: 18,
                color: C.gray500,
                maxWidth: 520,
                lineHeight: 1.55,
              }}
            >
              Préparez, vivez et prolongez votre expérience des 130 salons <strong style={{ color: C.nuit }}>L'Étudiant</strong>. Un seul compte, tous vos salons.
            </p>

            {/* Stats strip inline */}
            <div
              style={{
                marginTop: 40,
                display: "flex",
                gap: 32,
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <Stat color={C.tomate} value="700K" label="Visiteurs / an" />
              <div style={{ width: 1, height: 48, background: C.gray200 }} />
              <Stat color={C.piscine} value="130" label="Salons" />
              <div style={{ width: 1, height: 48, background: C.gray200 }} />
              <Stat color={C.citron} value="8 954" label="Établissements" />
            </div>
          </div>

          {/* Hero panel: colorblock composition */}
          <div
            aria-hidden="true"
            style={{
              position: "relative",
              aspectRatio: "1/1.15",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            <div style={{ background: C.tomate, gridRow: "1 / span 2" }}>
              <div
                style={{
                  padding: 20,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Découvrez
              </div>
              <div
                style={{
                  padding: "0 20px",
                  color: "#fff",
                  fontSize: 48,
                  fontWeight: 900,
                  fontStyle: "italic",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                Salons
              </div>
            </div>
            <div style={{ background: C.citron, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div
                style={{
                  color: C.nuit,
                  fontSize: 52,
                  fontWeight: 900,
                  fontStyle: "italic",
                  letterSpacing: "-0.04em",
                }}
              >
                QR
              </div>
            </div>
            <div style={{ background: C.piscine, gridColumn: "2 / 3", gridRow: "2 / span 2", padding: 20, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Connectez
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  fontStyle: "italic",
                  letterSpacing: "-0.03em",
                  lineHeight: 0.95,
                }}
              >
                Écoles
                <br />&<br />Étudiants
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.citron }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.tomate }} />
              </div>
            </div>
            <div style={{ background: C.menthe, gridColumn: "1 / 2", gridRow: "3 / 4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div
                style={{
                  color: "#fff",
                  fontSize: 40,
                  fontWeight: 900,
                  fontStyle: "italic",
                  letterSpacing: "-0.03em",
                }}
              >
                Match
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role cards section */}
      <section style={{ padding: "80px 48px", background: "#fff", borderTop: `1px solid ${C.gray200}`, borderBottom: `1px solid ${C.gray200}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "inline-block", position: "relative", paddingBottom: 8, marginBottom: 16 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: C.gray500,
              }}
            >
              Commencez ici
            </span>
            <div style={{ position: "absolute", left: 0, bottom: 0, width: 28, height: 3, background: C.tomate }} />
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              color: C.nuit,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              maxWidth: 800,
            }}
          >
            Qui <span style={{ color: C.tomate, fontStyle: "italic" }}>êtes-vous</span> ?
          </h2>

          <div
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {roles.map((role) => (
              <div
                key={role.href}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  padding: 32,
                  background: "#fff",
                  border: `1px solid ${C.gray200}`,
                  borderTop: `6px solid ${role.accent}`,
                  color: C.nuit,
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 12px 32px rgba(25, 24, 41, 0.08)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 24,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: role.accent,
                    }}
                  >
                    {role.eyebrow}
                  </span>
                  <span style={{ fontSize: 32, color: role.accent, lineHeight: 1 }}>
                    {role.glyph}
                  </span>
                </div>

                <h3
                  style={{
                    margin: "0 0 12px",
                    fontSize: 28,
                    fontWeight: 900,
                    color: C.nuit,
                    letterSpacing: "-0.02em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                  }}
                >
                  {role.title}
                </h3>
                <p
                  style={{
                    margin: "0 0 28px",
                    fontSize: 14,
                    color: C.gray500,
                    lineHeight: 1.55,
                    flex: 1,
                  }}
                >
                  {role.description}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a
                    href={role.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "12px 18px",
                      background: role.accent,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      borderRadius: 2,
                      textDecoration: "none",
                    }}
                  >
                    Créer un compte
                    <span>→</span>
                  </a>
                  <a
                    href="/login"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "12px 18px",
                      background: "transparent",
                      color: role.accent,
                      border: `1.5px solid ${role.accent}`,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      borderRadius: 2,
                      textDecoration: "none",
                    }}
                  >
                    Se connecter
                    <span>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section style={{ padding: "80px 48px", background: C.blanc }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40 }}>
            <Feature color={C.tomate} number="01" title="Avant" desc="Préparez votre visite, sauvegardez vos écoles cibles, planifiez votre parcours." />
            <Feature color={C.piscine} number="02" title="Pendant" desc="Scannez les stands, matchez les écoles et accédez à la carte du salon." />
            <Feature color={C.citron} number="03" title="Après" desc="Retrouvez votre parcours complet et prolongez les échanges avec les écoles." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: C.nuit,
          padding: "48px 48px 32px",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <Logo variant="mono" size="sm" />
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.tomate }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.piscine }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.citron }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.spirit }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.menthe }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.pourpre }} />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Saguez & Partners Design · L'Étudiant 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ color, value, label }: { color: string; value: string; label: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 42,
          fontWeight: 900,
          color: C.nuit,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Feature({ color, number, title, desc }: { color: string; number: string; title: string; desc: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          color,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          fontStyle: "italic",
        }}
      >
        {number}
      </div>
      <div
        style={{
          marginTop: 4,
          width: 28,
          height: 3,
          background: color,
        }}
      />
      <h3
        style={{
          margin: "20px 0 10px",
          fontSize: 22,
          fontWeight: 900,
          color: C.nuit,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: 14, color: C.gray500, lineHeight: 1.55 }}>
        {desc}
      </p>
    </div>
  );
}
