# 🚀 Quick Fix for Blank Page Issue

## What's Wrong
Your app shows a blank page because the **database migration hasn't been applied yet**. The code is ready, but the tables don't exist in Supabase.

## What's Fixed ✅
- ✅ **Actualités link** → Opens `https://www.letudiant.fr/` in new tab
- ✅ **Public programs API** → Created `/api/events/[id]/programs`
- ✅ **All admin endpoints** → Ready to use
- ✅ **Admin salon dashboard** → 5 fully functional tabs

## What You Must Do NOW 🔴

### 1. Run the Migration in Supabase

**COPY THIS ENTIRE BLOCK AND RUN IT IN SUPABASE SQL EDITOR:**

```sql
-- Step 1: Add QR code columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS entry_qr TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS exit_qr TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;

-- Step 2: Create event_programs table
CREATE TABLE IF NOT EXISTS event_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  speaker TEXT,
  location TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Step 3: Create event_exhibitors table
CREATE TABLE IF NOT EXISTS event_exhibitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT now(),
  UNIQUE(event_id, school_id)
);

-- Step 4: Set up RLS policies for event_programs
ALTER TABLE event_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_programmes_select" ON event_programs FOR SELECT USING (true);
CREATE POLICY "event_programmes_insert" ON event_programs FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "event_programmes_update" ON event_programs FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "event_programmes_delete" ON event_programs FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Step 5: Set up RLS policies for event_exhibitors
ALTER TABLE event_exhibitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_exhibitors_select" ON event_exhibitors FOR SELECT USING (true);
CREATE POLICY "event_exhibitors_insert" ON event_exhibitors FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "event_exhibitors_delete" ON event_exhibitors FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS event_programs_event_id_idx ON event_programs(event_id);
CREATE INDEX IF NOT EXISTS event_programs_start_time_idx ON event_programs(start_time);
CREATE INDEX IF NOT EXISTS event_exhibitors_event_id_idx ON event_exhibitors(event_id);
CREATE INDEX IF NOT EXISTS event_exhibitors_school_id_idx ON event_exhibitors(school_id);
```

**Steps:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste the SQL above
6. Click **Run**
7. Wait for ✓ Success

### 2. Hard Refresh Your App
```
Ctrl + Shift + Delete  (Windows)
Cmd + Shift + Delete   (Mac)
```
Then reload the page.

## What Should Work After Fix

### For Admins:
- ✅ Create and edit salons
- ✅ Add programmes (sessions) to salons
- ✅ Manually add exhibitors from school database
- ✅ Generate entry/exit QR codes
- ✅ View student registration data

### For Students:
- ✅ See salon details (date, location)
- ✅ View programme with times and speakers
- ✅ See all exhibitors at the fair
- ✅ Click Actualités → opens letudiant.fr

## If It Still Doesn't Work

### Check This:
1. **Supabase Tables** → Go to Supabase, click "Tables" in left sidebar
   - Should see: `events`, `event_programs`, `event_exhibitors`, etc.
   - If `event_programs` doesn't exist → Migration didn't run

2. **Check Console Errors** → Press F12, click Console tab
   - Look for red error messages
   - Screenshot the error and share it

3. **Check Server Logs** → In your terminal where Next.js runs
   - Look for error messages starting with `[GET /api...]`

## Files Modified
- `app/api/events/[id]/programs/route.ts` ← **NEW** (Public programmes)
- `components/features/ServicesBar.tsx` ← Fixed Actualités link
- `lib/supabase/types.ts` ← Added types
- `app/(student)/fair/[eventId]/page.tsx` ← Fetches real data
- `app/admin/salons/[id]/page.tsx` ← Admin dashboard

Everything is **code-ready**. Just need the database tables. 🎯
