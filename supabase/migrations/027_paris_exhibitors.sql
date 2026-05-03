-- ─────────────────────────────────────────────────────────────────────────────
-- 027_paris_exhibitors.sql
-- Phase 2: Insert the 34 exhibitors from the Salon de l'Étudiant Paris
-- (previous edition list) as schools, then link them to the Paris event
-- via event_exhibitors and stands.
--
-- UUID prefix for this batch: e1e2e3e4-0000-0000-0000-0000000000XX
-- Event:  Salon de l'Étudiant Paris → a1b2c3d4-0000-0000-0000-000000000001
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. SCHOOLS ───────────────────────────────────────────────────────────────

INSERT INTO public.schools (
  id, name, type, city, website, description,
  target_levels, target_fields, target_regions,
  tuition_fee, apprenticeship, parcoursup, scholarship_allowed
) VALUES

-- 1 · ESUP Paris
('e1e2e3e4-0000-0000-0000-000000000001',
 'ESUP Paris',
 'École de Commerce', 'Paris', 'https://esup-paris.fr',
 'École supérieure de Paris, formations en management, commerce et entrepreneuriat du Bac+2 au Bac+5',
 ARRAY['terminale','post-bac','bac+2'], ARRAY['Commerce et Marketing','Économie et Gestion'], ARRAY['Île-de-France'],
 7500, true, false, false),

-- 2 · ÉCOLE DE MANAGEMENT APPLIQUÉ
('e1e2e3e4-0000-0000-0000-000000000002',
 'École de Management Appliqué',
 'École de Commerce', 'Paris', 'https://ema-paris.fr',
 'École de management orientée pratique professionnelle, en partenariat étroit avec des entreprises partenaires',
 ARRAY['post-bac','bac+2'], ARRAY['Économie et Gestion','Commerce et Marketing'], ARRAY['Île-de-France'],
 6800, true, false, false),

-- 3 · COMPAGNONS DU DEVOIR
('e1e2e3e4-0000-0000-0000-000000000003',
 'Compagnons du Devoir',
 'Centre de Formation', 'Paris', 'https://compagnons-du-devoir.com',
 'Réseau de formation par apprentissage aux métiers de l''artisanat, du bâtiment et du compagnonnage depuis 1941',
 ARRAY['terminale','post-bac'], ARRAY['Sciences et Technologies','Art et Design'], ARRAY['National'],
 0, true, false, false),

-- 4 · L'ÉTUDIANT
('e1e2e3e4-0000-0000-0000-000000000004',
 'L''Étudiant',
 'Organisme', 'Paris', 'https://letudiant.fr',
 'Média et plateforme d''orientation scolaire, organisateur du Salon de l''Étudiant, guides et outils pour lycéens et étudiants',
 ARRAY['terminale','post-bac','bac+2','bac+3'], ARRAY['Lettres et Sciences Humaines','Commerce et Marketing'], ARRAY['National'],
 0, false, false, false),

-- 5 · IESF RÉGIONS
('e1e2e3e4-0000-0000-0000-000000000005',
 'Ingénieurs et Scientifiques de France – IESF',
 'Organisme', 'Paris', 'https://iesf.fr',
 'Association nationale représentant les ingénieurs et scientifiques français — ressources, réseau et insertion professionnelle',
 ARRAY['bac+2','bac+3','bac+4','bac+5'], ARRAY['Sciences et Technologies','Informatique et Numérique'], ARRAY['National'],
 0, false, false, false),

-- 6 · SMBS
('e1e2e3e4-0000-0000-0000-000000000006',
 'SMBS – L''École de Commerce de la Santé',
 'École de Commerce', 'Paris', 'https://smbs.fr',
 'École spécialisée en management des organisations de santé, MBA Santé et formations continues pour professionnels du secteur',
 ARRAY['post-bac','bac+2','bac+3'], ARRAY['Commerce et Marketing','Santé'], ARRAY['Île-de-France'],
 8900, false, false, false),

-- 7 · SKALE COLLABORATIVE BUSINESS SCHOOL
('e1e2e3e4-0000-0000-0000-000000000007',
 'SKALE Collaborative Business School',
 'École de Commerce', 'Paris', 'https://skale-cbs.fr',
 'École de commerce collaborative et innovante — pédagogie par projets collectifs et co-création avec les entreprises partenaires',
 ARRAY['terminale','post-bac','bac+2'], ARRAY['Commerce et Marketing','Économie et Gestion'], ARRAY['Île-de-France'],
 7200, true, false, false),

-- 8 · AURLOM BTS+
('e1e2e3e4-0000-0000-0000-000000000008',
 'Aurlom BTS+',
 'École Spécialisée', 'Paris', 'https://aurlom.com',
 'Centre de formation BTS, Bachelor et Mastère en alternance dans les domaines du commerce, du numérique et de la communication',
 ARRAY['terminale','post-bac'], ARRAY['Commerce et Marketing','Informatique et Numérique'], ARRAY['Île-de-France'],
 0, true, false, false),

-- 9 · CFAI MECAVENIR // GIM
('e1e2e3e4-0000-0000-0000-000000000009',
 'CFAI Mécavenir – GIM',
 'Centre de Formation', 'Paris', 'https://cfai-mecavenir.fr',
 'Centre de formation par apprentissage en mécanique et industrie, partenaire du Groupement des Industries Mécaniques d''Île-de-France',
 ARRAY['terminale','post-bac'], ARRAY['Sciences et Technologies'], ARRAY['Île-de-France'],
 0, true, true, false),

-- 10 · EF – INTERNATIONAL
('e1e2e3e4-0000-0000-0000-000000000010',
 'EF Education First',
 'Organisme', 'Paris', 'https://ef.fr',
 'Organisation internationale d''éducation — programmes linguistiques, séjours à l''étranger et préparations aux certifications internationales',
 ARRAY['terminale','post-bac','bac+2','bac+3'], ARRAY['Lettres et Sciences Humaines'], ARRAY['International'],
 0, false, false, false),

-- 11 · GRDF DÉLÉGATION RH
('e1e2e3e4-0000-0000-0000-000000000011',
 'GRDF – Délégation RH',
 'Recruteur', 'Paris', 'https://grdf.fr',
 'Gaz Réseau Distribution France — gestionnaire du réseau de gaz en France, présent pour ses recrutements en apprentissage, VIE et CDI',
 ARRAY['terminale','post-bac','bac+2','bac+3'], ARRAY['Sciences et Technologies','Informatique et Numérique'], ARRAY['National'],
 0, true, false, false),

-- 12 · UXCO GROUP
('e1e2e3e4-0000-0000-0000-000000000012',
 'UXCO Group',
 'Organisme', 'Paris', 'https://uxco-group.com',
 'Groupe spécialisé dans les résidences étudiantes et les services de logement pour étudiants et jeunes actifs en France',
 ARRAY['post-bac','bac+2','bac+3'], ARRAY['Commerce et Marketing'], ARRAY['National'],
 0, false, false, false),

-- 13 · UFV – UNIVERSIDAD FRANCISCO DE VITORIA
('e1e2e3e4-0000-0000-0000-000000000013',
 'Universidad Francisco de Vitoria – UFV',
 'Université', 'Madrid', 'https://ufv.es',
 'Université privée espagnole reconnue — formations en médecine, droit, communication, business et sciences en espagnol et anglais',
 ARRAY['post-bac','bac+2'], ARRAY['Santé','Droit et Sciences Politiques','Commerce et Marketing'], ARRAY['International'],
 9500, false, false, false),

-- 14 · BRIGADE DE SAPEURS-POMPIERS DE PARIS
('e1e2e3e4-0000-0000-0000-000000000014',
 'Brigade de Sapeurs-Pompiers de Paris',
 'Recruteur', 'Paris', 'https://www.brigadesapeurspompiersparis.fr',
 'Corps militaire chargé de la sécurité civile à Paris et en petite couronne — voies de recrutement, formations et carrières',
 ARRAY['terminale','post-bac'], ARRAY['Santé','Sciences et Technologies'], ARRAY['Île-de-France'],
 0, false, false, false),

-- 15 · ARMÉE DE TERRE IDF
('e1e2e3e4-0000-0000-0000-000000000015',
 'Armée de Terre – Île-de-France',
 'Recruteur', 'Paris', 'https://recrutement.terre.defense.gouv.fr',
 'Armée de Terre en Île-de-France — présentation des métiers militaires, formations, carrières et dispositifs d''engagement',
 ARRAY['terminale','post-bac'], ARRAY['Sciences et Technologies'], ARRAY['Île-de-France'],
 0, false, false, false),

-- 16 · EDE PARIS
('e1e2e3e4-0000-0000-0000-000000000016',
 'EDE Paris',
 'École Spécialisée', 'Paris', 'https://ede-paris.fr',
 'École de droit et d''économie de Paris — formations en droit des affaires, fiscalité et économie appliquée',
 ARRAY['post-bac','bac+2','bac+3'], ARRAY['Droit et Sciences Politiques','Économie et Gestion'], ARRAY['Île-de-France'],
 5500, false, false, false),

-- 17 · ARMÉE – MARINE NATIONALE
('e1e2e3e4-0000-0000-0000-000000000017',
 'Marine Nationale',
 'Recruteur', 'Paris', 'https://www.marine.defense.gouv.fr',
 'Marine Nationale française — filières d''engagement, de formation et de carrière pour les jeunes, du matelot au officier',
 ARRAY['terminale','post-bac'], ARRAY['Sciences et Technologies'], ARRAY['National'],
 0, false, false, false),

-- 18 · ESIEE-IT
('e1e2e3e4-0000-0000-0000-000000000018',
 'ESIEE-IT – École d''ingénieurs et d''experts IT',
 'École d''Ingénieurs', 'Pontault-Combault', 'https://esiee-it.fr',
 'École d''ingénieurs spécialisée en informatique et systèmes d''information, formations en 3 ou 5 ans, membre du réseau ESIEE',
 ARRAY['terminale','post-bac','bac+2'], ARRAY['Informatique et Numérique','Sciences et Technologies'], ARRAY['Île-de-France'],
 8200, true, false, false),

-- 19 · SURFACE TRAINING ACADEMY
('e1e2e3e4-0000-0000-0000-000000000019',
 'Surface Training Academy',
 'Centre de Formation', 'Paris', 'https://surfacetraining.fr',
 'Académie de formation professionnelle en coiffure, esthétique et métiers de l''image — du CAP au Bac+3',
 ARRAY['terminale','post-bac'], ARRAY['Art et Design'], ARRAY['Île-de-France'],
 3200, true, false, false),

-- 20 · STAND UP ACADEMY
('e1e2e3e4-0000-0000-0000-000000000020',
 'Stand Up Academy',
 'École Spécialisée', 'Paris', 'https://standupacademy.fr',
 'École des arts vivants et de la comédie — formation en stand-up, improvisation, expression scénique et pitch professionnel',
 ARRAY['terminale','post-bac','bac+2'], ARRAY['Art et Design','Lettres et Sciences Humaines'], ARRAY['Île-de-France'],
 4500, false, false, false),

-- 21 · EIMP
('e1e2e3e4-0000-0000-0000-000000000021',
 'EIMP – École Internationale de Management et de Projets',
 'École de Commerce', 'Paris', 'https://eimp.fr',
 'École internationale spécialisée en management de projet, gestion internationale et développement des organisations',
 ARRAY['post-bac','bac+2','bac+3'], ARRAY['Économie et Gestion','Commerce et Marketing'], ARRAY['Île-de-France','International'],
 7800, true, false, false),

-- 22 · CRÉE TON AVENIR
('e1e2e3e4-0000-0000-0000-000000000022',
 'Crée Ton Avenir – France',
 'Organisme', 'Paris', 'https://creetonavenir.fr',
 'Association nationale d''accompagnement à l''entrepreneuriat, à l''orientation et à l''insertion professionnelle des jeunes',
 ARRAY['terminale','post-bac','bac+2'], ARRAY['Commerce et Marketing','Économie et Gestion'], ARRAY['National'],
 0, false, false, false),

-- 23 · MAX HAVELAAR FRANCE
('e1e2e3e4-0000-0000-0000-000000000023',
 'Max Havelaar France',
 'Organisme', 'Paris', 'https://maxhavelaarfrance.org',
 'Association Fairtrade France — commerce équitable et ESS : présente ses métiers, engagements et débouchés pour les jeunes',
 ARRAY['bac+2','bac+3','bac+4'], ARRAY['Commerce et Marketing','Économie et Gestion'], ARRAY['National'],
 0, false, false, false),

-- 24 · UNIVERSITY OF NICOSIA MEDICAL SCHOOL
('e1e2e3e4-0000-0000-0000-000000000024',
 'University of Nicosia Medical School',
 'Université', 'Nicosie', 'https://medschool.unic.ac.cy',
 'École de médecine européenne accréditée — programme MBBS en anglais accessible aux étudiants français, reconnaissance UE',
 ARRAY['post-bac','bac+2'], ARRAY['Santé'], ARRAY['International'],
 19000, false, false, false),

-- 25 · ILS PARIS
('e1e2e3e4-0000-0000-0000-000000000025',
 'ILS Paris – Institut Langue et Stratégie',
 'École Spécialisée', 'Paris', 'https://ils-paris.fr',
 'Institut de formation en langues appliquées, traduction, interprétariat et communication interculturelle',
 ARRAY['post-bac','bac+2','bac+3'], ARRAY['Lettres et Sciences Humaines'], ARRAY['Île-de-France'],
 5800, false, false, false),

-- 26 · SOLANA APIE
('e1e2e3e4-0000-0000-0000-000000000026',
 'Solana APIE',
 'Organisme', 'Paris', 'https://solana-apie.fr',
 'Pour une orientation choisie, joyeuse et solidaire — accompagnement individualisé des lycéens et étudiants dans leur parcours',
 ARRAY['terminale','post-bac'], ARRAY['Droit et Sciences Politiques','Lettres et Sciences Humaines'], ARRAY['Île-de-France'],
 0, false, false, false),

-- 27 · STUDENCY
('e1e2e3e4-0000-0000-0000-000000000027',
 'Studency',
 'Organisme', 'Paris', 'https://studency.com',
 'Plateforme et services de logement pour étudiants en mobilité — résidences, colocations et accompagnement à l''installation',
 ARRAY['post-bac','bac+2','bac+3'], ARRAY['Commerce et Marketing'], ARRAY['National'],
 0, false, false, false),

-- 28 · JUMP L'ACADÉMIE DES MÉTIERS DU SPORT
('e1e2e3e4-0000-0000-0000-000000000028',
 'JUMP – L''Académie des Métiers du Sport',
 'École Spécialisée', 'Paris', 'https://jump-academie.fr',
 'Formation aux métiers du sport : management sportif, marketing, événementiel et préparation physique — du Bac+2 au Bac+5',
 ARRAY['terminale','post-bac','bac+2'], ARRAY['Commerce et Marketing','Santé'], ARRAY['Île-de-France'],
 6200, true, false, false),

-- 29 · CIDJ PARIS IDF
('e1e2e3e4-0000-0000-0000-000000000029',
 'CIDJ Paris IDF – Centre d''Information et de Documentation Jeunesse',
 'Organisme', 'Paris', 'https://cidj.com',
 'Centre d''information sur l''orientation, l''emploi, le logement, les droits et la mobilité internationale pour les jeunes',
 ARRAY['terminale','post-bac','bac+2','bac+3'], ARRAY['Droit et Sciences Politiques','Lettres et Sciences Humaines'], ARRAY['Île-de-France'],
 0, false, false, false),

-- 30 · MMI DÉCO
('e1e2e3e4-0000-0000-0000-000000000030',
 'MMI Déco – École de Décoration et d''Architecture d''Intérieur',
 'École Spécialisée', 'Paris', 'https://mmideco.fr',
 'École spécialisée en décoration et architecture d''intérieur — formations BTS Design d''Espace et Bachelor créatif',
 ARRAY['terminale','post-bac'], ARRAY['Art et Design','Architecture'], ARRAY['Île-de-France'],
 6500, false, false, false),

-- 31 · STELLANTIS &YOU PARIS
('e1e2e3e4-0000-0000-0000-000000000031',
 'Stellantis & You Paris',
 'Recruteur', 'Paris', 'https://stellantis-and-you.fr',
 'Réseau de distribution automobile Stellantis (Peugeot, Citroën, DS, Opel) — formations en alternance et métiers de l''automobile',
 ARRAY['terminale','post-bac'], ARRAY['Sciences et Technologies','Commerce et Marketing'], ARRAY['Île-de-France'],
 0, true, false, false),

-- 32 · WE HIVE
('e1e2e3e4-0000-0000-0000-000000000032',
 'We Hive – Programmes Au Pair',
 'Organisme', 'Paris', 'https://wehive.fr',
 'Agence spécialisée dans les programmes Au Pair et la mobilité internationale — immersion culturelle et linguistique pour les jeunes',
 ARRAY['terminale','post-bac'], ARRAY['Lettres et Sciences Humaines'], ARRAY['International'],
 0, false, false, false),

-- 33 · IMCI
('e1e2e3e4-0000-0000-0000-000000000033',
 'IMCI – Institut des Métiers de la Création et de l''Internet',
 'École Spécialisée', 'Paris', 'https://imci.fr',
 'École du digital et de la création de contenus : réseaux sociaux, motion design, community management et UX/UI',
 ARRAY['terminale','post-bac','bac+2'], ARRAY['Informatique et Numérique','Art et Design'], ARRAY['Île-de-France'],
 5900, true, false, false),

-- 34 · 3W ACADEMY
('e1e2e3e4-0000-0000-0000-000000000034',
 '3W Academy – École des Nouveaux Métiers du Code',
 'École Spécialisée', 'Paris', 'https://3wa.fr',
 'École de développement web et des nouveaux métiers du code — formations intensives, bootcamps et alternance',
 ARRAY['terminale','post-bac','bac+2'], ARRAY['Informatique et Numérique'], ARRAY['Île-de-France'],
 6800, true, false, false)

ON CONFLICT (id) DO NOTHING;


-- ── 2. EVENT_EXHIBITORS ───────────────────────────────────────────────────────
-- Register all 34 as official exhibitors for the Paris event

INSERT INTO public.event_exhibitors (event_id, school_id) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000001'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000002'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000003'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000004'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000005'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000006'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000007'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000008'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000009'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000010'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000011'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000012'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000013'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000014'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000015'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000016'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000017'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000018'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000019'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000020'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000021'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000022'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000023'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000024'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000025'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000026'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000027'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000028'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000029'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000030'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000031'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000032'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000033'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000034')
ON CONFLICT (event_id, school_id) DO NOTHING;


-- ── 3. STANDS ────────────────────────────────────────────────────────────────
-- One stand per exhibitor for the Paris event.
-- stand_label uses the PDF order (A-01 … A-34).
-- map_position is NULL here — filled in Phase 3 when the floor plan is configured.

INSERT INTO public.stands (event_id, school_id, category, stand_label) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000001', 'Écoles de Commerce',       'A-01'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000002', 'Écoles de Commerce',       'A-02'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000003', 'Centres de Formation',     'A-03'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000004', 'Organismes et Partenaires','A-04'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000005', 'Organismes et Partenaires','A-05'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000006', 'Écoles de Commerce',       'A-06'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000007', 'Écoles de Commerce',       'A-07'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000008', 'Écoles Spécialisées',      'A-08'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000009', 'Centres de Formation',     'A-09'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000010', 'Organismes et Partenaires','A-10'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000011', 'Recruteurs et Entreprises','A-11'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000012', 'Organismes et Partenaires','A-12'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000013', 'Universités',              'A-13'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000014', 'Recruteurs et Entreprises','A-14'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000015', 'Recruteurs et Entreprises','A-15'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000016', 'Écoles Spécialisées',      'A-16'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000017', 'Recruteurs et Entreprises','A-17'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000018', 'Écoles d''Ingénieurs',     'A-18'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000019', 'Centres de Formation',     'A-19'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000020', 'Écoles Spécialisées',      'A-20'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000021', 'Écoles de Commerce',       'A-21'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000022', 'Organismes et Partenaires','A-22'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000023', 'Organismes et Partenaires','A-23'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000024', 'Universités',              'A-24'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000025', 'Écoles Spécialisées',      'A-25'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000026', 'Organismes et Partenaires','A-26'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000027', 'Organismes et Partenaires','A-27'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000028', 'Écoles Spécialisées',      'A-28'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000029', 'Organismes et Partenaires','A-29'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000030', 'Écoles Spécialisées',      'A-30'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000031', 'Recruteurs et Entreprises','A-31'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000032', 'Organismes et Partenaires','A-32'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000033', 'Écoles Spécialisées',      'A-33'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'e1e2e3e4-0000-0000-0000-000000000034', 'Écoles Spécialisées',      'A-34')
ON CONFLICT DO NOTHING;
