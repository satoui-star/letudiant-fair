# Critical Setup Fixes - Run These Steps

## Issue Summary
The blank page issue is caused by:
1. **Missing public programs API endpoint** - FIXED ✓
2. **Database migration not applied** - NEEDS MANUAL ACTION
3. **Missing tables: event_programs, event_exhibitors** - NEEDS MIGRATION

## Step 1: Apply Database Migration to Supabase

**Important**: You must run this SQL in your Supabase dashboard.

1. Go to https://supabase.com/dashboard
2. Select your project (letudiant-fair)
3. Click "SQL Editor" in the left sidebar
4. Click "New query"
5. Copy and paste the entire SQL from `supabase_migration_014.sql`
6. Click "Run"
7. You should see ✓ Success message

### What the migration does:
- ✓ Adds `entry_qr` and `exit_qr` columns to `events` table
- ✓ Creates `event_programs` table for managing salon sessions
- ✓ Creates `event_exhibitors` table for manual exhibitor management
- ✓ Sets up RLS policies so students can read but only admins can write
- ✓ Creates indexes for performance

## Step 2: Verify API Endpoints

All critical endpoints are now in place:

✓ `GET /api/admin/events/[id]` - Fetch salon details
✓ `GET/POST/PATCH/DELETE /api/admin/events/[id]/programs` - Manage sessions
✓ `GET /api/events/[id]/programs` - Public endpoint for students (NEWLY CREATED)
✓ `POST /api/admin/events/[id]/exhibitors` - Manually add schools
✓ `GET /api/admin/schools?q=query` - School autocomplete for exhibitor selection

## Step 3: Verify the Fix

After applying the migration:

1. **Go to admin salon page**: `/admin/salons/{salon-id}`
   - Should load with 5 tabs
   - Can edit details, see exhibitors, view programme

2. **Go to student fair page**: `/(student)/fair/{event-id}`
   - Should show Programme tab with sessions from database
   - Should load without errors

3. **Test Actualités link**: 
   - In student app, look for Services bar
   - "Actualités" tile should link to https://www.letudiant.fr/
   - Should open in new tab with ↗ indicator

## Files Created/Modified

### New Files:
- ✓ `app/api/events/[id]/programs/route.ts` - Public programs endpoint
- ✓ `supabase_migration_014.sql` - Database migration script

### Modified Files:
- `lib/supabase/types.ts` - Added EventProgramRow, entry_qr, exit_qr
- `app/(student)/fair/[eventId]/page.tsx` - Fetches real programmes
- `components/features/ServicesBar.tsx` - Actualités links to letudiant.fr
- `app/admin/salons/[id]/page.tsx` - Complete admin dashboard with CRUD
- `app/api/admin/events/[id]/route.ts` - Fetch/update salon details
- `app/api/admin/events/[id]/programs/route.ts` - Programme CRUD
- `app/api/admin/events/[id]/exhibitors/route.ts` - Exhibitor management
- `app/api/admin/schools/route.ts` - School search for exhibitors

## Troubleshooting

**Still seeing blank page?**

1. Check browser console (F12) for errors
2. Check Supabase logs: Dashboard → Logs
3. Check Next.js server logs in terminal
4. Make sure migration ran successfully (check Supabase for new tables)
5. Clear browser cache: Ctrl+Shift+Delete

**Database tables not showing?**

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
4. Should show: events, schools, users, event_programs, event_exhibitors, etc.

**API returning 500 error?**

1. Check terminal for detailed error message
2. Verify `.env.local` has correct SUPABASE_SERVICE_ROLE_KEY
3. Make sure Supabase connection is working

## Next Steps After Fixes

1. ✓ Apply migration to Supabase
2. ✓ Refresh the app (hard refresh: Ctrl+F5)
3. ✓ Test creating a new salon
4. ✓ Test adding programmes to salon
5. ✓ Test manually adding exhibitors
6. ✓ Test student viewing fair with programmes
7. ✓ Test Actualités link opens letudiant.fr in new tab
