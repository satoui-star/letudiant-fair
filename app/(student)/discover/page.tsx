'use client';

import { useState, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import StripeRule from '@/components/ui/StripeRule';
import { getSchools } from '@/lib/supabase/database';
import { upsertMatch } from '@/lib/supabase/database';
import { useAuth } from '@/hooks/useAuth';
import type { SchoolRow } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

// School cards use SchoolRow directly from DB — no more hardcoded mock type

interface Reel {
  id: string;
  schoolName: string;
  title: string;
  duration: string;
  views: string;
  thumbnail_color: string;
  tags: string[];
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

function ReelCard({ reel }: { reel: Reel; key?: string }) {
  const [playing, setPlaying] = useState(false);

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
      onClick={() => setPlaying((p) => !p)}
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
      {!playing ? (
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
      ) : (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            background: 'rgba(0,0,0,0.45)',
            padding: '8px 16px',
            borderRadius: 24,
            backdropFilter: 'blur(4px)',
            whiteSpace: 'nowrap',
          }}
        >
          ▶ Lecture en cours...
        </div>
      )}

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

export default function DiscoverPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('swipe');
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [rightCount, setRightCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [gone, setGone] = useState<Set<string>>(new Set());
  // Empty arrays until reel/article tables are wired in Supabase
  const reels: Reel[] = [];
  const articles: Article[] = [];

  // ── Load real schools from Supabase ──────────────────────────────────────
  useEffect(() => {
    getSchools().then((data) => {
      // Reverse so first school shows on top of TinderCard stack
      setSchools([...data].reverse());
      setLoadingSchools(false);
    });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSwipe = async (direction: string, school: SchoolRow) => {
    setGone((prev) => new Set(prev).add(school.id));

    if (direction === 'right') {
      setRightCount((n) => n + 1);
      showToast(`Match avec ${school.name} !`);

      // ── Write to Supabase if user is logged in ──────────────────────────
      if (user?.id) {
        try {
          await upsertMatch({
            student_id: user.id,
            school_id: school.id,
            student_swipe: 'right',
            school_interest: false,
            appointment_booked: false,
          });
        } catch (err) {
          // Don't block the UI if the write fails
          console.error('upsertMatch failed:', err);
        }
      }
    } else if (direction === 'left') {
      // Record left swipe too so the exposant knows who passed
      if (user?.id) {
        try {
          await upsertMatch({
            student_id: user.id,
            school_id: school.id,
            student_swipe: 'left',
            school_interest: false,
            appointment_booked: false,
          });
        } catch (err) {
          console.error('upsertMatch failed:', err);
        }
      }
    }
  };

  const currentCard = schools.find((c) => !gone.has(c.id));

  const handleAction = (direction: 'left' | 'right' | 'up') => {
    if (!currentCard) return;
    handleSwipe(direction, currentCard);
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
          {activeTab === 'swipe' && (
            <div
              style={{
                background: 'var(--le-red)',
                color: '#fff',
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {rightCount} intérêt{rightCount !== 1 ? 's' : ''}
            </div>
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
            {loadingSchools ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: 'var(--le-gray-500)', fontSize: 14 }}>Chargement des écoles…</p>
              </div>
            ) : schools.length === 0 || schools.every((c) => gone.has(c.id)) ? (
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
                <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Plus d&apos;écoles disponibles</p>
                <p className="le-caption" style={{ textAlign: 'center', margin: 0 }}>
                  Vous avez exploré toutes les écoles !<br />
                  Revenez bientôt pour de nouvelles suggestions.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setGone(new Set());
                  }}
                >
                  Recommencer
                </Button>
              </div>
            ) : (
              schools.map((school, index) => (
                <TinderCard
                  key={school.id}
                  onSwipe={(dir) => handleSwipe(dir, school)}
                  preventSwipe={['up', 'down']}
                  className="swipe-card"
                >
                  <div
                    style={{
                      height: 420,
                      borderRadius: 16,
                      background: gradientFor(index),
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 8px 40px rgba(26,26,26,0.15)',
                      cursor: 'grab',
                    }}
                  >
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
                      {emojiFor(index)}
                    </div>

                    <div className="school-card-overlay">
                      <p
                        style={{
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 22,
                          margin: '0 0 8px',
                          lineHeight: 1.2,
                        }}
                      >
                        {school.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                        <Tag variant={typeVariant(school.type)}>{school.type}</Tag>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                          📍 {school.city}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(school.target_fields ?? []).slice(0, 3).map((f) => (
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
                </TinderCard>
              ))
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
            >
              ✕
            </button>
            <button
              className="le-btn-base le-btn-ghost"
              style={{ width: 52, height: 52, borderRadius: '50%', padding: 0, fontSize: 20, color: 'var(--le-gray-500)' }}
              onClick={() => handleAction('up')}
              aria-label="Enregistrer"
            >
              ♡
            </button>
            <button
              className="le-btn-base le-btn-primary"
              style={{ width: 64, height: 64, borderRadius: '50%', padding: 0, fontSize: 24 }}
              onClick={() => handleAction('right')}
              aria-label="Intéressé"
            >
              ✓
            </button>
          </div>

          <p className="le-caption" style={{ textAlign: 'center', marginTop: 14 }}>
            Swipez à droite pour manifester votre intérêt
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
                <ReelCard key={reel.id} reel={reel} />
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
    </div>
  );
}