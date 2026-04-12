'use client'
export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import StripeRule from '@/components/ui/StripeRule'
import Logo from '@/components/ui/Logo'

const TIPS = [
  {
    phase: 'Avant le salon',
    color: '#003C8F',
    items: [
      'Encouragez votre enfant a creer son profil sur l app avant le salon',
      'Discutez ensemble des domaines qui l interessent sans imposer vos preferences',
      'Consultez ensemble les etablissements presents via l app',
      'Laissez votre enfant preparer ses questions pour les exposants',
    ],
  },
  {
    phase: 'Pendant le salon',
    color: '#E3001B',
    items: [
      'Laissez votre enfant scanner lui meme son QR a l entree',
      'Privilegiez les stands qui correspondent aux interets declares',
      'Encouragez votre enfant a poser ses propres questions aux conseillers',
      'Le RDV avec un exposant est possible uniquement apres le scan d entree',
    ],
  },
  {
    phase: 'Apres le salon',
    color: '#1A1A1A',
    items: [
      'Consultez ensemble les etablissements sauvegardes dans son profil',
      'Discutez du score d orientation obtenu : qu est-ce que cela revele ?',
      'Privilegiez les voeux qui combinent interet, niveau et projet professionnel',
      'Contactez un conseiller d orientation si le projet reste flou',
    ],
  },
]

export default function ParentOrientationPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StripeRule />
      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-le-gray-500 text-sm hover:text-le-gray-900">
            Retour
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>

        <h1 className="text-2xl font-bold text-le-gray-900 mb-1">Guide orientation</h1>
        <p className="text-sm text-le-gray-500 mb-8">
          Comment accompagner votre enfant a chaque etape
        </p>

        <div className="space-y-5">
          {TIPS.map(section => (
            <div key={section.phase} className="bg-white border border-le-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3" style={{ backgroundColor: section.color }}>
                <h2 className="text-white font-bold text-sm">{section.phase}</h2>
              </div>
              <div className="p-5 space-y-3">
                {section.items.map((tip, i) => (
                  <div key={i} className="flex gap-3 text-sm text-le-gray-700">
                    <span className="text-le-red font-bold mt-0.5">*</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-le-yellow-light border border-le-yellow rounded-xl p-4 text-sm text-le-gray-700">
            <span className="font-semibold">Bon a savoir :</span>{' '}
            les donnees comportementales de votre enfant (stands visites, temps par zone) sont
            strictement confidentielles. Seuls les elements qu il a choisi de partager avec vous sont visibles ici.
          </div>

          <a
            href="/parent/home"
            className="block w-full text-center py-3 rounded-xl font-semibold text-sm border border-le-gray-200 text-le-gray-700"
          >
            Retour au profil
          </a>
        </div>
      </div>
    </div>
  )
}
