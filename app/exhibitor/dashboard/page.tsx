"use client";

import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import Tag from "@/components/ui/Tag";
import OrientationBadge from "@/components/ui/OrientationBadge";
import Button from "@/components/ui/Button";

const KPI_DATA = [
  {
    label: "Visiteurs au stand",
    value: "127",
    delta: "+12 vs hier",
    up: true,
  },
  { label: "Matches", value: "34", delta: "+5 vs hier", up: true },
  { label: "Rendez-vous", value: "12", delta: "−1 vs hier", up: false },
  { label: "Leads exportés", value: "8", delta: "+3 vs hier", up: true },
];

const FUNNEL = [
  { label: "Stand visit", count: 127, color: "#E3001B" },
  { label: "Match", count: 34, color: "#003C8F" },
  { label: "RDV", count: 12, color: "#FFD100" },
  { label: "Export", count: 8, color: "#6B6B6B" },
];

const INTERESTS = [
  { label: "Business", pct: 45, color: "#E3001B" },
  { label: "Finance", pct: 30, color: "#003C8F" },
  { label: "Management", pct: 25, color: "#FFD100" },
];

const LEADS = [
  {
    id: 1,
    name: "Étudiant •••••",
    score: 82,
    signals: "Visite stand + swipe + conf",
    tier: 82,
  },
  {
    id: 2,
    name: "Étudiant •••••",
    score: 74,
    signals: "Visite stand + swipe",
    tier: 74,
  },
  {
    id: 3,
    name: "Étudiant •••••",
    score: 61,
    signals: "Visite stand + conf",
    tier: 61,
  },
  {
    id: 4,
    name: "Étudiant •••••",
    score: 38,
    signals: "Visite stand",
    tier: 38,
  },
  {
    id: 5,
    name: "Étudiant •••••",
    score: 22,
    signals: "Swipe",
    tier: 22,
  },
];

function KpiCard({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      <p className={`kpi-delta ${up ? "positive" : "negative"}`}>
        {up ? "▲" : "▼"} {delta}
      </p>
    </div>
  );
}

function FunnelBar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = Math.round((count / max) * 100);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#3D3D3D" }}>
          {label}
        </span>
        <span style={{ fontSize: "13px", color: "#6B6B6B", fontWeight: 600 }}>
          {count}
        </span>
      </div>
      <div
        style={{
          height: "10px",
          background: "#E8E8E8",
          borderRadius: "5px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "5px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function ExhibitorDashboard() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <SectionLabel>Tableau de bord</SectionLabel>
          <h1 className="le-h1" style={{ marginTop: "10px" }}>
            HEC Paris
          </h1>
          <p className="le-body">Salon de Paris — 15 avril 2026</p>
        </div>
        <Tag variant="blue">En cours</Tag>
      </div>

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {KPI_DATA.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {/* Funnel */}
        <div
          className="le-card le-card-padded"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <SectionLabel>Entonnoir de conversion</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {FUNNEL.map((f) => (
              <FunnelBar
                key={f.label}
                label={f.label}
                count={f.count}
                max={FUNNEL[0].count}
                color={f.color}
              />
            ))}
          </div>
        </div>

        {/* Interests */}
        <div
          className="le-card le-card-padded"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <SectionLabel>Domaines d&apos;intérêt</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {INTERESTS.map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{ fontSize: "13px", fontWeight: 600, color: "#3D3D3D" }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{ fontSize: "13px", color: "#6B6B6B", fontWeight: 600 }}
                  >
                    {item.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: "10px",
                    background: "#E8E8E8",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${item.pct}%`,
                      background: item.color,
                      borderRadius: "5px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leads table */}
      <div className="le-card" style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <SectionLabel>Derniers leads</SectionLabel>
          <Link
            href="/exhibitor/leads"
            style={{
              fontSize: "13px",
              color: "#E3001B",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Voir tous les leads →
          </Link>
        </div>

        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 120px 1fr auto",
            gap: "12px",
            padding: "8px 0",
            borderBottom: "1.5px solid #E8E8E8",
            marginBottom: "4px",
          }}
        >
          {["Étudiant", "Score", "Signaux", "Action"].map((h) => (
            <span
              key={h}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#6B6B6B",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {LEADS.map((lead) => (
          <div
            key={lead.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 1fr auto",
              gap: "12px",
              padding: "14px 0",
              borderBottom: "1px solid #F4F4F4",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, color: "#1A1A1A", fontSize: "14px" }}>
              {lead.name}
            </span>
            <OrientationBadge score={lead.score} />
            <span style={{ fontSize: "13px", color: "#6B6B6B" }}>
              {lead.signals}
            </span>
            <Button href={`/exhibitor/leads`} variant="ghost" size="sm">
              Voir
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
