# 🎯 Seed Demo Data - Complete Guide

## What Gets Created

This seeding endpoint will populate your database with realistic demo data:

### 📊 Data Created:
- **10 new Salons** (Paris, Toulouse, Lyon, Marseille, Lille, Bordeaux, Strasbourg, Nantes, Montpellier, Nice)
- **10 new Schools** (HEC Paris, Polytechnique, ESSEC, Université Paris Cité, etc.)
- **8 Programs per Salon** = 8 realistic sessions for each salon
- **Random School-Salon Links** = 5-8 schools per salon as exhibitors

### 📍 Salon Details Include:
- Full name and description
- City and venue
- Physical address
- Event date
- Active status

### 🏫 School Details Include:
- Name, type (Grande École or Université)
- City and website
- Description
- Target education levels (Bac, Bac+2, Bac+3)
- Target fields (Sciences, Commerce, Ingénierie, etc.)
- Student acceptance numbers by BAC type
- Professional insertion rate
- Tuition fees
- Apprenticeship availability
- Parcoursup eligibility
- Scholarship availability

### 📅 Program Details Include:
- Title (Présentation, Formations, Apprentissage, etc.)
- Full description
- Speaker name
- Location/Room
- Start and end times
- 15-minute breaks between sessions

## How to Run

### Option 1: Simple HTTP Request (Easiest)

Open your browser and visit:
```
http://localhost:3000/api/admin/seed-demo
```

Wait for the response showing how much data was created.

### Option 2: Using curl

```bash
curl -X POST http://localhost:3000/api/admin/seed-demo \
  -H "Content-Type: application/json"
```

### Option 3: Using Postman or REST Client

**Method:** POST
**URL:** `http://localhost:3000/api/admin/seed-demo`
**Headers:** None needed
**Body:** Empty

## Expected Response

```json
{
  "success": true,
  "message": "Demo data seeded successfully",
  "stats": {
    "salons_created": 10,
    "schools_created": 10,
    "programs_created": 80,
    "exhibitor_links_created": ~60,
    "total_salons": 10,
    "total_schools": 10
  }
}
```

## What You Can Do After Seeding

### For Admins:
1. Go to `/admin/salons` - see 10 salons listed
2. Click any salon to edit it
3. Switch to "Programme" tab - see 8 sessions
4. Switch to "Exposants" tab - see 5-8 linked schools
5. Add/edit/delete programs
6. Add/remove exhibitors

### For Students:
1. Go to student app
2. See "Plan salon" with 10 salons available
3. Click a salon - view all programs with times and speakers
4. See all exhibiting schools at that salon
5. View detailed school information

## Test Scenarios

### Scenario 1: Browse Salons
- Student goes to fair list
- Sees 10 salons with dates and cities
- Clicks one to view programs and exhibitors

### Scenario 2: View Programs
- Admin goes to salon detail
- Opens "Programme" tab
- Sees 8 sessions scheduled throughout the day
- Can edit session times or add more sessions

### Scenario 3: Manage Exhibitors
- Admin goes to salon detail
- Opens "Exposants" tab
- Sees 5-8 schools linked to this salon
- Can remove schools or add new ones

### Scenario 4: School Details
- Click any school link
- See full school profile with:
  - Description
  - Programs offered
  - Admission rates
  - Tuition fees
  - International opportunities

## Data Seeding Rules

✅ **Safe to Run Multiple Times:**
- New schools won't duplicate
- New salons won't duplicate
- Exhibitor links won't duplicate (unique constraint)
- Programs will multiply (each run adds 8 more per salon)

⚠️ **Note:**
- If you run it 3 times, you'll have 30 salons with 8 programs each
- You can always delete extras from `/admin/salons`

## Clear Data (If Needed)

To start fresh, run this in Supabase SQL Editor:

```sql
-- Delete all programs (they're linked by foreign key)
DELETE FROM event_programs;

-- Delete all exhibitor links
DELETE FROM event_exhibitors;

-- Delete all events (salons)
DELETE FROM events WHERE name LIKE '%Salon%' OR name LIKE '%Forum%' OR name LIKE '%Education%';

-- Delete all schools (only if you want a clean slate)
-- DELETE FROM schools;
```

## Troubleshooting

**Error: "School not found"**
- Make sure schools exist before linking
- The script creates schools first, so this shouldn't happen

**Error: "Event not found"**
- Salons might not be created
- Check Supabase Tables to see if events table is populated

**Programs not showing in salon?**
- Refresh the page (hard refresh: Ctrl+Shift+Delete)
- Check that the salon ID is correct
- Look in Supabase Tables → event_programs to verify

**Exhibitors not showing?**
- Make sure schools are created first
- Check event_exhibitors table for links
- Verify school_id and event_id match

## Sample Schools Created

1. **HEC Paris** - Commerce Grande École - 95% insertion rate
2. **Polytechnique** - Engineering - 98% insertion rate
3. **ESSEC Business School** - Commerce - 94% insertion rate
4. **Université Paris Cité** - Multi-discipline - 85% insertion rate
5. **Institut Mines-Télécom** - Engineering/Tech - 96% insertion rate
6. **EMLYON Business School** - Commerce - 93% insertion rate
7. **Université Toulouse III** - Sciences - 87% insertion rate
8. **INSA Lyon** - Engineering - 97% insertion rate
9. **Audencia Business School** - Commerce - 92% insertion rate
10. **Université Claude Bernard Lyon 1** - Sciences/Tech - 88% insertion rate

## Sample Salons Created

1. Paris - March 15 - Palais Omni Sports de Paris-Bercy
2. Toulouse - March 22 - Parc des Expositions
3. Lyon - March 29 - Cité Internationale de la Confluence
4. Marseille - April 5 - Palais des Congrès
5. Lille - April 12 - Parc Expo de Lille
6. Bordeaux - April 19 - Palais Beaumont
7. Strasbourg - April 26 - Wacken Centre
8. Nantes - May 3 - Cité des Congrès
9. Montpellier - May 10 - Parc Expo
10. Nice - May 17 - Acropolis Nice

Ready? Just visit the endpoint and watch the data populate! 🚀
