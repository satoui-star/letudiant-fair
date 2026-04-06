'use client';

import { useState } from 'react';
import { use } from 'react';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';
import OrientationBadge from '@/components/ui/OrientationBadge';
import StripeRule from '@/components/ui/StripeRule';

// ─── Types & Mock Data ───────────────────────────────────────────────────────

interface JourneyEvent {
  time: string;
  type: 'entry' | 'stand' | 'conference' | 'exit';
  title: string;
  schoolId?: string;
  detail?: string;
  icon: string;
  tag?: 'red' | 'blue' | 'yellow' | 'gray';
}

const JOURNEY_EVENTS: JourneyEvent[] = [
  { time: '09:15', type: 'entry', title: 'Entrée au salon', detail: 'Palais des Congrès, Paris', icon: '🚀', tag: 'blue' },
  { time: '09:42', type: 'stand', title: 'Stand HEC Paris', schoolId: 'hec-paris', detail: 'Échange avec la responsable admissions', icon: '🏛️', tag: 'red' },
  { time: '10:30', type: 'conference', title: 'Conférence : Business ou Ingénierie ?', detail: 'Amphithéâtre A · 45 min', icon: '🎤', tag: 'yellow' },
  { time: '11:45', type: 'stand', title: 'Stand Sciences Po', schoolId: 'sciences-po', detail: 'Récupération de documentation', icon: '🌍', tag: 'blue' },
  { time: '12:10', type: 'stand', title: 'Stand INSA Lyon', schoolId: 'insa-lyon', detail: 'Présentation cycle ingénieur', icon: '🔬', tag: 'yellow' },
  { time: '12:30', type: 'exit', title: 'Sortie du salon', detail: 'Durée totale : 3h30', icon: '✅', tag: 'gray' },
];

const NOTICED_SCHOOLS = [
  { id: 'hec-paris', name: 'HEC Paris', score: 78, tag: 'red' as const, emoji: '🏛️', gradient: 'linear-gradient(135deg, #E3001B, #B0001A)' },
  { id: 'sciences-po', name: 'Sciences Po', score: 63, tag: 'blue' as const, emoji: '🌍', gradient: 'linear-gradient(135deg, #003C8F, #001A4D)' },
];

const DOCS = [
  { id: 'd1', schoolName: 'HEC Paris', type: 'Brochure', fileName: 'HEC_Brochure_2026.pdf', size: '4.2 MB', schoolColor: '#003C8F' },
  { id: 'd2', schoolName: 'Sciences Po', type: 'Plaquette des programmes', fileName: 'SciencesPo_Programmes_2026.pdf', size: '2.8 MB', schoolColor: '#E3001B' },
  { id: 'd3', schoolName: 'INSA Lyon', type: 'Guide des admissions', fileName: 'INSA_Admissions_2026.pdf', size: '1.9 MB', schoolColor: '#FFD100' },
  { id: 'd4', schoolName: 'emlyon', type: 'Présentation PGE', fileName: 'emlyon_PGE_2026.pdf', size: '3.1 MB', schoolColor: '#1A1A1A' },
  { id: 'd5', schoolName: 'CentraleSupélec', type: 'Livret accueil', fileName: 'CS_Livret_2026.pdf', size: '5.4 MB', schoolColor: '#003C8F' },
];

const VISITED_SCHOOLS = [
  { id: 'hec-paris', name: 'HEC Paris', type: 'Grande École de commerce', color: '#003C8F' },
  { id: 'sciences-po', name: 'Sciences Po Paris', type: 'IEP', color: '#E3001B' },
  { id: 'insa-lyon', name: 'INSA Lyon', type: "École d'ingénieurs", color: '#FFD100' },
];

interface NextStep {
  priority: number;
  label: string;
  deadline: string | null;
  done: boolean;
  cta: string | null;
  icon: string;
}

const NEXT_STEPS_INITIAL: NextStep[] = [
  { priority: 1, label: 'Compléter votre dossier Parcoursup', deadline: '20 mars 2026', done: false, cta: 'parcoursup.fr', icon: '📋' },
  { priority: 2, label: 'Demander une lettre de recommandation', deadline: null, done: false, cta: null, icon: '✉️' },
  { priority: 3, label: 'Participer à la JPO de HEC Paris', deadline: '21 janvier 2026', done: false, cta: "S'inscrire", icon: '🏫' },
  { priority: 4, label: 'Prendre RDV de suivi avec Sciences Po', deadline: null, done: false, cta: 'Réserver', icon: '📅' },
  { priority: 5, label: "Lire : \"Préparer son dossier d'admission\"", deadline: null, done: false, cta: "Lire l'article", icon: '📖' },
];

// ─── Tab type ─────────────────────────────────────────────────────────────────

type TabId = 'bilan' | 'documents' | 'comparer' | 'prochaines-etapes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecapPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId: _eventId } = use(params);

  const [activeTab, setActiveTab] = useState<TabId>('bilan');
  const [shared, setShared] = useState(false);
  const [nextSteps, setNextSteps] = useState<NextStep[]>(NEXT_STEPS_INITIAL);
  const [emailReminder, setEmailReminder] = useState(false);
  const [whatsappReminder, setWhatsappReminder] = useState(false);
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set(['hec-paris', 'sciences-po', 'insa-lyon']));
  const [compareToast, setCompareToast] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href).catch(() => null);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  };

  const toggleStep = (priority: number) => {
    setNextSteps((prev) =>
      prev.map((s) => (s.priority === priority ? { ...s, done: !s.done } : s))
    );
  };

  const toggleSchool = (id: string) => {
    setSelectedSchools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: 'bilan', label: 'Mon Bilan' },
    { id: 'documents', label: 'Documents' },
    { id: 'comparer', label: 'Comparer' },
    { id: 'prochaines-etapes', label: 'Prochaines étapes' },
  ];

  const doneCnt = nextSteps.filter((s) => s.done).length;

  return (
    <div className="page-with-nav" style={{ background: 'var(--le-gray-100)', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #E3001B 0%, #B0001A 60%, #003C8F 100%)',
          padding: '24px 20px 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Stripe pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              #fff 0px,
              #fff 1px,
              transparent 1px,
              transparent 18px
            )`,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <a
            href="/home"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'rgba(255,255,255,0.75)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 16,
            }}
          >
            ← Accueil
          </a>
          <Tag variant="gray" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: 10 }}>
            Kit After-the-Fair
          </Tag>
          <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 22, margin: '0 0 4px', lineHeight: 1.2 }}>
            Récapitulatif — Salon de Paris
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: '0 0 20px' }}>
            📅 15 avril 2026 &nbsp;·&nbsp; Palais des Congrès
          </p>

          {/* Tabs */}
          <div
            className="no-scrollbar"
            style={{ display: 'flex', gap: 0, overflowX: 'auto' }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <StripeRule />

      {/* ── Mon Bilan tab ── */}
      {activeTab === 'bilan' && (
        <div>
          {/* KPI cards */}
          <div style={{ padding: '20px 16px 0' }}>
            <SectionLabel>Votre journée en chiffres</SectionLabel>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                marginTop: 14,
              }}
            >
              {[
                { value: '4', label: 'Stands visités', icon: '🏢', color: 'var(--le-red)' },
                { value: '1', label: 'Conférence', icon: '🎤', color: 'var(--le-blue)' },
                { value: '5', label: 'Documents', icon: '📄', color: '#16A34A' },
                { value: '3h30', label: 'Durée totale', icon: '⏱️', color: '#7A6200' },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="kpi-card"
                  style={{ borderLeft: `3px solid ${kpi.color}` }}
                >
                  <span style={{ fontSize: 22 }}>{kpi.icon}</span>
                  <span className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
                  <span className="kpi-label">{kpi.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Journey timeline */}
          <div style={{ padding: '24px 16px 0' }}>
            <SectionLabel>Votre parcours</SectionLabel>
            <div
              style={{
                marginTop: 16,
                background: '#fff',
                borderRadius: 12,
                border: '1px solid var(--le-gray-200)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {JOURNEY_EVENTS.map((event, index) => (
                <div
                  key={index}
                  className="timeline-item"
                  style={{ paddingBottom: index < JOURNEY_EVENTS.length - 1 ? 20 : 0 }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingLeft: 8 }}>
                    {/* Time */}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--le-red)',
                        minWidth: 40,
                        flexShrink: 0,
                        paddingTop: 2,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {event.time}
                    </span>

                    {/* Icon */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'var(--le-gray-100)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {event.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                        {event.schoolId ? (
                          <a
                            href={`/schools/${event.schoolId}`}
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: 'var(--le-blue)',
                              textDecoration: 'none',
                            }}
                          >
                            {event.title}
                          </a>
                        ) : (
                          <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: 'var(--le-gray-900)' }}>
                            {event.title}
                          </p>
                        )}
                        {event.tag && (
                          <Tag variant={event.tag} style={{ fontSize: 10 }}>
                            {event.type === 'stand' ? 'Stand' : event.type === 'conference' ? 'Conf.' : event.type === 'entry' ? 'Entrée' : 'Sortie'}
                          </Tag>
                        )}
                      </div>
                      {event.detail && (
                        <p className="le-caption" style={{ margin: 0 }}>{event.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schools that noticed you */}
          <div style={{ padding: '24px 16px 0' }}>
            <SectionLabel>Établissements qui vous ont remarqué</SectionLabel>
            <p className="le-caption" style={{ marginTop: 6, marginBottom: 14 }}>
              Ces établissements ont consulté votre profil pendant le salon
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {NOTICED_SCHOOLS.map((school) => (
                <div
                  key={school.id}
                  className="le-card"
                  style={{ padding: '16px', display: 'flex', gap: 14, alignItems: 'center' }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: school.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {school.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px', color: 'var(--le-gray-900)' }}>
                      {school.name}
                    </p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <OrientationBadge score={school.score} />
                      <span className="le-caption">{school.score}/100 de compatibilité</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" href={`/schools/${school.id}`} style={{ flexShrink: 0 }}>
                    Voir
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Share button */}
          <div style={{ padding: '24px 16px' }}>
            <Button
              variant="primary"
              onClick={handleShare}
              style={{ justifyContent: 'center', width: '100%' }}
            >
              {shared ? '✓ Lien copié !' : (
                <>
                  <span style={{ fontSize: 16, marginRight: 4 }}>📤</span>
                  Partager mon bilan
                </>
              )}
            </Button>
            <p className="le-caption" style={{ textAlign: 'center', marginTop: 10 }}>
              Partagez votre récapitulatif avec vos parents ou conseillers d&apos;orientation
            </p>
          </div>
        </div>
      )}

      {/* ── Documents tab ── */}
      {activeTab === 'documents' && (
        <div style={{ padding: '20px 16px 0' }}>
          <SectionLabel>Documents collectés au salon</SectionLabel>
          <p className="le-caption" style={{ marginTop: 6, marginBottom: 14 }}>
            {DOCS.length} documents récupérés le 15 avril 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DOCS.map((doc) => {
              const initials = getInitials(doc.schoolName);
              return (
                <div
                  key={doc.id}
                  className="le-card"
                  style={{
                    borderLeft: `4px solid ${doc.schoolColor}`,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: doc.schoolColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: doc.schoolColor === '#FFD100' ? '#1A1A1A' : '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--le-gray-900)',
                        margin: '0 0 2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.fileName}
                    </p>
                    <p className="le-caption" style={{ margin: 0 }}>
                      {doc.schoolName} · {doc.type} · {doc.size}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" style={{ flexShrink: 0 }}>
                    ↓
                  </Button>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20, paddingBottom: 16 }}>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
              📦 Télécharger tout (.zip)
            </Button>
            <Button variant="secondary" href="/saved" style={{ width: '100%', justifyContent: 'center' }}>
              Voir dans Mon Dossier →
            </Button>
          </div>
        </div>
      )}

      {/* ── Comparer tab ── */}
      {activeTab === 'comparer' && (
        <div style={{ padding: '20px 16px 0' }}>
          <SectionLabel>Comparer les établissements visités</SectionLabel>
          <p className="le-caption" style={{ marginTop: 6, marginBottom: 16 }}>
            Sélectionnez jusqu&apos;à 3 écoles pour les comparer côte à côte
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {VISITED_SCHOOLS.map((school) => {
              const selected = selectedSchools.has(school.id);
              return (
                <div
                  key={school.id}
                  className="le-card"
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderLeft: selected ? `4px solid ${school.color}` : '4px solid var(--le-gray-200)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onClick={() => toggleSchool(school.id)}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      border: `2px solid ${selected ? school.color : 'var(--le-gray-200)'}`,
                      background: selected ? school.color : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    {selected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Initials */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: school.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: school.color === '#FFD100' ? '#1A1A1A' : '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(school.name)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px', color: 'var(--le-gray-900)' }}>
                      {school.name}
                    </p>
                    <p className="le-caption" style={{ margin: 0 }}>{school.type}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Criteria preview */}
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--le-gray-200)',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--le-gray-500)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
              Critères de comparaison
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                "Type d'établissement",
                "Taux d'admission",
                "Frais de scolarité",
                "Insertion professionnelle",
                "Alternance disponible",
                "Note étudiants",
                "Prochaine JPO",
              ].map((criterion) => (
                <div
                  key={criterion}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: 'var(--le-gray-700)',
                  }}
                >
                  <span style={{ color: '#16A34A', fontSize: 12 }}>✓</span>
                  {criterion}
                </div>
              ))}
              <p className="le-caption" style={{ margin: '4px 0 0' }}>+ 9 autres critères</p>
            </div>
          </div>

          <Button
            variant="primary"
            href="/compare"
            onClick={() => {
              setCompareToast(true);
              setTimeout(() => setCompareToast(false), 2000);
            }}
            style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}
          >
            Lancer la comparaison ({selectedSchools.size} école{selectedSchools.size > 1 ? 's' : ''})
          </Button>

          {compareToast && (
            <div
              style={{
                position: 'fixed',
                top: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--le-gray-900)',
                color: '#fff',
                padding: '12px 22px',
                borderRadius: 24,
                fontWeight: 600,
                fontSize: 13,
                zIndex: 200,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              Chargement de la comparaison...
            </div>
          )}
        </div>
      )}

      {/* ── Prochaines étapes tab ── */}
      {activeTab === 'prochaines-etapes' && (
        <div style={{ padding: '20px 16px 0' }}>
          <SectionLabel>Vos prochaines étapes</SectionLabel>
          <p className="le-caption" style={{ marginTop: 6, marginBottom: 14 }}>
            {doneCnt}/{nextSteps.length} étapes complétées
          </p>

          {/* Progress bar */}
          <div
            style={{
              height: 6,
              background: 'var(--le-gray-200)',
              borderRadius: 10,
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round((doneCnt / nextSteps.length) * 100)}%`,
                background: 'var(--le-red)',
                borderRadius: 10,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nextSteps.map((step) => (
              <div
                key={step.priority}
                className="le-card"
                style={{
                  padding: '14px 16px',
                  opacity: step.done ? 0.6 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Priority circle */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: step.done ? '#DCFCE7' : 'var(--le-red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: step.done ? '#15803D' : '#fff',
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {step.done ? '✓' : step.priority}
                  </div>

                  {/* Icon + content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{step.icon}</span>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: 'var(--le-gray-900)',
                          margin: 0,
                          lineHeight: 1.4,
                          textDecoration: step.done ? 'line-through' : 'none',
                        }}
                      >
                        {step.label}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {step.deadline && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'var(--le-red-light)',
                            color: 'var(--le-red-dark)',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 20,
                          }}
                        >
                          ⏰ {step.deadline}
                        </span>
                      )}
                      {step.cta && !step.done && (
                        <a
                          href="#"
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--le-blue)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          {step.cta} →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleStep(step.priority)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      border: `2px solid ${step.done ? '#16A34A' : 'var(--le-gray-200)'}`,
                      background: step.done ? '#DCFCE7' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                    aria-label={step.done ? 'Marquer comme non fait' : 'Marquer comme fait'}
                  >
                    {step.done && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Reminder opt-in */}
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--le-gray-200)',
              borderRadius: 12,
              padding: '16px',
              marginTop: 20,
              marginBottom: 16,
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--le-gray-900)', margin: '0 0 4px' }}>
              🔔 Recevoir des rappels
            </p>
            <p className="le-caption" style={{ margin: '0 0 14px' }}>
              Soyez notifié avant chaque deadline importante
            </p>

            {/* Email toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📧</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--le-gray-700)' }}>Email</span>
              </div>
              <button
                onClick={() => setEmailReminder((v) => !v)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: emailReminder ? 'var(--le-red)' : 'var(--le-gray-200)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                  padding: 0,
                }}
                aria-label={emailReminder ? 'Désactiver Email' : 'Activer Email'}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: emailReminder ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {/* WhatsApp toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>💬</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--le-gray-700)' }}>WhatsApp</span>
                <span
                  style={{
                    background: '#25D366',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 20,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  WAX
                </span>
              </div>
              <button
                onClick={() => setWhatsappReminder((v) => !v)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: whatsappReminder ? '#25D366' : 'var(--le-gray-200)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                  padding: 0,
                }}
                aria-label={whatsappReminder ? 'Désactiver WhatsApp' : 'Activer WhatsApp'}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: whatsappReminder ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {(emailReminder || whatsappReminder) && (
              <p
                style={{
                  fontSize: 12,
                  color: '#16A34A',
                  fontWeight: 600,
                  margin: '12px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                ✓ Rappels activés — vous recevrez une notification avant chaque deadline
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
