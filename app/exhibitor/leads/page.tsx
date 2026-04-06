"use client";

import { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Tag from "@/components/ui/Tag";
import OrientationBadge from "@/components/ui/OrientationBadge";
import Button from "@/components/ui/Button";

type Tier = "all" | "deciding" | "comparing" | "exploring";

interface Lead {
  id: number;
  score: number;
  level: string;
  visitedStand: boolean;
  conference: boolean;
  swiped: boolean;
  dwellMinutes: number;
}

const MOCK_LEADS: Lead[] = [
  {
    id: 1,
    score: 88,
    level: "Terminale",
    visitedStand: true,
    conference: true,
    swiped: true,
    dwellMinutes: 12,
  },
  {
    id: 2,
    score: 79,
    level: "Première",
    visitedStand: true,
    conference: false,
    swiped: true,
    dwellMinutes: 8,
  },
  {
    id: 3,
    score: 72,
    level: "Terminale",
    visitedStand: true,
    conference: true,
    swiped: false,
    dwellMinutes: 6,
  },
  {
    id: 4,
    score: 65,
    level: "Post-bac",
    visitedStand: false,
    conference: true,
    swiped: true,
    dwellMinutes: 4,
  },
  {
    id: 5,
    score: 58,
    level: "Terminale",
    visitedStand: true,
    conference: false,
    swiped: false,
    dwellMinutes: 7,
  },
  {
    id: 6,
    score: 45,
    level: "Première",
    visitedStand: true,
    conference: false,
    swiped: true,
    dwellMinutes: 3,
  },
  {
    id: 7,
    score: 38,
    level: "Seconde",
    visitedStand: false,
    conference: false,
    swiped: true,
    dwellMinutes: 2,
  },
  {
    id: 8,
    score: 30,
    level: "Terminale",
    visitedStand: true,
    conference: false,
    swiped: false,
    dwellMinutes: 5,
  },
  {
    id: 9,
    score: 20,
    level: "Première",
    visitedStand: false,
    conference: false,
    swiped: false,
    dwellMinutes: 1,
  },
  {
    id: 10,
    score: 10,
    level: "Seconde",
    visitedStand: false,
    conference: false,
    swiped: false,
    dwellMinutes: 1,
  },
];

function getTier(score: number): "deciding" | "comparing" | "exploring" {
  if (score > 65) return "deciding";
  if (score > 40) return "comparing";
  return "exploring";
}

function ScoreRing({ score }: { score: number }) {
  const tier = getTier(score);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    tier === "deciding" ? "#E3001B" : tier === "comparing" ? "#003C8F" : "#FFD100";

  return (
    <div className={`score-ring score-${tier}`} style={{ width: 56, height: 56 }}>
      <svg width={56} height={56} viewBox="0 0 56 56" aria-label={`Score ${score}`}>
        <circle
          className="track"
          cx={28}
          cy={28}
          r={r}
          strokeWidth={5}
          fill="none"
          stroke="#E8E8E8"
        />
        <circle
          className="progress"
          cx={28}
          cy={28}
          r={r}
          strokeWidth={5}
          fill="none"
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          position: "absolute",
          fontSize: "13px",
          fontWeight: 700,
          color: "#1A1A1A",
        }}
      >
        {score}
      </span>
    </div>
  );
}

function SignalIcons({
  stand,
  conf,
  swipe,
}: {
  stand: boolean;
  conf: boolean;
  swipe: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <span
        title="Visite stand"
        style={{ opacity: stand ? 1 : 0.25, fontSize: "16px" }}
      >
        📍
      </span>
      <span
        title="Conférence"
        style={{ opacity: conf ? 1 : 0.25, fontSize: "16px" }}
      >
        🎓
      </span>
      <span
        title="Swipe"
        style={{ opacity: swipe ? 1 : 0.25, fontSize: "16px" }}
      >
        ❤️
      </span>
    </div>
  );
}

interface ModalProps {
  lead: Lead;
  onClose: () => void;
}

function ExportModal({ lead, onClose }: ModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,26,26,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "24px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "420px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(26,26,26,0.2)",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E8E8E8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 700, color: "#1A1A1A" }}>
            Détails du lead
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "20px",
              color: "#6B6B6B",
              lineHeight: 1,
            }}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#F4F4F4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              👤
            </div>
            <div>
              <p style={{ fontWeight: 700, color: "#1A1A1A" }}>
                Étudiant Anonyme #{lead.id}
              </p>
              <p style={{ fontSize: "13px", color: "#6B6B6B" }}>{lead.level}</p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {[
              { label: "Score", value: `${lead.score}/100` },
              { label: "Niveau", value: lead.level },
              {
                label: "Visite stand",
                value: lead.visitedStand ? "Oui" : "Non",
              },
              {
                label: "Conférence",
                value: lead.conference ? "Oui" : "Non",
              },
              {
                label: "Swipe",
                value: lead.swiped ? "Oui" : "Non",
              },
              { label: "Durée moyenne", value: `${lead.dwellMinutes} min` },
            ].map((row) => (
              <div key={row.label}>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#6B6B6B",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "4px",
                  }}
                >
                  {row.label}
                </p>
                <p style={{ fontWeight: 600, color: "#1A1A1A", fontSize: "14px" }}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "#FFFBE6",
              border: "1px solid #FFD100",
              borderRadius: "6px",
              padding: "10px 14px",
              fontSize: "12px",
              color: "#7A6200",
              marginBottom: "20px",
              lineHeight: 1.5,
            }}
          >
            Les coordonnées réelles ne sont visibles qu&apos;après opt-in de
            l&apos;étudiant. Seules les données agrégées sont disponibles pour
            le moment.
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="primary" onClick={onClose}>
              Exporter le contact
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const FILTER_TABS: { id: Tier; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "deciding", label: "Décision" },
  { id: "comparing", label: "Comparaison" },
  { id: "exploring", label: "Exploration" },
];

export default function LeadsPage() {
  const [filter, setFilter] = useState<Tier>("all");
  const [modalLead, setModalLead] = useState<Lead | null>(null);

  const filtered =
    filter === "all"
      ? MOCK_LEADS
      : MOCK_LEADS.filter((l) => getTier(l.score) === filter);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <SectionLabel>Leads</SectionLabel>
        <h1 className="le-h1" style={{ marginTop: "10px", marginBottom: "4px" }}>
          Vos leads
        </h1>
        <p className="le-body">
          HEC Paris &mdash; Salon de Paris, 15 avril 2026 &mdash;{" "}
          {MOCK_LEADS.length} leads
        </p>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "8px 18px",
                borderRadius: "20px",
                border: active ? "1.5px solid #E3001B" : "1.5px solid #E8E8E8",
                background: active ? "#FDEAEA" : "#ffffff",
                color: active ? "#B0001A" : "#3D3D3D",
                fontWeight: active ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
              {tab.id === "all" && (
                <span
                  style={{
                    marginLeft: "6px",
                    background: active ? "#E3001B" : "#E8E8E8",
                    color: active ? "#ffffff" : "#6B6B6B",
                    borderRadius: "10px",
                    padding: "1px 7px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {MOCK_LEADS.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lead cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map((lead) => (
          <div
            key={lead.id}
            className="kpi-card"
            style={{
              flexDirection: "row",
              gap: "20px",
              alignItems: "center",
              padding: "18px 20px",
            }}
          >
            {/* Score ring */}
            <ScoreRing score={lead.score} />

            {/* Middle info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontWeight: 700,
                  color: "#1A1A1A",
                  marginBottom: "6px",
                  fontSize: "15px",
                }}
              >
                Étudiant Anonyme #{lead.id}
              </p>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}
              >
                <Tag variant="gray">{lead.level}</Tag>
                <SignalIcons
                  stand={lead.visitedStand}
                  conf={lead.conference}
                  swipe={lead.swiped}
                />
                <span
                  style={{ fontSize: "12px", color: "#6B6B6B" }}
                >
                  {lead.dwellMinutes} min
                </span>
              </div>
            </div>

            {/* Right: badge + action */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "flex-end",
                flexShrink: 0,
              }}
            >
              <OrientationBadge score={lead.score} />
              <button
                type="button"
                className="le-btn-base le-btn-primary le-btn-sm"
                onClick={() => setModalLead(lead)}
              >
                Exporter le contact
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "#6B6B6B",
          }}
        >
          <p style={{ fontSize: "2rem", marginBottom: "12px" }} aria-hidden="true">
            🔍
          </p>
          <p className="le-body">Aucun lead dans cette catégorie.</p>
        </div>
      )}

      {/* Export modal */}
      {modalLead && (
        <ExportModal lead={modalLead} onClose={() => setModalLead(null)} />
      )}
    </div>
  );
}
