"use client";
export const dynamic = 'force-dynamic'

import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

const BRANCH_INTERESTS = [
  { label: "Économie-Gestion", count: 12, pct: 43, color: "#0066CC" },
  { label: "Ingénierie-Industrie", count: 9, pct: 32, color: "#EC1F27" },
  { label: "Santé-Social", count: 5, pct: 18, color: "#FCD716" },
  { label: "Droit-Sciences politiques", count: 4, pct: 14, color: "#0066CC" },
  { label: "Communication-Information", count: 3, pct: 11, color: "#6B6B6B" },
  { label: "Sciences-Nature", count: 3, pct: 11, color: "#0066CC" },
  { label: "Arts-Culture", count: 1, pct: 4, color: "#FCD716" },
];

const TOP_SCHOOLS = [
  { name: "HEC Paris", count: 8, type: "Grande École" },
  { name: "Sciences Po", count: 7, type: "IEP" },
  { name: "INSA Lyon", count: 6, type: "École d'ingénieurs" },
  { name: "Université Paris-Saclay", count: 5, type: "Université" },
  { name: "CentraleSupélec", count: 4, type: "Grande École d'ingénieurs" },
];

const STUDY_LEVEL_DIST = [
  { level: "Bac+5 (Master/Grande École)", count: 15, pct: 54 },
  { level: "Bac+3 (Licence)", count: 7, pct: 25 },
  { level: "Bac+2 (BTS/BUT)", count: 4, pct: 14 },
  { level: "Non défini", count: 2, pct: 7 },
];

const LEVEL_COLORS = ["#0066CC", "#EC1F27", "#FCD716", "#E8E8E8"];

function HorizontalBar({
  label,
  count,
  pct,
  color,
  rank,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
  rank: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {/* Rank number */}
      <span
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: rank <= 2 ? color : "#E8E8E8",
          color: rank <= 2 ? (color === "#FCD716" ? "#1A1A1A" : "#ffffff") : "#6B6B6B",
          fontSize: "11px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {rank}
      </span>

      {/* Label */}
      <span
        style={{
          width: "200px",
          fontSize: "13px",
          fontWeight: 500,
          color: "#1A1A1A",
          flexShrink: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={label}
      >
        {label}
      </span>

      {/* Bar track */}
      <div
        style={{
          flex: 1,
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
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Count badge */}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color,
          width: "28px",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {count}
      </span>

      {/* Pct */}
      <span
        style={{
          fontSize: "12px",
          color: "#6B6B6B",
          width: "36px",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

function SchoolRankRow({
  rank,
  name,
  type,
  count,
}: {
  rank: number;
  name: string;
  type: string;
  count: number;
}) {
  const medalColors: Record<number, string> = {
    1: "#FCD716",
    2: "#C0C0C0",
    3: "#CD7F32",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px 0",
        borderBottom: rank < TOP_SCHOOLS.length ? "1px solid #E8E8E8" : "none",
      }}
    >
      {/* Rank */}
      <span
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: medalColors[rank] ?? "#F4F4F4",
          color: rank <= 3 ? "#1A1A1A" : "#6B6B6B",
          fontSize: "13px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {rank}
      </span>

      {/* Name + type */}
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: "14px", color: "#1A1A1A", marginBottom: "2px" }}>
          {name}
        </p>
        <p style={{ fontSize: "12px", color: "#6B6B6B" }}>{type}</p>
      </div>

      {/* Count */}
      <div
        style={{
          background: "var(--le-blue-light)",
          color: "var(--le-blue)",
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {count} élèves
      </div>
    </div>
  );
}

function StudyLevelBar({
  level,
  count,
  pct,
  color,
}: {
  level: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#1A1A1A" }}>
          {level}
        </span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A" }}>
          {count}{" "}
          <span style={{ fontWeight: 400, color: "#6B6B6B" }}>({pct}%)</span>
        </span>
      </div>
      <div
        style={{
          height: "8px",
          background: "#E8E8E8",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "4px",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function TeacherInsights() {
  function handleExport() {
    // Mock export action
    alert("Génération du rapport classe en cours…");
  }

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
          <SectionLabel>Analyse pédagogique</SectionLabel>
          <h1 className="le-h1" style={{ marginTop: "10px" }}>
            Intérêts de la Classe
          </h1>
          <p className="le-body" style={{ marginTop: "4px" }}>
            14 profils complétés sur 28 · Terminale S — Groupe 2
          </p>
        </div>
        <Button variant="ghost" onClick={handleExport}>
          Télécharger le rapport classe
        </Button>
      </div>

      {/* Advisory insight card */}
      <div
        style={{
          marginBottom: "28px",
          padding: "16px 20px",
          background: "var(--le-red-light)",
          borderLeft: "4px solid var(--le-red)",
          borderRadius: "0 8px 8px 0",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
        role="note"
        aria-label="Conseil pédagogique"
      >
        <svg
          width={20}
          height={20}
          viewBox="0 0 20 20"
          fill="none"
          stroke="var(--le-red)"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: "2px" }}
        >
          <circle cx="10" cy="10" r="9" />
          <path d="M10 6v4M10 14h.01" />
        </svg>
        <p style={{ fontSize: "14px", color: "var(--le-red-dark)", fontWeight: 500, lineHeight: 1.6 }}>
          <strong>43% de la classe s&apos;intéresse à l&apos;Économie-Gestion</strong> — pensez à
          prioriser les stands Commerce et Finance lors de votre visite au salon.
        </p>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Filières populaires */}
        <div className="le-card le-card-padded">
          <div style={{ marginBottom: "20px" }}>
            <SectionLabel>Filières populaires</SectionLabel>
            <p style={{ fontSize: "12px", color: "#6B6B6B", marginTop: "6px" }}>
              Basé sur les 14 profils complétés — plusieurs filières par élève possible
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {BRANCH_INTERESTS.map((branch, i) => (
              <HorizontalBar
                key={branch.label}
                rank={i + 1}
                label={branch.label}
                count={branch.count}
                pct={branch.pct}
                color={branch.color}
              />
            ))}
          </div>
        </div>

        {/* Right column: top schools + level dist */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top 5 établissements */}
          <div className="le-card le-card-padded">
            <div style={{ marginBottom: "12px" }}>
              <SectionLabel>Top 5 établissements sauvegardés</SectionLabel>
            </div>
            {TOP_SCHOOLS.map((school, i) => (
              <SchoolRankRow
                key={school.name}
                rank={i + 1}
                name={school.name}
                type={school.type}
                count={school.count}
              />
            ))}
          </div>

          {/* Niveau d'études visé */}
          <div className="le-card le-card-padded">
            <div style={{ marginBottom: "16px" }}>
              <SectionLabel>Niveau d&apos;études visé</SectionLabel>
            </div>
            {STUDY_LEVEL_DIST.map((item, i) => (
              <StudyLevelBar
                key={item.level}
                level={item.level}
                count={item.count}
                pct={item.pct}
                color={LEVEL_COLORS[i]}
              />
            ))}

            {/* Stacked visual summary */}
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "11px", color: "#6B6B6B", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Répartition globale
              </p>
              <div
                style={{
                  display: "flex",
                  height: "16px",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
                role="img"
                aria-label="Répartition des niveaux d'études visés"
              >
                {STUDY_LEVEL_DIST.map((item, i) => (
                  <div
                    key={item.level}
                    title={`${item.level}: ${item.pct}%`}
                    style={{
                      width: `${item.pct}%`,
                      background: LEVEL_COLORS[i],
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                {STUDY_LEVEL_DIST.map((item, i) => (
                  <div
                    key={item.level}
                    style={{ display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "2px",
                        background: LEVEL_COLORS[i],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#6B6B6B" }}>
                      {item.pct}% {item.level.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom summary row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
        }}
      >
        {[
          {
            label: "Filières explorées",
            value: BRANCH_INTERESTS.length,
            sub: "au total",
            color: "var(--le-blue)",
          },
          {
            label: "Établissement top",
            value: "HEC Paris",
            sub: "8 élèves intéressés",
            color: "#FCD716",
          },
          {
            label: "Ambition dominante",
            value: "Bac+5",
            sub: "54% de la classe",
            color: "var(--le-red)",
          },
          {
            label: "Profils complétés",
            value: "14/28",
            sub: "50% du groupe",
            color: "#16A34A",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="kpi-card"
            style={{ borderTop: `3px solid ${item.color}` }}
          >
            <p className="kpi-label">{item.label}</p>
            <p className="kpi-value" style={{ fontSize: "1.5rem" }}>
              {item.value}
            </p>
            <p style={{ fontSize: "12px", color: "#6B6B6B" }}>{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
