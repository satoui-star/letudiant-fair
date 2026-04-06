"use client";

import { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

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

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registered: boolean;
  connected: boolean;
  profileComplete: boolean;
  educationLevel: string;
  bacSeries: string;
}

const STUDENTS: Student[] = Array.from({ length: 28 }, (_, i) => ({
  id: `s${i + 1}`,
  firstName: FIRST_NAMES[i],
  lastName: LAST_NAMES[i],
  registered: i < 22,
  connected: i < 18,
  profileComplete: i < 14,
  educationLevel: "terminale",
  bacSeries: i % 3 === 0 ? "bac_t" : "bac_g",
}));

type FilterKey = "all" | "registered" | "unregistered" | "connected";

const FILTERS: { key: FilterKey; label: string; count: number }[] = [
  { key: "all", label: "Tous", count: 28 },
  { key: "registered", label: "Inscrits", count: 22 },
  { key: "unregistered", label: "Non-inscrits", count: 6 },
  { key: "connected", label: "Connectés", count: 18 },
];

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function AvatarCircle({ firstName, lastName, index }: { firstName: string; lastName: string; index: number }) {
  const COLORS = [
    "#003C8F", "#E3001B", "#FFD100", "#16A34A", "#7C3AED",
    "#0891B2", "#EA580C", "#BE185D",
  ];
  const bg = COLORS[index % COLORS.length];
  const textColor = bg === "#FFD100" ? "#1A1A1A" : "#ffffff";

  return (
    <div
      style={{
        width: "36px",
        height: "36px",
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

export default function TeacherGroup() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  }

  function handleRelancer() {
    showToast(
      "Rappel envoyé aux 6 élèves non-inscrits. Ils recevront un email sous peu."
    );
  }

  function handleExport() {
    showToast("Export de la liste en cours de préparation…");
  }

  const filteredStudents = STUDENTS.filter((s) => {
    if (activeFilter === "registered") return s.registered;
    if (activeFilter === "unregistered") return !s.registered;
    if (activeFilter === "connected") return s.connected;
    return true;
  });

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Toast */}
      {toastVisible && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#1A1A1A",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          }}
        >
          {toastMessage}
        </div>
      )}

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
          <SectionLabel>Gestion du groupe</SectionLabel>
          <h1 className="le-h1" style={{ marginTop: "10px" }}>
            Mon Groupe — Terminale S
          </h1>
          <p className="le-body" style={{ marginTop: "4px" }}>
            Lycée Victor Hugo · Salon de l&apos;Orientation — Paris, 15 avril 2026
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Tag variant="blue">28 élèves</Tag>
        </div>
      </div>

      {/* Actions bar */}
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
        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "#E8E8E8",
            borderRadius: "8px",
            padding: "4px",
          }}
          role="tablist"
          aria-label="Filtrer les élèves"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={activeFilter === f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                background: activeFilter === f.key ? "#ffffff" : "transparent",
                color:
                  activeFilter === f.key ? "#1A1A1A" : "#6B6B6B",
                boxShadow:
                  activeFilter === f.key
                    ? "0 1px 4px rgba(0,0,0,0.12)"
                    : "none",
                transition: "all 0.15s ease",
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="primary" size="sm" onClick={handleRelancer}>
            Relancer les non-inscrits
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            Exporter la liste
          </Button>
        </div>
      </div>

      {/* Students table */}
      <div className="le-card" style={{ overflow: "hidden" }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "40px 2fr 1fr 1fr 1fr 80px",
            gap: "12px",
            padding: "12px 20px",
            background: "#F4F4F4",
            borderBottom: "1px solid #E8E8E8",
          }}
        >
          {["", "Élève", "Inscription", "Connexion", "Profil", "Filière"].map(
            (h) => (
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
            )
          )}
        </div>

        {/* Student rows */}
        {filteredStudents.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "#6B6B6B",
            }}
          >
            Aucun élève dans cette catégorie.
          </div>
        ) : (
          filteredStudents.map((student, idx) => (
            <div
              key={student.id}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 2fr 1fr 1fr 1fr 80px",
                gap: "12px",
                padding: "14px 20px",
                borderBottom:
                  idx < filteredStudents.length - 1
                    ? "1px solid #E8E8E8"
                    : "none",
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
              />

              {/* Name */}
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#1A1A1A",
                    marginBottom: "1px",
                  }}
                >
                  {student.firstName} {student.lastName}
                </p>
                <p style={{ fontSize: "12px", color: "#6B6B6B" }}>
                  {student.educationLevel}
                </p>
              </div>

              {/* Registration status */}
              <div>
                {student.registered ? (
                  <Tag variant="blue">Inscrit</Tag>
                ) : (
                  <Tag variant="red">Non-inscrit</Tag>
                )}
              </div>

              {/* Connection status */}
              <div>
                {student.connected ? (
                  <Tag variant="blue">Connecté</Tag>
                ) : (
                  <Tag variant="gray">Non-connecté</Tag>
                )}
              </div>

              {/* Profile complete */}
              <div>
                {student.profileComplete ? (
                  <Tag variant="yellow">Complété</Tag>
                ) : (
                  <Tag variant="gray">Incomplet</Tag>
                )}
              </div>

              {/* Bac series */}
              <div>
                <Tag variant={student.bacSeries === "bac_t" ? "red" : "gray"}>
                  {student.bacSeries === "bac_t" ? "Techno" : "Général"}
                </Tag>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary footer */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Inscrits", count: 22, of: 28, color: "var(--le-blue)" },
          { label: "Connectés", count: 18, of: 28, color: "var(--le-blue)" },
          { label: "Profils complets", count: 14, of: 28, color: "#FFD100" },
        ].map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "13px", color: "#6B6B6B" }}>
              <strong style={{ color: "#1A1A1A" }}>{item.count}</strong> /{" "}
              {item.of} {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
