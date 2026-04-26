"use client";
export const dynamic = 'force-dynamic'

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    badge: "Essentiel",
    badgeColor: "#6B6B6B",
    badgeBg: "#E8E8E8",
    features: [
      "Profil enrichi avec photos & vidéos",
      "Reels de présentation (jusqu'à 3)",
      "Page établissement complète",
      "Accès aux statistiques de profil",
    ],
    cta: "Contactez-nous",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Populaire",
    badgeColor: "#0066CC",
    badgeBg: "#E6F0FF",
    features: [
      "Tout Starter inclus",
      "Slots rendez-vous visio (jusqu'à 20/jour)",
      "Calendrier de disponibilités",
      "Notifications aux étudiants intéressés",
      "Analytics visiteurs avancés",
    ],
    cta: "Contactez-nous",
    highlight: true,
  },
  {
    id: "elite",
    name: "Elite",
    badge: "Premium",
    badgeColor: "#7A6200",
    badgeBg: "#FFF9E6",
    features: [
      "Tout Pro inclus",
      "Visibilité maximale — mise en avant",
      "Analytics complets et export des données",
      "Analytics complets + export",
      "Account manager dédié",
      "Analyse personnalisée des profils",
    ],
    cta: "Contactez-nous",
    highlight: false,
  },
];

const STAT_ITEMS = [
  { value: "113", label: "salons en ligne" },
  { value: "421", label: "mini-sites écoles" },
  { value: "66 423", label: "formations référencées" },
];

export default function ExhibitorVirtualPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              display: "inline-block",
              padding: "5px 14px",
              background: "#FCD716",
              color: "#1A1A1A",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase" as const,
              letterSpacing: "0.08em",
            }}
          >
            Extension Premium
          </span>
        </div>
        <h1 className="le-h1" style={{ margin: "0 0 10px", color: "#1A1A1A" }}>
          Salon virtuel — Visibilité premium
        </h1>
        <p className="le-body" style={{ color: "#6B6B6B", maxWidth: 620 }}>
          En complément de votre présence physique, participez au salon virtuel pour
          atteindre les étudiants qui ne peuvent pas se déplacer et maximiser votre
          impact sur l&apos;ensemble de l&apos;audience L&apos;Étudiant.
        </p>
      </div>

      {/* Why virtual section */}
      <div
        style={{
          background: "linear-gradient(135deg, #0066CC 0%, #001F5C 100%)",
          borderRadius: 16,
          padding: "28px 28px",
          marginBottom: 32,
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Pourquoi le virtuel ?
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
            30 à 40% des étudiants intéressés ne peuvent pas se déplacer
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0 }}>
            Distance, contraintes horaires ou de santé — le salon virtuel vous permet de
            les toucher là où ils sont.
          </p>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {STAT_ITEMS.map((s) => (
            <div key={s.label} style={{ textAlign: "center", minWidth: 90 }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#FCD716", margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: "4px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing tiers */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#6B6B6B",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 20,
          }}
        >
          Formules disponibles
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "24px",
                border: tier.highlight ? "2px solid #0066CC" : "1px solid #E8E8E8",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {tier.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: 24,
                    right: 24,
                    height: 3,
                    background: "#0066CC",
                    borderRadius: "0 0 3px 3px",
                  }}
                />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>{tier.name}</p>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: tier.badgeBg,
                    color: tier.badgeColor,
                  }}
                >
                  {tier.badge}
                </span>
              </div>

              {/* Blurred price placeholder */}
              <div
                style={{
                  height: 36,
                  background: "#F4F4F4",
                  borderRadius: 8,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 14,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#1A1A1A",
                    filter: "blur(6px)",
                    userSelect: "none",
                  }}
                >
                  ███ € / salon
                </span>
              </div>

              <div style={{ flex: 1, marginBottom: 20 }}>
                {tier.features.map((f, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}
                  >
                    <svg
                      width={14}
                      height={14}
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    >
                      <path
                        d="M2.5 7L5.5 10L11.5 4"
                        stroke="#16A34A"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span style={{ fontSize: 13, color: "#3D3D3D", lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {}}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: tier.highlight ? "#0066CC" : "#fff",
                  color: tier.highlight ? "#fff" : "#0066CC",
                  border: `2px solid #0066CC`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Primary CTA */}
      <div
        style={{
          background: "#FFF0F1",
          borderRadius: 16,
          padding: "28px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px" }}>
            Prendre contact avec notre équipe commerciale
          </p>
          <p style={{ fontSize: 13, color: "#6B6B6B", margin: 0 }}>
            Notre équipe vous présente les formules et élabore une offre sur mesure.
          </p>
        </div>
        <button
          onClick={() => {}}
          style={{
            padding: "14px 28px",
            background: "#EC1F27",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap" as const,
          }}
        >
          Nous contacter →
        </button>
      </div>
    </div>
  );
}
