"use client";
export const dynamic = 'force-dynamic'

import { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

const INITIAL_PROGRAMMES = [
  "Grande École — Programme Grande École (PGE)",
  "Bachelor en Management",
  "Mastère Spécialisé Finance",
];

const ALL_LEVELS = [
  "Terminale",
  "Post-bac BTS",
  "Post-bac Licence",
  "Post-bac BUT",
  "Post-bac Bachelor",
  "Bac+3/4",
  "Bac+5",
];

const ALL_FIELDS = [
  "Business",
  "Finance",
  "Management",
  "Marketing",
  "Ingénierie",
  "Data / IA",
  "Design",
  "Santé",
  "Droit",
];

export default function ExhibitorProfilePage() {
  const [schoolName, setSchoolName] = useState("HEC Paris");
  const [city, setCity] = useState("Jouy-en-Josas");
  const [schoolType, setSchoolType] = useState("Grande École de Commerce");

  const [programmes, setProgrammes] = useState<string[]>(INITIAL_PROGRAMMES);
  const [newProgramme, setNewProgramme] = useState("");

  const [selectedLevels, setSelectedLevels] = useState<string[]>([
    "Terminale",
    "Post-bac Licence",
    "Bac+3/4",
    "Bac+5",
  ]);

  const [selectedFields, setSelectedFields] = useState<string[]>([
    "Business",
    "Finance",
    "Management",
    "Marketing",
  ]);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleLevel(l: string) {
    setSelectedLevels((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
    );
  }

  function toggleField(f: string) {
    setSelectedFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  function addProgramme() {
    const trimmed = newProgramme.trim();
    if (trimmed) {
      setProgrammes((prev) => [...prev, trimmed]);
      setNewProgramme("");
    }
  }

  function removeProgramme(idx: number) {
    setProgrammes((prev) => prev.filter((_, i) => i !== idx));
  }

  function simulateVideoUpload() {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p === null || p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  }

  async function handleSave() {
    setSaved(false);
    await new Promise((r) => setTimeout(r, 800));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <SectionLabel>Profil établissement</SectionLabel>
        <h1 className="le-h1" style={{ marginTop: "10px" }}>
          Modifier le profil
        </h1>
        <p className="le-body">
          Ces informations sont affichées aux étudiants dans le salon.
        </p>
      </div>

      {/* Success banner */}
      {saved && (
        <div
          role="status"
          style={{
            background: "#D1FAE5",
            border: "1px solid #10B981",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontWeight: 600,
            color: "#065F46",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ✅ Profil sauvegardé avec succès.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* Cover image */}
        <div className="le-card le-card-padded">
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#3D3D3D",
              marginBottom: "12px",
            }}
          >
            Image de couverture
          </p>
          <div
            style={{
              border: "2px dashed #E8E8E8",
              borderRadius: "8px",
              padding: "40px 24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.15s ease, background 0.15s ease",
              background: "#F4F4F4",
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div
              style={{
                fontSize: "32px",
                marginBottom: "12px",
              }}
              aria-hidden="true"
            >
              🖼️
            </div>
            <p
              style={{ fontWeight: 600, color: "#3D3D3D", marginBottom: "4px" }}
            >
              Glissez une image ici
            </p>
            <p style={{ fontSize: "13px", color: "#6B6B6B" }}>
              ou{" "}
              <span style={{ color: "#E3001B", cursor: "pointer", fontWeight: 600 }}>
                parcourez vos fichiers
              </span>
            </p>
            <p style={{ fontSize: "12px", color: "#6B6B6B", marginTop: "8px" }}>
              JPG, PNG — max 5 Mo — recommandé : 1280×400px
            </p>
          </div>
        </div>

        {/* Basic info */}
        <div className="le-card le-card-padded">
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#3D3D3D",
              marginBottom: "16px",
            }}
          >
            Informations générales
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Input
              id="schoolName"
              label="Nom de l'établissement"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              required
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Input
                id="city"
                label="Ville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                id="schoolType"
                label="Type d'établissement"
                value={schoolType}
                onChange={(e) => setSchoolType(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Programmes */}
        <div className="le-card le-card-padded">
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#3D3D3D",
              marginBottom: "16px",
            }}
          >
            Programmes proposés
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
            {programmes.map((prog, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  background: "#F4F4F4",
                  borderRadius: "6px",
                  border: "1px solid #E8E8E8",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: "14px",
                    color: "#1A1A1A",
                    fontWeight: 500,
                  }}
                >
                  {prog}
                </span>
                <button
                  type="button"
                  onClick={() => removeProgramme(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6B6B6B",
                    fontSize: "16px",
                    lineHeight: 1,
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                  aria-label={`Supprimer ${prog}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Ajouter un programme..."
              value={newProgramme}
              onChange={(e) => setNewProgramme(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProgramme()}
              className="le-input"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={addProgramme}
              className="le-btn-base le-btn-secondary le-btn-sm"
              disabled={!newProgramme.trim()}
            >
              + Ajouter
            </button>
          </div>
        </div>

        {/* Target levels */}
        <div className="le-card le-card-padded">
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#3D3D3D",
              marginBottom: "14px",
            }}
          >
            Niveaux cibles
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ALL_LEVELS.map((l) => {
              const checked = selectedLevels.includes(l);
              return (
                <label
                  key={l}
                  htmlFor={`level-${l}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: checked ? "#FDEAEA" : "transparent",
                    border: checked
                      ? "1px solid #E3001B"
                      : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <input
                    id={`level-${l}`}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLevel(l)}
                    style={{ accentColor: "#E3001B", width: "16px", height: "16px" }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      color: checked ? "#B0001A" : "#3D3D3D",
                      fontWeight: checked ? 600 : 400,
                    }}
                  >
                    {l}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Target fields */}
        <div className="le-card le-card-padded">
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#3D3D3D",
              marginBottom: "14px",
            }}
          >
            Domaines cibles
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {ALL_FIELDS.map((f) => {
              const selected = selectedFields.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleField(f)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: selected
                      ? "1.5px solid #003C8F"
                      : "1.5px solid #E8E8E8",
                    background: selected ? "#E6ECF8" : "#ffffff",
                    color: selected ? "#003C8F" : "#3D3D3D",
                    fontWeight: selected ? 700 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
          {selectedFields.length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {selectedFields.map((f) => (
                <Tag key={f} variant="blue">
                  {f}
                </Tag>
              ))}
            </div>
          )}
        </div>

        {/* Reel upload */}
        <div className="le-card le-card-padded">
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#3D3D3D",
              marginBottom: "6px",
            }}
          >
            Vidéo de présentation (Reel)
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#6B6B6B",
              marginBottom: "16px",
            }}
          >
            Uploadez une vidéo courte (max 60 s) pour attirer l&apos;attention
            des étudiants dans le swipe.
          </p>

          {uploadProgress === null ? (
            <button
              type="button"
              onClick={simulateVideoUpload}
              style={{
                width: "100%",
                border: "2px dashed #E8E8E8",
                borderRadius: "8px",
                padding: "32px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: "#F4F4F4",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "28px" }} aria-hidden="true">
                🎥
              </span>
              <span style={{ fontWeight: 600, color: "#3D3D3D" }}>
                Cliquez pour uploader une vidéo
              </span>
              <span style={{ fontSize: "13px", color: "#6B6B6B" }}>
                MP4, MOV — max 100 Mo — 60 secondes max
              </span>
            </button>
          ) : (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#3D3D3D" }}>
                  {uploadProgress < 100 ? "Upload en cours…" : "Upload terminé ✅"}
                </span>
                <span style={{ fontSize: "13px", color: "#6B6B6B" }}>
                  {uploadProgress}%
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
                    width: `${uploadProgress}%`,
                    background:
                      uploadProgress === 100 ? "#10B981" : "#E3001B",
                    borderRadius: "4px",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
              {uploadProgress === 100 && (
                <button
                  type="button"
                  onClick={() => setUploadProgress(null)}
                  style={{
                    marginTop: "10px",
                    background: "none",
                    border: "none",
                    color: "#6B6B6B",
                    fontSize: "13px",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Changer la vidéo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Save button */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <Button variant="ghost" type="button">
            Annuler
          </Button>
          <Button variant="primary" type="button" onClick={handleSave}>
            Sauvegarder les modifications
          </Button>
        </div>
      </div>
    </div>
  );
}
