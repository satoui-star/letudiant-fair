'use client';
export const dynamic = 'force-dynamic'

import { useState } from 'react';
import { use } from 'react';
import StripeRule from '@/components/ui/StripeRule';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';

interface Stand {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  textColor: string;
  tag: 'red' | 'blue' | 'yellow' | 'gray';
  type: string;
}

const STANDS: Stand[] = [
  { id: 'hec', name: 'HEC Paris', x: 20, y: 30, w: 90, h: 60, color: '#FDEAEA', textColor: '#E3001B', tag: 'red', type: 'Grande École' },
  { id: 'sciencespo', name: 'Sciences Po', x: 130, y: 30, w: 90, h: 60, color: '#E6ECF8', textColor: '#003C8F', tag: 'blue', type: 'Grande École' },
  { id: 'insa', name: 'INSA Lyon', x: 240, y: 30, w: 80, h: 60, color: '#FFFBE6', textColor: '#7A6200', tag: 'yellow', type: 'Ingénierie' },
  { id: 'essec', name: 'ESSEC', x: 20, y: 130, w: 80, h: 55, color: '#F4F4F4', textColor: '#3D3D3D', tag: 'gray', type: 'Grande École' },
  { id: 'polytechnique', name: 'Polytechnique', x: 120, y: 130, w: 100, h: 55, color: '#E6ECF8', textColor: '#003C8F', tag: 'blue', type: 'Grande École' },
  { id: 'centrale', name: 'Centrale Paris', x: 240, y: 130, w: 90, h: 55, color: '#FDEAEA', textColor: '#E3001B', tag: 'red', type: 'Ingénierie' },
];

const SESSIONS = [
  { time: '09h30', title: 'Ouverture officielle du salon', room: 'Salle principale', tag: 'red' as const },
  { time: '10h00', title: 'Business ou Ingénierie ? Comment choisir', room: 'Amphithéâtre A', tag: 'blue' as const },
  { time: '11h30', title: 'Financer ses études : bourses, prêts, alternance', room: 'Salle B', tag: 'yellow' as const },
  { time: '14h00', title: 'Table ronde : parcours d\'alumni', room: 'Amphithéâtre A', tag: 'gray' as const },
];

export default function FairPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [activeTab, setActiveTab] = useState<'plan' | 'programme'>('plan');
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null);

  return (
    <div className="page-with-nav" style={{ background: '#F4F4F4', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 20px 0', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <a href="/home" style={{ color: '#6B6B6B', textDecoration: 'none', fontSize: 22, lineHeight: 1 }}>
            ←
          </a>
          <div style={{ flex: 1 }}>
            <Tag variant="red" style={{ marginBottom: 6 }}>Salon</Tag>
            <h1 className="le-h2" style={{ margin: '4px 0 2px', lineHeight: 1.2 }}>
              Salon de l&apos;Orientation — Paris
            </h1>
            <p className="le-caption" style={{ margin: 0 }}>
              📅 15 avril 2026 &nbsp;|&nbsp; 📍 Palais des Congrès, Paris
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E8E8E8', marginTop: 4 }}>
          {(['plan', 'programme'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: activeTab === tab ? '#E3001B' : '#6B6B6B',
                borderBottom: activeTab === tab ? '2px solid #E3001B' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'color 0.15s ease',
              }}
            >
              {tab === 'plan' ? '🗺️ Plan' : '📋 Programme'}
            </button>
          ))}
        </div>
      </div>

      <StripeRule />

      {/* Tab content */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'plan' ? (
          <div>
            <SectionLabel>Plan du salon</SectionLabel>
            <div
              style={{
                marginTop: 16,
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #E8E8E8',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              {/* SVG Map */}
              <svg
                viewBox="0 0 380 220"
                style={{ width: '100%', display: 'block' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Floor background */}
                <rect x="0" y="0" width="380" height="220" fill="#F9F9F9" />
                {/* Allées */}
                <rect x="110" y="20" width="10" height="180" fill="#E8E8E8" rx="2" />
                <rect x="220" y="20" width="10" height="180" fill="#E8E8E8" rx="2" />
                <rect x="10" y="105" width="360" height="10" fill="#E8E8E8" rx="2" />
                {/* Entrée */}
                <text x="190" y="210" textAnchor="middle" fontSize="10" fill="#6B6B6B" fontWeight="600">
                  ENTRÉE
                </text>
                <path d="M175 215 L205 215 L205 220 L175 220 Z" fill="#E3001B" opacity="0.5" />
                {/* Stands */}
                {STANDS.map((stand) => (
                  <g
                    key={stand.id}
                    onClick={() => setSelectedStand(selectedStand?.id === stand.id ? null : stand)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={stand.x}
                      y={stand.y}
                      width={stand.w}
                      height={stand.h}
                      fill={selectedStand?.id === stand.id ? stand.textColor : stand.color}
                      stroke={stand.textColor}
                      strokeWidth="1.5"
                      rx="6"
                    />
                    <text
                      x={stand.x + stand.w / 2}
                      y={stand.y + stand.h / 2 - 4}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill={selectedStand?.id === stand.id ? '#fff' : stand.textColor}
                    >
                      {stand.name.split(' ')[0]}
                    </text>
                    <text
                      x={stand.x + stand.w / 2}
                      y={stand.y + stand.h / 2 + 8}
                      textAnchor="middle"
                      fontSize="8"
                      fill={selectedStand?.id === stand.id ? 'rgba(255,255,255,0.8)' : '#6B6B6B'}
                    >
                      {stand.name.split(' ').slice(1).join(' ')}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Stand detail overlay */}
              {selectedStand && (
                <div
                  style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #E8E8E8',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px', color: '#1A1A1A' }}>
                      {selectedStand.name}
                    </p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Tag variant={selectedStand.tag}>{selectedStand.type}</Tag>
                      <span className="le-caption">Stand {selectedStand.id.toUpperCase()}</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" href={`/schools/${selectedStand.id}`}>
                    Voir
                  </Button>
                </div>
              )}
            </div>

            <p className="le-caption" style={{ textAlign: 'center', marginTop: 12 }}>
              Appuyez sur un stand pour voir ses informations
            </p>
          </div>
        ) : (
          <div>
            <SectionLabel>Programme du jour</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {SESSIONS.map((session, i) => (
                <div
                  key={i}
                  className="le-card"
                  style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}
                >
                  <div
                    style={{
                      background: '#F4F4F4',
                      borderRadius: 8,
                      padding: '8px 10px',
                      textAlign: 'center',
                      flexShrink: 0,
                      minWidth: 56,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#E3001B', display: 'block' }}>
                      {session.time}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 6px', color: '#1A1A1A' }}>
                      {session.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag variant={session.tag}>{session.room}</Tag>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating scan button */}
      <a
        href={`/fair/${eventId}/scan`}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          background: '#E3001B',
          color: '#fff',
          padding: '14px 20px',
          borderRadius: 30,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: 14,
          boxShadow: '0 4px 20px rgba(227,0,27,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 40,
        }}
      >
        <span style={{ fontSize: 18 }}>📷</span>
        Scanner un stand
      </a>
    </div>
  );
}
