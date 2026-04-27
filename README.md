# L'Étudiant Salons

Une plateforme digitale complète pour les salons d'orientation de "l'Etudiant", développée avec Next.js et Supabase.

## 🎯 Vue d'ensemble

L'Étudiant Salons est une application web moderne qui transforme l'expérience des salons d'orientation en permettant :
- **Capture intelligente des visiteurs** via kiosques physiques et app mobile
- **Découverte personnalisée des écoles** avec ranking intelligent
- **Gestion des groupes scolaires** pour les enseignants
- **Analytics temps réel** pour les exposants
- **Système de scoring** pour mesurer l'engagement

## 🚀 Fonctionnalités principales

### Pour les étudiants
- **Découverte intelligente** : écoles classées par pertinence (profil + comportements)
- **Tinder-like swiping** : découvrir les écoles qui correspondent
- **QR code personnel** : accès rapide aux stands
- **Sauvegarde et suivi** : garder une trace des écoles intéressantes

### Pour les enseignants
- **Gestion de groupes** : inviter et suivre les élèves
- **Insights collectifs** : analyser les intérêts de la classe
- **Préparation au salon** : outils d'orientation collective

### Pour les exposants
- **Données agrégées** : statistiques anonymes sur les visiteurs???
- **Rapports J+1** : analyse post-événement
- **Scan QR** : validation des présences aux RDV

### Pour les administrateurs
- **Tableau de bord complet** : gestion des salons, utilisateurs, données
- **Paramétrage des écoles** : configuration des profils d'établissement
- **Analytics avancés** : métriques de performance

## 🛠️ Technologies

- **Frontend** : Next.js 16, React 19, TypeScript
- **Styling** : Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **PWA** : Service Worker, manifest.json
- **QR Codes** : Génération et scan intégrés
- **Charts** : Recharts pour les visualisations

## 📦 Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/satoui-star/letudiant-fair.git
   cd letudiant-fair
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configuration Supabase**
   - Créer un projet Supabase
   - Copier les variables d'environnement dans `.env.local`
   - Exécuter les migrations : `supabase db push`

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🏗️ Architecture

### Structure des dossiers
```
app/                    # Pages Next.js (App Router)
├── (student)/         # Routes étudiants
├── (admin)/          # Routes administrateurs
├── (exhibitor)/      # Routes exposants
├── (teacher)/        # Routes enseignants
├── (parent)/         # Routes parents
└── api/              # API routes

components/            # Composants réutilisables
lib/                   # Utilitaires et configurations
├── supabase/         # Client et fonctions Supabase
├── firebase/         # Configuration Firebase
└── scoring/          # Logique de scoring

supabase/             # Schéma et migrations base de données
functions/            # Cloud Functions Firebase
```

### Base de données
- **Utilisateurs** : profils étudiants, enseignants, exposants
- **Écoles** : catalogue avec critères de ciblage
- **Matches** : interactions étudiant-école (swipes)
- **Salons** : événements avec configuration
- **Scans** : tracking des visites de stands

## 🎨 Fonctionnalités clés

### Phase 1 : Ranking intelligent
- Algorithme de pertinence basé sur le profil étudiant
- Boost comportemental selon les swipes précédents
- Score final = 60% profil + 40% comportement

### Score Booth
- Kiosque physique pour capture rapide
- 3 champs max : prénom, niveau, branche
- QR généré automatiquement
- Mode PWA standalone

### Système de groupes
- Pipeline enseignant-élèves
- Liens d'invitation personnalisés
- Suivi collectif des intérêts

## 🚀 Déploiement

### Développement
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Déploiement recommandé
- **Vercel** pour le frontend Next.js
- **Supabase** pour la base de données
- **Firebase Functions** pour les traitements lourds

## 📊 Scripts disponibles

- `npm run dev` : serveur de développement
- `npm run build` : build de production
- `npm run start` : serveur de production
- `npm run lint` : vérification ESLint
- `npm run seed:preregistrations` : seeding des pré-inscriptions

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est propriété de L'Étudiant. Tous droits réservés.

## 📞 Support

Pour toute question technique ou fonctionnalité :
- Ouvrir une issue GitHub
- Contacter l'équipe développement
