'use client';

import Logo from '@/components/ui/Logo';
import OrientationBadge from '@/components/ui/OrientationBadge';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';

const UPCOMING_FAIRS = [
  { id: 'fair-paris-2026', city: 'Paris', date: '15 avril 2026', venue: 'Palais des Congrès', tag: 'red' as const },
  { id: 'fair-lyon-2026', city: 'Lyon', date: '22 avril 2026', venue: 'Cité Internationale', tag: 'blue' as const },
  { id: 'fair-bordeaux-2026', city: 'Bordeaux', date: '3 mai 2026', venue: 'Parc des Expositions', tag: 'yellow' as const },
];

const SAVED_SCHOOLS = [
  { id: 'hec', name: 'HEC Paris', type: 'Grande École', city: 'Jouy-en-Josas', tag: 'red' as const },
  { id: 'sciencespo', name: 'Sciences Po', type: 'Grande École', city: 'Paris', tag: 'blue' as const },
  { id: 'insa', name: 'INSA Lyon', type: 'École d\'ingénieurs', city: 'Lyon', tag: 'yellow' as const },
];

export default function HomePage() {
  return (
    <div className="page-with-nav" style={{ background: '#F4F4F4', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          background: '#fff',
          padding: '20px 20px 16px',
          borderBottom: '1px solid #E8E8E8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Logo variant="default" size="sm" />
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#E3001B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            EA
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className="le-caption" style={{ marginBottom: 2 }}>Bonjour,</p>
            <p className="le-h3" style={{ margin: 0 }}>Emma Aubert 👋</p>
          </div>
          <OrientationBadge score={45} />
        </div>
      </div>

      {/* Prochains Salons */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionLabel>Prochains salons</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {UPCOMING_FAIRS.map((fair) => (
            <div
              key={fair.id}
              className="le-card"
              style={{ display: 'flex', alignItems: 'center', padding: '16px', gap: 14 }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 10,
                  background: fair.tag === 'red' ? '#FDEAEA' : fair.tag === 'blue' ? '#E6ECF8' : '#FFFBE6',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: fair.tag === 'red' ? '#E3001B' : fair.tag === 'blue' ? '#003C8F' : '#7A6200',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {fair.date.split(' ')[1].toUpperCase().slice(0, 3)}
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: fair.tag === 'red' ? '#E3001B' : fair.tag === 'blue' ? '#003C8F' : '#7A6200',
                  }}
                >
                  {fair.date.split(' ')[0]}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 2px', color: '#1A1A1A' }}>
                  Salon de {fair.city}
                </p>
                <p className="le-caption" style={{ margin: '0 0 6px' }}>
                  {fair.venue}
                </p>
                <Tag variant={fair.tag}>{fair.date}</Tag>
              </div>
              <Button
                variant="primary"
                size="sm"
                href={`/fair/${fair.id}`}
                style={{ flexShrink: 0, fontSize: 13 }}
              >
                S&apos;inscrire
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Écoles sauvegardées */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionLabel>Écoles sauvegardées</SectionLabel>
          <a href="/schools" style={{ fontSize: 13, color: '#E3001B', fontWeight: 600, textDecoration: 'none' }}>
            Voir tout →
          </a>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }} className="no-scrollbar">
          {SAVED_SCHOOLS.map((school) => (
            <a
              key={school.id}
              href={`/schools/${school.id}`}
              style={{ textDecoration: 'none', flexShrink: 0, width: 160 }}
            >
              <div className="le-card" style={{ padding: '16px 14px' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 8,
                    background:
                      school.tag === 'red'
                        ? 'linear-gradient(135deg, #E3001B, #B0001A)'
                        : school.tag === 'blue'
                        ? 'linear-gradient(135deg, #003C8F, #0052CC)'
                        : 'linear-gradient(135deg, #FFD100, #E6A800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    marginBottom: 10,
                  }}
                >
                  {school.name[0]}
                </div>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 4px', color: '#1A1A1A' }}>
                  {school.name}
                </p>
                <p className="le-caption" style={{ margin: '0 0 8px' }}>
                  {school.city}
                </p>
                <Tag variant={school.tag}>{school.type}</Tag>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Mes actions rapides */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionLabel>Mes actions rapides</SectionLabel>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', marginTop: 16 }} className="no-scrollbar">
          <a
            href="/saved"
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            <div
              style={{
                background: '#F4F4F4',
                borderRadius: 12,
                padding: '18px 20px',
                minWidth: 130,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 26 }}>📁</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Mon dossier</p>
            </div>
          </a>
          <a
            href="/compare"
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            <div
              style={{
                background: '#E6ECF8',
                borderRadius: 12,
                padding: '18px 20px',
                minWidth: 130,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 26 }}>⚖️</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#003C8F', margin: 0 }}>Comparer</p>
            </div>
          </a>
          <a
            href="/recap/fair-paris-2026"
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            <div
              style={{
                background: '#FDEAEA',
                borderRadius: 12,
                padding: '18px 20px',
                minWidth: 130,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 26 }}>📋</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#E3001B', margin: 0 }}>Récapitulatif</p>
            </div>
          </a>
        </div>
      </div>

      {/* Article teaser */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionLabel>À lire</SectionLabel>
        <a
          href="#"
          style={{ textDecoration: 'none', display: 'block', marginTop: 16 }}
        >
          <div
            className="le-card"
            style={{
              padding: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                height: 140,
                background: 'linear-gradient(135deg, #E3001B 0%, #003C8F 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '16px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
              />
              <Tag variant="red" style={{ position: 'relative', zIndex: 1 }}>Guide orientation</Tag>
            </div>
            <div style={{ padding: '16px' }}>
              <p className="le-h3" style={{ margin: '0 0 6px', color: '#1A1A1A' }}>
                Choisir son école après le bac : le guide complet 2026
              </p>
              <p className="le-body" style={{ margin: '0 0 12px', fontSize: 13 }}>
                BTS, IUT, Licence, Grandes Écoles... comment s&apos;y retrouver dans l&apos;offre de formation ?
              </p>
              <span style={{ fontSize: 13, color: '#E3001B', fontWeight: 600 }}>
                Lire l&apos;article →
              </span>
            </div>
          </div>
        </a>
      </div>
      {/* Prochain salon countdown card */}
      <div style={{ padding: '24px 20px 32px' }}>
        <div
          className="le-card"
          style={{
            background: 'linear-gradient(135deg, #003C8F 0%, #001F5C 100%)',
            padding: '20px',
            border: 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                }}
              >
                Prochain salon
              </p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
                Salon de Paris
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#FFD100', margin: 0, lineHeight: 1 }}>9</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>jours</p>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '70%', background: '#FFD100', borderRadius: 3 }} />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
              15 avril 2026 — Palais des Congrès, Paris
            </p>
          </div>
          <a
            href="/fair/fair-paris-2026"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#FFD100',
              color: '#1A1A1A',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Voir le programme →
          </a>
        </div>
      </div>
    </div>
  );
}
