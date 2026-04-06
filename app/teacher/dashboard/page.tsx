"use client";

import { useState } from "react";
import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

const TEACHER = {
  name: "M. Martin",
  school: "Lycée Victor Hugo",
  class: "Terminale S — Groupe 2",
};

const GROUP = {
  fairName: "Salon de l'Orientation — Paris",
  fairDate: "15 avril 2026",
  totalStudents: 28,
  registered: 22,
  connected: 18,
  attended: 0,
  inviteLinkSent: true,
  inviteLink: "https://app.letudiant.fr/group-invite/abc123",
};

function KpiCard({
  label,
  value,
  delta,
  deltaPositive,
}: {
  label: string;
  value: number | string;
  delta?: string;
  deltaPositive?: boolean;
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {delta && (
        <p
          className={`kpi-delta ${deltaPositive !== false ? "positive" : "negative"}`}
        >
          {deltaPositive !== false ? "▲" : "▼"} {delta}
        </p>
      )}
    </div>
  );
}

function ReadinessGauge({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? "#16A34A" : pct >= 50 ? "#FFD100" : "var(--le-red)";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#3D3D3D" }}>
          Préparation du groupe
        </span>
        <span style={{ fontSize: "18px", fontWeight: 700, color }}>
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: "12px",
          background: "#E8E8E8",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--le-red) 0%, #FFD100 50%, #16A34A 100%)`,
            backgroundSize: `${100 / (pct / 100)}% 100%`,
            backgroundPosition: "left",
            borderRadius: "6px",
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "6px",
        }}
      >
        <span style={{ fontSize: "11px", color: "#6B6B6B" }}>0%</span>
        <span style={{ fontSize: "11px", color: "#6B6B6B" }}>
          Basé sur les comptes activés ({GROUP.connected}/{GROUP.totalStudents}{" "}
          élèves)
        </span>
        <span style={{ fontSize: "11px", color: "#6B6B6B" }}>100%</span>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const readinessPct = Math.round(
    (GROUP.connected / GROUP.totalStudents) * 100
  );

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(GROUP.inviteLink).then(() => {
      setCopied(true);
      showToast("Lien copié dans le presse-papier !");
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleResendEmail() {
    showToast("Email de rappel envoyé aux 6 élèves non-inscrits.");
  }

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
            animation: "fadeIn 0.2s ease",
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
          <SectionLabel>Tableau de bord</SectionLabel>
          <h1 className="le-h1" style={{ marginTop: "10px" }}>
            Bonjour {TEACHER.name}
          </h1>
          <p className="le-body" style={{ marginTop: "4px" }}>
            {TEACHER.school}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Tag variant="blue">{TEACHER.class}</Tag>
        </div>
      </div>

      {/* Fair info card */}
      <div
        className="le-card"
        style={{
          marginBottom: "28px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          borderLeft: "4px solid var(--le-red)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "var(--le-red-light)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--le-red)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <div>
            <p
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#1A1A1A",
                marginBottom: "2px",
              }}
            >
              {GROUP.fairName}
            </p>
            <p style={{ fontSize: "14px", color: "#6B6B6B" }}>
              Le {GROUP.fairDate} · Paris
            </p>
          </div>
        </div>
        <Tag variant="yellow">Salon à venir</Tag>
      </div>

      {/* KPI grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <KpiCard label="Élèves dans le groupe" value={GROUP.totalStudents} />
        <KpiCard
          label="Inscrits via le lien"
          value={GROUP.registered}
          delta={`${Math.round((GROUP.registered / GROUP.totalStudents) * 100)}% de la classe`}
          deltaPositive={true}
        />
        <KpiCard
          label="Comptes activés"
          value={GROUP.connected}
          delta={`${Math.round((GROUP.connected / GROUP.totalStudents) * 100)}%`}
          deltaPositive={true}
        />
        <KpiCard
          label="Profils complétés"
          value={14}
          delta="50%"
          deltaPositive={true}
        />
      </div>

      {/* Two-column layout: invite + readiness */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "28px",
        }}
      >
        {/* Invite link section */}
        <div className="le-card le-card-padded">
          <div style={{ marginBottom: "16px" }}>
            <SectionLabel>Lien d&apos;invitation groupe</SectionLabel>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input
              readOnly
              value={GROUP.inviteLink}
              className="le-input"
              aria-label="Lien d'invitation"
              style={{ flex: 1, fontSize: "13px", color: "#6B6B6B" }}
            />
            <Button
              variant={copied ? "secondary" : "primary"}
              size="sm"
              onClick={handleCopyLink}
            >
              {copied ? "Copié !" : "Copier le lien"}
            </Button>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <Button variant="ghost" size="sm" onClick={handleResendEmail}>
              Renvoyer par email
            </Button>
          </div>

          {GROUP.inviteLinkSent && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: "#F4F4F4",
                borderRadius: "6px",
              }}
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 14 14"
                fill="none"
                stroke="#16A34A"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="2,7 5.5,10.5 12,3" />
              </svg>
              <span style={{ fontSize: "12px", color: "#6B6B6B" }}>
                Lien envoyé le 10 avril 2026
              </span>
            </div>
          )}
        </div>

        {/* Readiness gauge */}
        <div className="le-card le-card-padded">
          <div style={{ marginBottom: "20px" }}>
            <SectionLabel>Niveau de préparation</SectionLabel>
          </div>
          <ReadinessGauge pct={readinessPct} />

          <div
            style={{
              marginTop: "20px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              textAlign: "center",
            }}
          >
            {[
              { label: "Non inscrits", count: GROUP.totalStudents - GROUP.registered, color: "var(--le-red)" },
              { label: "Inscrits", count: GROUP.registered - GROUP.connected, color: "#FFD100" },
              { label: "Activés", count: GROUP.connected, color: "#16A34A" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "8px 4px",
                  background: "#F4F4F4",
                  borderRadius: "6px",
                  borderTop: `3px solid ${item.color}`,
                }}
              >
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#1A1A1A",
                    marginBottom: "2px",
                  }}
                >
                  {item.count}
                </p>
                <p style={{ fontSize: "10px", color: "#6B6B6B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="le-card le-card-padded">
        <div style={{ marginBottom: "16px" }}>
          <SectionLabel>Actions rapides</SectionLabel>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Button variant="primary" href="/teacher/insights">
            Voir les intérêts de la classe
          </Button>
          <Button variant="secondary" href="/teacher/students">
            Suivi individuel
          </Button>
          <Button variant="ghost" href="/teacher/group">
            Gérer le groupe
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
