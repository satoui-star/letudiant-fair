import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

const SALON_DATA = [
  {
    name: 'Salon Étudiant Paris 2026',
    city: 'Paris',
    venue: 'Palais Omni Sports de Paris-Bercy',
    address: '8 Boulevard de Bercy, 75012 Paris',
    event_date: '2026-03-15',
    description: 'Le plus grand salon des formations en Île-de-France',
    is_active: true,
  },
  {
    name: 'Forum Études Toulouse',
    city: 'Toulouse',
    venue: 'Parc des Expositions Hall 2',
    address: 'Avenue de Grande-Bretagne, 31300 Toulouse',
    event_date: '2026-03-22',
    description: 'Découvrez les meilleures formations du sud-ouest',
    is_active: true,
  },
  {
    name: 'Salon Education Lyon',
    city: 'Lyon',
    venue: 'Cité Internationale de la Confluence',
    address: '81 Quai Saint-Antoine, 69002 Lyon',
    event_date: '2026-03-29',
    description: 'Rencontrez 150+ écoles et universités',
    is_active: true,
  },
  {
    name: 'Études Marseille 2026',
    city: 'Marseille',
    venue: 'Palais des Congrès et des Expositions',
    address: 'Rue Neuve, 13008 Marseille',
    event_date: '2026-04-05',
    description: 'Les formations les plus demandées en méditerranée',
    is_active: true,
  },
  {
    name: 'Salon Orientation Lille',
    city: 'Lille',
    venue: 'Parc Expo de Lille',
    address: '1 Boulevard de l\'Université, 59650 Villeneuve-d\'Ascq',
    event_date: '2026-04-12',
    description: 'Explorez vos possibilités d\'études',
    is_active: true,
  },
  {
    name: 'Forum Carrières Bordeaux',
    city: 'Bordeaux',
    venue: 'Palais Beaumont',
    address: 'Allée de Sermet, 33000 Bordeaux',
    event_date: '2026-04-19',
    description: 'Métiers et formations de demain',
    is_active: true,
  },
  {
    name: 'Salon Etudes Strasbourg',
    city: 'Strasbourg',
    venue: 'Wacken Centre',
    address: '5 Avenue de la Marne, 67000 Strasbourg',
    event_date: '2026-04-26',
    description: 'Explorez les écoles d\'Alsace et du Grand Est',
    is_active: true,
  },
  {
    name: 'Salon Education Nantes',
    city: 'Nantes',
    venue: 'Cité des Congrès',
    address: '5 Rue de Valmy, 44000 Nantes',
    event_date: '2026-05-03',
    description: 'Formations professionnelles et académiques',
    is_active: true,
  },
  {
    name: 'Forum Orientation Montpellier',
    city: 'Montpellier',
    venue: 'Parc Expo de Montpellier',
    address: '2870 Avenue Pierre Mendès France, 34000 Montpellier',
    event_date: '2026-05-10',
    description: 'Découvrez les écoles du sud',
    is_active: true,
  },
  {
    name: 'Salon Formations Nice',
    city: 'Nice',
    venue: 'Acropolis Nice',
    address: '1 Esplanade Kennedy, 06000 Nice',
    event_date: '2026-05-17',
    description: 'Les meilleures formations de la côte d\'azur',
    is_active: true,
  },
]

const SCHOOL_DATA = [
  {
    name: 'HEC Paris',
    type: 'Grande École',
    city: 'Jouy-en-Josas',
    website: 'https://www.hec.edu',
    description: 'École de commerce de renommée internationale, partenaire de l\'université Paris-Saclay',
    target_levels: ['Bac+2', 'Bac+3'],
    target_fields: ['Commerce', 'Gestion', 'Finance'],
    nb_accepted_bac_g: 200,
    nb_accepted_bac_t: 50,
    nb_accepted_bac_p: 10,
    rate_professional_insertion: 95,
    tuition_fee: 15000,
    apprenticeship: true,
    parcoursup: true,
    scholarship_allowed: true,
  },
  {
    name: 'Polytechnique',
    type: 'Grande École',
    city: 'Palaiseau',
    website: 'https://www.polytechnique.edu',
    description: 'L\'une des meilleures écoles d\'ingénieurs françaises',
    target_levels: ['Bac', 'Bac+1'],
    target_fields: ['Sciences', 'Ingénierie', 'Technologie'],
    nb_accepted_bac_g: 150,
    nb_accepted_bac_t: 40,
    nb_accepted_bac_p: 5,
    rate_professional_insertion: 98,
    tuition_fee: 20000,
    apprenticeship: false,
    parcoursup: true,
    scholarship_allowed: true,
  },
  {
    name: 'ESSEC Business School',
    type: 'Grande École',
    city: 'Cergy',
    website: 'https://www.essec.edu',
    description: 'Grande école de commerce avec accréditation triple couronne',
    target_levels: ['Bac+2', 'Bac+3'],
    target_fields: ['Commerce', 'Management', 'Finance'],
    nb_accepted_bac_g: 180,
    nb_accepted_bac_t: 45,
    nb_accepted_bac_p: 8,
    rate_professional_insertion: 94,
    tuition_fee: 14000,
    apprenticeship: true,
    parcoursup: true,
    scholarship_allowed: true,
  },
  {
    name: 'Université Paris Cité',
    type: 'Université',
    city: 'Paris',
    website: 'https://u-paris.fr',
    description: 'Grande université parisienne avec offre complète de formations',
    target_levels: ['Bac', 'Bac+1', 'Bac+2', 'Bac+3'],
    target_fields: ['Sciences', 'Lettres', 'Médecine', 'Droit'],
    nb_accepted_bac_g: 1000,
    nb_accepted_bac_t: 300,
    nb_accepted_bac_p: 50,
    rate_professional_insertion: 85,
    tuition_fee: 200,
    apprenticeship: true,
    parcoursup: true,
    scholarship_allowed: true,
  },
  {
    name: 'Institut Mines-Télécom',
    type: 'Grande École',
    city: 'Évry',
    website: 'https://www.imt.fr',
    description: 'Groupe d\'écoles d\'ingénieurs spécialisé en ingénierie et télécom',
    target_levels: ['Bac', 'Bac+1', 'Bac+2'],
    target_fields: ['Ingénierie', 'Numérique', 'Télécommunications'],
    nb_accepted_bac_g: 250,
    nb_accepted_bac_t: 100,
    nb_accepted_bac_p: 20,
    rate_professional_insertion: 96,
    tuition_fee: 10000,
    apprenticeship: true,
    parcoursup: true,
    scholarship_allowed: true,
  },
  {
    name: 'EMLYON Business School',
    type: 'Grande École',
    city: 'Écully',
    website: 'https://www.em-lyon.com',
    description: 'Prestigieuse école de commerce française avec influence internationale',
    target_levels: ['Bac+2', 'Bac+3'],
    target_fields: ['Commerce', 'Entrepreneuriat', 'Management'],
    nb_accepted_bac_g: 220,
    nb_accepted_bac_t: 60,
    nb_accepted_bac_p: 15,
    rate_professional_insertion: 93,
    tuition_fee: 13000,
    apprenticeship: true,
    parcoursup: true,
    scholarship_allowed: true,
  },
  {
    name: 'Université Toulouse III',
    type: 'Université',
    city: 'Toulouse',
    website: 'https://www.univ-tlse3.fr',
    description: 'Université scientifique avec excellence en recherche',
    target_levels: ['Bac', 'Bac+1', 'Bac+2', 'Bac+3'],
    target_fields: ['Sciences', 'Ingénierie', 'Informatique'],
    nb_accepted_bac_g: 800,
    nb_accepted_bac_t: 400,
    nb_accepted_bac_p: 100,
    rate_professional_insertion: 87,
    tuition_fee: 200,
    apprenticeship: true,
    parcoursup: true,
    scholarship_allowed: true,
  },
  {
    name: 'INSA Lyon',
    type: 'Grande École',
    city: 'Villeurbanne',
    website: 'https://www.insa-lyon.fr',
    description: 'Institut national des sciences appliquées reconnu pour son excellence',
    target_levels: ['Bac', 'Bac+1'],
    target_fields: ['Ingénierie', 'Génie Civil', 'Informatique'],
    nb_accepted_bac_g: 300,
    nb_accepted_bac_t: 150,
    nb_accepted_bac_p: 30,
    rate_professional_insertion: 97,
    tuition_fee: 9000,
    apprenticeship: true,
    parcoursup: true,
    scholarship_allowed: true,
  },
  {
    name: 'Audencia Business School',
    type: 'Grande École',
    city: 'Nantes',
    website: 'https://www.audencia.com',
    description: 'École de commerce avec excellente réputation en France',
    target_levels: ['Bac+2', 'Bac+3'],
    target_fields: ['Commerce', 'Management', 'Finance'],
    nb_accepted_bac_g: 150,
    nb_accepted_bac_t: 40,
    nb_accepted_bac_p: 10,
    rate_professional_insertion: 92,
    tuition_fee: 12000,
    apprenticeship: true,
    parcoursup: true,
    scholarship_allowed: true,
  },
  {
    name: 'Université Claude Bernard Lyon 1',
    type: 'Université',
    city: 'Lyon',
    website: 'https://www.univ-lyon1.fr',
    description: 'Université de sciences et technologie de premier plan',
    target_levels: ['Bac', 'Bac+1', 'Bac+2', 'Bac+3'],
    target_fields: ['Sciences', 'Santé', 'Technologie'],
    nb_accepted_bac_g: 900,
    nb_accepted_bac_t: 500,
    nb_accepted_bac_p: 150,
    rate_professional_insertion: 88,
    tuition_fee: 200,
    apprenticeship: true,
    parcoursup: true,
    scholarship_allowed: true,
  },
]

const PROGRAM_TEMPLATES = [
  {
    title: 'Présentation de l\'école',
    description: 'Découvrez notre histoire, nos valeurs et notre vision pour l\'avenir',
    speaker: 'Directeur de l\'école',
    location: 'Salle Principale',
    duration_minutes: 30,
  },
  {
    title: 'Les formations proposées',
    description: 'Tour d\'horizon complet de nos programmes d\'études',
    speaker: 'Responsable Pédagogique',
    location: 'Auditorium',
    duration_minutes: 45,
  },
  {
    title: 'Parcours en Apprentissage',
    description: 'Découvrez notre offre de formations en alternance',
    speaker: 'Manager Apprentissage',
    location: 'Salle B',
    duration_minutes: 30,
  },
  {
    title: 'Insertion Professionnelle',
    description: 'Comment nos étudiants trouvent leur premier emploi',
    speaker: 'Responsable Carrières',
    location: 'Salle C',
    duration_minutes: 25,
  },
  {
    title: 'International & Mobilité',
    description: 'Nos partenaires et opportunités d\'études à l\'étranger',
    speaker: 'Coordinateur International',
    location: 'Salle D',
    duration_minutes: 35,
  },
  {
    title: 'Bourses & Financements',
    description: 'Les aides financières disponibles pour vos études',
    speaker: 'Service Financements',
    location: 'Salle E',
    duration_minutes: 30,
  },
  {
    title: 'Réunion d\'information',
    description: 'Échanges libres avec les responsables pédagogiques',
    speaker: 'Équipe pédagogique',
    location: 'Stand',
    duration_minutes: 60,
  },
  {
    title: 'Témoignages d\'étudiants',
    description: 'Nos étudiants partagent leur expérience',
    speaker: 'Étudiants actuels',
    location: 'Salle F',
    duration_minutes: 45,
  },
]

async function seedData() {
  try {
    const db = svc()

    // Get existing salons
    const { data: existingSalons } = await db.from('events').select('id')
    const existingSalonIds = (existingSalons || []).map(s => s.id)

    // Get existing schools
    const { data: existingSchools } = await db.from('schools').select('id')
    const existingSchoolIds = (existingSchools || []).map(s => s.id)

    let salonsCreated = 0
    let schoolsCreated = 0
    let programsCreated = 0
    let exhibitorsCreated = 0

    // Create new salons
    const { data: newSalons, error: salonError } = await db
      .from('events')
      .insert(
        SALON_DATA.map(s => ({
          ...s,
          is_virtual: false,
        }))
      )
      .select('id')

    if (salonError) throw salonError
    salonsCreated = newSalons?.length || 0
    const allSalonIds = [...existingSalonIds, ...(newSalons?.map(s => s.id) || [])]

    // Create new schools
    const { data: newSchools, error: schoolError } = await db
      .from('schools')
      .insert(
        SCHOOL_DATA.map(s => ({
          ...s,
          education_branches: s.target_fields,
        }))
      )
      .select('id')

    if (schoolError) throw schoolError
    schoolsCreated = newSchools?.length || 0
    const allSchoolIds = [...existingSchoolIds, ...(newSchools?.map(s => s.id) || [])]

    // Create programs for all salons
    const programsToCreate: any[] = []
    const baseTime = new Date('2026-03-15T09:00:00').getTime()

    for (const salonId of allSalonIds) {
      let timeOffset = 0
      for (let i = 0; i < 8; i++) {
        const template = PROGRAM_TEMPLATES[i]
        const startTime = new Date(baseTime + timeOffset)
        const endTime = new Date(startTime.getTime() + template.duration_minutes * 60000)

        programsToCreate.push({
          event_id: salonId,
          title: template.title,
          description: template.description,
          speaker: template.speaker,
          location: template.location,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        })

        timeOffset += (template.duration_minutes + 15) * 60000 // Add 15 min break
      }
    }

    if (programsToCreate.length > 0) {
      const { error: programError } = await db.from('event_programs').insert(programsToCreate)
      if (programError) throw programError
      programsCreated = programsToCreate.length
    }

    // Link schools to salons as exhibitors
    const exhibitorsToCreate: any[] = []
    for (const salonId of allSalonIds) {
      // Add 5-8 random schools to each salon
      const schoolCount = 5 + Math.floor(Math.random() * 4)
      const shuffledSchools = allSchoolIds.sort(() => Math.random() - 0.5).slice(0, schoolCount)

      for (const schoolId of shuffledSchools) {
        exhibitorsToCreate.push({
          event_id: salonId,
          school_id: schoolId,
        })
      }
    }

    if (exhibitorsToCreate.length > 0) {
      const { error: exhibitorError } = await db
        .from('event_exhibitors')
        .insert(exhibitorsToCreate)
        .select()

      if (exhibitorError && exhibitorError.message.includes('duplicate key')) {
        // Ignore duplicate errors
        exhibitorsCreated = exhibitorsToCreate.length
      } else if (exhibitorError) {
        throw exhibitorError
      } else {
        exhibitorsCreated = exhibitorsToCreate.length
      }
    }

    return {
      success: true,
      message: 'Demo data seeded successfully',
      stats: {
        salons_created: salonsCreated,
        schools_created: schoolsCreated,
        programs_created: programsCreated,
        exhibitor_links_created: exhibitorsCreated,
        total_salons: allSalonIds.length,
        total_schools: allSchoolIds.length,
      },
    }
  } catch (err: unknown) {
    throw err
  }
}

export async function GET(request: Request) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const result = await seedData()
    return NextResponse.json(result, { status: 200 })
  } catch (err: unknown) {
    console.error('[GET /api/admin/seed-demo]', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Server error',
        details: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const result = await seedData()
    return NextResponse.json(result, { status: 200 })
  } catch (err: unknown) {
    console.error('[POST /api/admin/seed-demo]', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Server error',
        details: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    )
  }
}
