'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';
import { getAppointmentsForStudent } from '@/lib/supabase/database';
import { useAuth } from '@/hooks/useAuth';
import type { AppointmentRow } from '@/lib/supabase/types';

// ─── User-specific data types ────────────────────────────────────────────────
// Saved docs/links/downloads persist per authenticated user via Supabase.
// Empty state on a fresh account — items are added by user actions (scan stand,
// save link, download doc).

type SavedDoc = { id: string; schoolName: string; type: string; fileName: string; size: string; savedAt: string; unlockedByScan: boolean; schoolColor: string };
type SavedLink = { id: string; schoolName: string; label: string; url: string; savedAt: string };
type Download = { id: string; schoolName: string; type: string; fileName: string; size: string; downloadedAt: string; schoolColor: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getTypeVariant(type: string): 'blue' | 'red' | 'yellow' | 'gray' {
  const t = type.toLowerCase();
  if (t.includes('brochure') || t.includes('plaquette')) return 'blue';
  if (t.includes('guide') || t.includes('admission')) return 'red';
  if (t.includes('livret')) return 'yellow';
  return 'gray';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DocCard({ doc }: { doc: SavedDoc }) {
  const [shared, setShared] = useState(false);
  const initials = getInitials(doc.schoolName);
  const typeVariant = getTypeVariant(doc.type);

  return (
    <div
      className="le-card"
      style={{
        borderLeft: `4px solid ${doc.schoolColor}`,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Top row: avatar + type badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: doc.schoolColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 2px', color: 'var(--le-gray-900)', lineHeight: 1.2 }}>
            {doc.schoolName}
          </p>
          <Tag variant={typeVariant}>{doc.type}</Tag>
        </div>
        {doc.unlockedByScan && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#DCFCE7',
              color: '#15803D',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 20,
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            📎 Scanné au stand
          </span>
        )}
      </div>

      {/* File name + size */}
      <div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--le-gray-700)',
            margin: '0 0 2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {doc.fileName}
        </p>
        <p className="le-caption" style={{ margin: 0 }}>
          {doc.size} · {doc.savedAt}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" size="sm">
          Télécharger
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShared(true);
            setTimeout(() => setShared(false), 2000);
          }}
        >
          {shared ? '✓ Partagé' : 'Partager'}
        </Button>
      </div>
    </div>
  );
}

function LinkRow({ link }: { link: SavedLink }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: '#fff',
        borderBottom: '1px solid var(--le-gray-200)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'var(--le-blue-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        🔗
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--le-gray-900)',
            margin: '0 0 1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {link.label}
        </p>
        <p className="le-caption" style={{ margin: 0 }}>
          {link.schoolName} · {link.savedAt}
        </p>
      </div>

      <Button variant="secondary" size="sm" href={link.url}>
        Ouvrir
      </Button>
    </div>
  );
}

function AppointmentCard({ appt }: { appt: { id: string; schoolName: string; contact: string; date: string; time: string; location: string; status: string; notes: string } }) {
  const isConfirmed = appt.status === 'confirmed';
  return (
    <div className="le-card" style={{ padding: '16px' }}>
      {/* School + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: 'var(--le-gray-900)' }}>
          {appt.schoolName}
        </p>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: isConfirmed ? '#DCFCE7' : 'var(--le-yellow-light)',
            color: isConfirmed ? '#15803D' : '#7A6200',
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 20,
            letterSpacing: '0.04em',
          }}
        >
          {isConfirmed ? '✓ Confirmé' : '⏳ En attente'}
        </span>
      </div>

      {/* Contact */}
      <p style={{ fontSize: 13, color: 'var(--le-gray-700)', margin: '0 0 10px' }}>
        {appt.contact}
      </p>

      {/* Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          background: 'var(--le-gray-100)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: appt.notes ? 10 : 12,
        }}
      >
        <div>
          <p className="le-caption" style={{ margin: '0 0 2px' }}>Date</p>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--le-gray-900)' }}>{appt.date}</p>
        </div>
        <div>
          <p className="le-caption" style={{ margin: '0 0 2px' }}>Heure</p>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--le-gray-900)' }}>{appt.time}</p>
        </div>
        <div>
          <p className="le-caption" style={{ margin: '0 0 2px' }}>Lieu</p>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--le-gray-900)' }}>{appt.location}</p>
        </div>
      </div>

      {/* Notes */}
      {appt.notes && (
        <div
          style={{
            background: 'var(--le-yellow-light)',
            border: '1px solid var(--le-yellow)',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 12,
          }}
        >
          <p style={{ fontSize: 12, color: '#7A6200', margin: 0 }}>
            <span style={{ fontWeight: 700 }}>Note : </span>
            {appt.notes}
          </p>
        </div>
      )}

      {/* Map link */}
      <a
        href="#"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--le-blue)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        🗺️ Voir sur la carte
      </a>
    </div>
  );
}

function DownloadCard({ dl }: { dl: Download }) {
  const initials = getInitials(dl.schoolName);
  const typeVariant = getTypeVariant(dl.type);

  return (
    <div
      className="le-card"
      style={{
        borderLeft: `4px solid ${dl.schoolColor}`,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: dl.schoolColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--le-gray-900)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {dl.fileName}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Tag variant={typeVariant}>{dl.type}</Tag>
          <p className="le-caption" style={{ margin: 0 }}>
            {dl.size} · {dl.downloadedAt}
          </p>
        </div>
      </div>

      {/* Check badge */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#DCFCE7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        ✓
      </div>
    </div>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabId = 'documents' | 'liens' | 'rendez-vous' | 'telechargements';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('documents');
  const [appointments, setAppointments] = useState<(AppointmentRow & { schools?: { name: string; city: string; type: string } })[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // Saved docs/links/downloads start empty for a fresh user — filled via stand
  // scans and user save actions. Persistence tables TBD; kept as local state
  // shape for now so UI components work unchanged.
  const savedDocs: SavedDoc[] = [];
  const savedLinks: SavedLink[] = [];
  const downloads: Download[] = [];

  useEffect(() => {
    if (!user) return;
    // Resolve the currently active event dynamically instead of hardcoding one.
    (async () => {
      const { getSupabase } = await import('@/lib/supabase/client');
      const { data } = await getSupabase()
        .from('events')
        .select('id')
        .eq('is_active', true)
        .order('event_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      const eventId = data?.id ?? null;
      setActiveEventId(eventId);
      if (eventId) {
        getAppointmentsForStudent(user.id, eventId).then(setAppointments);
      }
    })();
  }, [user]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'documents', label: 'Documents', count: savedDocs.length },
    { id: 'liens', label: 'Liens sauvegardés', count: savedLinks.length },
    { id: 'rendez-vous', label: 'Rendez-vous', count: appointments.length },
    { id: 'telechargements', label: 'Téléchargements', count: downloads.length },
  ];

  return (
    <div className="page-with-nav" style={{ background: 'var(--le-gray-100)', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          background: '#fff',
          padding: '20px 20px 0',
          borderBottom: '1px solid var(--le-gray-200)',
        }}
      >
        <h1 className="le-h2" style={{ margin: '0 0 4px' }}>
          Mon Dossier
        </h1>

        {/* Summary bar */}
        <p className="le-caption" style={{ margin: '0 0 16px' }}>
          {savedDocs.length} documents · {savedLinks.length} liens · {appointments.length} RDV
          {activeEventId ? '' : ' · Aucun salon actif'}
        </p>

        {/* Tabs */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: 0,
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: activeTab === tab.id ? 'var(--le-red)' : 'var(--le-gray-500)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--le-red)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'color 0.15s ease',
              }}
            >
              {tab.label}
              <span
                style={{
                  background: activeTab === tab.id ? 'var(--le-red)' : 'var(--le-gray-200)',
                  color: activeTab === tab.id ? '#fff' : 'var(--le-gray-500)',
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '16px 16px 0' }}>
        {/* ── Documents ── */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionLabel>Documents collectés au salon</SectionLabel>
            {savedDocs.length === 0 ? (
              <p style={{ color: 'var(--le-gray-500)', fontSize: 14, textAlign: 'center', padding: '32px 16px' }}>
                Aucun document enregistré pour l&apos;instant. Scannez un stand au salon pour récupérer les brochures des établissements.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 10 }}>
                {savedDocs.map((doc) => (
                  <DocCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Liens sauvegardés ── */}
        {activeTab === 'liens' && (
          <div>
            <SectionLabel>Liens sauvegardés</SectionLabel>
            {savedLinks.length === 0 ? (
              <p style={{ color: 'var(--le-gray-500)', fontSize: 14, textAlign: 'center', padding: '32px 16px' }}>
                Aucun lien sauvegardé. Enregistrez des pages d&apos;écoles depuis leur fiche pour les retrouver ici.
              </p>
            ) : (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  border: '1px solid var(--le-gray-200)',
                  overflow: 'hidden',
                  marginTop: 12,
                }}
              >
                {savedLinks.map((link) => (
                  <LinkRow key={link.id} link={link} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Rendez-vous ── */}
        {activeTab === 'rendez-vous' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionLabel>Rendez-vous pris au salon</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {appointments.length === 0 ? (
                <p style={{ color: 'var(--le-gray-500)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
                  Aucun rendez-vous pris pour ce salon.
                </p>
              ) : appointments.map((appt) => (
                <div key={appt.id} className="le-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: 15 }}>{(appt as { schools?: { name: string } }).schools?.name ?? 'École'}</strong>
                    <span style={{
                      background: appt.status === 'confirmed' ? 'var(--le-blue-light)' : 'var(--le-yellow-light)',
                      color: appt.status === 'confirmed' ? 'var(--le-blue)' : '#7a5c00',
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    }}>
                      {appt.status === 'confirmed' ? 'Confirmé' : appt.status === 'pending' ? 'En attente' : appt.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--le-gray-500)' }}>
                    {new Date(appt.slot_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {' · '}
                    {new Date(appt.slot_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{appt.slot_duration} min
                  </p>
                  {appt.student_notes && (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--le-gray-700)', fontStyle: 'italic' }}>
                      &ldquo;{appt.student_notes}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div
              style={{
                background: 'var(--le-blue-light)',
                border: '1px solid var(--le-blue)',
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 18 }}>ℹ️</span>
              <p style={{ fontSize: 13, color: 'var(--le-blue)', margin: 0, lineHeight: 1.5 }}>
                Les confirmations de RDV sont envoyées par email. Pensez à vérifier vos spams.
              </p>
            </div>
          </div>
        )}

        {/* ── Téléchargements ── */}
        {activeTab === 'telechargements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionLabel>Fichiers téléchargés</SectionLabel>
            {downloads.length === 0 ? (
              <p style={{ color: 'var(--le-gray-500)', fontSize: 14, textAlign: 'center', padding: '32px 16px' }}>
                Aucun téléchargement pour l&apos;instant. Les brochures et documents téléchargés depuis les fiches écoles apparaîtront ici.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {downloads.map((dl) => (
                    <DownloadCard key={dl.id} dl={dl} />
                  ))}
                </div>
                <div style={{ paddingBottom: 16 }}>
                  <Button variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>
                    Télécharger tout (.zip)
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
