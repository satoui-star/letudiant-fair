'use client';

import { useState } from 'react';
import { use } from 'react';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';
import StripeRule from '@/components/ui/StripeRule';

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  duration: string;
  available: boolean;
  booked?: boolean;
}

const MOCK_SCHOOL = {
  id: 'hec',
  name: 'HEC Paris',
  fullName: 'HEC Paris — École des Hautes Études Commerciales',
  type: 'Grande École',
  typeVariant: 'red' as const,
  city: 'Jouy-en-Josas',
  description:
    'HEC Paris est l\'une des grandes écoles de commerce les plus renommées au monde. Fondée en 1881, elle forme des leaders dans les domaines du management, de la finance, du marketing et de l\'entrepreneuriat.',
  programmes: [
    { name: 'Grande École (Master)', tag: 'red' as const },
    { name: 'MBA', tag: 'blue' as const },
    { name: 'Executive MBA', tag: 'yellow' as const },
    { name: 'PhD', tag: 'gray' as const },
    { name: 'Mastères Spécialisés', tag: 'gray' as const },
  ],
  stats: [
    { label: 'Taux d\'admission', value: '5%', icon: '🎯' },
    { label: 'Étudiants', value: '4 500', icon: '🎓' },
    { label: 'Nationalités', value: '90', icon: '🌍' },
    { label: 'Alumni', value: '62 000', icon: '🤝' },
  ],
  gradient: 'linear-gradient(135deg, #E3001B 0%, #B0001A 60%, #7A0010 100%)',
};

const APPOINTMENT_SLOTS: TimeSlot[] = [
  { id: 'slot1', date: '15 avril 2026', time: '10h00', duration: '30 min', available: true },
  { id: 'slot2', date: '15 avril 2026', time: '11h30', duration: '30 min', available: true },
  { id: 'slot3', date: '15 avril 2026', time: '14h00', duration: '30 min', available: false },
];

export default function SchoolDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId: _schoolId } = use(params);
  const school = MOCK_SCHOOL;
  const [interested, setInterested] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);

  const handleBookSlot = (slotId: string) => {
    setBookedSlot(bookedSlot === slotId ? null : slotId);
  };

  return (
    <div className="page-with-nav" style={{ background: '#F4F4F4', minHeight: '100vh' }}>
      {/* Back button */}
      <div style={{ background: '#fff', padding: '16px 20px 0' }}>
        <a
          href="/schools"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#6B6B6B',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          ← Retour aux écoles
        </a>
      </div>

      {/* Cover image / Hero */}
      <div
        style={{
          height: 200,
          background: school.gradient,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '20px',
          overflow: 'hidden',
        }}
      >
        {/* Decorative pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.07,
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #fff 0px,
              #fff 1px,
              transparent 1px,
              transparent 20px
            )`,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 10,
            }}
          >
            🏛️
          </div>
          <h1
            style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: 22,
              margin: '0 0 6px',
              lineHeight: 1.2,
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {school.name}
          </h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Tag variant={school.typeVariant}>{school.type}</Tag>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
              📍 {school.city}
            </span>
          </div>
        </div>
      </div>

      <StripeRule />

      {/* Video reel section */}
      <div style={{ padding: '20px 20px 0' }}>
        <SectionLabel>Vidéo de présentation</SectionLabel>
        <div
          style={{
            marginTop: 12,
            borderRadius: 12,
            overflow: 'hidden',
            background: '#1A1A1A',
            height: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          {/* Thumbnail gradient */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(227,0,27,0.4) 0%, rgba(0,60,143,0.4) 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: 56,
              height: 56,
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ fontSize: 24, marginLeft: 4 }}>▶</span>
          </div>
          <p
            style={{
              position: 'relative',
              zIndex: 1,
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              margin: 0,
              textAlign: 'center',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            Découvrez notre école en 30 secondes
          </p>
          <Tag variant="gray" style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
            0:30
          </Tag>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '20px 20px 0' }}>
        <SectionLabel>À propos</SectionLabel>
        <p className="le-body" style={{ marginTop: 12 }}>
          {school.description}
        </p>
      </div>

      {/* Programmes */}
      <div style={{ padding: '20px 20px 0' }}>
        <SectionLabel>Programmes</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {school.programmes.map((prog) => (
            <Tag key={prog.name} variant={prog.tag}>
              {prog.name}
            </Tag>
          ))}
        </div>
      </div>

      {/* Key stats */}
      <div style={{ padding: '20px 20px 0' }}>
        <SectionLabel>Chiffres clés</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginTop: 12,
          }}
        >
          {school.stats.map((stat) => (
            <div key={stat.label} className="kpi-card">
              <span style={{ fontSize: 20 }}>{stat.icon}</span>
              <span className="kpi-value">{stat.value}</span>
              <span className="kpi-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Appointment slots */}
      <div id="rdv" style={{ padding: '20px 20px 0' }}>
        <SectionLabel>Prendre rendez-vous au salon</SectionLabel>
        <p className="le-caption" style={{ marginTop: 6, marginBottom: 12 }}>
          Réservez un créneau de 30 min avec un conseiller HEC Paris
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {APPOINTMENT_SLOTS.map((slot) => (
            <div
              key={slot.id}
              className="le-card"
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                opacity: slot.available ? 1 : 0.5,
                borderColor: bookedSlot === slot.id ? '#E3001B' : undefined,
                borderWidth: bookedSlot === slot.id ? '2px' : undefined,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: bookedSlot === slot.id ? '#E3001B' : '#F4F4F4',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: bookedSlot === slot.id ? '#fff' : '#E3001B',
                    }}
                  >
                    {slot.time}
                  </span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px', color: '#1A1A1A' }}>
                    {slot.date}
                  </p>
                  <p className="le-caption" style={{ margin: 0 }}>Durée : {slot.duration}</p>
                </div>
              </div>
              {slot.available ? (
                <Button
                  variant={bookedSlot === slot.id ? 'ghost' : 'secondary'}
                  size="sm"
                  onClick={() => handleBookSlot(slot.id)}
                >
                  {bookedSlot === slot.id ? '✓ Réservé' : 'Réserver'}
                </Button>
              ) : (
                <Tag variant="gray">Complet</Tag>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Button
          variant={interested ? 'ghost' : 'primary'}
          onClick={() => setInterested(!interested)}
          style={{ justifyContent: 'center' }}
        >
          {interested ? '✓ Intérêt manifesté' : 'Je suis intéressé(e)'}
        </Button>
        {bookedSlot && (
          <div
            style={{
              background: '#FDEAEA',
              border: '1px solid #E3001B',
              borderRadius: 8,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>✅</span>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#B0001A' }}>
              Rendez-vous confirmé ! Vous recevrez une confirmation par email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
