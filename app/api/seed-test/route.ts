import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Create 10 salons
    const salons = [
      { name: 'Salon Étudiant Paris 2026', city: 'Paris', venue: 'Palais Omni Sports', address: '8 Boulevard de Bercy, 75012 Paris', event_date: '2026-03-15', description: 'Le plus grand salon des formations', is_virtual: false, is_active: true },
      { name: 'Forum Études Toulouse', city: 'Toulouse', venue: 'Parc des Expositions', address: 'Avenue de Grande-Bretagne, 31300 Toulouse', event_date: '2026-03-22', description: 'Salon sud-ouest', is_virtual: false, is_active: true },
      { name: 'Salon Education Lyon', city: 'Lyon', venue: 'Cité Confluence', address: '81 Quai Saint-Antoine, 69002 Lyon', event_date: '2026-03-29', description: 'Salon rhône-alpes', is_virtual: false, is_active: true },
      { name: 'Études Marseille 2026', city: 'Marseille', venue: 'Palais Congrès', address: 'Rue Neuve, 13008 Marseille', event_date: '2026-04-05', description: 'Salon méditerranée', is_virtual: false, is_active: true },
      { name: 'Salon Orientation Lille', city: 'Lille', venue: 'Parc Expo', address: '1 Boulevard Université, 59650 Villeneuve', event_date: '2026-04-12', description: 'Salon nord', is_virtual: false, is_active: true },
      { name: 'Forum Carrières Bordeaux', city: 'Bordeaux', venue: 'Palais Beaumont', address: 'Allée Sermet, 33000 Bordeaux', event_date: '2026-04-19', description: 'Salon aquitaine', is_virtual: false, is_active: true },
      { name: 'Salon Etudes Strasbourg', city: 'Strasbourg', venue: 'Wacken Centre', address: '5 Avenue Marne, 67000 Strasbourg', event_date: '2026-04-26', description: 'Salon alsace', is_virtual: false, is_active: true },
      { name: 'Salon Education Nantes', city: 'Nantes', venue: 'Cité Congrès', address: '5 Rue Valmy, 44000 Nantes', event_date: '2026-05-03', description: 'Salon ouest', is_virtual: false, is_active: true },
      { name: 'Forum Orientation Montpellier', city: 'Montpellier', venue: 'Parc Expo', address: '2870 Avenue Mendès, 34000 Montpellier', event_date: '2026-05-10', description: 'Salon languedoc', is_virtual: false, is_active: true },
      { name: 'Salon Formations Nice', city: 'Nice', venue: 'Acropolis', address: '1 Esplanade Kennedy, 06000 Nice', event_date: '2026-05-17', description: 'Salon azur', is_virtual: false, is_active: true },
    ]

    const { data: newSalons, error: salonErr } = await db.from('events').insert(salons).select('id')
    if (salonErr) throw salonErr
    const salonIds = newSalons?.map((s: any) => s.id) || []

    // Create 10 schools
    const schools = [
      { name: 'HEC Paris', type: 'Grande École', city: 'Jouy-en-Josas', website: 'https://www.hec.edu', description: 'École de commerce mondiale', education_branches: ['Commerce'], target_levels: ['Bac+2', 'Bac+3'], target_fields: ['Commerce', 'Finance'], nb_accepted_bac_g: 200, nb_accepted_bac_t: 50, nb_accepted_bac_p: 10, rate_professional_insertion: 95, tuition_fee: 15000, apprenticeship: true, parcoursup: true, scholarship_allowed: true },
      { name: 'Polytechnique', type: 'Grande École', city: 'Palaiseau', website: 'https://www.polytechnique.edu', description: 'Meilleure école ingénieurs', education_branches: ['Sciences'], target_levels: ['Bac', 'Bac+1'], target_fields: ['Sciences', 'Ingénierie'], nb_accepted_bac_g: 150, nb_accepted_bac_t: 40, nb_accepted_bac_p: 5, rate_professional_insertion: 98, tuition_fee: 20000, apprenticeship: false, parcoursup: true, scholarship_allowed: true },
      { name: 'ESSEC Business School', type: 'Grande École', city: 'Cergy', website: 'https://www.essec.edu', description: 'Grande école commerce', education_branches: ['Commerce'], target_levels: ['Bac+2', 'Bac+3'], target_fields: ['Commerce', 'Management'], nb_accepted_bac_g: 180, nb_accepted_bac_t: 45, nb_accepted_bac_p: 8, rate_professional_insertion: 94, tuition_fee: 14000, apprenticeship: true, parcoursup: true, scholarship_allowed: true },
      { name: 'Université Paris Cité', type: 'Université', city: 'Paris', website: 'https://u-paris.fr', description: 'Université parisienne', education_branches: ['Sciences'], target_levels: ['Bac', 'Bac+1', 'Bac+2', 'Bac+3'], target_fields: ['Sciences', 'Lettres', 'Médecine'], nb_accepted_bac_g: 1000, nb_accepted_bac_t: 300, nb_accepted_bac_p: 50, rate_professional_insertion: 85, tuition_fee: 200, apprenticeship: true, parcoursup: true, scholarship_allowed: true },
      { name: 'Institut Mines-Télécom', type: 'Grande École', city: 'Évry', website: 'https://www.imt.fr', description: 'École ingénieurs télécom', education_branches: ['Ingénierie'], target_levels: ['Bac', 'Bac+1', 'Bac+2'], target_fields: ['Ingénierie', 'Numérique'], nb_accepted_bac_g: 250, nb_accepted_bac_t: 100, nb_accepted_bac_p: 20, rate_professional_insertion: 96, tuition_fee: 10000, apprenticeship: true, parcoursup: true, scholarship_allowed: true },
      { name: 'EMLYON Business School', type: 'Grande École', city: 'Écully', website: 'https://www.em-lyon.com', description: 'École commerce lyon', education_branches: ['Commerce'], target_levels: ['Bac+2', 'Bac+3'], target_fields: ['Commerce', 'Management'], nb_accepted_bac_g: 220, nb_accepted_bac_t: 60, nb_accepted_bac_p: 15, rate_professional_insertion: 93, tuition_fee: 13000, apprenticeship: true, parcoursup: true, scholarship_allowed: true },
      { name: 'Université Toulouse III', type: 'Université', city: 'Toulouse', website: 'https://www.univ-tlse3.fr', description: 'Université sciences', education_branches: ['Sciences'], target_levels: ['Bac', 'Bac+1', 'Bac+2', 'Bac+3'], target_fields: ['Sciences', 'Ingénierie'], nb_accepted_bac_g: 800, nb_accepted_bac_t: 400, nb_accepted_bac_p: 100, rate_professional_insertion: 87, tuition_fee: 200, apprenticeship: true, parcoursup: true, scholarship_allowed: true },
      { name: 'INSA Lyon', type: 'Grande École', city: 'Villeurbanne', website: 'https://www.insa-lyon.fr', description: 'Institut sciences appliquées', education_branches: ['Ingénierie'], target_levels: ['Bac', 'Bac+1'], target_fields: ['Ingénierie', 'Informatique'], nb_accepted_bac_g: 300, nb_accepted_bac_t: 150, nb_accepted_bac_p: 30, rate_professional_insertion: 97, tuition_fee: 9000, apprenticeship: true, parcoursup: true, scholarship_allowed: true },
      { name: 'Audencia Business School', type: 'Grande École', city: 'Nantes', website: 'https://www.audencia.com', description: 'École commerce nantes', education_branches: ['Commerce'], target_levels: ['Bac+2', 'Bac+3'], target_fields: ['Commerce', 'Finance'], nb_accepted_bac_g: 150, nb_accepted_bac_t: 40, nb_accepted_bac_p: 10, rate_professional_insertion: 92, tuition_fee: 12000, apprenticeship: true, parcoursup: true, scholarship_allowed: true },
      { name: 'Université Claude Bernard Lyon 1', type: 'Université', city: 'Lyon', website: 'https://www.univ-lyon1.fr', description: 'Université sciences tech', education_branches: ['Sciences'], target_levels: ['Bac', 'Bac+1', 'Bac+2', 'Bac+3'], target_fields: ['Sciences', 'Santé', 'Technologie'], nb_accepted_bac_g: 900, nb_accepted_bac_t: 500, nb_accepted_bac_p: 150, rate_professional_insertion: 88, tuition_fee: 200, apprenticeship: true, parcoursup: true, scholarship_allowed: true },
    ]

    const { data: newSchools, error: schoolErr } = await db.from('schools').insert(schools).select('id')
    if (schoolErr) throw schoolErr
    const schoolIds = newSchools?.map((s: any) => s.id) || []

    // Create programs for each salon
    const allPrograms: any[] = []
    const programs = [
      { title: 'Présentation', description: 'Découvrez notre école', speaker: 'Directeur', location: 'Salle A', duration: 30 },
      { title: 'Les formations', description: 'Tous les programmes', speaker: 'Responsable', location: 'Auditorium', duration: 45 },
      { title: 'Apprentissage', description: 'Alternance', speaker: 'Manager', location: 'Salle B', duration: 30 },
      { title: 'Insertion Pro', description: 'Carrières', speaker: 'Responsable Carrières', location: 'Salle C', duration: 25 },
      { title: 'International', description: 'Mobilité', speaker: 'Coordinateur', location: 'Salle D', duration: 35 },
      { title: 'Financement', description: 'Bourses', speaker: 'Service Financements', location: 'Salle E', duration: 30 },
      { title: 'Q&A', description: 'Questions', speaker: 'Équipe', location: 'Stand', duration: 60 },
      { title: 'Témoignages', description: 'Étudiants', speaker: 'Étudiants', location: 'Salle F', duration: 45 },
    ]

    for (const salonId of salonIds) {
      let currentTime = new Date('2026-03-15T09:00:00')
      for (const prog of programs) {
        const endTime = new Date(currentTime.getTime() + prog.duration * 60000)
        allPrograms.push({
          event_id: salonId,
          title: prog.title,
          description: prog.description,
          speaker: prog.speaker,
          location: prog.location,
          start_time: currentTime.toISOString(),
          end_time: endTime.toISOString(),
        })
        currentTime = new Date(endTime.getTime() + 15 * 60000)
      }
    }

    const { error: progErr } = await db.from('event_programs').insert(allPrograms)
    if (progErr) throw progErr

    // Link schools to salons
    const exhibitors: any[] = []
    for (const salonId of salonIds) {
      const count = 5 + Math.floor(Math.random() * 4)
      const selected = [...schoolIds].sort(() => Math.random() - 0.5).slice(0, count)
      for (const schoolId of selected) {
        exhibitors.push({ event_id: salonId, school_id: schoolId })
      }
    }

    const { error: exhErr } = await db.from('event_exhibitors').insert(exhibitors)
    if (exhErr && !exhErr.message.includes('duplicate')) throw exhErr

    return NextResponse.json({
      success: true,
      created: {
        salons: salonIds.length,
        schools: schoolIds.length,
        programs: allPrograms.length,
        exhibitors: exhibitors.length,
      },
    })
  } catch (err: unknown) {
    console.error('Seed error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}
