'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import Tag from '@/components/ui/Tag';
import SectionLabel from '@/components/ui/SectionLabel';
import { Skeleton } from '@/components/ui/Skeleton';

// ── Types ────────────────────────────────────────────────────────────────────

interface MapPosition { x: number; y: number; w: number; h: number }

interface StandData {
  id: string;
  school_id: string;
  stand_label: string | null;
  category: string;
  map_position: MapPosition;
  schools: { name: string; type: string; city: string | null; website: string | null } | null;
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

const CAT_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  'Écoles de Commerce':        { fill: '#DBEAFE', stroke: '#3B82F6', text: '#1D4ED8' },
  'Écoles Spécialisées':       { fill: '#EDE9FE', stroke: '#8B5CF6', text: '#6D28D9' },
  'Centres de Formation':      { fill: '#FFEDD5', stroke: '#F97316', text: '#C2410C' },
  'Organismes et Partenaires': { fill: '#D1FAE5', stroke: '#10B981', text: '#065F46' },
  'Recruteurs et Entreprises': { fill: '#FEE2E2', stroke: '#EF4444', text: '#B91C1C' },
  "Écoles d'Ingénieurs":       { fill: '#CFFAFE', stroke: '#06B6D4', text: '#0E7490' },
  'Universités':               { fill: '#FEF9C3', stroke: '#EAB308', text: '#A16207' },
  'Grandes Écoles':            { fill: '#EFF6FF', stroke: '#1D4ED8', text: '#1E3A8A' },
  "Écoles d'Art et Design":   { fill: '#FCE7F3', stroke: '#EC4899', text: '#9D174D' },
  "Écoles d'Architecture":    { fill: '#F0FDF4', stroke: '#22C55E', text: '#15803D' },
};
const DEFAULT_COLORS = { fill: '#F3F4F6', stroke: '#9CA3AF', text: '#4B5563' };
const C = (cat: string) => CAT_COLORS[cat] ?? DEFAULT_COLORS;

const AISLES = [62, 124, 186, 248, 310, 372].map((y, i) => ({ y, label: `Allée ${i + 1}` }));

// Canvas is drawn at 2× for retina sharpness, displayed at CSS 100 % width
const SCALE = 2;
const MAP_W = 380;
const MAP_H = 490;

// ── Canvas draw ───────────────────────────────────────────────────────────────

function drawFloorPlan(ctx: CanvasRenderingContext2D, stands: StandData[]) {
  const s = SCALE;
  ctx.clearRect(0, 0, MAP_W * s, MAP_H * s);

  // Floor background
  ctx.fillStyle = '#F7F7F7';
  ctx.fillRect(0, 0, MAP_W * s, MAP_H * s);

  // Outer border
  ctx.strokeStyle = '#D4D4D4';
  ctx.lineWidth = s;
  ctx.strokeRect(s / 2, s / 2, MAP_W * s - s, MAP_H * s - s);

  // Aisles
  AISLES.forEach(({ y, label }) => {
    ctx.fillStyle = '#E5E5E5';
    ctx.fillRect(0, y * s, MAP_W * s, 20 * s);
    ctx.fillStyle = '#A0A0A0';
    ctx.font = `${6 * s}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, (MAP_W / 2) * s, (y + 10) * s);
  });

  // Entrance zone
  ctx.fillStyle = '#FEF2F2';
  ctx.fillRect(0, 444 * s, MAP_W * s, 46 * s);
  ctx.strokeStyle = '#FECACA';
  ctx.lineWidth = s;
  ctx.strokeRect(0, 444 * s, MAP_W * s, 46 * s);
  ctx.fillStyle = '#EC1F27';
  ctx.font = `bold ${8 * s}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('▼  ENTRÉE  ▼', (MAP_W / 2) * s, 467 * s);

  // Stands
  stands.forEach((stand) => {
    const { x, y, w, h } = stand.map_position;
    const colors = C(stand.category);
    const schoolName = stand.schools?.name ?? '';
    const line1 = schoolName.length > 11 ? schoolName.slice(0, 10) + '…' : schoolName;

    // Rounded rect (manual path for compatibility)
    const r = 3 * s;
    ctx.beginPath();
    ctx.moveTo(x * s + r, y * s);
    ctx.lineTo((x + w) * s - r, y * s);
    ctx.arcTo((x + w) * s, y * s, (x + w) * s, y * s + r, r);
    ctx.lineTo((x + w) * s, (y + h) * s - r);
    ctx.arcTo((x + w) * s, (y + h) * s, (x + w) * s - r, (y + h) * s, r);
    ctx.lineTo(x * s + r, (y + h) * s);
    ctx.arcTo(x * s, (y + h) * s, x * s, (y + h) * s - r, r);
    ctx.lineTo(x * s, y * s + r);
    ctx.arcTo(x * s, y * s, x * s + r, y * s, r);
    ctx.closePath();
    ctx.fillStyle = colors.fill;
    ctx.fill();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    // Stand label (small, top-left)
    ctx.fillStyle = '#9CA3AF';
    ctx.font = `${5 * s}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(stand.stand_label ?? '', (x + 3) * s, (y + 3) * s);

    // School name (centered, bold)
    ctx.fillStyle = colors.text;
    ctx.font = `600 ${6 * s}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line1, (x + w / 2) * s, (y + h / 2 + 2) * s);
  });
}

// ── PDF print window ──────────────────────────────────────────────────────────

function openPrintWindow(imgDataUrl: string, stands: StandData[], event: EventData | null) {
  const eventName = event?.name ?? 'Salon';
  const eventDate = event?.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const venueLine = [event?.address, event?.city].filter(Boolean).join(', ');

  // Group stands by category, sorted by label
  const grouped: Record<string, StandData[]> = {};
  stands.forEach(s => {
    const cat = s.category || 'Autre';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });
  Object.values(grouped).forEach(arr =>
    arr.sort((a, b) => (a.stand_label ?? '').localeCompare(b.stand_label ?? ''))
  );

  const rowsHtml = Object.entries(grouped).map(([cat, items]) => {
    const colors = CAT_COLORS[cat] ?? DEFAULT_COLORS;
    const rows = items.map(s => `
      <tr>
        <td style="padding:4px 8px;font-size:11px;font-weight:700;color:#6B6B6B;white-space:nowrap;">${s.stand_label ?? ''}</td>
        <td style="padding:4px 8px;font-size:12px;font-weight:600;">${s.schools?.name ?? ''}</td>
        <td style="padding:4px 8px;font-size:11px;color:#9CA3AF;">${s.schools?.city ?? ''}</td>
      </tr>`).join('');
    return `
      <tr>
        <td colspan="3" style="padding:10px 8px 4px;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${colors.text};background:${colors.fill};border-left:3px solid ${colors.stroke};">
          ${cat}
        </td>
      </tr>
      ${rows}`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Plan — ${eventName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, Arial, sans-serif; color: #1A1A1A; padding: 24px 28px; max-width: 780px; margin: 0 auto; }
  .header { border-bottom: 3px solid #EC1F27; padding-bottom: 14px; margin-bottom: 20px; }
  .header h1 { font-size: 22px; font-weight: 900; letter-spacing: -.04em; color: #191829; }
  .header p { font-size: 12px; color: #6B6B6B; margin-top: 4px; }
  .map-wrap { text-align: center; margin-bottom: 24px; }
  .map-wrap img { max-width: 320px; width: 100%; border-radius: 8px; border: 1px solid #E5E5E5; }
  h2 { font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #6B6B6B; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  tr:nth-child(even) td { background: #FAFAFA; }
  td { border-bottom: 1px solid #F0F0F0; vertical-align: middle; }
  .footer { margin-top: 20px; font-size: 10px; color: #C0C0C0; text-align: center; }
  @page { margin: 1.2cm; size: A4 portrait; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <h1>${eventName}</h1>
    <p>${eventDate}${venueLine ? '  ·  ' + venueLine : ''}</p>
  </div>
  <div class="map-wrap">
    <img src="${imgDataUrl}" alt="Plan du salon">
  </div>
  <h2>Liste des exposants (${stands.length} stands)</h2>
  <table>
    <tbody>${rowsHtml}</tbody>
  </table>
  <p class="footer">L'Étudiant Salons 2026 — Plan généré le ${new Date().toLocaleDateString('fr-FR')}</p>
  <script>window.addEventListener('load', () => { setTimeout(() => window.print(), 300); });<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FairPage({ params }: { params: Promise<{ eventId: string }> }) {
  const router  = useRouter();
  const { eventId } = use(params);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeTab, setActiveTab]           = useState<'plan' | 'programme'>('plan');
  const [event, setEvent]                   = useState<EventData | null>(null);
  const [eventLoading, setEventLoading]     = useState(true);
  const [stands, setStands]                 = useState<StandData[]>([]);
  const [standsLoading, setStandsLoading]   = useState(true);
  const [standsError, setStandsError]       = useState<string | null>(null);
  const [sessions, setSessions]             = useState<ProgramSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [pdfLoading, setPdfLoading]         = useState(false);

  // Load event info
  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('events')
        .select('name, event_date, city, address')
        .eq('id', eventId)
        .maybeSingle();
      if (data) setEvent(data as EventData);
      setEventLoading(false);
    }
    load();
  }, [eventId]);

  // Load stands
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/events/${eventId}/stands`);
        const json = await res.json();
        if (json.success) setStands(json.data || []);
        else setStandsError(json.error ?? 'Erreur lors du chargement du plan');
      } catch {
        setStandsError('Impossible de charger le plan du salon');
      } finally {
        setStandsLoading(false);
      }
    }
    load();
  }, [eventId]);

  // Load programme
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/events/${eventId}/programs`);
        const json = await res.json();
        if (json.success) setSessions(json.data || []);
      } catch {
        /* silent */
      } finally {
        setSessionsLoading(false);
      }
    }
    load();
  }, [eventId]);

  // Draw canvas whenever stands data is ready
  useEffect(() => {
    if (!canvasRef.current || stands.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    drawFloorPlan(ctx, stands);
  }, [stands]);

  // Group stands by category for the list
  const standsByCategory = stands.reduce<Record<string, StandData[]>>((acc, s) => {
    const cat = s.category || 'Autre';
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});
  Object.values(standsByCategory).forEach(arr =>
    arr.sort((a, b) => (a.stand_label ?? '').localeCompare(b.stand_label ?? ''))
  );

  const presentCategories = Object.keys(CAT_COLORS).filter(cat =>
    stands.some(s => s.category === cat)
  );

  const formattedDate = event?.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const venueLine = [event?.address, event?.city].filter(Boolean).join(', ');

  const handlePDF = useCallback(() => {
    if (!canvasRef.current || stands.length === 0) return;
    setPdfLoading(true);
    try {
      const imgData = canvasRef.current.toDataURL('image/png');
      openPrintWindow(imgData, stands, event);
    } finally {
      setPdfLoading(false);
    }
  }, [stands, event]);

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
                <h1 className="le-h2" style={{ margin: '4px 0 2px', lineHeight: 1.2 }}>{event?.name ?? 'Salon'}</h1>
                <p className="le-caption" style={{ margin: 0 }}>
                  {formattedDate && <>📅 {formattedDate}</>}
                  {venueLine && <>&nbsp;|&nbsp; 📍 {venueLine}</>}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E8E8E8', marginTop: 4 }}>
          {(['plan', 'programme'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                color: activeTab === tab ? '#EC1F27' : '#6B6B6B',
                borderBottom: activeTab === tab ? '2px solid #EC1F27' : '2px solid transparent',
                marginBottom: '-2px', transition: 'color 0.15s',
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

          /* ── Plan tab ── */
          <div>
            {/* Title row + PDF button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <SectionLabel>Plan du salon</SectionLabel>
              {!standsLoading && stands.length > 0 && (
                <button
                  onClick={handlePDF}
                  disabled={pdfLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 8,
                    background: pdfLoading ? '#F4F4F4' : '#191829',
                    color: pdfLoading ? '#9CA3AF' : '#fff',
                    border: 'none', cursor: pdfLoading ? 'default' : 'pointer',
                    fontSize: 12, fontWeight: 700, letterSpacing: '.04em',
                    transition: 'background .15s',
                  }}
                >
                  📄 Plan PDF
                </button>
              )}
            </div>

            {/* Category legend */}
            {!standsLoading && presentCategories.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {presentCategories.map(cat => {
                  const colors = C(cat);
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: colors.stroke, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: '#6B6B6B' }}>{cat}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Map canvas */}
            <div style={{
              background: '#fff', borderRadius: 12,
              border: '1px solid #E8E8E8', overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              marginBottom: 20,
            }}>
              {standsLoading ? (
                <div style={{ padding: 20 }}>
                  <Skeleton style={{ height: 340, borderRadius: 8 }} />
                </div>
              ) : standsError ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p className="le-caption" style={{ color: '#EC1F27' }}>⚠️ {standsError}</p>
                </div>
              ) : stands.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p className="le-caption">Le plan du salon sera disponible prochainement.</p>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  width={MAP_W * SCALE}
                  height={MAP_H * SCALE}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              )}
            </div>

            {/* ── Exhibitor list ── */}
            {!standsLoading && stands.length > 0 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                  paddingBottom: 8, borderBottom: '2px solid #E8E8E8',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6B6B6B' }}>
                    Exposants
                  </span>
                  <span style={{
                    background: '#EC1F27', color: '#fff', fontSize: 10, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 10,
                  }}>
                    {stands.length}
                  </span>
                </div>

                {Object.entries(standsByCategory).map(([cat, items]) => {
                  const colors = C(cat);
                  return (
                    <div key={cat} style={{ marginBottom: 16 }}>
                      {/* Category header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                        padding: '5px 10px',
                        background: colors.fill,
                        borderLeft: `3px solid ${colors.stroke}`,
                        borderRadius: '0 6px 6px 0',
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: colors.stroke, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>{cat}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: colors.text, opacity: 0.7 }}>
                          {items.length} stand{items.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Stands in this category */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {items.map(stand => (
                          <div
                            key={stand.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '7px 10px', background: '#fff',
                              borderRadius: 8, border: '1px solid #F0F0F0',
                            }}
                          >
                            {/* Stand badge */}
                            <span style={{
                              fontSize: 10, fontWeight: 800, color: colors.text,
                              background: colors.fill, border: `1px solid ${colors.stroke}`,
                              padding: '2px 6px', borderRadius: 5,
                              minWidth: 36, textAlign: 'center', flexShrink: 0,
                            }}>
                              {stand.stand_label}
                            </span>
                            {/* School name */}
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', flex: 1, minWidth: 0 }}>
                              {stand.schools?.name ?? '—'}
                            </span>
                            {/* City */}
                            {stand.schools?.city && (
                              <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>
                                {stand.schools.city}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        ) : (

          /* ── Programme tab ── */
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
                sessions.map(session => {
                  const start = new Date(session.start_time);
                  const timeLabel = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={session.id} className="le-card" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ background: '#F4F4F4', borderRadius: 8, padding: '8px 10px', textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#EC1F27', display: 'block' }}>{timeLabel}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 6px', color: '#1A1A1A' }}>{session.title}</p>
                        {session.description && (
                          <p style={{ fontSize: 12, color: '#6B6B6B', margin: '0 0 6px' }}>{session.description}</p>
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
          position: 'fixed', bottom: 80, right: 20,
          background: '#EC1F27', color: '#fff',
          padding: '14px 20px', borderRadius: 30,
          textDecoration: 'none', fontWeight: 700, fontSize: 14,
          boxShadow: '0 4px 20px rgba(227,0,27,0.4)',
          display: 'flex', alignItems: 'center', gap: 8, zIndex: 40,
        }}
      >
        <span style={{ fontSize: 18 }}>📷</span>
        Scanner un stand
      </a>
    </div>
  );
}
