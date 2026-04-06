'use client';

import { useState } from 'react';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import OrientationBadge from '@/components/ui/OrientationBadge';
import SectionLabel from '@/components/ui/SectionLabel';
import StripeRule from '@/components/ui/StripeRule';

interface School {
  id: string;
  name: string;
  type: string;
  typeVariant: 'red' | 'blue' | 'yellow' | 'gray';
  city: string;
  score: number;
  mutualMatch: boolean;
  emoji: string;
  gradient: string;
}

const ALL_SCHOOLS: School[] = [
  {
    id: 'hec',
    name: 'HEC Paris',
    type: 'Grande École',
    typeVariant: 'red',
    city: 'Jouy-en-Josas',
    score: 72,
    mutualMatch: true,
    emoji: '🏛️',
    gradient: 'linear-gradient(135deg, #E3001B, #B0001A)',
  },
  {
    id: 'sciencespo',
    name: 'Sciences Po',
    type: 'Grande École',
    typeVariant: 'blue',
    city: 'Paris',
    score: 58,
    mutualMatch: true,
    emoji: '🌍',
    gradient: 'linear-gradient(135deg, #003C8F, #001A4D)',
  },
  {
    id: 'insa',
    name: 'INSA Lyon',
    type: 'École d\'ingénieurs',
    typeVariant: 'yellow',
    city: 'Lyon',
    score: 45,
    mutualMatch: false,
    emoji: '🔬',
    gradient: 'linear-gradient(135deg, #E6A800, #A07000)',
  },
  {
    id: 'essec',
    name: 'ESSEC Business School',
    type: 'Grande École',
    typeVariant: 'red',
    city: 'Cergy',
    score: 38,
    mutualMatch: false,
    emoji: '📊',
    gradient: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
  },
  {
    id: 'polytechnique',
    name: 'École Polytechnique',
    type: 'Grande École',
    typeVariant: 'blue',
    city: 'Palaiseau',
    score: 82,
    mutualMatch: false,
    emoji: '⚙️',
    gradient: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
  },
];

function SchoolCard({ school }: { school: School }) {
  return (
    <div
      className="le-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Color bar */}
      <div
        style={{
          height: 6,
          background: school.gradient,
        }}
      />
      <div style={{ padding: '16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: school.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {school.emoji}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: '#1A1A1A' }}>
              {school.name}
            </p>
            {school.mutualMatch && (
              <span
                style={{
                  background: '#E3001B',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  letterSpacing: '0.04em',
                }}
              >
                MATCH !
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <Tag variant={school.typeVariant}>{school.type}</Tag>
            <span className="le-caption">📍 {school.city}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <OrientationBadge score={school.score} />
            <span className="le-caption">{school.score}/100</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '0 16px 16px',
          display: 'flex',
          gap: 8,
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          href={`/schools/${school.id}`}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          Voir le profil
        </Button>
        {school.mutualMatch && (
          <Button
            variant="primary"
            size="sm"
            href={`/schools/${school.id}#rdv`}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            📅 Prendre RDV
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SchoolsPage() {
  const [activeTab, setActiveTab] = useState<'saved' | 'matches'>('saved');

  const saved = ALL_SCHOOLS;
  const matches = ALL_SCHOOLS.filter((s) => s.mutualMatch);

  const displayList = activeTab === 'saved' ? saved : matches;

  return (
    <div className="page-with-nav" style={{ background: '#F4F4F4', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 20px 0', borderBottom: '1px solid #E8E8E8' }}>
        <h1 className="le-h2" style={{ margin: '0 0 4px' }}>Mes écoles</h1>
        <p className="le-caption" style={{ margin: '0 0 16px' }}>
          {saved.length} sauvegardée{saved.length > 1 ? 's' : ''} &nbsp;·&nbsp;{' '}
          {matches.length} match{matches.length > 1 ? 's' : ''} mutuel{matches.length > 1 ? 's' : ''}
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E8E8E8' }}>
          {([
            { key: 'saved', label: `Sauvegardées (${saved.length})` },
            { key: 'matches', label: `Matches (${matches.length})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: activeTab === key ? '#E3001B' : '#6B6B6B',
                borderBottom: activeTab === key ? '2px solid #E3001B' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'color 0.15s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <StripeRule />

      {/* List */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeTab === 'matches' && matches.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <SectionLabel>Matches mutuels</SectionLabel>
            <p className="le-caption" style={{ marginTop: 6 }}>
              Ces écoles ont aussi manifesté de l&apos;intérêt pour votre profil
            </p>
          </div>
        )}

        {displayList.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 48 }}>🔍</span>
            <p style={{ fontWeight: 600, fontSize: 16, color: '#1A1A1A', margin: 0 }}>
              Aucun match pour l&apos;instant
            </p>
            <p className="le-caption" style={{ margin: 0 }}>
              Continuez à explorer des écoles sur la page Découvrir
            </p>
            <Button variant="primary" href="/discover" size="sm">
              Découvrir des écoles
            </Button>
          </div>
        ) : (
          displayList.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))
        )}
      </div>
    </div>
  );
}
