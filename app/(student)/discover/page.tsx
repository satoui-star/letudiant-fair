'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import TinderCard from 'react-tinder-card';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import StripeRule from '@/components/ui/StripeRule';
import { getSchools, upsertMatch, saveSchoolToWishlist, getSchoolFormations, saveFormationToWishlist, getAllReels, saveReelToWishlist, getSavedReels, deleteReelFromWishlist } from '@/lib/supabase/database';
import { getSupabase } from '@/lib/supabase/client';
import { rankSchoolsForStudent } from '@/lib/supabase/schoolRanking';
import { rankFormationsForStudent } from '@/lib/supabase/programRanking';
import { useAuth } from '@/hooks/useAuth';
import type { SchoolRow, FormationRow, SchoolReelRow, SavedReelRow } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

// School cards use SchoolRow directly from DB — no more hardcoded mock type

interface Reel {
  id: string;
  schoolName: string;
  title: string;
  description?: string;
  duration: string;
  views: string;
  thumbnail_color: string;
  tags: string[];
  video_url: string; // YouTube embed URL or Supabase Storage URL
}

interface Article {
  id: string;
  title: string;
  rubrique: string;
  readingTime: string;
  published_at: string;
  tag: 'red' | 'blue' | 'yellow' | 'gray';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Map school type to a Tag variant
function typeVariant(type: string): 'red' | 'blue' | 'yellow' | 'gray' {
  if (type.toLowerCase().includes('ingénieur')) return 'yellow';
  if (type.toLowerCase().includes('université')) return 'blue';
  if (type.toLowerCase().includes('grande')) return 'red';
  return 'gray';
}

// Generate a gradient from school type so cards still look nice
const GRADIENTS = [
  'linear-gradient(160deg, #EC1F27 0%, #8B0012 100%)',
  'linear-gradient(160deg, #0066CC 0%, #001A4D 100%)',
  'linear-gradient(160deg, #1a1a2e 0%, #0f3460 100%)',
  'linear-gradient(160deg, #E6A800 0%, #A07000 100%)',
  'linear-gradient(160deg, #2d6a4f 0%, #1b4332 100%)',
  'linear-gradient(160deg, #4a1942 0%, #2d1128 100%)',
];
const EMOJIS = ['🏛️', '⚙️', '🌍', '🔬', '📊', '🎓', '🏫', '📐'];

function gradientFor(index: number) { return GRADIENTS[index % GRADIENTS.length]; }
function emojiFor(index: number) { return EMOJIS[index % EMOJIS.length]; }

// Reels and articles are editorial content published by exhibitors / l'Étudiant
// editorial team. Until the content tables are wired up (school_reels, articles),
// we show empty states rather than shipping hardcoded demo rows.

// ─── Tab type ─────────────────────────────────────────────────────────────────

type TabId = 'swipe' | 'reels' | 'actualites';

// ─── Reel card component ──────────────────────────────────────────────────────

function ReelCard({ reel, onPlay }: { reel: Reel; onPlay: (reel: Reel) => void; key?: string }) {
  const textOnDark = reel.thumbnail_color === '#FCD716' ? '#1A1A1A' : '#fff';

  return (
    <div
      style={{
        width: '100%',
        height: 200,
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        background: `linear-gradient(160deg, ${reel.thumbnail_color} 0%, ${reel.thumbnail_color}99 100%)`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}
      onClick={() => onPlay(reel)}
    >
      {/* Noise texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Bottom gradient for text legibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)',
        }}
      />

      {/* School name — top left */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 12,
          fontSize: 11,
          fontWeight: 700,
          color: textOnDark,
          background: 'rgba(0,0,0,0.25)',
          padding: '3px 8px',
          borderRadius: 20,
          backdropFilter: 'blur(4px)',
        }}
      >
        {reel.schoolName}
      </div>

      {/* Tags — top right */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 12,
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        {reel.tags.map((t) => (
          <span
            key={t}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 20,
              backdropFilter: 'blur(4px)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Play button — center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translate(-50%, -50%) scale(1.1)',
          },
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="var(--le-gray-900)"
          style={{ marginLeft: 3 }}
        >
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </div>

      {/* Views — bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(255,255,255,0.15)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: 20,
          backdropFilter: 'blur(4px)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {reel.views}
      </div>

      {/* Duration — bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 12,
          background: 'rgba(0,0,0,0.55)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 6,
        }}
      >
        {reel.duration}
      </div>

      {/* Title — bottom overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 12,
          right: 12,
        }}
      >
        <p
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            margin: 0,
            lineHeight: 1.3,
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          {reel.title}
        </p>
      </div>
    </div>
  );
}

// ─── Video modal component ────────────────────────────────────────────────────

function VideoModal({
  reel,
  onClose,
  isSaved = false,
  onSave
}: {
  reel: Reel | null;
  onClose: () => void;
  isSaved?: boolean;
  onSave?: (reelId: string, title: string) => void;
}) {
  if (!reel) return null;

  // Detect if URL is YouTube embed
  const isYouTube = reel.video_url.includes('youtube.com');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: '#fff',
          fontSize: '28px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
      >
        ✕
      </button>

      {/* Save button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onSave && !isSaved) {
            onSave(reel.id, reel.title);
          }
        }}
        disabled={isSaved}
        style={{
          position: 'absolute',
          top: '20px',
          right: '80px',
          background: isSaved ? 'rgba(100, 200, 100, 0.3)' : 'rgba(100, 150, 255, 0.2)',
          border: '1px solid ' + (isSaved ? 'rgba(100, 200, 100, 0.5)' : 'rgba(100, 150, 255, 0.5)'),
          color: '#fff',
          fontSize: '14px',
          fontWeight: '600',
          padding: '8px 14px',
          borderRadius: '6px',
          cursor: isSaved ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          opacity: isSaved ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isSaved) {
            e.currentTarget.style.background = 'rgba(100, 150, 255, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isSaved ? 'rgba(100, 200, 100, 0.3)' : 'rgba(100, 150, 255, 0.2)';
        }}
      >
        {isSaved ? '✅ Saved' : '💾 Save'}
      </button>

      {/* Modal content */}
      <div
        style={{
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '100%',
          aspectRatio: isYouTube ? '16 / 9' : 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video player */}
        {isYouTube ? (
          <iframe
            width="100%"
            height="100%"
            src={reel.video_url}
            title={reel.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ flex: 1 }}
          />
        ) : (
          <video
            width="100%"
            height="100%"
            controls
            autoPlay
            style={{ flex: 1, background: '#000' }}
          >
            <source src={reel.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}

        {/* Video info */}
        <div style={{ padding: '16px', background: '#000', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px' }}>{reel.title}</h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 8px' }}>
            {reel.schoolName} · {reel.duration}
          </p>
          {reel.description && (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '1.5' }}>
              {reel.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Article card component ───────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article; key?: string }) {
  return (
    <div
      className="le-card"
      style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tag variant={article.tag}>{article.rubrique}</Tag>
        <span className="le-caption">{article.readingTime} · {article.published_at}</span>
      </div>
      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--le-gray-900)', margin: 0, lineHeight: 1.4 }}>
        {article.title}
      </p>
      <a
        href="#"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--le-red)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          alignSelf: 'flex-start',
        }}
      >
        Lire →
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FormationWithSchool = FormationRow & {
  schoolId: string;
  schoolName: string;
  schoolCity: string;
  schoolType: string;
  schoolImage?: string;
  score?: number;
};

export default function DiscoverPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'swipe';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [formations, setFormations] = useState<FormationWithSchool[]>([]);
  const [loadingFormations, setLoadingFormations] = useState(true);
  const [loadingReels, setLoadingReels] = useState(true);
  const [rightCount, setRightCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [flipped, setFlipped] = useState<Set<string>>(new Set()); // For card flip animation
  const [pendingSaves, setPendingSaves] = useState(0); // Track pending database saves
  const [reels, setReels] = useState<Reel[]>([]); // Load from getAllReels()
  const [playingReelId, setPlayingReelId] = useState<string | null>(null); // Track which reel is playing
  const [savedReelIds, setSavedReelIds] = useState<Set<string>>(new Set()); // Track saved reels by ID
  const articles: Article[] = []; // TODO: Implement articles once table is wired

  // ── Sync activeTab with URL searchParams ───────────────────────────────────────
  useEffect(() => {
    const tab = searchParams.get('tab') as TabId | null;
    if (tab && (tab === 'swipe' || tab === 'reels' || tab === 'actualites')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // ── Load formations from all schools with smart ranking ──────────────────────
  useEffect(() => {
    const loadFormations = async () => {
      try {
        if (!user?.id) {
          setFormations([]);
          setLoadingFormations(false);
          return;
        }

        // STEP 1: Fetch user's wishlist from Supabase
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('wishlist, education_branches, orientation_stage, name, email')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('❌ Error fetching user data:', userError);
          setFormations([]);
          setLoadingFormations(false);
          return;
        }

        const userWishlist = userData?.wishlist ?? [];
        // STEP 2: Load all schools and formations
        const allSchools = await getSchools();
        if (!allSchools || allSchools.length === 0) {
          setFormations([]);
          setLoadingFormations(false);
          return;
        }

        const allFormations: FormationWithSchool[] = [];

        // Fetch formations for each school
        for (const school of allSchools) {
          try {
            const schoolFormations = await getSchoolFormations(school.id);
            if (schoolFormations && schoolFormations.length > 0) {
              allFormations.push(
                ...schoolFormations.map((formation) => ({
                  ...formation,
                  schoolId: school.id,
                  schoolName: school.name,
                  schoolCity: school.city,
                  schoolType: school.type,
                  schoolImage: school.cover_image_url,
                }))
              );
            }
          } catch (err) {
            console.error(`Error loading formations for ${school.name}:`, err);
          }
        }
        if (allFormations.length === 0) {
          setFormations([]);
          setLoadingFormations(false);
          return;
        }

        // STEP 3: Filter out formations already in wishlist
        const newFormations = allFormations.filter(
          (formation) => !userWishlist.includes(formation.id)
        );
        if (newFormations.length === 0) {
          setFormations([]);
          setLoadingFormations(false);
          return;
        }

        // STEP 4: Rank formations by relevance if user has profile data
        let finalFormations = newFormations;
        if (userData?.education_branches && userData.education_branches.length > 0) {
          finalFormations = await rankFormationsForStudent(user.id, userData, newFormations);
        } else {
        }

        // Reverse so first formation shows on top of TinderCard stack
        setFormations([...finalFormations].reverse());
        setRightCount(userWishlist.length); // Set counter to total saved (sync with /saved page)
        setGone(new Set()); // Reset swiped cards
      } catch (err) {
        console.error('❌ Error loading formations:', err);
        setFormations([]);
      } finally {
        setLoadingFormations(false);
      }
    };

    loadFormations();
  }, [user?.id, user?.profile]);

  // ── Load rightCount from user's wishlist ────────────────────────────────────
  const loadWishlistCount = async (userId: string) => {
    try {
      const { data: userData } = await getSupabase()
        .from('users')
        .select('wishlist')
        .eq('id', userId)
        .maybeSingle();

      const wishlist = (userData?.wishlist as string[]) ?? [];
      setRightCount(wishlist.length);
    } catch (err) {
      console.error('Error loading wishlist count:', err);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setRightCount(0);
      return;
    }
    loadWishlistCount(user.id);
  }, [user?.id]);

  // Refresh counter when page becomes visible (tab switching, returning from saved page, etc)
  useEffect(() => {
    if (!user?.id) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await loadWishlistCount(user.id);
      }
    };

    // Also refresh immediately if page is already visible
    if (document.visibilityState === 'visible') {
      loadWishlistCount(user.id);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  // Refresh counter when user presses back button
  useEffect(() => {
    if (!user?.id) return;

    const handlePopState = () => {
      loadWishlistCount(user.id);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user?.id]);

  // ── Load reels (MOCK DATA FOR NOW) ─────────────────────────────────────────
  useEffect(() => {
    const loadReels = async () => {
      try {
        setLoadingReels(true);

        const reelData = await getAllReels();
        // Transform SchoolReelRow to Reel format for display
        const transformedReels: Reel[] = reelData.map((reel: any) => ({
          id: reel.id,
          schoolName: reel.schools?.name || 'École', // Use school name from join
          title: reel.title,
          description: reel.description || undefined,
          duration: reel.duration_seconds ? `${Math.floor(reel.duration_seconds / 60)}:${String(reel.duration_seconds % 60).padStart(2, '0')}` : '0:00',
          views: reel.view_count > 1000 ? `${(reel.view_count / 1000).toFixed(1)}K` : String(reel.view_count),
          thumbnail_color: reel.thumbnail_color,
          tags: reel.tags,
          video_url: reel.video_url,
        }));

        setReels(transformedReels);
      } catch (err) {
        console.error('Error loading reels:', err);
        setReels([]);
      } finally {
        setLoadingReels(false);
      }
    };

    loadReels();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const toggleFlip = (cardId: string) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const handleSwipe = async (direction: string, formation: FormationWithSchool) => {
    try {
      setGone((prev) => new Set(prev).add(formation.id));

      if (direction === 'right') {
        setRightCount((n) => {
          const newCount = n + 1;
          return newCount;
        });
        showToast(`💾 ${formation.name} enregistrée !`);

        // Save formation to wishlist if user is logged in
        if (user?.id) {
          setPendingSaves((n) => n + 1);
          try {
            await saveFormationToWishlist(user.id, formation.id);
          } catch (err) {
            console.error('saveFormationToWishlist failed:', err);
          } finally {
            setPendingSaves((n) => Math.max(0, n - 1));
          }
        }
      } else if (direction === 'left') {
      }
    } catch (err) {
      console.error('Error in handleSwipe:', err);
    }
  };

  const handleSaveReel = async (reelId: string, reelTitle: string) => {
    if (!user?.id) return;

    try {
      const result = await saveReelToWishlist(user.id, reelId);
      setSavedReelIds((prev) => new Set(prev).add(reelId));

      if (result.alreadySaved) {
        showToast(`ℹ️ ${reelTitle} est déjà sauvegardé`);
      } else {
        showToast(`✅ ${reelTitle} sauvegardé !`);
      }
    } catch (error) {
      console.error('Failed to save reel:', error);
      showToast(`❌ Erreur lors de l'enregistrement du reel`);
    }
  };

  const currentCard = formations.find((c) => !gone.has(c.id));

  const handleAction = (direction: 'left' | 'center' | 'right') => {
    if (!currentCard) {
      return;
    }

    if (direction === 'center') {
      // 💡 Flip button: toggle card flip animation
      toggleFlip(currentCard.id);
    } else {
      // X (left) or ✓ (right): swipe and remove card
      handleSwipe(direction, currentCard);
    }
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: 'swipe', label: 'Swipe 🃏' },
    { id: 'reels', label: 'Reels 🎬' },
    { id: 'actualites', label: 'Actualités 📰' },
  ];

  return (
    <div
      className="page-with-nav"
      style={{
        background: 'var(--le-gray-100)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#fff',
          padding: '20px 20px 0',
          borderBottom: '1px solid var(--le-gray-200)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div>
            <h1 className="le-h2" style={{ margin: 0 }}>Découvrir</h1>
            <p className="le-caption" style={{ margin: 0 }}>Explorez écoles, vidéos et actualités</p>
          </div>
          {activeTab === 'swipe' && rightCount > 0 && (
            <>
              <button
                onClick={() => {
                  router.push('/saved?tab=liens');
                }}
                disabled={pendingSaves > 0}
              style={{
                background: pendingSaves > 0 ? 'var(--le-gray-400)' : 'var(--le-red)',
                color: '#fff',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: pendingSaves > 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                border: 'none',
                fontFamily: 'inherit',
                opacity: pendingSaves > 0 ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (pendingSaves === 0) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--le-red-dark)';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (pendingSaves === 0) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--le-red)';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }
              }}
              title={pendingSaves > 0 ? 'Enregistrement en cours...' : ''}
            >
              {pendingSaves > 0 ? '⏳ Enregistrement...' : `${rightCount} intérêt${rightCount !== 1 ? 's' : ''}`}
            </button>
            </>
          )}
          {activeTab === 'reels' && savedReelIds.size > 0 && (
            <button
              onClick={() => router.push('/saved?tab=liens&subtab=reels')}
              style={{
                background: 'var(--le-red)',
                color: '#fff',
                borderRadius: 20,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: 'none',
                fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--le-red-dark)';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--le-red)';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              🎥 {savedReelIds.size} {savedReelIds.size === 1 ? 'reel sauvegardé' : 'reels sauvegardés'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 8px',
                fontSize: 13,
                fontWeight: 600,
                color: activeTab === tab.id ? 'var(--le-red)' : 'var(--le-gray-500)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--le-red)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <StripeRule />

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
            padding: '12px 24px',
            borderRadius: 24,
            fontWeight: 600,
            fontSize: 14,
            zIndex: 100,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>💚</span>
          {toast}
        </div>
      )}

      {/* ── Swipe tab ── */}
      {activeTab === 'swipe' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 20px 0',
          }}
        >
          <div
            className="swipe-container"
            style={{ height: 420, width: '100%', maxWidth: 380, position: 'relative' }}
          >
            {loadingFormations ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: 'var(--le-gray-500)', fontSize: 14 }}>Chargement des formations…</p>
              </div>
            ) : formations.length === 0 || formations.every((c) => gone.has(c.id)) ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 16,
                  color: 'var(--le-gray-500)',
                }}
              >
                <span style={{ fontSize: 48 }}>🎓</span>
                <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Plus de formations disponibles</p>
                <p className="le-caption" style={{ textAlign: 'center', margin: 0 }}>
                  Vous avez exploré toutes les formations !<br />
                  Revenez bientôt pour de nouvelles suggestions.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setGone(new Set());
                    setFlipped(new Set());
                  }}
                >
                  Recommencer
                </Button>
              </div>
            ) : currentCard ? (
              <TinderCard
                key={currentCard.id}
                onSwipe={(dir) => {
                  handleSwipe(dir, currentCard);
                }}
                preventSwipe={['up', 'down']}
                className="swipe-card"
              >
                  <div
                    style={{
                      height: 420,
                      borderRadius: 16,
                      background: gradientFor(formations.indexOf(currentCard)),
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 8px 40px rgba(26,26,26,0.15)',
                      cursor: 'grab',
                    }}
                  >
                    {/* Flip container with 3D animation */}
                    <div className="flip-container">
                      <div className={`flip-card ${flipped.has(currentCard.id) ? 'flipped' : ''}`}>

                        {/* Front side */}
                        <div className="flip-card-front" style={{ background: gradientFor(formations.indexOf(currentCard)) }}>
                          {/* Background emoji */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -60%)',
                              fontSize: 100,
                              opacity: 0.25,
                              userSelect: 'none',
                            }}
                          >
                            {emojiFor(formations.indexOf(currentCard))}
                          </div>

                          <div className="school-card-overlay">
                            <p
                              style={{
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: 20,
                                margin: '0 0 6px',
                                lineHeight: 1.2,
                              }}
                            >
                              {currentCard.name}
                            </p>
                            <p
                              style={{
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: 14,
                                fontWeight: 500,
                                margin: '0 0 10px',
                              }}
                            >
                              {currentCard.schoolName}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                              <Tag variant={typeVariant(currentCard.schoolType)}>{currentCard.schoolType}</Tag>
                              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                                📍 {currentCard.schoolCity}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {(currentCard.fields ?? []).slice(0, 3).map((f) => (
                                <span
                                  key={f}
                                  style={{
                                    background: 'rgba(255,255,255,0.18)',
                                    color: '#fff',
                                    padding: '3px 10px',
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    border: '1px solid rgba(255,255,255,0.25)',
                                  }}
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Back side */}
                        <div className="flip-card-back" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 16px 16px' }}>
                          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>
                            {currentCard.name}
                          </h3>

                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.95)', lineHeight: 1.5, marginTop: 12 }}>
                            {currentCard.duration && (
                              <p style={{ margin: '4px 0' }}>
                                <strong>Durée:</strong> {currentCard.duration}
                              </p>
                            )}
                            {currentCard.level && (
                              <p style={{ margin: '4px 0' }}>
                                <strong>Niveau:</strong> {currentCard.level}
                              </p>
                            )}
                            {currentCard.study_modality && (
                              <p style={{ margin: '4px 0' }}>
                                <strong>Modalité:</strong> {currentCard.study_modality}
                              </p>
                            )}
                            {currentCard.admission_requirements && (
                              <p style={{ margin: '4px 0', fontSize: 12 }}>
                                <strong>Admission:</strong> {currentCard.admission_requirements}
                              </p>
                            )}
                            {currentCard.cost !== null && currentCard.cost !== undefined && (
                              <p style={{ margin: '4px 0' }}>
                                <strong>Coût:</strong> {currentCard.cost > 0 ? `${currentCard.cost.toLocaleString()}€` : 'Gratuit'}
                              </p>
                            )}
                          </div>

                          <p style={{ fontSize: 12, margin: '8px 0 0 0', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}>
                            Cliquez sur 💡 pour fermer
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
              </TinderCard>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 16,
                  color: 'var(--le-gray-500)',
                }}
              >
                <span style={{ fontSize: 48 }}>🎓</span>
                <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Plus de formations disponibles</p>
                <p className="le-caption" style={{ textAlign: 'center', margin: 0 }}>
                  Vous avez exploré toutes les formations !<br />
                  Revenez bientôt pour de nouvelles suggestions.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setGone(new Set());
                    setFlipped(new Set());
                  }}
                >
                  Recommencer
                </Button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 28,
            }}
          >
            <button
              className="le-btn-base le-btn-ghost"
              style={{ width: 56, height: 56, borderRadius: '50%', padding: 0, fontSize: 22 }}
              onClick={() => handleAction('left')}
              aria-label="Passer"
              title="Passer (X)"
            >
              ✕
            </button>
            <button
              className="le-btn-base le-btn-ghost"
              style={{ width: 52, height: 52, borderRadius: '50%', padding: 0, fontSize: 20, color: 'var(--le-gray-500)' }}
              onClick={() => handleAction('center')}
              aria-label="En savoir plus"
              title="En savoir plus (💡)"
            >
              💡
            </button>
            <button
              className="le-btn-base le-btn-primary"
              style={{ width: 64, height: 64, borderRadius: '50%', padding: 0, fontSize: 24 }}
              onClick={() => handleAction('right')}
              aria-label="Intéressé"
              title="Enregistrer (✓)"
            >
              ✓
            </button>
          </div>

          <p className="le-caption" style={{ textAlign: 'center', marginTop: 14 }}>
            Swipez ou cliquez sur les boutons pour explorer
          </p>
        </div>
      )}

      {/* ── Reels tab ── */}
      {activeTab === 'reels' && (
        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--le-gray-500)' }}>
              <span style={{ fontSize: 44, display: 'block', marginBottom: 12 }}>🎬</span>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: 'var(--le-gray-700)' }}>
                Aucune vidéo pour l&apos;instant
              </p>
              <p className="le-caption" style={{ margin: 0 }}>
                Les reels publiés par les écoles apparaîtront ici.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 12, color: 'var(--le-gray-500)', margin: 0 }}>
                  {reels.length} vidéos disponibles
                </p>
                <span
                  style={{
                    background: 'var(--le-red-light)',
                    color: 'var(--le-red-dark)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 20,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Direct du salon
                </span>
              </div>
              {reels.map((reel) => (
                <ReelCard key={reel.id} reel={reel} onPlay={(r) => setPlayingReelId(r.id)} />
              ))}
              <p className="le-caption" style={{ textAlign: 'center', paddingBottom: 16 }}>
                Nouvelles vidéos ajoutées chaque semaine
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Actualités tab ── */}
      {activeTab === 'actualites' && (
        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--le-gray-500)' }}>
              <span style={{ fontSize: 44, display: 'block', marginBottom: 12 }}>📰</span>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: 'var(--le-gray-700)' }}>
                Aucune actualité pour l&apos;instant
              </p>
              <p className="le-caption" style={{ margin: 0 }}>
                Les articles publiés par la rédaction de L&apos;Étudiant apparaîtront ici.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ fontSize: 12, color: 'var(--le-gray-500)', margin: 0 }}>
                  {articles.length} articles récents
                </p>
                <a
                  href="#"
                  style={{ fontSize: 12, fontWeight: 700, color: 'var(--le-red)', textDecoration: 'none' }}
                >
                  Voir tout →
                </a>
              </div>
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
              <div style={{ paddingBottom: 16 }}>
                <Button variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  Charger plus d&apos;articles
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Video modal */}
      <VideoModal
        reel={playingReelId ? reels.find((r) => r.id === playingReelId) || null : null}
        onClose={() => setPlayingReelId(null)}
        isSaved={playingReelId ? savedReelIds.has(playingReelId) : false}
        onSave={(reelId, title) => handleSaveReel(reelId, title)}
      />
    </div>
  );
}