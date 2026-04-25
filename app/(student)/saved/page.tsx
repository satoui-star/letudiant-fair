'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';
import { getAppointmentsForStudent, getSchools, getSchoolFormations, getSavedFormations, getSavedFormationsWithDates } from '@/lib/supabase/database';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase/client';
import type { AppointmentRow, FormationRow } from '@/lib/supabase/types';

// ─── User-specific data types ────────────────────────────────────────────────
// Saved docs/links/downloads persist per authenticated user via the
// public.saved_items table (migration 010). Items are added by user actions
// (scan stand, save link, download doc).

type SavedDoc = { id: string; schoolName: string; type: string; fileName: string; size: string; savedAt: string; unlockedByScan: boolean; schoolColor: string };
type SavedLink = { id: string; schoolName: string; label: string; url: string; savedAt: string };
type Download = { id: string; schoolName: string; type: string; fileName: string; size: string; downloadedAt: string; schoolColor: string };

type SavedItemRow = {
  id: string;
  school_id: string | null;
  kind: 'document' | 'link' | 'download';
  label: string;
  url: string | null;
  file_name: string | null;
  file_size: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  schools?: { name: string; color?: string | null } | null;
};

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

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

// ─── Formation Card Component ─────────────────────────────────────────────────

function FormationCard({ formation, schoolName, schoolCity, schoolType, schoolImage }: { formation: FormationRow; schoolName: string; schoolCity: string; schoolType: string; schoolImage?: string }) {
  return (
    <div
      className="le-card"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header: formation name + school */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: 'var(--le-gray-900)' }}>
          {formation.name}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--le-gray-600)', margin: 0 }}>
          {schoolName} · {schoolCity}
        </p>
      </div>

      {/* Tags: school type + fields */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Tag variant="blue">{schoolType}</Tag>
        {(formation.fields ?? []).slice(0, 2).map((field) => (
          <span
            key={field}
            style={{
              background: 'var(--le-gray-100)',
              color: 'var(--le-gray-700)',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {field}
          </span>
        ))}
      </div>

      {/* Details grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          background: 'var(--le-gray-100)',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 12,
        }}
      >
        {formation.duration && (
          <div>
            <p className="le-caption" style={{ margin: '0 0 2px' }}>Durée</p>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--le-gray-900)' }}>{formation.duration}</p>
          </div>
        )}
        {formation.level && (
          <div>
            <p className="le-caption" style={{ margin: '0 0 2px' }}>Niveau</p>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--le-gray-900)' }}>{formation.level}</p>
          </div>
        )}
        {formation.study_modality && (
          <div>
            <p className="le-caption" style={{ margin: '0 0 2px' }}>Modalité</p>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--le-gray-900)' }}>{formation.study_modality}</p>
          </div>
        )}
        {formation.cost !== null && formation.cost !== undefined && (
          <div>
            <p className="le-caption" style={{ margin: '0 0 2px' }}>Coût</p>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--le-gray-900)' }}>
              {formation.cost > 0 ? `${formation.cost.toLocaleString()}€` : 'Gratuit'}
            </p>
          </div>
        )}
      </div>

      {/* Requirements if available */}
      {formation.admission_requirements && (
        <div style={{ borderTop: '1px solid var(--le-gray-200)', paddingTop: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--le-gray-600)', margin: 0 }}>
            <strong>Admission:</strong> {formation.admission_requirements}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SavedSubTab = 'swipe' | 'reels' | 'salon';

export default function SavedPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'documents';

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [activeSubTab, setActiveSubTab] = useState<SavedSubTab>('swipe');
  const [appointments, setAppointments] = useState<(AppointmentRow & { schools?: { name: string; city: string; type: string } })[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const [savedDocs, setSavedDocs] = useState<SavedDoc[]>([]);
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [savedFormations, setSavedFormations] = useState<Array<FormationRow & { schoolId: string; schoolName: string; schoolCity: string; schoolType: string }>>([]);

  // Swipe filters and selection
  const [swipeFilterCity, setSwipeFilterCity] = useState<string>('');
  const [swipeFilterProgram, setSwipeFilterProgram] = useState<string>('');
  const [swipeFilterSort, setSwipeFilterSort] = useState<'asc' | 'desc' | 'none'>('none');
  const [swipeFilterDate, setSwipeFilterDate] = useState<string>('');
  const [selectedSwipes, setSelectedSwipes] = useState<Set<string>>(new Set());

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Load all saved data (docs, links, downloads, formations)
  const loadAllSavedData = async (userId: string) => {
    const supabase = getSupabase();

    // Resolve the currently active event dynamically instead of hardcoding one.
    const { data: evt } = await supabase
      .from('events')
      .select('id')
      .eq('is_active', true)
      .order('event_date', { ascending: true })
      .limit(1)
      .maybeSingle();
    const eventId = evt?.id ?? null;
    setActiveEventId(eventId);
    if (eventId) {
      getAppointmentsForStudent(userId, eventId).then(setAppointments);
    }

    // Load saved items for the current user, joined with school name.
    const { data: items } = await supabase
      .from('saved_items')
      .select('id, school_id, kind, label, url, file_name, file_size, meta, created_at, schools ( name )')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const rows: SavedItemRow[] = (items as unknown as SavedItemRow[]) ?? [];
    const defaultColor = '#003C8F';

    setSavedDocs(
      rows.filter((r) => r.kind === 'document').map((r) => ({
        id: r.id,
        schoolName: r.schools?.name ?? 'École',
        type: (r.meta?.type as string) ?? 'Document',
        fileName: r.file_name ?? r.label,
        size: r.file_size ?? '',
        savedAt: formatRelative(r.created_at),
        unlockedByScan: Boolean(r.meta?.unlockedByScan),
        schoolColor: (r.schools?.color as string) ?? defaultColor,
      })),
    );

    setSavedLinks(
      rows.filter((r) => r.kind === 'link').map((r) => ({
        id: r.id,
        schoolName: r.schools?.name ?? 'École',
        label: r.label,
        url: r.url ?? '#',
        savedAt: formatRelative(r.created_at),
      })),
    );

    setDownloads(
      rows.filter((r) => r.kind === 'download').map((r) => ({
        id: r.id,
        schoolName: r.schools?.name ?? 'École',
        type: (r.meta?.type as string) ?? 'Document',
        fileName: r.file_name ?? r.label,
        size: r.file_size ?? '',
        downloadedAt: formatRelative(r.created_at),
        schoolColor: (r.schools?.color as string) ?? defaultColor,
      })),
    );

    // Load saved formations from user's wishlist
    const { data: userData } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .maybeSingle();

    const wishlist = (userData?.wishlist as string[]) ?? [];
    console.log('SavedPage: User wishlist:', wishlist, 'length:', wishlist.length);

    if (wishlist.length > 0) {
      // Use new function that gets formations WITH save dates
      const allFormations = await getSavedFormationsWithDates(userId);
      setSavedFormations(allFormations);
      console.log('SavedPage: Loaded', allFormations.length, 'formations from wishlist with dates:', allFormations);
    } else {
      setSavedFormations([]);
      console.log('SavedPage: Wishlist is empty');
    }
  };

  // Load data on initial mount and when search params change (tab selection)
  useEffect(() => {
    if (!user?.id) return;
    const tabParam = searchParams.get('tab');
    console.log('SavedPage: Loading data for user:', user.id, 'tab:', tabParam);
    loadAllSavedData(user.id);
  }, [user?.id, searchParams]);

  // Refresh data when page becomes visible (browser tab switching)
  useEffect(() => {
    if (!user?.id) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('SavedPage: Page became visible, refreshing data...');
        await loadAllSavedData(user.id);
      }
    };

    // Also refresh immediately if page is already visible
    if (document.visibilityState === 'visible') {
      console.log('SavedPage: Page is visible on effect run, refreshing...');
      loadAllSavedData(user.id);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  // Refresh data when user presses back button or uses browser navigation
  useEffect(() => {
    if (!user?.id) return;

    const handlePopState = () => {
      console.log('SavedPage: Browser back/forward detected, refreshing...');
      loadAllSavedData(user.id);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user?.id]);

  // Get unique cities from saved formations
  const uniqueCities = Array.from(new Set(savedFormations.map((f) => f.schoolCity)))
    .filter((city) => city)
    .sort();

  // Filter and sort swipes
  const filteredFormations = savedFormations
    .filter((f) => {
      const matchCity = !swipeFilterCity || f.schoolCity === swipeFilterCity;
      const matchProgram = !swipeFilterProgram || f.name.toLowerCase().includes(swipeFilterProgram.toLowerCase());

      // Filter by date: match formations saved on the selected date
      let matchDate = true;
      if (swipeFilterDate && (f as any).saved_at) {
        const savedDate = new Date((f as any).saved_at).toISOString().split('T')[0]; // YYYY-MM-DD
        matchDate = savedDate === swipeFilterDate;
      }

      return matchCity && matchProgram && matchDate;
    })
    .sort((a, b) => {
      if (swipeFilterSort === 'none') return 0; // Keep insertion order
      if (swipeFilterSort === 'asc') return a.name.localeCompare(b.name); // A→Z
      if (swipeFilterSort === 'desc') return b.name.localeCompare(a.name); // Z→A
      return 0;
    });

  // Toggle A→Z / Z→A sorting
  const handleToggleSortOrder = () => {
    if (swipeFilterSort === 'none') {
      setSwipeFilterSort('asc'); // None → A→Z
    } else if (swipeFilterSort === 'asc') {
      setSwipeFilterSort('desc'); // A→Z → Z→A
    } else {
      setSwipeFilterSort('none'); // Z→A → None (keep insertion order)
    }
  };

  const handleToggleSwipeSelection = (formationId: string) => {
    const newSelected = new Set(selectedSwipes);
    if (newSelected.has(formationId)) {
      newSelected.delete(formationId);
    } else {
      newSelected.add(formationId);
    }
    setSelectedSwipes(newSelected);
  };

  const handleSelectAllSwipes = () => {
    if (selectedSwipes.size === filteredFormations.length) {
      setSelectedSwipes(new Set());
    } else {
      setSelectedSwipes(new Set(filteredFormations.map((f) => f.id)));
    }
  };

  const handleDeleteSelectedSwipes = async () => {
    if (selectedSwipes.size === 0 || !user?.id) return;

    const newWishlist = savedFormations
      .filter((f) => !selectedSwipes.has(f.id))
      .map((f) => f.id);

    try {
      await getSupabase()
        .from('users')
        .update({ wishlist: newWishlist })
        .eq('id', user.id);

      setSavedFormations(savedFormations.filter((f) => !selectedSwipes.has(f.id)));
      setSelectedSwipes(new Set());
      showToast(`✓ ${selectedSwipes.size} programme(s) supprimé(s)`);
    } catch (err) {
      console.error('Error deleting formations:', err);
      showToast('❌ Erreur lors de la suppression');
    }
  };

  const liensCount = savedFormations.length + savedLinks.length;

  // Log for debugging
  useEffect(() => {
    console.log('SavedPage: Render - savedFormations:', savedFormations.length, 'savedLinks:', savedLinks.length, 'total liens:', liensCount);
  }, [savedFormations, savedLinks, liensCount]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'documents', label: 'Documents', count: savedDocs.length },
    { id: 'liens', label: 'Liens sauvegardés', count: liensCount },
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
          {savedDocs.length} documents · {liensCount} liens · {appointments.length} RDV
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

        {/* ── Liens sauvegardés (with sub-tabs) ── */}
        {activeTab === 'liens' && (
          <div>
            <SectionLabel>Mes Intérêts & Liens</SectionLabel>

            {/* Sub-tabs for Liens */}
            <div
              style={{
                display: 'flex',
                gap: 0,
                borderBottom: '1px solid var(--le-gray-200)',
                marginTop: 16,
                marginBottom: 20,
              }}
            >
              {(['swipe', 'reels', 'salon'] as SavedSubTab[]).map((subTab) => (
                <button
                  key={subTab}
                  onClick={() => setActiveSubTab(subTab)}
                  style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: activeSubTab === subTab ? 'var(--le-red)' : 'var(--le-gray-500)',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeSubTab === subTab ? '2px solid var(--le-red)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease',
                    textTransform: 'capitalize',
                  }}
                >
                  {subTab === 'swipe' && '💡 Swipe'}
                  {subTab === 'reels' && '🎥 Reels'}
                  {subTab === 'salon' && '🏫 Salon'}
                </button>
              ))}
            </div>

            {/* Swipe sub-tab: Formations */}
            {activeSubTab === 'swipe' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {savedFormations.length === 0 ? (
                  <p style={{ color: 'var(--le-gray-500)', fontSize: 14, textAlign: 'center', padding: '32px 16px' }}>
                    Aucun programme enregistré. Swipez vers la droite (✓) sur les programmes dans le Swipe pour les ajouter à vos favoris.
                  </p>
                ) : (
                  <>
                    {/* Filters */}
                    <div
                      style={{
                        background: '#fff',
                        padding: '12px 16px',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        border: '1px solid var(--le-gray-200)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="🔍 Rechercher programme..."
                          value={swipeFilterProgram}
                          onChange={(e) => setSwipeFilterProgram(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid var(--le-gray-300)',
                            borderRadius: 6,
                            fontSize: 13,
                          }}
                        />
                      </div>

                      {/* Filter buttons: A→Z (reversible), Ville, Choisir date */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleToggleSortOrder}
                          style={{
                            padding: '8px 12px',
                            background: swipeFilterSort !== 'none' ? 'var(--le-red)' : 'var(--le-gray-100)',
                            color: swipeFilterSort !== 'none' ? '#fff' : 'var(--le-gray-700)',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 13,
                            transition: 'all 0.2s ease',
                            minWidth: '60px',
                          }}
                        >
                          {swipeFilterSort === 'asc' && 'A→Z'}
                          {swipeFilterSort === 'desc' && 'Z→A'}
                          {swipeFilterSort === 'none' && 'A→Z'}
                        </button>

                        {/* Ville dropdown */}
                        <select
                          value={swipeFilterCity}
                          onChange={(e) => setSwipeFilterCity(e.target.value)}
                          style={{
                            padding: '8px 12px',
                            background: swipeFilterCity ? 'var(--le-red)' : 'var(--le-gray-100)',
                            color: swipeFilterCity ? '#fff' : 'var(--le-gray-700)',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 13,
                            flex: 1,
                          }}
                        >
                          <option value="">📍 Ville</option>
                          {uniqueCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>

                        {/* Date picker */}
                        <input
                          type="date"
                          value={swipeFilterDate}
                          onChange={(e) => setSwipeFilterDate(e.target.value)}
                          style={{
                            padding: '8px 12px',
                            background: swipeFilterDate ? 'var(--le-red)' : 'var(--le-gray-100)',
                            color: swipeFilterDate ? '#fff' : 'var(--le-gray-700)',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        />
                      </div>

                      {/* Selection Actions */}
                      {savedFormations.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid var(--le-gray-200)', paddingTop: 12 }}>
                          <input
                            type="checkbox"
                            checked={selectedSwipes.size === filteredFormations.length && filteredFormations.length > 0}
                            onChange={handleSelectAllSwipes}
                            style={{ cursor: 'pointer' }}
                            title="Sélectionner tout"
                          />
                          <span style={{ fontSize: 13, color: 'var(--le-gray-600)' }}>
                            {selectedSwipes.size > 0 ? `${selectedSwipes.size} sélectionné(s)` : 'Tout sélectionner'}
                          </span>
                          {selectedSwipes.size > 0 && (
                            <>
                              <button
                                onClick={handleDeleteSelectedSwipes}
                                style={{
                                  marginLeft: 'auto',
                                  padding: '6px 12px',
                                  background: 'var(--le-red)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                🗑️ Supprimer
                              </button>
                              <button
                                onClick={() => showToast('🏫 Recherche en salon - Prochainement')}
                                style={{
                                  padding: '6px 12px',
                                  background: 'var(--le-blue)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                🏫 Rechercher sur salon
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Formations List */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                      {filteredFormations.map((formation) => (
                        <div
                          key={formation.id}
                          style={{
                            display: 'flex',
                            gap: 12,
                            padding: 12,
                            background: '#fff',
                            borderRadius: 8,
                            border: selectedSwipes.has(formation.id) ? '2px solid var(--le-red)' : '1px solid var(--le-gray-200)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => handleToggleSwipeSelection(formation.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSwipes.has(formation.id)}
                            onChange={() => handleToggleSwipeSelection(formation.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', marginTop: 4 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <FormationCard
                              formation={formation}
                              schoolName={formation.schoolName}
                              schoolCity={formation.schoolCity}
                              schoolType={formation.schoolType}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Back to Swipe Button */}
                    <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid var(--le-gray-200)' }}>
                      <Link
                        href="/discover"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          background: 'var(--le-red)',
                          color: '#fff',
                          borderRadius: 8,
                          textAlign: 'center',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: 'pointer',
                          display: 'inline-block',
                        }}
                      >
                        ← Retour au Swipe
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reels sub-tab */}
            {activeSubTab === 'reels' && (
              <div>
                <p style={{ color: 'var(--le-gray-500)', fontSize: 14, textAlign: 'center', padding: '32px 16px' }}>
                  Fonctionnalité à venir. Les Reels que vous enregistrerez apparaîtront ici.
                </p>
              </div>
            )}

            {/* Salon sub-tab: Documents */}
            {activeSubTab === 'salon' && (
              <div>
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
                    }}
                  >
                    {savedLinks.map((link) => (
                      <LinkRow key={link.id} link={link} />
                    ))}
                  </div>
                )}
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
