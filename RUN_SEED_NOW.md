# 🚀 RUN SEEDING NOW - 3 EASY WAYS

## What Will Happen

After you run the seed command, your database will have:

✅ **10 New Salons** created in different French cities with:
- Real venue names and addresses
- Event dates from March to May 2026
- Full descriptions

✅ **10 New Schools** created with complete profiles:
- HEC Paris, Polytechnique, ESSEC, Université Paris Cité, and 6 more
- Full descriptions, admission rates, tuition fees
- Target levels and fields
- Professional insertion rates

✅ **80 Programs** (8 per salon) with:
- Realistic session titles (Présentation, Formations, Apprentissage, etc.)
- Speaker names and locations
- Times with 15-minute breaks between sessions
- Descriptions for each session

✅ **60+ School-Salon Links** creating a realistic fair structure

## Choose Your Method

### 🌐 **Method 1: Browser (Easiest - Just Click!)**

1. Make sure your Next.js app is running (`npm run dev`)
2. Copy this URL: `http://localhost:3000/api/admin/seed-demo`
3. **Paste it into your browser address bar**
4. Press Enter
5. Wait 2-5 seconds for the response
6. You'll see JSON showing how much data was created ✅

### 📝 **Method 2: Terminal/PowerShell**

**Windows PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/seed-demo" -Method POST
```

**Mac/Linux Terminal:**
```bash
curl -X POST http://localhost:3000/api/admin/seed-demo
```

### 🎯 **Method 3: Postman or Rest Client**

1. Open Postman or VS Code REST Client
2. **Method:** POST
3. **URL:** `http://localhost:3000/api/admin/seed-demo`
4. **Headers:** (leave empty)
5. **Body:** (leave empty)
6. Click Send

## Expected Result

You should see a response like:

```json
{
  "success": true,
  "message": "Demo data seeded successfully",
  "stats": {
    "salons_created": 10,
    "schools_created": 10,
    "programs_created": 80,
    "exhibitor_links_created": 60,
    "total_salons": 10,
    "total_schools": 10
  }
}
```

## Verify It Worked

After seeding:

### 1️⃣ Admin Dashboard
- Go to `/admin/salons`
- Should show **10 salons** listed
- Click any salon
- See **5 tabs**: Détails, Exposants, Étudiants, Programme, Codes QR
- Click "Programme" tab - see **8 sessions**
- Click "Exposants" tab - see **5-8 schools**

### 2️⃣ Student Fair Page
- Go to `/(student)/fair` or `/fair/{salon-id}`
- See **Programme tab** with all sessions
- See **exhibitors** from that salon
- Each program shows: time, speaker, location, description

### 3️⃣ Database Check
- Go to Supabase Dashboard
- Click "Tables" in left sidebar
- Open `events` table - should see 10 rows
- Open `schools` table - should see 10 rows
- Open `event_programs` table - should see 80 rows
- Open `event_exhibitors` table - should see ~60 rows

## What Each School Has

1. **HEC Paris** - Commerce, Paris ✨
2. **Polytechnique** - Engineering, Palaiseau 🏆
3. **ESSEC** - Commerce, Cergy 💼
4. **Université Paris Cité** - Multi-discipline, Paris 📚
5. **Institut Mines-Télécom** - Tech, Évry 💻
6. **EMLYON** - Commerce, Lyon 🎓
7. **Université Toulouse III** - Sciences, Toulouse 🔬
8. **INSA Lyon** - Engineering, Lyon ⚙️
9. **Audencia** - Commerce, Nantes 💡
10. **Université Claude Bernard** - Sciences, Lyon 🧪

## What Each Salon Has

1. **Paris** - March 15 - Palais Omni Sports de Paris-Bercy
2. **Toulouse** - March 22 - Parc des Expositions Hall 2
3. **Lyon** - March 29 - Cité Internationale de la Confluence
4. **Marseille** - April 5 - Palais des Congrès et des Expositions
5. **Lille** - April 12 - Parc Expo de Lille
6. **Bordeaux** - April 19 - Palais Beaumont
7. **Strasbourg** - April 26 - Wacken Centre
8. **Nantes** - May 3 - Cité des Congrès
9. **Montpellier** - May 10 - Parc Expo de Montpellier
10. **Nice** - May 17 - Acropolis Nice

## Program Schedule Per Salon

Each salon has 8 sessions spread throughout the day:

| Time | Session | Duration |
|------|---------|----------|
| 09:00 | Présentation de l'école | 30 min |
| 09:45 | Les formations proposées | 45 min |
| 10:45 | Parcours en Apprentissage | 30 min |
| 11:30 | Insertion Professionnelle | 25 min |
| 12:15 | International & Mobilité | 35 min |
| 13:15 | Bourses & Financements | 30 min |
| 14:15 | Réunion d'information | 60 min |
| 15:30 | Témoignages d'étudiants | 45 min |

*Times shown are examples with 15-minute breaks*

## Next Steps After Seeding

### For Demo/Testing:
1. ✅ Run seeding endpoint
2. ✅ Refresh your browser (Ctrl+F5)
3. ✅ Go to admin salon - edit details, add/remove programs, manage exhibitors
4. ✅ Go to student fair page - see all programs and exhibitors
5. ✅ Show the complete workflow to stakeholders

### For Customization:
- Edit salon details: `/admin/salons/{id}`
- Add/remove schools: Exposants tab
- Create more programs: Programme tab
- Add student QR codes: Codes QR tab

### For Clear Data:
If you want to start fresh later, run this in Supabase SQL Editor:
```sql
DELETE FROM event_programs;
DELETE FROM event_exhibitors;
DELETE FROM events WHERE created_at > now() - interval '1 day';
DELETE FROM schools WHERE created_at > now() - interval '1 day';
```

## Troubleshooting

**Nothing happened / Got error?**
1. Make sure your app is running (`npm run dev`)
2. Make sure you're logged in as admin
3. Check browser console for errors (F12)
4. Check that Supabase migration was applied

**Getting 401 Unauthorized?**
- You need admin privileges
- Make sure your user role is set to 'admin' in the users table

**Getting 500 error?**
- Check the error message in the response
- Go to Supabase → Logs to see detailed database errors
- Make sure event_programs table exists (run the migration again)

## Safe to Run Multiple Times?

✅ **YES!** The script will:
- Not duplicate schools
- Not duplicate salons
- Not duplicate exhibitor links
- Only add new data

⚠️ **BUT:** Programs will be added again, so you might get 80 + 80 = 160 programs

If that happens, just delete the duplicates or run the SQL clear command above.

---

**Ready? Pick a method above and run it now!** 🎉

Your demo is waiting... 👇
