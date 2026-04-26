"use client";
export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/Skeleton";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";

// ── Types ──────────────────────────────────────────────────────────────────────
type BranchInterest = { label: string; count: number; pct: number; color: string };
type TopSchool      = { name: string; count: number; type: string };
type StudyLevel     = { level: string; count: number; pct: number };

// ── Colors ─────────────────────────────────────────────────────────────────────
const BRANCH_COLORS  = ["#0066CC", "#EC1F27", "#FCD716", "#16A34A", "#7C3AED", "#0891B2", "#EA580C", "#BE185D"];
const LEVEL_COLORS   = ["#0066CC", "#EC1F27", "#FCD716", "#E8E8E8"];

// ── Sub-components (unchanged UI) ──────────────────────────────────────────────

function HorizontalBar({ label, count, pct, color, rank }: {
  label: string; count: number; pct: number; color: string; rank: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: rank <= 2 ? color : "#E8E8E8", color: rank <= 2 ? (color === "#FCD716" ? "#1A1A1A" : "#ffffff") : "#6B6B6B", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {rank}
      </span>
      <span style={{ width: "200px", fontSize: "13px", fontWeight: 500, color: "#1A1A1A", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={label}>
        {label}
      </span>
      <div style={{ flex: 1, height: "10px", background: "#E8E8E8", borderRadius: "5px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "5px", transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color, width: "28px", textAlign: "right", flexShrink: 0 }}>{count}</span>
      <span style={{ fontSize: "12px", color: "#6B6B6B", width: "36px", textAlign: "right", flexShrink: 0 }}>{pct}%</span>
    </div>
  );
}

function SchoolRankRow({ rank, name, type, count, totalLength }: {
  rank: number; name: string; type: string; count: number; totalLength: number;
}) {
  const medalColors: Record<number, string> = { 1: "#FCD716", 2: "#C0C0C0", 3: "#CD7F32" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 0", borderBottom: rank < totalLength ? "1px solid #E8E8E8" : "none" }}>
      <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: medalColors[rank] ?? "#F4F4F4", color: rank <= 3 ? "#1A1A1A" : "#6B6B6B", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {rank}
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: "14px", color: "#1A1A1A", marginBottom: "2px" }}>{name}</p>
        <p style={{ fontSize: "12px", color: "#6B6B6B", margin: 0 }}>{type}</p>
      </div>
      <div style={{ background: "var(--le-blue-light)", color: "var(--le-blue)", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
        {count} élève{count !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function StudyLevelBar({ level, count, pct, color }: { level: string; count: number; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#1A1A1A" }}>{level}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A" }}>
          {count} <span style={{ fontWeight: 400, color: "#6B6B6B" }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: "8px", background: "#E8E8E8", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TeacherInsights() {
  const { user } = useAuth();

  const [loading,         setLoading]         = useState(true);
  const [totalMembers,    setTotalMembers]     = useState(0);
  const [totalProfiles,   setTotalProfiles]    = useState(0);
  const [branchInterests, setBranchInterests] = useState<BranchInterest[]>([]);
  const [topSchools,      setTopSchools]      = useState<TopSchool[]>([]);
  const [studyLevelDist,  setStudyLevelDist]  = useState<StudyLevel[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = getSupabase();

      // Get teacher's group
      const { data: groupRaw } = await supabase
        .from("groups")
        .select("member_uids")
        .eq("teacher_id", user!.id)
        .maybeSingle();

      const group = groupRaw as { member_uids: string[] } | null;

      if (!group?.member_uids?.length) { setLoading(false); return; }

      setTotalMembers(group.member_uids.length);

      // Fetch members' profile fields
      const { data: membersRaw } = await supabase
        .from("users")
        .select("id, education_level, education_branches")
        .in("id", group.member_uids);

      const members = (membersRaw ?? []) as { id: string; education_level: string | null; education_branches: string[] }[];

      if (!members.length) { setLoading(false); return; }

      const withProfile = members.filter(m => !!m.education_level);
      setTotalProfiles(withProfile.length);

      // Study level distribution
      const levelCounts: Record<string, number> = {};
      for (const m of members) {
        const lvl = m.education_level;
        if (lvl) levelCounts[lvl] = (levelCounts[lvl] ?? 0) + 1;
      }
      const totalWithLevel = Object.values(levelCounts).reduce((a, b) => a + b, 0);
      setStudyLevelDist(
        Object.entries(levelCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([level, count]) => ({
            level,
            count,
            pct: totalWithLevel ? Math.round((count / totalWithLevel) * 100) : 0,
          }))
      );

      // Branch interests (each member can declare multiple)
      const branchCounts: Record<string, number> = {};
      for (const m of members) {
        const branches: string[] = (m as any).education_branches ?? [];
        for (const b of branches) {
          if (b) branchCounts[b] = (branchCounts[b] ?? 0) + 1;
        }
      }
      setBranchInterests(
        Object.entries(branchCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([label, count], i) => ({
            label,
            count,
            pct: members.length ? Math.round((count / members.length) * 100) : 0,
            color: BRANCH_COLORS[i % BRANCH_COLORS.length],
          }))
      );

      // Top saved schools: matches where student swiped right
      const { data: matchRowsRaw } = await supabase
        .from("matches")
        .select("school_id")
        .in("student_id", group.member_uids)
        .eq("student_swipe", "right");

      const matchRows = matchRowsRaw as { school_id: string }[] | null;

      if (matchRows?.length) {
        const schoolCounts: Record<string, number> = {};
        for (const row of matchRows) {
          if (row.school_id) schoolCounts[row.school_id] = (schoolCounts[row.school_id] ?? 0) + 1;
        }
        const topIds = Object.entries(schoolCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id]) => id);
        const { data: schoolsRaw } = await supabase.from("schools").select("id, name, type").in("id", topIds);
        const schools = schoolsRaw as { id: string; name: string; type: string }[] | null;
        const schoolMap = new Map((schools ?? []).map(s => [s.id, s]));
        setTopSchools(
          topIds
            .filter(id => schoolMap.has(id))
            .map(id => ({
              name:  schoolMap.get(id)!.name,
              type:  schoolMap.get(id)!.type,
              count: schoolCounts[id],
            }))
        );
      }

      setLoading(false);
    }
    load();
  }, [user]);

  function handleExport() {
    const lines: string[][] = [["Filière", "Nombre d'élèves", "Pourcentage"]];
    for (const b of branchInterests) lines.push([b.label, String(b.count), `${b.pct}%`]);
    lines.push([]);
    lines.push(["Niveau visé", "Nombre", "Pourcentage"]);
    for (const l of studyLevelDist) lines.push([l.level, String(l.count), `${l.pct}%`]);
    const csv = lines.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `rapport_classe_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const hasData = branchInterests.length > 0 || studyLevelDist.length > 0 || topSchools.length > 0;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <SectionLabel>Analyse pédagogique</SectionLabel>
          <h1 className="le-h1" style={{ marginTop: "10px" }}>Intérêts de la Classe</h1>
          <p className="le-body" style={{ marginTop: "4px" }}>
            {loading
              ? "Chargement des données…"
              : !hasData
                ? "Aucun profil complété pour l'instant — invitez vos élèves à rejoindre votre groupe."
                : `${totalProfiles} profil${totalProfiles !== 1 ? "s" : ""} complété${totalProfiles !== 1 ? "s" : ""} sur ${totalMembers} élève${totalMembers !== 1 ? "s" : ""}`}
          </p>
        </div>
        {hasData && (
          <Button variant="ghost" onClick={handleExport}>Télécharger le rapport classe</Button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton variant="card" style={{ height: 120, borderRadius: 12 }} />
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 24 }}>
            <Skeleton variant="card" style={{ height: 300, borderRadius: 12 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Skeleton variant="card" style={{ height: 140, borderRadius: 12 }} />
              <Skeleton variant="card" style={{ height: 140, borderRadius: 12 }} />
            </div>
          </div>
        </div>
      ) : !hasData ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: "48px 24px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 40, margin: "0 0 12px" }}>📊</p>
          <p style={{ fontWeight: 700, fontSize: 16, color: "#1A1A1A", margin: "0 0 6px" }}>Aucune donnée disponible</p>
          <p style={{ fontSize: 13, color: "#6B6B6B", margin: "0 0 20px" }}>Les intérêts de votre classe apparaîtront dès que les élèves auront complété leur profil.</p>
          <Button variant="primary" href="/teacher/dashboard">Partager le lien d'inscription →</Button>
        </div>
      ) : (
        <>
          {/* Advisory insight */}
          {branchInterests.length > 0 && (
            <div style={{ marginBottom: "28px", padding: "16px 20px", background: "var(--le-red-light)", borderLeft: "4px solid var(--le-red)", borderRadius: "0 8px 8px 0", display: "flex", alignItems: "flex-start", gap: "12px" }} role="note">
              <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="var(--le-red)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                <circle cx="10" cy="10" r="9" /><path d="M10 6v4M10 14h.01" />
              </svg>
              <p style={{ fontSize: "14px", color: "var(--le-red-dark)", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                <strong>{branchInterests[0].pct}% de la classe s&apos;intéresse à {branchInterests[0].label}</strong> — pensez à prioriser les stands correspondants lors de votre visite au salon.
              </p>
            </div>
          )}

          {/* Two-column layout */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "24px", marginBottom: "24px" }}>

            {/* Filières populaires */}
            <div className="le-card le-card-padded">
              <div style={{ marginBottom: "20px" }}>
                <SectionLabel>Filières populaires</SectionLabel>
                <p style={{ fontSize: "12px", color: "#6B6B6B", marginTop: "6px" }}>Basé sur les profils d&apos;élèves complétés — plusieurs filières par élève possible</p>
              </div>
              {branchInterests.length === 0 ? (
                <p style={{ fontSize: 13, color: "#6B6B6B", textAlign: "center", padding: "24px 0" }}>Les filières préférées apparaîtront dès que les élèves rempliront leur profil.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {branchInterests.map((branch, i) => (
                    <HorizontalBar key={branch.label} rank={i + 1} label={branch.label} count={branch.count} pct={branch.pct} color={branch.color} />
                  ))}
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Top 5 schools */}
              <div className="le-card le-card-padded">
                <div style={{ marginBottom: "12px" }}>
                  <SectionLabel>Top 5 établissements sauvegardés</SectionLabel>
                </div>
                {topSchools.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#6B6B6B", textAlign: "center", padding: "16px 0" }}>Les écoles sauvegardées par vos élèves apparaîtront ici.</p>
                ) : (
                  topSchools.map((school, i) => (
                    <SchoolRankRow key={school.name} rank={i + 1} name={school.name} type={school.type} count={school.count} totalLength={topSchools.length} />
                  ))
                )}
              </div>

              {/* Niveau d'études visé */}
              <div className="le-card le-card-padded">
                <div style={{ marginBottom: "16px" }}>
                  <SectionLabel>Niveau d&apos;études visé</SectionLabel>
                </div>
                {studyLevelDist.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#6B6B6B", textAlign: "center", padding: "16px 0" }}>La répartition des niveaux visés apparaîtra ici.</p>
                ) : (
                  <>
                    {studyLevelDist.map((item, i) => (
                      <StudyLevelBar key={item.level} level={item.level} count={item.count} pct={item.pct} color={LEVEL_COLORS[i]} />
                    ))}
                    <div style={{ marginTop: "16px" }}>
                      <p style={{ fontSize: "11px", color: "#6B6B6B", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Répartition globale</p>
                      <div style={{ display: "flex", height: "16px", borderRadius: "8px", overflow: "hidden" }} role="img" aria-label="Répartition des niveaux d'études visés">
                        {studyLevelDist.map((item, i) => (
                          <div key={item.level} title={`${item.level}: ${item.pct}%`} style={{ width: `${item.pct}%`, background: LEVEL_COLORS[i] }} />
                        ))}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                        {studyLevelDist.map((item, i) => (
                          <div key={item.level} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: LEVEL_COLORS[i], flexShrink: 0 }} />
                            <span style={{ fontSize: "11px", color: "#6B6B6B" }}>{item.pct}% {item.level.split(" ")[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            {[
              { label: "Filières explorées",  value: branchInterests.length,            sub: branchInterests.length ? "au total" : "aucune donnée",                                       color: "var(--le-blue)" },
              { label: "Établissement top",   value: topSchools[0]?.name ?? "—",         sub: topSchools[0] ? `${topSchools[0].count} élèves intéressés` : "aucune donnée",               color: "#FCD716" },
              { label: "Ambition dominante",  value: studyLevelDist[0]?.level.split(" ")[0] ?? "—", sub: studyLevelDist[0] ? `${studyLevelDist[0].pct}% de la classe` : "aucune donnée", color: "var(--le-red)" },
              { label: "Profils complétés",   value: totalProfiles,                      sub: `sur ${totalMembers} élève${totalMembers !== 1 ? "s" : ""}`,                                color: "#16A34A" },
            ].map(item => (
              <div key={item.label} className="kpi-card" style={{ borderTop: `3px solid ${item.color}` }}>
                <p className="kpi-label">{item.label}</p>
                <p className="kpi-value" style={{ fontSize: "1.5rem" }}>{item.value}</p>
                <p style={{ fontSize: "12px", color: "#6B6B6B", margin: 0 }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
