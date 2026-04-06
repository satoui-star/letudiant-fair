"use client";

import { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

// ── Mock student data ──────────────────────────────────────────────

const FIRST_NAMES = [
  "Emma", "Lucas", "Léa", "Hugo", "Chloé", "Nathan", "Manon", "Théo",
  "Camille", "Mathis", "Inès", "Louis", "Jade", "Tom", "Sarah", "Axel",
  "Juliette", "Romain", "Alice", "Maxime", "Lucie", "Baptiste", "Océane",
  "Antoine", "Clara", "Pierre", "Eva", "Julien",
];

const LAST_NAMES = [
  "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Petit", "Durand",
  "Leroy", "Moreau", "Simon", "Laurent", "Michel", "Lefebvre", "Lefevre",
  "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel",
  "Girard", "André", "Mercier", "Dupont", "Bonnet", "François", "Garnier",
];

const BRANCH_OPTIONS = [
  ["Économie-Gestion", "Droit"],
  ["Ingénierie", "Sciences"],
  ["Santé-Social"],
  ["Communication", "Économie-Gestion"],
  ["Droit", "Sciences politiques"],
  ["Ingénierie"],
  ["Arts-Culture", "Communication"],
  ["Sciences", "Ingénierie"],
  ["Économie-Gestion"],
  ["Santé-Social", "Sciences"],
  ["Droit"],
  ["Communication"],
  ["Économie-Gestion", "Ingénierie"],
  ["Sciences politiques"],
];

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registered: boolean;
  connected: boolean;
  profileComplete: boolean;
  profilePct: number;
  bacSeries: string;
  filières: string[];
}

const STUDENTS: Student[] = Array.from({ length: 28 }, (_, i) => ({
  id: `s${i + 1}`,
  firstName: FIRST_NAMES[i],
  lastName: LAST_NAMES[i],
  registered: i < 22,
  connected: i < 18,
  profileComplete: i < 14,
  profilePct: i < 14 ? 100 : i < 20 ? Math.round(30 + (i % 5) * 12) : 0,
  bacSeries: i % 3 === 0 ? "bac_t" : "bac_g",
  filières: i < 14 ? BRANCH_OPTIONS[i % BRANCH_OPTIONS.length] : [],
}));

// ── Mock post-fair data ──────────────────────────────────────────────

// Use a seeded sequence to avoid random values on each render
const STAND_COUNTS = [5, 3, 6, 2, 4, 1, 6, 3, 5, 2, 4, 6, 1, 3, 5, 4, 2, 6];
const CONF_COUNTS =  [2, 0, 1, 2, 0, 1, 2, 1, 0, 2, 1, 0, 1, 2, 0, 1, 2, 0];
const MATCH_COUNTS = [3, 1, 2, 0, 3, 1, 2, 0, 3, 1, 2, 3, 0, 1, 2, 3, 1, 2];
const DWELL_MINS =   [90, 65, 150, 75, 110, 62, 145, 88, 120, 70, 105, 140, 60, 95, 130, 115, 68, 155];
const TOP_INTERESTS = ["HEC Paris", "Sciences Po", "INSA", "emlyon"];

interface FairData {
  studentId: string;
  attended: boolean;
  standsScanned: number;
  conferences: number;
  matchesGenerated: number;
  dwellMinutes: number;
  topInterest: string;
}

const FAIR_DATA: FairData[] = Array.from({ length: 18 }, (_, i) => ({
  studentId: `s${i + 1}`,
  attended: true,
  standsScanned: STAND_COUNTS[i],
  conferences: CONF_COUNTS[i],
  matchesGenerated: MATCH_COUNTS[i],
  dwellMinutes: DWELL_MINS[i],
  topInterest: TOP_INTERESTS[i % 4],
}));

// ── Helper functions ──────────────────────────────────────────────

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function getEngagementLevel(scans: number): "high" | "medium" | "low" {
  if (scans >= 5) return "high";
  if (scans >= 3) return "medium";
  return "low";
}

function getEngagementColor(level: "high" | "medium" | "low"): string {
  if (level === "high") return "#16A34A";
  if (level === "medium") return "#FFD100";
  return "#E3001B";
}

function formatDwell(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h${m > 0 ? m + "m" : ""}`;
  return `${m}m`;
}

function AvatarCircle({
  firstName,
  lastName,
  index,
  dimmed = false,
}: {
  firstName: string;
  lastName: string;
  index: number;
  dimmed?: boolean;
}) {
  const COLORS = [
    "#003C8F", "#E3001B", "#FFD100", "#16A34A", "#7C3AED",
    "#0891B2", "#EA580C", "#BE185D",
  ];
  const bg = dimmed ? "#E8E8E8" : COLORS[index % COLORS.length];
  const textColor = bg === "#FFD100" ? "#1A1A1A" : bg === "#E8E8E8" ? "#6B6B6B" : "#ffffff";

  return (
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: "12px", fontWeight: 700, color: textColor }}>
        {getInitials(firstName, lastName)}
      </span>
    </div>
  );
}

// ── Sub-views ──────────────────────────────────────────────────────

function BeforeView() {
  return (
    <div className="le-card" style={{ overflow: "hidden" }}>
      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "40px 2fr 1fr 1fr 80px 2fr",
          gap: "12px",
          padding: "12px 20px",
          background: "#F4F4F4",
          borderBottom: "1px solid #E8E8E8",
        }}
      >
        {["", "Élève", "Inscription", "Profil", "Série", "Filières"].map((h) => (
          <span
            key={h}
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {STUDENTS.map((student, idx) => (
        <div
          key={student.id}
          style={{
            display: "grid",
            gridTemplateColumns: "40px 2fr 1fr 1fr 80px 2fr",
            gap: "12px",
            padding: "14px 20px",
            borderBottom:
              idx < STUDENTS.length - 1 ? "1px solid #E8E8E8" : "none",
            alignItems: "center",
            background: !student.registered
              ? "rgba(227, 0, 27, 0.02)"
              : undefined,
          }}
        >
          {/* Avatar */}
          <AvatarCircle
            firstName={student.firstName}
            lastName={student.lastName}
            index={idx}
            dimmed={!student.registered}
          />

          {/* Name */}
          <div>
            <p
              style={{
                fontWeight: 600,
                fontSize: "14px",
                color: student.registered ? "#1A1A1A" : "#6B6B6B",
                marginBottom: "1px",
              }}
            >
              {student.firstName} {student.lastName}
            </p>
            {student.connected && (
              <p style={{ fontSize: "11px", color: "#16A34A" }}>
                Compte activé
              </p>
            )}
          </div>

          {/* Registration */}
          <div>
            {student.registered ? (
              <Tag variant="blue">Inscrit</Tag>
            ) : (
              <Tag variant="red">Non-inscrit</Tag>
            )}
          </div>

          {/* Profile % */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  flex: 1,
                  height: "6px",
                  background: "#E8E8E8",
                  borderRadius: "3px",
                  overflow: "hidden",
                  maxWidth: "60px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${student.profilePct}%`,
                    background:
                      student.profilePct === 100
                        ? "#16A34A"
                        : student.profilePct > 0
                        ? "#FFD100"
                        : "#E8E8E8",
                    borderRadius: "3px",
                  }}
                />
              </div>
              <span style={{ fontSize: "12px", color: "#6B6B6B", flexShrink: 0 }}>
                {student.profilePct}%
              </span>
            </div>
          </div>

          {/* Bac */}
          <div>
            <Tag variant={student.bacSeries === "bac_t" ? "red" : "gray"}>
              {student.bacSeries === "bac_t" ? "Techno" : "Général"}
            </Tag>
          </div>

          {/* Filières */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {student.filières.length > 0 ? (
              student.filières.slice(0, 2).map((f) => (
                <Tag key={f} variant="blue">
                  {f}
                </Tag>
              ))
            ) : (
              <span style={{ fontSize: "12px", color: "#6B6B6B", fontStyle: "italic" }}>
                —
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DuringAfterView() {
  const fairDataMap = new Map(FAIR_DATA.map((d) => [d.studentId, d]));

  return (
    <div className="le-card" style={{ overflow: "hidden" }}>
      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "40px 2fr 80px 1fr 1fr 1fr 1fr 100px",
          gap: "12px",
          padding: "12px 20px",
          background: "#F4F4F4",
          borderBottom: "1px solid #E8E8E8",
        }}
      >
        {[
          "",
          "Élève",
          "Présence",
          "Stands",
          "Conférences",
          "Durée",
          "Top école",
          "",
        ].map((h) => (
          <span
            key={h}
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {STUDENTS.map((student, idx) => {
        const fairEntry = fairDataMap.get(student.id);
        const attended = !!fairEntry;
        const engagement = attended
          ? getEngagementLevel(fairEntry.standsScanned)
          : "low";
        const engColor = getEngagementColor(engagement);

        return (
          <div
            key={student.id}
            style={{
              display: "grid",
              gridTemplateColumns: "40px 2fr 80px 1fr 1fr 1fr 1fr 100px",
              gap: "12px",
              padding: "14px 20px",
              borderBottom:
                idx < STUDENTS.length - 1 ? "1px solid #E8E8E8" : "none",
              alignItems: "center",
              background: !attended ? "rgba(107, 107, 107, 0.04)" : undefined,
              opacity: attended ? 1 : 0.65,
            }}
          >
            {/* Avatar */}
            <AvatarCircle
              firstName={student.firstName}
              lastName={student.lastName}
              index={idx}
              dimmed={!attended}
            />

            {/* Name */}
            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: "14px",
                  color: attended ? "#1A1A1A" : "#6B6B6B",
                  marginBottom: "1px",
                }}
              >
                {student.firstName} {student.lastName}
              </p>
              {attended && (
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: engColor,
                    display: "inline-block",
                  }}
                  title={`Engagement: ${engagement}`}
                />
              )}
            </div>

            {/* Présence */}
            <div>
              {attended ? (
                <Tag variant="blue">Présent</Tag>
              ) : (
                <Tag variant="red">Absent</Tag>
              )}
            </div>

            {/* Stands */}
            <div>
              {attended ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: `${engColor}18`,
                    color: engColor,
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke={engColor}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  >
                    <circle cx="6" cy="6" r="4" />
                    <path d="M6 4v2l1.5 1.5" />
                  </svg>
                  {fairEntry.standsScanned}
                </div>
              ) : (
                <span style={{ fontSize: "12px", color: "#6B6B6B", fontStyle: "italic" }}>
                  —
                </span>
              )}
            </div>

            {/* Conférences */}
            <div>
              {attended ? (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: fairEntry.conferences > 0 ? "#003C8F" : "#6B6B6B",
                  }}
                >
                  {fairEntry.conferences > 0
                    ? `${fairEntry.conferences} conf.`
                    : "—"}
                </span>
              ) : (
                <span style={{ fontSize: "12px", color: "#6B6B6B", fontStyle: "italic" }}>
                  —
                </span>
              )}
            </div>

            {/* Durée */}
            <div>
              {attended ? (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                  }}
                >
                  {formatDwell(fairEntry.dwellMinutes)}
                </span>
              ) : (
                <span style={{ fontSize: "12px", color: "#6B6B6B", fontStyle: "italic" }}>
                  —
                </span>
              )}
            </div>

            {/* Top école */}
            <div>
              {attended ? (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#1A1A1A",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "block",
                    maxWidth: "100px",
                  }}
                  title={fairEntry.topInterest}
                >
                  {fairEntry.topInterest}
                </span>
              ) : (
                <Tag variant="red" style={{ fontSize: "10px" }}>
                  Aucun scan
                </Tag>
              )}
            </div>

            {/* Detail link */}
            <div>
              {attended ? (
                <a
                  href={`/teacher/students/${student.id}`}
                  style={{
                    fontSize: "12px",
                    color: "var(--le-blue)",
                    fontWeight: 600,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Voir le détail →
                </a>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────

type ViewMode = "before" | "during";

export default function TeacherStudents() {
  const [viewMode, setViewMode] = useState<ViewMode>("before");

  const attendedCount = FAIR_DATA.length;
  const absentCount = STUDENTS.length - attendedCount;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
          <SectionLabel>Suivi pédagogique</SectionLabel>
          <h1 className="le-h1" style={{ marginTop: "10px" }}>
            Suivi Individuel
          </h1>
          <p className="le-body" style={{ marginTop: "4px" }}>
            Terminale S — Groupe 2 · 28 élèves
          </p>
        </div>
        <Tag variant="blue">Terminale S — Groupe 2</Tag>
      </div>

      {/* View toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "#E8E8E8",
            borderRadius: "8px",
            padding: "4px",
          }}
          role="tablist"
          aria-label="Mode de vue"
        >
          {(
            [
              { key: "before" as ViewMode, label: "Vue avant le salon" },
              { key: "during" as ViewMode, label: "Vue pendant/après le salon" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={viewMode === tab.key}
              onClick={() => setViewMode(tab.key)}
              style={{
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                background: viewMode === tab.key ? "#ffffff" : "transparent",
                color: viewMode === tab.key ? "#1A1A1A" : "#6B6B6B",
                boxShadow:
                  viewMode === tab.key
                    ? "0 1px 4px rgba(0,0,0,0.12)"
                    : "none",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {viewMode === "during" && (
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#16A34A",
                }}
              />
              <span style={{ fontSize: "12px", color: "#6B6B6B" }}>
                Engagement élevé (5+ stands)
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#FFD100",
                }}
              />
              <span style={{ fontSize: "12px", color: "#6B6B6B" }}>
                Moyen (3–4)
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#E3001B",
                }}
              />
              <span style={{ fontSize: "12px", color: "#6B6B6B" }}>
                Faible (1–2)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* During/after view summary bar */}
      {viewMode === "during" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {[
            { label: "Présents", value: attendedCount, color: "#16A34A" },
            { label: "Absents", value: absentCount, color: "var(--le-red)" },
            {
              label: "Moy. stands",
              value:
                Math.round(
                  FAIR_DATA.reduce((a, d) => a + d.standsScanned, 0) /
                    FAIR_DATA.length
                ) + " stands",
              color: "var(--le-blue)",
            },
            {
              label: "Moy. durée",
              value: formatDwell(
                Math.round(
                  FAIR_DATA.reduce((a, d) => a + d.dwellMinutes, 0) /
                    FAIR_DATA.length
                )
              ),
              color: "#FFD100",
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
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {viewMode === "before" ? <BeforeView /> : <DuringAfterView />}

      {/* Export */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
        }}
      >
        <Button variant="ghost" size="sm">
          Exporter le suivi CSV
        </Button>
      </div>
    </div>
  );
}
