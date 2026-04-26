"use client";
export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import { useAuth } from "@/hooks/useAuth";
import { getSupabase } from "@/lib/supabase/client";
import QRCode from 'qrcode';

const ALL_LEVELS = ["Terminale", "Post-bac BTS", "Post-bac Licence", "Post-bac BUT", "Post-bac Bachelor", "Bac+3/4", "Bac+5"];
const ALL_FIELDS = ["Business", "Finance", "Management", "Marketing", "Ingénierie", "Data / IA", "Design", "Santé", "Droit"];
const FORMATION_LEVELS = ["Terminale", "Bac+1", "Bac+2", "Bac+3", "Bac+4", "Bac+5", "Bac+6/7", "Autre"];
const SCHOOL_TYPES = ["Université", "Grande École", "École d'Ingénieurs", "École Spécialisée", "IUT"];

interface FormationDraft {
  id?: string;
  name: string;
  level: string;
  duration: string;
  cost: string;
  rncp_code: string;
}

const EMPTY_FORMATION: FormationDraft = { name: "", level: "", duration: "", cost: "", rncp_code: "" };

export default function ExhibitorProfilePage() {
  const { user } = useAuth();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Identity ──────────────────────────────────────────────────────────────
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");

  // ── Badges ────────────────────────────────────────────────────────────────
  const [parcoursup, setParcoursup] = useState(false);
  const [apprenticeship, setApprenticeship] = useState(false);
  const [scholarshipAllowed, setScholarshipAllowed] = useState(false);

  // ── Targeting ─────────────────────────────────────────────────────────────
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [nbBacG, setNbBacG] = useState("");
  const [nbBacT, setNbBacT] = useState("");
  const [nbBacP, setNbBacP] = useState("");
  const [insertionRate, setInsertionRate] = useState("");
  const [tuitionFee, setTuitionFee] = useState("");

  // ── Formations ────────────────────────────────────────────────────────────
  const [formations, setFormations] = useState<FormationDraft[]>([]);
  const [newFormation, setNewFormation] = useState<FormationDraft>(EMPTY_FORMATION);
  const [addingFormation, setAddingFormation] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // ── Media ─────────────────────────────────────────────────────────────────
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [reelUrl, setReelUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadTarget, setUploadTarget] = useState<"cover" | "reel" | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrProfileUrl, setQrProfileUrl] = useState<string | null>(null);
  const [originalValues, setOriginalValues] = useState<Record<string, unknown> | null>(null);

  // ── Hydrate ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("schools")
        .select(`id, name, city, type, description, website,
                 parcoursup, apprenticeship, scholarship_allowed,
                 target_levels, target_fields,
                 nb_accepted_bac_g, nb_accepted_bac_t, nb_accepted_bac_p,
                 rate_professional_insertion, tuition_fee,
                 cover_image_url, reel_url`)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) { setLoadError(error.message); setLoading(false); return; }

      if (data) {
        setSchoolId(data.id);
        setSchoolName(data.name ?? "");
        setCity(data.city ?? "");
        setSchoolType(data.type ?? "");
        setDescription(data.description ?? "");
        setWebsite(data.website ?? "");
        setParcoursup(data.parcoursup ?? false);
        setApprenticeship(data.apprenticeship ?? false);
        setScholarshipAllowed(data.scholarship_allowed ?? false);
        setSelectedLevels(data.target_levels ?? []);
        setSelectedFields(data.target_fields ?? []);
        setNbBacG(data.nb_accepted_bac_g != null ? String(data.nb_accepted_bac_g) : "");
        setNbBacT(data.nb_accepted_bac_t != null ? String(data.nb_accepted_bac_t) : "");
        setNbBacP(data.nb_accepted_bac_p != null ? String(data.nb_accepted_bac_p) : "");
        setInsertionRate(data.rate_professional_insertion != null ? String(data.rate_professional_insertion) : "");
        setTuitionFee(data.tuition_fee != null ? String(data.tuition_fee) : "");
        setCoverUrl(data.cover_image_url ?? null);
        setReelUrl(data.reel_url ?? null);
      }

      if (data?.id) {
        const { data: formRows } = await supabase
          .from("formations")
          .select("id, name, level, duration, cost, rncp_code")
          .eq("school_id", data.id)
          .order("name");
        const loaded: FormationDraft[] = (formRows ?? []).map((f) => ({
          id: f.id,
          name: f.name ?? "",
          level: f.level ?? "",
          duration: f.duration ?? "",
          cost: f.cost != null ? String(f.cost) : "",
          rncp_code: f.rncp_code ?? "",
        }));
        setFormations(loaded);
        setOriginalValues({ ...data, formations: loaded });
      } else {
        setOriginalValues(data ?? {});
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── QR code ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const profileUrl = `${origin}/school-preview/${schoolId}`;
      setQrProfileUrl(profileUrl);
      try {
        if (qrCanvasRef.current) {
          await QRCode.toCanvas(qrCanvasRef.current, profileUrl, { width: 200 });
          setQrDataUrl(qrCanvasRef.current.toDataURL('image/png'));
        }
      } catch (err) { console.error('QR error:', err); }
    })();
  }, [schoolId]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function toggleLevel(l: string) {
    setSelectedLevels(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);
  }
  function toggleField(f: string) {
    setSelectedFields(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  }

  function addFormation() {
    if (!newFormation.name.trim()) return;
    setFormations(p => [...p, { ...newFormation, name: newFormation.name.trim() }]);
    setNewFormation(EMPTY_FORMATION);
    setAddingFormation(false);
  }

  function saveEdit(idx: number) {
    setFormations(p => p.map((f, i) => i === idx ? { ...f, ...editDraft } : f));
    setEditingIdx(null);
  }

  const [editDraft, setEditDraft] = useState<FormationDraft>(EMPTY_FORMATION);

  function startEdit(idx: number) {
    setEditDraft({ ...formations[idx] });
    setEditingIdx(idx);
  }

  async function handleCoverFile(file: File) {
    if (!user?.id) return;
    if (file.size > 5 * 1024 * 1024) { setSaveError("Image trop volumineuse (max 5 Mo)."); return; }
    const supabase = getSupabase();
    setUploadTarget("cover"); setUploadProgress(0);
    const path = `${user.id}/${Date.now()}.${file.name.split('.').pop()?.toLowerCase() ?? 'jpg'}`;
    const { error } = await supabase.storage.from("school-covers").upload(path, file, { cacheControl: "3600", upsert: true });
    if (error) { setSaveError(`Upload échoué: ${error.message}`); setUploadProgress(null); return; }
    setUploadProgress(100);
    const { data: pub } = supabase.storage.from("school-covers").getPublicUrl(path);
    setCoverUrl(pub.publicUrl);
    setTimeout(() => { setUploadProgress(null); setUploadTarget(null); }, 1500);
  }

  async function handleReelFile(file: File) {
    if (!user?.id) return;
    if (file.size > 100 * 1024 * 1024) { setSaveError("Vidéo trop volumineuse (max 100 Mo)."); return; }
    const supabase = getSupabase();
    setUploadTarget("reel"); setUploadProgress(0);
    const path = `${user.id}/${Date.now()}.${file.name.split('.').pop()?.toLowerCase() ?? 'mp4'}`;
    const { error } = await supabase.storage.from("school-reels").upload(path, file, { cacheControl: "3600", upsert: true });
    if (error) { setSaveError(`Upload échoué: ${error.message}`); setUploadProgress(null); return; }
    setUploadProgress(100);
    const { data: pub } = supabase.storage.from("school-reels").getPublicUrl(path);
    setReelUrl(pub.publicUrl);
    setTimeout(() => { setUploadProgress(null); setUploadTarget(null); }, 1500);
  }

  function handleCancel() {
    if (!originalValues) return;
    const d = originalValues as Record<string, unknown>;
    setSchoolName((d.name as string) ?? "");
    setCity((d.city as string) ?? "");
    setSchoolType((d.type as string) ?? "");
    setDescription((d.description as string) ?? "");
    setWebsite((d.website as string) ?? "");
    setParcoursup((d.parcoursup as boolean) ?? false);
    setApprenticeship((d.apprenticeship as boolean) ?? false);
    setScholarshipAllowed((d.scholarship_allowed as boolean) ?? false);
    setSelectedLevels((d.target_levels as string[]) ?? []);
    setSelectedFields((d.target_fields as string[]) ?? []);
    setNbBacG(d.nb_accepted_bac_g != null ? String(d.nb_accepted_bac_g) : "");
    setNbBacT(d.nb_accepted_bac_t != null ? String(d.nb_accepted_bac_t) : "");
    setNbBacP(d.nb_accepted_bac_p != null ? String(d.nb_accepted_bac_p) : "");
    setInsertionRate(d.rate_professional_insertion != null ? String(d.rate_professional_insertion) : "");
    setTuitionFee(d.tuition_fee != null ? String(d.tuition_fee) : "");
    setCoverUrl((d.cover_image_url as string | null) ?? null);
    setReelUrl((d.reel_url as string | null) ?? null);
    setFormations((d.formations as FormationDraft[]) ?? []);
    setSaveError(null);
  }

  async function handleSave() {
    if (!user?.id) return;
    if (!schoolName.trim()) { setSaveError("Le nom de l'établissement est obligatoire."); return; }
    setSaving(true); setSaveError(null); setSaved(false);

    const supabase = getSupabase();
    const payload = {
      user_id: user.id,
      name: schoolName.trim(),
      city: city.trim(),
      type: schoolType.trim(),
      description: description.trim() || null,
      website: website.trim() || null,
      parcoursup,
      apprenticeship,
      scholarship_allowed: scholarshipAllowed,
      target_levels: selectedLevels,
      target_fields: selectedFields,
      nb_accepted_bac_g: nbBacG ? parseInt(nbBacG) : null,
      nb_accepted_bac_t: nbBacT ? parseInt(nbBacT) : null,
      nb_accepted_bac_p: nbBacP ? parseInt(nbBacP) : null,
      rate_professional_insertion: insertionRate ? parseFloat(insertionRate) : null,
      tuition_fee: tuitionFee ? parseInt(tuitionFee) : null,
      cover_image_url: coverUrl,
      reel_url: reelUrl,
    };

    let currentSchoolId = schoolId;
    if (currentSchoolId) {
      const { error } = await supabase.from("schools").update(payload).eq("id", currentSchoolId).eq("user_id", user.id);
      if (error) { setSaveError(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("schools").insert(payload).select("id").single();
      if (error || !data) { setSaveError(error?.message ?? "Création impossible"); setSaving(false); return; }
      currentSchoolId = data.id;
      setSchoolId(currentSchoolId);
    }

    if (currentSchoolId) {
      await supabase.from("formations").delete().eq("school_id", currentSchoolId);
      if (formations.length) {
        await supabase.from("formations").insert(
          formations.map(f => ({
            school_id: currentSchoolId,
            name: f.name,
            level: f.level || "-",
            duration: f.duration || "-",
            cost: f.cost ? parseInt(f.cost) : null,
            rncp_code: f.rncp_code || null,
          }))
        );
      }
    }

    setSaving(false); setSaved(true);
    setOriginalValues({ ...payload, formations });
    setTimeout(() => setSaved(false), 3000);
  }

  // ── Loading / error guards ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#6B6B6B" }}>Chargement…</div>
  );
  if (loadError) return (
    <div style={{ padding: 40, textAlign: "center", color: "#EC1F27" }}>Erreur : {loadError}</div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <SectionLabel>Profil établissement</SectionLabel>
        <h1 className="le-h1" style={{ marginTop: "10px" }}>Modifier le profil</h1>
        <p className="le-body">Ces informations sont affichées aux étudiants dans le salon.</p>
      </div>

      {/* Banners */}
      {saveError && (
        <div role="alert" style={{ background: "#FEE2E2", border: "1px solid #EF4444", borderRadius: "6px", padding: "12px 16px", marginBottom: "20px", fontWeight: 600, color: "#7F1D1D", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          ⚠️ {saveError}
        </div>
      )}
      {saved && (
        <div role="status" style={{ background: "#D1FAE5", border: "1px solid #10B981", borderRadius: "6px", padding: "12px 16px", marginBottom: "20px", fontWeight: 600, color: "#065F46", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          ✅ Profil sauvegardé avec succès.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* ── Cover image ────────────────────────────────────────────────── */}
        <div className="le-card le-card-padded">
          <p style={sectionTitle}>Image de couverture</p>
          {coverUrl && (
            <img src={coverUrl} alt="Aperçu" style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "8px", border: "1px solid #E8E8E8", marginBottom: "12px" }} />
          )}
          {uploadTarget === "cover" && uploadProgress !== null ? (
            <ProgressBar progress={uploadProgress} />
          ) : (
            <DropZone
              icon="🖼️"
              label={coverUrl ? "Remplacer l'image" : "Glissez une image ici"}
              hint="JPG, PNG — max 5 Mo — recommandé : 1280×400px"
              accept="image/png,image/jpeg"
              onFile={handleCoverFile}
            />
          )}
        </div>

        {/* ── General info ───────────────────────────────────────────────── */}
        <div className="le-card le-card-padded">
          <p style={sectionTitle}>Informations générales</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Input id="schoolName" label="Nom de l'établissement *" value={schoolName} onChange={e => setSchoolName(e.target.value)} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Input id="city" label="Ville" value={city} onChange={e => setCity(e.target.value)} />
              <Select
                id="schoolType"
                label="Type d'établissement"
                value={schoolType}
                onChange={e => setSchoolType(e.target.value)}
                options={SCHOOL_TYPES.map(type => ({ value: type, label: type }))}
              />
            </div>
            <Input id="website" label="Site web (URL)" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://www.monecole.fr" />
            <div>
              <label htmlFor="description" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3D3D3D", marginBottom: "6px" }}>Description</label>
              <textarea
                id="description" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez votre établissement, ses valeurs et ses atouts…"
                className="le-input"
                style={{ minHeight: "110px", fontFamily: "inherit", lineHeight: "1.5", resize: "vertical" }}
              />
            </div>

            {/* Badges */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#3D3D3D", marginBottom: "10px" }}>Caractéristiques</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {([
                  { key: "parcoursup", label: "Parcoursup", val: parcoursup, set: setParcoursup, color: "#0066CC" },
                  { key: "apprenticeship", label: "Alternance", val: apprenticeship, set: setApprenticeship, color: "#15803d" },
                  { key: "scholarship", label: "Bourses disponibles", val: scholarshipAllowed, set: setScholarshipAllowed, color: "#92400e" },
                ] as const).map(({ key, label, val, set, color }) => (
                  <button key={key} type="button" onClick={() => set(!val)}
                    style={{ padding: "8px 16px", borderRadius: "20px", border: `1.5px solid ${val ? color : "#E8E8E8"}`, background: val ? `${color}18` : "#fff", color: val ? color : "#6B6B6B", fontWeight: val ? 700 : 500, fontSize: "13px", cursor: "pointer", transition: "all 0.15s" }}>
                    {val ? "✓ " : ""}{label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="le-card le-card-padded">
          <p style={sectionTitle}>Chiffres clés <span style={{ fontSize: "11px", fontWeight: 500, color: "#6B6B6B" }}>(affichés dans l'onglet Stats étudiant)</span></p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {([
              { id: "nbBacG", label: "Bacheliers Généraux acceptés / an", val: nbBacG, set: setNbBacG, placeholder: "ex : 120" },
              { id: "nbBacT", label: "Bacheliers Techno acceptés / an",    val: nbBacT, set: setNbBacT, placeholder: "ex : 40"  },
              { id: "nbBacP", label: "Bacheliers Pro acceptés / an",       val: nbBacP, set: setNbBacP, placeholder: "ex : 10"  },
              { id: "insertionRate", label: "Taux d'insertion pro (%)",    val: insertionRate, set: setInsertionRate, placeholder: "ex : 92" },
              { id: "tuitionFee",    label: "Frais de scolarité (€ / an)", val: tuitionFee,    set: setTuitionFee,    placeholder: "ex : 7500" },
            ] as const).map(({ id, label, val, set, placeholder }) => (
              <div key={id}>
                <label htmlFor={id} style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3D3D3D", marginBottom: "5px" }}>{label}</label>
                <input id={id} type="number" min="0" value={val} onChange={e => set(e.target.value)} placeholder={placeholder} className="le-input" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Niveaux cibles ─────────────────────────────────────────────── */}
        <div className="le-card le-card-padded">
          <p style={sectionTitle}>Niveaux cibles</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ALL_LEVELS.map(l => {
              const checked = selectedLevels.includes(l);
              return (
                <label key={l} htmlFor={`level-${l}`} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px 12px", borderRadius: "6px", background: checked ? "#FFF0F1" : "transparent", border: checked ? "1px solid #EC1F27" : "1px solid transparent", transition: "all 0.15s" }}>
                  <input id={`level-${l}`} type="checkbox" checked={checked} onChange={() => toggleLevel(l)} style={{ accentColor: "#EC1F27", width: "16px", height: "16px" }} />
                  <span style={{ fontSize: "14px", color: checked ? "#C41520" : "#3D3D3D", fontWeight: checked ? 600 : 400 }}>{l}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Domaines cibles ────────────────────────────────────────────── */}
        <div className="le-card le-card-padded">
          <p style={sectionTitle}>Domaines cibles</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {ALL_FIELDS.map(f => {
              const sel = selectedFields.includes(f);
              return (
                <button key={f} type="button" onClick={() => toggleField(f)} style={{ padding: "8px 16px", borderRadius: "20px", border: sel ? "1.5px solid #0066CC" : "1.5px solid #E8E8E8", background: sel ? "#E6F0FF" : "#fff", color: sel ? "#0066CC" : "#3D3D3D", fontWeight: sel ? 700 : 500, fontSize: "13px", cursor: "pointer", transition: "all 0.15s" }}>
                  {f}
                </button>
              );
            })}
          </div>
          {selectedFields.length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {selectedFields.map(f => <Tag key={f} variant="blue">{f}</Tag>)}
            </div>
          )}
        </div>

        {/* ── Formations ─────────────────────────────────────────────────── */}
        <div className="le-card le-card-padded">
          <p style={sectionTitle}>Formations proposées <span style={{ fontSize: "11px", fontWeight: 500, color: "#6B6B6B" }}>({formations.length})</span></p>

          {formations.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
              {formations.map((f, idx) => (
                <div key={idx}>
                  {editingIdx === idx ? (
                    <FormationForm
                      value={editDraft}
                      onChange={setEditDraft}
                      onConfirm={() => saveEdit(idx)}
                      onCancel={() => setEditingIdx(null)}
                      confirmLabel="Enregistrer"
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px", background: "#F4F4F4", borderRadius: "8px", border: "1px solid #E8E8E8" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 600, color: "#1A1A1A" }}>{f.name}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#6B6B6B" }}>
                          {[f.level, f.duration, f.cost ? `${parseInt(f.cost).toLocaleString("fr-FR")} €/an` : null, f.rncp_code ? `RNCP ${f.rncp_code}` : null].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <button type="button" onClick={() => startEdit(idx)} style={iconBtn}>✏️</button>
                        <button type="button" onClick={() => setFormations(p => p.filter((_, i) => i !== idx))} style={iconBtn}>×</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {addingFormation ? (
            <FormationForm
              value={newFormation}
              onChange={setNewFormation}
              onConfirm={addFormation}
              onCancel={() => { setAddingFormation(false); setNewFormation(EMPTY_FORMATION); }}
              confirmLabel="Ajouter"
            />
          ) : (
            <button type="button" onClick={() => setAddingFormation(true)} className="le-btn-base le-btn-secondary le-btn-sm" style={{ width: "100%" }}>
              + Ajouter une formation
            </button>
          )}
        </div>

        {/* ── Vidéo reel ─────────────────────────────────────────────────── */}
        <div className="le-card le-card-padded">
          <p style={sectionTitle}>Vidéo de présentation</p>
          <p style={{ fontSize: "13px", color: "#6B6B6B", marginBottom: "16px" }}>Courte vidéo (max 60 s) visible dans le swipe étudiant.</p>
          {uploadTarget === "reel" && uploadProgress !== null ? (
            <ProgressBar progress={uploadProgress} />
          ) : (
            <DropZone
              icon="🎥"
              label={reelUrl ? "Vidéo uploadée — remplacer" : "Cliquez pour uploader une vidéo"}
              hint="MP4, MOV — max 100 Mo"
              accept="video/mp4,video/quicktime"
              onFile={handleReelFile}
            />
          )}
        </div>

        {/* ── QR code ────────────────────────────────────────────────────── */}
        {schoolId && (
          <div className="le-card le-card-padded">
            <p style={sectionTitle}>Code QR du profil</p>
            <p style={{ fontSize: "13px", color: "#6B6B6B", marginBottom: "16px" }}>
              Affichez ce QR sur votre stand. Les étudiants accèdent directement à votre fiche et peuvent prendre rendez-vous.
            </p>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%" }}>
              <canvas ref={qrCanvasRef} style={{ border: "1px solid #E8E8E8", borderRadius: "8px", padding: "8px", background: "#fff" }} />
              {qrProfileUrl && (
                <div style={{ background: "#F4F4F4", border: "1px solid #E8E8E8", borderRadius: "6px", padding: "10px 14px", width: "100%", maxWidth: "360px", wordBreak: "break-all" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.08em" }}>URL encodée</p>
                  <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#3D3D3D", fontFamily: "monospace" }}>{qrProfileUrl}</p>
                  <a href={qrProfileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#0066CC", fontWeight: 600, textDecoration: "none" }}>🔗 Tester le lien →</a>
                </div>
              )}
              {qrDataUrl && (
                <a href={qrDataUrl} download={`qr-${schoolId}.png`} style={{ fontSize: "13px", color: "#0066CC", textDecoration: "none", fontWeight: 600 }}>⬇️ Télécharger le QR</a>
              )}
            </div>
          </div>
        )}

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <Button variant="ghost" type="button" onClick={handleCancel}>Annuler</Button>
          <Button variant="primary" type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : "Sauvegarder les modifications"}
          </Button>
        </div>

      </div>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

const sectionTitle: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#3D3D3D", marginBottom: "16px" };
const iconBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: "15px", padding: "4px 6px", borderRadius: "4px", color: "#6B6B6B" };

function DropZone({ icon, label, hint, accept, onFile }: { icon: string; label: string; hint: string; accept: string; onFile: (f: File) => void }) {
  return (
    <label
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", border: "2px dashed #E8E8E8", borderRadius: "8px", padding: "32px 24px", textAlign: "center", cursor: "pointer", background: "#F4F4F4" }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
    >
      <input type="file" accept={accept} style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <span style={{ fontSize: "28px" }}>{icon}</span>
      <span style={{ fontWeight: 600, color: "#3D3D3D" }}>{label}</span>
      <span style={{ fontSize: "12px", color: "#6B6B6B" }}>{hint}</span>
    </label>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600 }}>{progress < 100 ? "Upload en cours…" : "Upload terminé ✅"}</span>
        <span style={{ fontSize: "13px", color: "#6B6B6B" }}>{progress}%</span>
      </div>
      <div style={{ height: "8px", background: "#E8E8E8", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "#10B981" : "#EC1F27", borderRadius: "4px", transition: "width 0.2s" }} />
      </div>
    </div>
  );
}

function FormationForm({ value, onChange, onConfirm, onCancel, confirmLabel }: {
  value: FormationDraft;
  onChange: (v: FormationDraft) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
}) {
  return (
    <div style={{ border: "1.5px solid #EC1F27", borderRadius: "10px", padding: "16px", background: "#FFFAFA", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div>
        <label style={fieldLabel}>Nom de la formation *</label>
        <input className="le-input" value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} placeholder="ex : Bachelor Marketing" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label style={fieldLabel}>Niveau</label>
          <select className="le-input" value={value.level} onChange={e => onChange({ ...value, level: e.target.value })}>
            <option value="">— Choisir —</option>
            {FORMATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={fieldLabel}>Durée</label>
          <input className="le-input" value={value.duration} onChange={e => onChange({ ...value, duration: e.target.value })} placeholder="ex : 3 ans" />
        </div>
        <div>
          <label style={fieldLabel}>Frais de scolarité (€/an)</label>
          <input className="le-input" type="number" min="0" value={value.cost} onChange={e => onChange({ ...value, cost: e.target.value })} placeholder="0 = Gratuit" />
        </div>
        <div>
          <label style={fieldLabel}>Code RNCP</label>
          <input className="le-input" value={value.rncp_code} onChange={e => onChange({ ...value, rncp_code: e.target.value })} placeholder="ex : RNCP38584" />
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} className="le-btn-base le-btn-secondary le-btn-sm">Annuler</button>
        <button type="button" onClick={onConfirm} disabled={!value.name.trim()} className="le-btn-base le-btn-primary le-btn-sm">{confirmLabel}</button>
      </div>
    </div>
  );
}

const fieldLabel: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 600, color: "#3D3D3D", marginBottom: "5px" };
