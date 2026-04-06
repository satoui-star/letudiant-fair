"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import OrientationBadge from "@/components/ui/OrientationBadge";

// ─── Mock data ────────────────────────────────────────────────────────────────

const CHILD = {
  name: "Emma Dupont",
  initials: "ED",
  level: "Terminale S",
  series: "Bac général",
  score: 45,
  filieres: ["Économie-Gestion", "Ingénierie-Industrie"],
  savedCount: 5,
  isActive: true,
};

const FAIR = {
  name: "Salon de Paris",
  date: "15 avril 2026",
  city: "Paris",
  registered: true,
};

const SAVED_SCHOOLS = [
  { name: "HEC Paris", type: "Grande école", city: "Jouy-en-Josas" },
  { name: "Sciences Po Paris", type: "Institut d'études politiques", city: "Paris" },
  { name: "INSA Lyon", type: "École d'ingénieurs", city: "Lyon" },
];

const SUPPORT_LINKS = [
  { label: "Comment accompagner votre enfant ?", href: "#", icon: "📖" },
  { label: "Questions fréquentes sur l'orientation", href: "#", icon: "❓" },
  { label: "Agenda des journées portes ouvertes", href: "#", icon: "📅", external: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParentHomePage() {
  const [notifEnabled, setNotifEnabled] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header greeting */}
      <div>
        <h1 className="le-h1" style={{ marginBottom: "4px" }}>
          Bonjour, Mme Dupont
        </h1>
        <p className="le-body" style={{ color: "#6B6B6B" }}>
          Voici un résumé du parcours d&apos;Emma.
        </p>
      </div>

      {/* Child status card */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#E3001B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "1.125rem",
                flexShrink: 0,
              }}
            >
              {CHILD.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span className="le-h3">{CHILD.name}</span>
                {CHILD.isActive && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "0.8rem",
                      color: "#15803d",
                      fontWeight: 500,
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#22c55e",
                        display: "inline-block",
                      }}
                    />
                    Compte actif
                  </span>
                )}
              </div>
              <div style={{ marginTop: "4px" }}>
                <Tag variant="blue">{CHILD.level} — {CHILD.series}</Tag>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "#E8E8E8" }} />

          {/* Orientation badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: "#6B6B6B" }}>Stade d&apos;orientation</span>
            <OrientationBadge score={CHILD.score} />
          </div>

          {/* Filieres */}
          <div>
            <span style={{ fontSize: "0.875rem", color: "#6B6B6B", display: "block", marginBottom: "8px" }}>
              Emma s&apos;intéresse à :
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {CHILD.filieres.map((f) => (
                <Tag key={f} variant="red">{f}</Tag>
              ))}
            </div>
          </div>

          {/* Saved count */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#F4F4F4",
              borderRadius: "8px",
              padding: "10px 14px",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>🏫</span>
            <span style={{ fontSize: "0.9rem", color: "#3D3D3D", fontWeight: 500 }}>
              {CHILD.savedCount} établissements sauvegardés
            </span>
          </div>
        </div>
      </Card>

      {/* Prochain salon card */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div>
              <span className="le-section-label">Prochain salon</span>
              <h3 className="le-h3" style={{ marginTop: "6px" }}>{FAIR.name}</h3>
            </div>
            {FAIR.registered && (
              <Tag variant="blue" style={{ flexShrink: 0 }}>✓ Emma est inscrite</Tag>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#6B6B6B",
              fontSize: "0.9rem",
            }}
          >
            <span>📍</span>
            <span>{FAIR.date} · {FAIR.city}</span>
          </div>
        </div>
      </Card>

      {/* Exploration récente */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="le-section-label">Exploration récente</span>
            <a
              href="/parent/orientation"
              style={{ fontSize: "0.875rem", color: "#E3001B", fontWeight: 600, textDecoration: "none" }}
            >
              Voir tout →
            </a>
          </div>
          <p style={{ fontSize: "0.875rem", color: "#6B6B6B", margin: 0 }}>
            Emma a récemment sauvegardé :
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {SAVED_SCHOOLS.map((school) => (
              <div
                key={school.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "#F4F4F4",
                  borderRadius: "8px",
                  gap: "10px",
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, color: "#1A1A1A", margin: 0, fontSize: "0.9375rem" }}>
                    {school.name}
                  </p>
                  <p style={{ color: "#6B6B6B", margin: 0, fontSize: "0.8125rem" }}>
                    {school.city}
                  </p>
                </div>
                <Tag variant="gray" style={{ fontSize: "0.75rem", flexShrink: 0 }}>{school.type}</Tag>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Support parents card */}
      <div
        style={{
          background: "#E6ECF8",
          borderRadius: "12px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span style={{ fontSize: "1.125rem" }}>💡</span>
          <span className="le-section-label" style={{ color: "#003C8F" }}>Support parents</span>
        </div>
        {SUPPORT_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#003C8F",
              fontWeight: 500,
              fontSize: "0.9rem",
              textDecoration: "none",
              padding: "10px 12px",
              background: "rgba(255,255,255,0.6)",
              borderRadius: "8px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.6)"; }}
          >
            <span>{link.icon}</span>
            <span style={{ flex: 1 }}>{link.label}</span>
            {link.external && <span style={{ opacity: 0.5, fontSize: "0.75rem" }}>↗</span>}
          </a>
        ))}
      </div>

      {/* Notification preferences */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <p style={{ fontWeight: 600, color: "#1A1A1A", margin: "0 0 4px" }}>
              Mises à jour d&apos;orientation
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#6B6B6B", margin: 0 }}>
              Recevoir les mises à jour d&apos;orientation d&apos;Emma
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifEnabled}
            onClick={() => setNotifEnabled((v) => !v)}
            style={{
              width: "48px",
              height: "28px",
              borderRadius: "14px",
              background: notifEnabled ? "#E3001B" : "#E8E8E8",
              border: "none",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "4px",
                left: notifEnabled ? "24px" : "4px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>
      </Card>
    </div>
  );
}
