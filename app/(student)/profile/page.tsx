'use client';

import { useState } from 'react';
import OrientationBadge from '@/components/ui/OrientationBadge';
import SectionLabel from '@/components/ui/SectionLabel';
import Button from '@/components/ui/Button';
import StripeRule from '@/components/ui/StripeRule';

const DOMAINS = [
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'engineering', label: 'Ingénierie', emoji: '⚙️' },
  { id: 'design', label: 'Design', emoji: '🎨' },
  { id: 'health', label: 'Santé', emoji: '🏥' },
  { id: 'law', label: 'Droit', emoji: '⚖️' },
  { id: 'science', label: 'Sciences', emoji: '🔬' },
  { id: 'arts', label: 'Arts', emoji: '🎭' },
  { id: 'tech', label: 'Tech / IA', emoji: '💻' },
];

const FAIR_HISTORY = [
  { id: 1, name: 'Salon de l\'Orientation — Lyon', date: '12 mars 2026', stands: 6, icon: '🏙️' },
  { id: 2, name: 'Salon de Paris (à venir)', date: '15 avril 2026', stands: null, icon: '🗼' },
];

interface ConsentState {
  letudiant: boolean;
  partners: boolean;
  whatsapp: boolean;
}

export default function ProfilePage() {
  const [interests, setInterests] = useState<Set<string>>(new Set(['business', 'engineering', 'science']));
  const [consents, setConsents] = useState<ConsentState>({
    letudiant: true,
    partners: false,
    whatsapp: false,
  });
  const [saved, setSaved] = useState(false);

  const toggleInterest = (id: string) => {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  };

  const toggleConsent = (key: keyof ConsentState) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-with-nav" style={{ background: '#F4F4F4', minHeight: '100vh' }}>
      {/* Profile header */}
      <div
        style={{
          background: '#fff',
          padding: '24px 20px 20px',
          borderBottom: '1px solid #E8E8E8',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Avatar */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E3001B, #B0001A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 24,
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(227,0,27,0.3)',
            }}
          >
            EA
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="le-h3" style={{ margin: '0 0 4px' }}>Emma Aubert</h1>
            <p className="le-caption" style={{ margin: '0 0 8px' }}>
              Terminale S • Lycée Henri IV, Paris
            </p>
            <OrientationBadge score={45} />
          </div>
        </div>

        {/* Profile completion */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 600 }}>Profil complété</span>
            <span style={{ fontSize: 12, color: '#E3001B', fontWeight: 700 }}>75%</span>
          </div>
          <div
            style={{
              height: 6,
              background: '#E8E8E8',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '75%',
                background: 'linear-gradient(90deg, #E3001B, #FF4D4D)',
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      <StripeRule />

      {/* Interests section */}
      <div style={{ padding: '20px 20px 0' }}>
        <SectionLabel>Mes intérêts</SectionLabel>
        <p className="le-caption" style={{ marginTop: 6, marginBottom: 14 }}>
          Sélectionnez vos domaines pour des recommandations personnalisées
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DOMAINS.map((domain) => {
            const active = interests.has(domain.id);
            return (
              <button
                key={domain.id}
                onClick={() => toggleInterest(domain.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 24,
                  border: `1.5px solid ${active ? '#E3001B' : '#E8E8E8'}`,
                  background: active ? '#FDEAEA' : '#fff',
                  color: active ? '#E3001B' : '#3D3D3D',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{domain.emoji}</span>
                {domain.label}
              </button>
            );
          })}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          style={{ marginTop: 16 }}
        >
          {saved ? '✓ Sauvegardé !' : 'Enregistrer mes intérêts'}
        </Button>
      </div>

      {/* Fair history */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionLabel>Mes salons</SectionLabel>
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            paddingLeft: 8,
          }}
        >
          {FAIR_HISTORY.map((fair, index) => (
            <div key={fair.id} className="timeline-item" style={{ paddingBottom: index < FAIR_HISTORY.length - 1 ? 20 : 0 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  paddingLeft: 8,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: index === 0 ? '#FDEAEA' : '#E6ECF8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {fair.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px', color: '#1A1A1A' }}>
                    {fair.name}
                  </p>
                  <p className="le-caption" style={{ margin: '0 0 4px' }}>
                    {fair.date}
                  </p>
                  {fair.stands !== null ? (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#16A34A',
                        fontWeight: 600,
                        background: 'rgba(22,163,74,0.1)',
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}
                    >
                      {fair.stands} stands visités
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#003C8F',
                        fontWeight: 600,
                        background: '#E6ECF8',
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}
                    >
                      Inscrit(e)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data & Privacy */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionLabel>Données & Confidentialité</SectionLabel>

        <div
          className="le-card"
          style={{
            marginTop: 14,
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {(
            [
              { key: 'letudiant', label: 'Communications L\'Étudiant', description: 'Newsletters, offres et actualités' },
              { key: 'partners', label: 'Offres partenaires', description: 'Propositions d\'écoles et d\'entreprises partenaires' },
              { key: 'whatsapp', label: 'WhatsApp / SMS', description: 'Notifications par messagerie instantanée' },
            ] as { key: keyof ConsentState; label: string; description: string }[]
          ).map(({ key, label, description }, i, arr) => (
            <div
              key={key}
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                borderBottom: i < arr.length - 1 ? '1px solid #E8E8E8' : 'none',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px', color: '#1A1A1A' }}>
                  {label}
                </p>
                <p className="le-caption" style={{ margin: 0 }}>{description}</p>
              </div>
              {/* Toggle */}
              <button
                role="switch"
                aria-checked={consents[key]}
                onClick={() => toggleConsent(key)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: consents[key] ? '#E3001B' : '#E8E8E8',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: consents[key] ? 'flex-end' : 'flex-start',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    display: 'block',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <Button
            variant="ghost"
            size="sm"
            style={{ color: '#E3001B', borderColor: '#FDEAEA' }}
          >
            Supprimer mon compte
          </Button>
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '24px 20px' }}>
        <Button
          variant="secondary"
          style={{ justifyContent: 'center', width: '100%' }}
        >
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}
