'use client';

import { useState } from 'react';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';
import StripeRule from '@/components/ui/StripeRule';

// ─── Mock data ───────────────────────────────────────────────────────────────

interface CompareSchool {
  id: string;
  name: string;
  type: string;
  city: string;
  legal_status: string;
  scholarship_allowed: boolean;
  apprenticeship: boolean;
  nb_capacity: number;
  nb_accepted: number;
  nb_applicants: number;
  rate_accepted_bac_g: number;
  nb_accepted_degree_tb: number;
  nb_accepted_degree_b: number;
  top_formation: string;
  is_parcoursup: boolean;
  rate_professional_insertion: number;
  rate_further_studies: number;
  tuition_range: string;
  review_average: number;
  nb_review: number;
  educationBranches: { label: string; slug: string }[];
  openDayNext: string;
  color: string;
}

const COMPARE_SCHOOLS: CompareSchool[] = [
  {
    id: 'hec-paris',
    name: 'HEC Paris',
    type: 'Grande École de commerce',
    city: 'Jouy-en-Josas',
    legal_status: 'Privé (consulaire)',
    scholarship_allowed: true,
    apprenticeship: false,
    nb_capacity: 350,
    nb_accepted: 350,
    nb_applicants: 2900,
    rate_accepted_bac_g: 0.97,
    nb_accepted_degree_tb: 280,
    nb_accepted_degree_b: 60,
    top_formation: 'Programme Grande École (Bac+5)',
    is_parcoursup: false,
    rate_professional_insertion: 0.92,
    rate_further_studies: 0.15,
    tuition_range: '14 000 – 17 000 €/an',
    review_average: 4.3,
    nb_review: 1240,
    educationBranches: [{ label: 'Économie-Gestion', slug: 'economie-gestion' }],
    openDayNext: '21 janvier 2026',
    color: '#003C8F',
  },
  {
    id: 'sciences-po',
    name: 'Sciences Po Paris',
    type: 'IEP',
    city: 'Paris 7e',
    legal_status: 'Public (EPIC)',
    scholarship_allowed: true,
    apprenticeship: false,
    nb_capacity: 1400,
    nb_accepted: 1400,
    nb_applicants: 11500,
    rate_accepted_bac_g: 0.96,
    nb_accepted_degree_tb: 900,
    nb_accepted_degree_b: 400,
    top_formation: 'Collège universitaire (Bac+3)',
    is_parcoursup: true,
    rate_professional_insertion: 0.89,
    rate_further_studies: 0.28,
    tuition_range: '0 – 14 000 €/an (selon revenus)',
    review_average: 4.5,
    nb_review: 2180,
    educationBranches: [{ label: 'Droit-Sciences politiques', slug: 'droit-sciences-politiques' }],
    openDayNext: '1 février 2026',
    color: '#E3001B',
  },
  {
    id: 'insa-lyon',
    name: 'INSA Lyon',
    type: "École d'ingénieurs",
    city: 'Villeurbanne',
    legal_status: 'Public (EPSCP)',
    scholarship_allowed: true,
    apprenticeship: true,
    nb_capacity: 900,
    nb_accepted: 900,
    nb_applicants: 7200,
    rate_accepted_bac_g: 0.99,
    nb_accepted_degree_tb: 720,
    nb_accepted_degree_b: 160,
    top_formation: 'Cycle Ingénieur (Bac+5)',
    is_parcoursup: false,
    rate_professional_insertion: 0.93,
    rate_further_studies: 0.20,
    tuition_range: '601 €/an (frais inscription)',
    review_average: 4.2,
    nb_review: 890,
    educationBranches: [{ label: 'Ingénierie-Industrie', slug: 'ingenierie-industrie' }],
    openDayNext: '7 février 2026',
    color: '#FFD100',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('fr-FR');
}

function pct(r: number): string {
  return `${Math.round(r * 100)} %`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function StarRating({ value, count }: { value: number; count: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.25 && value - full < 0.75;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 14, color: '#FFD100', letterSpacing: -1 }}>
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'☆'.repeat(5 - full - (half ? 1 : 0))}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--le-gray-700)' }}>
        {value.toFixed(1)}
      </span>
      <span className="le-caption">({fmt(count)} avis)</span>
    </div>
  );
}

function MiniBar({ value, max = 1, color }: { value: number; max?: number; color: string }) {
  const w = Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      style={{
        height: 5,
        background: 'var(--le-gray-200)',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 4,
        maxWidth: 120,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${w}%`,
          background: color,
          borderRadius: 10,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

function BoolCell({ value }: { value: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: value ? '#DCFCE7' : 'var(--le-gray-100)',
        color: value ? '#15803D' : 'var(--le-gray-500)',
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {value ? '✓' : '✗'}
    </span>
  );
}

// ─── Row definitions ──────────────────────────────────────────────────────────

type RowDef = {
  label: string;
  render: (school: CompareSchool) => React.ReactNode;
};

const ROWS: RowDef[] = [
  {
    label: "Type d'établissement",
    render: (s) => (
      <Tag variant="blue" style={{ fontSize: 10, whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.3 }}>
        {s.type}
      </Tag>
    ),
  },
  {
    label: 'Ville',
    render: (s) => (
      <span style={{ fontSize: 13, color: 'var(--le-gray-700)' }}>📍 {s.city}</span>
    ),
  },
  {
    label: 'Statut juridique',
    render: (s) => {
      const isPublic = s.legal_status.toLowerCase().startsWith('public');
      return (
        <Tag variant={isPublic ? 'blue' : 'gray'} style={{ fontSize: 10 }}>
          {s.legal_status}
        </Tag>
      );
    },
  },
  {
    label: 'Filière principale',
    render: (s) => (
      <Tag variant="yellow" style={{ fontSize: 10, whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.3 }}>
        {s.educationBranches[0]?.label ?? '—'}
      </Tag>
    ),
  },
  {
    label: "Capacité d'accueil",
    render: (s) => (
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--le-gray-900)' }}>
        {fmt(s.nb_capacity)}
      </span>
    ),
  },
  {
    label: "Taux d'admission",
    render: (s) => {
      const rate = s.nb_accepted / s.nb_applicants;
      const color = rate < 0.15 ? 'var(--le-red)' : rate < 0.3 ? '#D97706' : '#16A34A';
      return (
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color }}>{pct(rate)}</span>
          <MiniBar value={rate} color={color} />
        </div>
      );
    },
  },
  {
    label: 'Bac général admis',
    render: (s) => (
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--le-gray-900)' }}>
        {pct(s.rate_accepted_bac_g)}
      </span>
    ),
  },
  {
    label: 'Mentions Très Bien',
    render: (s) => (
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--le-gray-900)' }}>
        {fmt(s.nb_accepted_degree_tb)}
      </span>
    ),
  },
  {
    label: 'Insertion professionnelle',
    render: (s) => {
      const r = s.rate_professional_insertion;
      const color = r > 0.9 ? '#16A34A' : r > 0.8 ? '#D97706' : 'var(--le-red)';
      return (
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color }}>{pct(r)}</span>
          <MiniBar value={r} color={color} />
        </div>
      );
    },
  },
  {
    label: "Poursuite d'études",
    render: (s) => (
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--le-blue)' }}>
        {pct(s.rate_further_studies)}
      </span>
    ),
  },
  {
    label: 'Frais de scolarité',
    render: (s) => (
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--le-gray-700)', lineHeight: 1.4 }}>
        {s.tuition_range}
      </span>
    ),
  },
  {
    label: 'Alternance disponible',
    render: (s) => <BoolCell value={s.apprenticeship} />,
  },
  {
    label: 'Bourse possible',
    render: (s) => <BoolCell value={s.scholarship_allowed} />,
  },
  {
    label: 'Parcoursup',
    render: (s) => <BoolCell value={s.is_parcoursup} />,
  },
  {
    label: 'Note étudiants',
    render: (s) => <StarRating value={s.review_average} count={s.nb_review} />,
  },
  {
    label: 'Prochaine JPO',
    render: (s) => (
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--le-gray-700)' }}>
        📅 {s.openDayNext}
      </span>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const [schools] = useState<CompareSchool[]>(COMPARE_SCHOOLS);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const COL_W = 140;
  const LABEL_W = 160;

  return (
    <div className="page-with-nav" style={{ background: 'var(--le-gray-100)', minHeight: '100vh' }}>
      {/* Toast */}
      {toast && (
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
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: '#fff',
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--le-gray-200)',
        }}
      >
        <a
          href="/saved"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--le-gray-500)',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            marginBottom: 12,
          }}
        >
          ← Retour à mes écoles
        </a>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h1 className="le-h2" style={{ margin: '0 0 6px' }}>
              Comparer mes écoles
            </h1>
            <Tag variant="blue">{schools.length} établissements sélectionnés</Tag>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => showToast('Maximum 3 établissements autorisés')}
          >
            + Ajouter
          </Button>
        </div>
      </div>

      <StripeRule />

      {/* Scrollable comparison table */}
      <div
        className="no-scrollbar"
        style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ minWidth: LABEL_W + COL_W * schools.length + 32 }}>
          {/* School header row */}
          <div
            style={{
              display: 'flex',
              background: '#fff',
              borderBottom: '2px solid var(--le-gray-200)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              padding: '0 16px',
            }}
          >
            {/* Label column spacer */}
            <div style={{ width: LABEL_W, flexShrink: 0 }} />

            {/* School headers */}
            {schools.map((school) => (
              <div
                key={school.id}
                style={{
                  width: COL_W,
                  flexShrink: 0,
                  padding: '14px 8px',
                  borderTop: `4px solid ${school.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  textAlign: 'center',
                }}
              >
                {/* Initials circle */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: school.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: school.color === '#FFD100' ? '#1A1A1A' : '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {getInitials(school.name)}
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--le-gray-900)', margin: 0, lineHeight: 1.3 }}>
                  {school.name}
                </p>
                <p className="le-caption" style={{ margin: 0, lineHeight: 1.3 }}>
                  {school.type}
                </p>
                <p className="le-caption" style={{ margin: 0 }}>📍 {school.city}</p>
                {/* Saved badge */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    background: '#DCFCE7',
                    color: '#15803D',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 20,
                    letterSpacing: '0.04em',
                  }}
                >
                  ❤️ Sauvegardé
                </span>
              </div>
            ))}
          </div>

          {/* Criteria rows */}
          <div style={{ padding: '0 16px' }}>
            {ROWS.map((row, rowIdx) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: rowIdx % 2 === 0 ? '#fff' : 'var(--le-gray-100)',
                  borderBottom: '1px solid var(--le-gray-200)',
                  minHeight: 56,
                }}
              >
                {/* Label */}
                <div
                  style={{
                    width: LABEL_W,
                    flexShrink: 0,
                    padding: '10px 12px 10px 0',
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--le-gray-700)',
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {row.label}
                  </p>
                </div>

                {/* Values per school */}
                {schools.map((school) => (
                  <div
                    key={school.id}
                    style={{
                      width: COL_W,
                      flexShrink: 0,
                      padding: '10px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {row.render(school)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding: '20px 16px', background: '#fff', borderTop: '1px solid var(--le-gray-200)', marginTop: 16 }}>
        <SectionLabel>Actions</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${schools.length}, 1fr)`,
            gap: 8,
            marginTop: 14,
          }}
        >
          {schools.map((school) => (
            <div key={school.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--le-gray-700)', margin: 0, textAlign: 'center', lineHeight: 1.3 }}>
                {school.name}
              </p>
              <Button
                variant="primary"
                size="sm"
                href={`/schools/${school.id}`}
                style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}
              >
                Prendre RDV
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          href="/saved"
          style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
        >
          ← Retour à mes écoles
        </Button>
      </div>
    </div>
  );
}
