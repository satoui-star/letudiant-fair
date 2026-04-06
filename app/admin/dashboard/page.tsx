"use client";

import { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

const FAIRS = [
  "Salon de Paris — 15 avril 2026",
  "Salon de Lyon — 22 mars 2026",
  "Salon de Bordeaux — 8 février 2026",
];

/* ─── PRE-FAIR DATA ─── */
const PRE_FAIR = {
  registrations: 5420,
  profileComplete: 3120,
  profileCompletePct: 57,
  schoolGroups: 48,
  studentsViaTeacher: 1340,
  studentsViaTeacherPct: 15,
  optinWAX: 2268,
  optinWAXPct: 42,
  topFiliere: "Économie-Gestion (43%)",
  fairsUpcoming: 3,
  likelyAttendance: 3850,
};

const TEACHER_GROUPS = [
  { school: "Lycée Louis-le-Grand", group: "Terminale ES — G1", students: 34, connection: 91 },
  { school: "Lycée Pasteur", group: "Terminale STMG — G2", students: 28, connection: 78 },
  { school: "Lycée Michelet", group: "Première G — G1", students: 31, connection: 84 },
  { school: "Lycée Carnot", group: "Terminale ES — G3", students: 22, connection: 68 },
  { school: "Lycée Victor Hugo", group: "BTS Management — G1", students: 19, connection: 73 },
];

const FILIERES = [
  { name: "Économie-Gestion", pct: 43 },
  { name: "Sciences (STEM)", pct: 31 },
  { name: "Lettres-SHS", pct: 14 },
  { name: "Santé", pct: 8 },
  { name: "Arts & Design", pct: 4 },
];

/* ─── LIVE DATA ─── */
const LIVE_FAIR = {
  scansEntry: 3891,
  noShows: 1529,
  noShowRate: 0.282,
  standsScanned: 14203,
  avgStandsPerVisitor: 3.65,
  conferencesCheckins: 2890,
  activeRightNow: 234,
  avgDwellTime: "3h42",
  topStands: [
    { name: "HEC Paris", scans: 487, stand: "B12" },
    { name: "Sciences Po", scans: 412, stand: "A7" },
    { name: "INSA Lyon", scans: 389, stand: "C3" },
    { name: "emlyon", scans: 341, stand: "B8" },
    { name: "Université Paris-Saclay", scans: 298, stand: "D1" },
    { name: "CentraleSupélec", scans: 276, stand: "A15" },
    { name: "Polytechnique", scans: 256, stand: "B2" },
    { name: "ESSEC", scans: 234, stand: "C9" },
    { name: "Kedge", scans: 198, stand: "D7" },
    { name: "Montpellier Supagro", scans: 145, stand: "E4" },
    { name: "Université Bordeaux", scans: 132, stand: "F2" },
    { name: "IUT Grenoble", scans: 98, stand: "G1" },
  ],
};

const NO_SHOW_CHANNELS = [
  { channel: "Inscription directe site", noShows: 712, pct: 46.6 },
  { channel: "Via enseignant (groupe)", noShows: 318, pct: 20.8 },
  { channel: "Réseaux sociaux", noShows: 284, pct: 18.6 },
  { channel: "Email marketing", noShows: 215, pct: 14.0 },
];

/* ─── POST-FAIR DATA ─── */
const POST_FAIR = {
  enrichedProfiles: 2134,
  enrichedProfilesPct: 55,
  enrichedProfilesTarget: 40,
  waxOpenRate: 0.38,
  waxOpenRateTarget: 0.35,
  socialFollowThrough: 0.063,
  socialFollowThroughTarget: 0.05,
  scoredLeads: 0.68,
  scoredLeadsTarget: 0.60,
  exhibitorSatisfaction: 0.74,
  exhibitorSatisfactionTarget: 0.70,
  docsDownloaded: 8934,
  appointmentsBooked: 234,
  compareToolUsage: 892,
  nextFairRegistrations: 312,
  schoolFollows: 1456,
};

/* ─── HELPERS ─── */
function getHeatColor(scans: number, max: number): string {
  const ratio = scans / max;
  if (ratio > 0.7) return "#E3001B";
  if (ratio > 0.4) return "#003C8F";
  return "#FFD100";
}

function getHeatTextColor(scans: number, max: number): string {
  const ratio = scans / max;
  return ratio > 0.4 ? "#ffffff" : "#1A1A1A";
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

/* ─── SUB-COMPONENTS ─── */
function KpiCard({
  label,
  value,
  delta,
  up,
  highlight,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className="kpi-card"
      style={highlight ? { border: "2px solid #FFD100", background: "#FFFBE6" } : undefined}
    >
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      <p className={`kpi-delta ${up ? "positive" : "negative"}`}>
        {up ? "▲" : "▼"} {delta}
      </p>
    </div>
  );
}

function ProgressBar({
  value,
  target,
  color,
  showTarget = true,
}: {
  value: number;
  target: number;
  color: string;
  showTarget?: boolean;
}) {
  return (
    <div style={{ position: "relative", height: "12px", background: "#E8E8E8", borderRadius: "6px", overflow: "visible" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(value, 100)}%`,
          background: color,
          borderRadius: "6px",
          transition: "width 0.5s ease",
        }}
      />
      {showTarget && (
        <div
          style={{
            position: "absolute",
            top: "-4px",
            left: `${target}%`,
            width: "2px",
            height: "20px",
            background: "#1A1A1A",
            borderRadius: "1px",
          }}
          title={`Objectif : ${target}%`}
        />
      )}
    </div>
  );
}

function ScAchievementCard({
  code,
  label,
  actual,
  target,
  unit = "%",
  color,
}: {
  code: string;
  label: string;
  actual: number;
  target: number;
  unit?: string;
  color: string;
}) {
  const achieved = actual >= target;
  return (
    <div
      className="le-card"
      style={{
        padding: "20px",
        borderLeft: `4px solid ${achieved ? "#16A34A" : "#FFD100"}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            {code}
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>{label}</p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            background: achieved ? "#DCFCE7" : "#FFFBE6",
            color: achieved ? "#16A34A" : "#7A6200",
          }}
        >
          {achieved ? "✓ Objectif atteint" : "En cours"}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color }}>
          {actual}{unit}
        </span>
        <span style={{ fontSize: 13, color: "#6B6B6B" }}>
          Objectif : {target}{unit}
        </span>
      </div>
      <ProgressBar value={actual} target={target} color={color} />
    </div>
  );
}

/* ─── TAB CONTENT COMPONENTS ─── */
function TabAvant() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <KpiCard label="Total inscrits" value={fmt(PRE_FAIR.registrations)} delta="+8.2% vs dernier salon" up={true} />
        <KpiCard label="Profils complétés" value={fmt(PRE_FAIR.profileComplete)} delta={`${PRE_FAIR.profileCompletePct}% de complétion`} up={true} />
        <KpiCard label="Groupes enseignants" value={String(PRE_FAIR.schoolGroups)} delta="classes connectées" up={true} />
        <KpiCard label="Via enseignants" value={fmt(PRE_FAIR.studentsViaTeacher)} delta={`${PRE_FAIR.studentsViaTeacherPct}% de l'audience`} up={true} />
        <KpiCard label="Opt-in WAX" value={`${PRE_FAIR.optinWAXPct}%`} delta="+3pts vs objectif" up={true} />
        <KpiCard label="Présence estimée" value={fmt(PRE_FAIR.likelyAttendance)} delta="modèle prédictif" up={true} />
      </div>

      {/* Profile completion gauge */}
      <div className="le-card le-card-padded">
        <SectionLabel>Complétion des profils</SectionLabel>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
              {fmt(PRE_FAIR.profileComplete)} profils complets
            </span>
            <Tag variant="blue">{PRE_FAIR.profileCompletePct}%</Tag>
          </div>
          <ProgressBar value={PRE_FAIR.profileCompletePct} target={70} color="#003C8F" />
          <p style={{ fontSize: 12, color: "#6B6B6B", marginTop: 8 }}>
            Objectif : 70% — {fmt(PRE_FAIR.registrations - PRE_FAIR.profileComplete)} profils incomplets restants
          </p>
        </div>
      </div>

      {/* Top filières + Opt-in */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Filières bar chart */}
        <div className="le-card le-card-padded">
          <SectionLabel>Top filières déclarées</SectionLabel>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {FILIERES.map((f) => (
              <div key={f.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{f.name}</span>
                  <span style={{ fontSize: 13, color: "#6B6B6B" }}>{f.pct}%</span>
                </div>
                <div style={{ height: 8, background: "#E8E8E8", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${f.pct}%`,
                      background: f.name === "Économie-Gestion" ? "#E3001B" : "#003C8F",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Opt-in + estimated attendance */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="le-card le-card-padded" style={{ flex: 1 }}>
            <SectionLabel>Opt-in WAX</SectionLabel>
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 32, fontWeight: 700, color: "#E3001B", margin: 0 }}>
                {PRE_FAIR.optinWAXPct}%
              </p>
              <p style={{ fontSize: 13, color: "#6B6B6B", margin: "4px 0 12px" }}>
                {fmt(PRE_FAIR.optinWAX)} inscrits
              </p>
              <ProgressBar value={PRE_FAIR.optinWAXPct} target={35} color="#E3001B" />
              <p style={{ fontSize: 11, color: "#6B6B6B", marginTop: 6 }}>Objectif : 35%</p>
            </div>
          </div>
          <div className="le-card le-card-padded" style={{ flex: 1 }}>
            <SectionLabel>Présence estimée (modèle)</SectionLabel>
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 32, fontWeight: 700, color: "#003C8F", margin: 0 }}>
                {fmt(PRE_FAIR.likelyAttendance)}
              </p>
              <p style={{ fontSize: 13, color: "#6B6B6B", margin: "4px 0 0" }}>
                sur {fmt(PRE_FAIR.registrations)} inscrits
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher groups table */}
      <div className="le-card le-card-padded">
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Groupes enseignants</SectionLabel>
          <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 6 }}>
            {PRE_FAIR.schoolGroups} groupes actifs — {fmt(PRE_FAIR.studentsViaTeacher)} étudiants inscrits via un enseignant
          </p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E8E8E8" }}>
                {["Établissement", "Groupe", "Élèves", "Connexion"].map((h) => (
                  <th
                    key={h}
                    style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#6B6B6B", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEACHER_GROUPS.map((g, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #E8E8E8" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "#1A1A1A" }}>{g.school}</td>
                  <td style={{ padding: "12px", color: "#3D3D3D" }}>{g.group}</td>
                  <td style={{ padding: "12px", color: "#3D3D3D" }}>{g.students}</td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "#E8E8E8", borderRadius: 3, overflow: "hidden", maxWidth: 80 }}>
                        <div style={{ height: "100%", width: `${g.connection}%`, background: g.connection >= 80 ? "#16A34A" : "#FFD100", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 600, color: g.connection >= 80 ? "#16A34A" : "#7A6200" }}>{g.connection}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabPendant() {
  const maxScans = Math.max(...LIVE_FAIR.topStands.map((s) => s.scans));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Live KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
        <KpiCard label="Entrées scannées" value={fmt(LIVE_FAIR.scansEntry)} delta="+5.1% vs dernier" up={true} />
        <KpiCard
          label="Non-présents"
          value={fmt(LIVE_FAIR.noShows)}
          delta={`${(LIVE_FAIR.noShowRate * 100).toFixed(1)}% — 1re mesure !`}
          up={false}
          highlight={true}
        />
        <KpiCard label="Scans stands" value={fmt(LIVE_FAIR.standsScanned)} delta="total journée" up={true} />
        <KpiCard label="Stands/visiteur" value={String(LIVE_FAIR.avgStandsPerVisitor)} delta="moyenne" up={true} />
        <KpiCard label="Conf. check-ins" value={fmt(LIVE_FAIR.conferencesCheckins)} delta="validations" up={true} />
        <KpiCard label="Actifs maintenant" value={fmt(LIVE_FAIR.activeRightNow)} delta="en temps réel" up={true} />
      </div>

      {/* No-show alert card */}
      <div
        style={{
          background: "#FFFBE6",
          border: "2px solid #FFD100",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: "0 0 6px" }}>
              {fmt(LIVE_FAIR.noShows)} inscrits non présents ({(LIVE_FAIR.noShowRate * 100).toFixed(1)}%)
            </p>
            <p style={{ fontSize: 13, color: "#3D3D3D", margin: "0 0 16px" }}>
              Taux de no-show <strong>mesurable pour la première fois</strong> grâce aux QR codes d&apos;entrée — cette donnée était invisible avant.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {NO_SHOW_CHANNELS.map((ch) => (
                <div key={ch.channel}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>{ch.channel}</span>
                    <span style={{ fontSize: 12, color: "#6B6B6B" }}>{fmt(ch.noShows)} ({ch.pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: "#E8E8E8", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ch.pct}%`, background: "#FFD100", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="le-card le-card-padded">
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Heatmap stands — activité en temps réel</SectionLabel>
          <p style={{ fontSize: 12, color: "#6B6B6B", marginTop: 6 }}>
            Intensité = nombre de scans. Rouge = haute activité · Bleu = moyenne · Jaune = faible
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {LIVE_FAIR.topStands.map((stand) => {
            const bg = getHeatColor(stand.scans, maxScans);
            const textColor = getHeatTextColor(stand.scans, maxScans);
            const ratio = stand.scans / maxScans;
            const height = ratio > 0.7 ? 90 : ratio > 0.4 ? 70 : 52;
            return (
              <div
                key={stand.name}
                className="heatmap-stand"
                style={{ background: bg, height, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8, textAlign: "center" }}
                title={`${stand.name} — ${stand.scans} scans — Stand ${stand.stand}`}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: textColor, lineHeight: 1.2 }}>
                  {stand.name}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, color: textColor, opacity: 0.8 }}>
                  {stand.stand}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: textColor, marginTop: 2 }}>
                  {stand.scans}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { color: "#E3001B", label: "Haute activité (>70%)" },
            { color: "#003C8F", label: "Activité moyenne (40–70%)" },
            { color: "#FFD100", label: "Faible activité (<40%)" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#6B6B6B" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Movement patterns */}
      <div className="le-card le-card-padded" style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Durée de visite moyenne
          </p>
          <p style={{ fontSize: 40, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>{LIVE_FAIR.avgDwellTime}</p>
        </div>
        <div style={{ width: 1, height: 60, background: "#E8E8E8", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Stands visités / visiteur
          </p>
          <p style={{ fontSize: 40, fontWeight: 700, color: "#003C8F", margin: 0 }}>{LIVE_FAIR.avgStandsPerVisitor}</p>
        </div>
        <div style={{ width: 1, height: 60, background: "#E8E8E8", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Conférences check-ins
          </p>
          <p style={{ fontSize: 40, fontWeight: 700, color: "#E3001B", margin: 0 }}>{fmt(LIVE_FAIR.conferencesCheckins)}</p>
        </div>
      </div>
    </div>
  );
}

function TabApres() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* SC achievement cards */}
      <div>
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Objectifs stratégiques — Résultats</SectionLabel>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <ScAchievementCard
            code="SC1"
            label="Profils enrichis post-salon"
            actual={POST_FAIR.enrichedProfilesPct}
            target={POST_FAIR.enrichedProfilesTarget}
            color="#E3001B"
          />
          <ScAchievementCard
            code="SC2"
            label="Taux d'ouverture WAX"
            actual={Math.round(POST_FAIR.waxOpenRate * 100)}
            target={Math.round(POST_FAIR.waxOpenRateTarget * 100)}
            color="#003C8F"
          />
          <ScAchievementCard
            code="SC2b"
            label="Suivi réseaux sociaux"
            actual={Math.round(POST_FAIR.socialFollowThrough * 100 * 10) / 10}
            target={Math.round(POST_FAIR.socialFollowThroughTarget * 100)}
            color="#003C8F"
          />
          <ScAchievementCard
            code="SC3"
            label="Leads scorés exposants"
            actual={Math.round(POST_FAIR.scoredLeads * 100)}
            target={Math.round(POST_FAIR.scoredLeadsTarget * 100)}
            color="#FFD100"
          />
          <ScAchievementCard
            code="SC3b"
            label="Satisfaction exposants"
            actual={Math.round(POST_FAIR.exhibitorSatisfaction * 100)}
            target={Math.round(POST_FAIR.exhibitorSatisfactionTarget * 100)}
            color="#FFD100"
          />
        </div>
      </div>

      {/* Post-fair engagement */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="le-card le-card-padded">
          <SectionLabel>Engagement post-salon</SectionLabel>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Documents téléchargés", value: fmt(POST_FAIR.docsDownloaded), color: "#E3001B" },
              { label: "RDV pris en ligne", value: String(POST_FAIR.appointmentsBooked), color: "#003C8F" },
              { label: "Follows écoles réseaux", value: fmt(POST_FAIR.schoolFollows), color: "#003C8F" },
              { label: "Outil comparaison utilisé", value: String(POST_FAIR.compareToolUsage), color: "#6B6B6B" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #E8E8E8" }}>
                <span style={{ fontSize: 13, color: "#3D3D3D" }}>{item.label}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Lead quality */}
          <div className="le-card le-card-padded">
            <SectionLabel>Qualité des leads</SectionLabel>
            <div style={{ marginTop: 12, display: "flex", gap: 16 }}>
              <div>
                <p style={{ fontSize: 32, fontWeight: 700, color: "#E3001B", margin: 0 }}>
                  {Math.round(POST_FAIR.scoredLeads * 100)}%
                </p>
                <p style={{ fontSize: 12, color: "#6B6B6B", margin: "4px 0 0" }}>leads scorés</p>
              </div>
              <div>
                <p style={{ fontSize: 32, fontWeight: 700, color: "#003C8F", margin: 0 }}>
                  {Math.round(POST_FAIR.exhibitorSatisfaction * 100)}%
                </p>
                <p style={{ fontSize: 12, color: "#6B6B6B", margin: "4px 0 0" }}>satisf. exposants</p>
              </div>
            </div>
          </div>

          {/* Re-engagement */}
          <div
            className="le-card le-card-padded"
            style={{ background: "#E6ECF8", border: "none" }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: "#003C8F", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Re-engagement
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, color: "#003C8F", margin: "0 0 4px" }}>
              {POST_FAIR.nextFairRegistrations}
            </p>
            <p style={{ fontSize: 13, color: "#003C8F", margin: 0 }}>
              étudiants déjà inscrits au prochain salon
            </p>
          </div>
        </div>
      </div>

      {/* Export button */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button variant="ghost">⬇ Exporter CSV</Button>
        <Button variant="primary">⬇ Exporter le rapport complet</Button>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function AdminDashboard() {
  const [selectedFair, setSelectedFair] = useState(FAIRS[0]);
  const [activeTab, setActiveTab] = useState<"avant" | "pendant" | "apres">("avant");

  const TABS = [
    { id: "avant" as const, label: "Avant le salon" },
    { id: "pendant" as const, label: "Pendant le salon" },
    { id: "apres" as const, label: "Après le salon" },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <SectionLabel>Analytics Admin — L&apos;Étudiant</SectionLabel>
          <h1 className="le-h1" style={{ marginTop: "10px" }}>
            Tableau de bord
          </h1>
          <p className="le-body" style={{ color: "#6B6B6B" }}>
            Base de données : <strong>8 954 établissements</strong> · <strong>66 423 formations</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedFair}
            onChange={(e) => setSelectedFair(e.target.value)}
            className="le-input"
            style={{ width: "auto", minWidth: "280px" }}
            aria-label="Sélectionner un salon"
          >
            {FAIRS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <Button variant="ghost" size="sm">⬇ Exporter CSV</Button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 28,
          borderBottom: "2px solid #E8E8E8",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: activeTab === tab.id ? "#E3001B" : "#6B6B6B",
              borderBottom: activeTab === tab.id ? "2px solid #E3001B" : "2px solid transparent",
              marginBottom: -2,
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "avant" && <TabAvant />}
      {activeTab === "pendant" && <TabPendant />}
      {activeTab === "apres" && <TabApres />}
    </div>
  );
}
