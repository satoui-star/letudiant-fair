'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';
import { Skeleton } from '@/components/ui/Skeleton';

// ── Types ────────────────────────────────────────────────────────────────────

interface MapPosition { x: number; y: number; w: number; h: number; }

interface StandData {
  id: string;
  school_id: string;
  stand_label: string | null;
  category: string;
  map_position: MapPosition;
  schools: { name: string; type: string; city: string | null; website: string | null; } | null;
}

interface ProgramSession {
  id: string;
  title: string;
  description: string | null;
  speaker: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
}

interface EventData {
  name: string;
  event_date: string;
  city: string | null;
  address: string | null;
}

// ── Map constants ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  'Écoles de Commerce':        { fill: '#DBEAFE', stroke: '#3B82F6', text: '#1D4ED8' },
  'Écoles Spécialisées':       { fill: '#EDE9FE', stroke: '#8B5CF6', text: '#6D28D9' },
  'Centres de Formation':      { fill: '#FFEDD5', stroke: '#F97316', text: '#C2410C' },
  'Organismes et Partenaires': { fill: '#D1FAE5', stroke: '#10B981', text: '#065F46' },
  'Recruteurs et Entreprises': { fill: '#FEE2E2', stroke: '#EF4444', text: '#B91C1C' },
  "Écoles d'Ingénieurs":       { fill: '#CFFAFE', stroke: '#06B6D4', text: '#0E7490' },
  'Universités':                { fill: '#FEF9C3', stroke: '#EAB308', text: '#A16207' },
  'Grandes Écoles':             { fill: '#EFF6FF', stroke: '#1D4ED8', text: '#1E3A8A' },
  "Écoles d'Art et Design":    { fill: '#FCE7F3', stroke: '#EC4899', text: '#9D174D' },
  "Écoles d'Architecture":     { fill: '#F0FDF4', stroke: '#22C55E', text: '#15803D' },
};
const DEFAULT_COLORS = { fill: '#F3F4F6', stroke: '#9CA3AF', text: '#4B5563' };

function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLORS;
}

// Aisle bands between rows — positions match the 028 migration layout
const AISLES = [62, 124, 186, 248, 310, 372].map((y, i) => ({ y, label: `Allée ${i + 1}` }));

// ── Component ─────────────────────────────────────────────────────────────────

export default function FairPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const router = useRouter();
  const { eventId } = use(params);

  const [activeTab, setActiveTab]           = useState<'plan' | 'programme'>('plan');
  const [selectedStand, setSelectedStand]   = useState<StandData | null>(null);
  const [event, setEvent]                   = useState<EventData | null>(null);
  const [eventLoading, setEventLoading]     = useState(true);
  const [stands, setStands]                 = useState<StandData[]>([]);
  const [standsLoading, setStandsLoading]   = useState(true);
  const [sessions, setSessions]             = useState<ProgramSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('events')
        .select('name, event_date, city, address')
        .eq('id', eventId)
        .maybeSingle();
      if (data) setEvent(data as EventData);
      setEventLoading(false);
    }
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    async function loadStands() {
      try {
        const res = await fetch(`/api/events/${eventId}/stands`);
        const json = await res.json();
        if (json.success) setStands(json.data || []);
      } catch (err) {
        console.error('Failed to load stands', err);
      } finally {
        setStandsLoading(false);
      }
    }
    loadStands();
  }, [eventId]);

  useEffect(() => {
    async function loadProgram() {
      try {
        const res = await fetch(`/api/events/${eventId}/programs`);
        const json = await res.json();
        if (json.success) setSessions(json.data || []);
      } catch (err) {
        console.error('Failed to load programme', err);
      } finally {
        setSessionsLoading(false);
      }
    }
    loadProgram();
  }, [eventId]);

  const formattedDate = event?.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const venueLine = [event?.address, event?.city].filter(Boolean).join(', ');

  // Which categories actually appear in this event's stands (for the legend)
  const presentCategories = Object.keys(CATEGORY_COLORS).filter(cat =>
    stands.some(s => s.category === cat)
  );

  return (
    <div className="page-with-nav" style={{ background: '#F4F4F4', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ background: '#fff', padding: '20px 20px 0', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: '#6B6B6B', fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 0 }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <Tag variant="red" style={{ marginBottom: 6 }}>Salon</Tag>
            {eventLoading ? (
              <>
                <Skeleton style={{ height: 22, width: '70%', marginBottom: 6 }} />
                <Skeleton style={{ height: 14, width: '55%' }} />
              </>
            ) : (
              <>
                <h1 className="le-h2" style={{ margin: '4px 0 2px', lineHeight: 1.2 }}>
                  {event?.name ?? 'Salon'}
                </h1>
                <p className="le-caption" style={{ margin: 0 }}>
                  {formattedDate && <>📅 {formattedDate}</>}
                  {venueLine && <> &nbsp;|&nbsp; 📍 {venueLine}</>}
                </p>
              </>
            )}
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
                color: activeTab === tab ? '#EC1F27' : '#6B6B6B',
                borderBottom: activeTab === tab ? '2px solid #EC1F27' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'color 0.15s ease',
              }}
            >
              {tab === 'plan' ? '🗺️ Plan' : '📋 Programme'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '20px' }}>

        {activeTab === 'plan' ? (

          /* ── Plan du salon ── */
          <div>
            <SectionLabel>Plan du salon</SectionLabel>

            {/* Category legend */}
            {!standsLoading && presentCategories.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                {presentCategories.map((cat) => {
                  const colors = getCategoryColors(cat);
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: 3,
                        background: colors.stroke, flexShrink: 0,
                        border: `1px solid ${colors.stroke}`,
                      }} />
                      <span style={{ fontSize: 10, color: '#6B6B6B', lineHeight: 1 }}>{cat}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Map card */}
            <div style={{
              marginTop: 14,
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #E8E8E8',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              {standsLoading ? (
                <div style={{ padding: 20 }}>
                  <Skeleton style={{ height: 320, borderRadius: 8 }} />
                </div>
              ) : stands.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p className="le-caption">Le plan du salon sera disponible prochainement.</p>
                </div>
              ) : (
                <svg
                  viewBox="0 0 380 490"
                  style={{ width: '100%', display: 'block' }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Floor */}
                  <rect x="0" y="0" width="380" height="490" fill="#F9F9F9" />

                  {/* Aisle bands */}
                  {AISLES.map((aisle) => (
                    <g key={aisle.y}>
                      <rect x="0" y={aisle.y} width="380" height="20" fill="#EBEBEB" />
                      <text
                        x="190" y={aisle.y + 14}
                        textAnchor="middle" fontSize="7" fill="#ABABAB" fontWeight="500"
                      >
                        {aisle.label}
                      </text>
                    </g>
                  ))}

                  {/* Stands */}
                  {stands.map((stand) => {
                    const pos = stand.map_position;
                    const colors = getCategoryColors(stand.category);
                    const isSelected = selectedStand?.id === stand.id;
                    const rawName = stand.schools?.name ?? '';
                    const displayName = rawName.length > 9 ? rawName.slice(0, 8) + '…' : rawName;

                    return (
                      <g
                        key={stand.id}
                        onClick={() => setSelectedStand(isSelected ? null : stand)}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect
                          x={pos.x} y={pos.y} width={pos.w} height={pos.h}
                          fill={isSelected ? colors.stroke : colors.fill}
                          stroke={colors.stroke}
                          strokeWidth={isSelected ? 2 : 1.5}
                          rx="4"
                        />
                        {/* School name */}
                        <text
                          x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 - 3}
                          textAnchor="middle" fontSize="7" fontWeight="600"
                          fill={isSelected ? '#fff' : colors.text}
                          style={{ userSelect: 'none' }}
                        >
                          {displayName}
                        </text>
                        {/* Stand label */}
                        <text
                          x={pos.x + 4} y={pos.y + pos.h - 5}
                          fontSize="5.5"
                          fill={isSelected ? 'rgba(255,255,255,0.75)' : '#ABABAB'}
                          style={{ userSelect: 'none' }}
                        >
                          {stand.stand_label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Entrance */}
                  <rect x="0" y="444" width="380" height="46" fill="#FEF2F2" />
                  <text
                    x="190" y="461"
                    textAnchor="middle" fontSize="8" fill="#EC1F27" fontWeight="700"
                  >
                    ENTRÉE
                  </text>
                  <path d="M180 466 L200 466 L190 476 Z" fill="#EC1F27" opacity="0.6" />
                </svg>
              )}

              {/* Selected stand detail panel */}
              {selectedStand && (
                <div style={{
                  padding: '16px 20px',
                  borderTop: '1px solid #E8E8E8',
                  background: '#fff',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px', color: '#1A1A1A' }}>
                        {selectedStand.schools?.name}
                      </p>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Tag variant="blue">{selectedStand.category}</Tag>
                        <span className="le-caption">Stand {selectedStand.stand_label}</span>
                        {selectedStand.schools?.city && (
                          <span className="le-caption">📍 {selectedStand.schools.city}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      href={`/student/schools/${selectedStand.school_id}`}
                    >
                      Voir
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {!standsLoading && stands.length > 0 && (
              <p className="le-caption" style={{ textAlign: 'center', marginTop: 12 }}>
                Appuyez sur un stand pour voir ses informations
              </p>
            )}
          </div>

        ) : (

          /* ── Programme du jour ── */
          <div>
            <SectionLabel>Programme du jour</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {sessionsLoading ? (
                <>
                  <Skeleton style={{ height: 70 }} />
                  <Skeleton style={{ height: 70 }} />
                </>
              ) : sessions.length === 0 ? (
                <p style={{ color: '#6B6B6B', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                  Le programme sera publié prochainement par l&apos;organisateur du salon.
                </p>
              ) : (
                sessions.map((session) => {
                  const start = new Date(session.start_time);
                  const timeLabel = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={session.id}
                      className="le-card"
                      style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}
                    >
                      <div style={{
                        background: '#F4F4F4',
                        borderRadius: 8,
                        padding: '8px 10px',
                        textAlign: 'center',
                        flexShrink: 0,
                        minWidth: 56,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#EC1F27', display: 'block' }}>
                          {timeLabel}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 6px', color: '#1A1A1A' }}>
                          {session.title}
                        </p>
                        {session.description && (
                          <p style={{ fontSize: 12, color: '#6B6B6B', margin: '0 0 6px' }}>
                            {session.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {session.location && <Tag variant="blue">{session.location}</Tag>}
                          {session.speaker && (
                            <span className="le-caption" style={{ fontSize: 11 }}>👤 {session.speaker}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
          background: '#EC1F27',
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
