# Quick Fix Guide - Admin Cannot Modify Inventory

## The Problem
Multiple admin users logged in at the same time → one admin cannot modify inventory (gets blocked).

## The Solution (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" → "New Query"

### Step 2: Copy & Run This Migration
Copy the contents of: **`add_admin_rls_policies_safe.sql`**

Or use this direct link in your repository:
```
database/migrations/add_admin_rls_policies_safe.sql
```

### Step 3: Execute
- Paste the SQL into the editor
- Click "Run" (or Ctrl+Enter)
- Wait for completion

### Step 4: Verify
You should see:
- ✅ NOTICES showing which policies were created
- ✅ A summary table at the end
- ✅ "Tabla attributes no existe, saltando..." (if attributes table doesn't exist - this is OK!)

Example output:
```
NOTICE: ✓ Política Admins can create products creada en tabla products
NOTICE: ✓ Política Admins can update products creada en tabla products
NOTICE: ✓ Política Admins can create product_variants creada en tabla product_variants
NOTICE: ✓ Política Admins can update product_variants creada en tabla product_variants
NOTICE: Tabla attributes no existe, saltando...
...

 schemaname |     tablename      |           policyname
------------+--------------------+---------------------------------
 public     | products           | Admins can create products
 public     | products           | Admins can update products
 public     | product_variants   | Admins can update product_variants
 ...
```

### Step 5: Test
1. Log in as Admin 1
2. Log in as Admin 2 (different browser)
3. Both can now modify inventory! ✅

## What If It Doesn't Work?

### Check Admin Role
```sql
SELECT id, email, role FROM user_profiles WHERE email = 'your-email@example.com';
```
Make sure `role` = `'Admin'` (exactly, case-sensitive)

### Clear Browser Session
1. Open browser console (F12)
2. Run: `localStorage.clear()`
3. Log out and log in again

### Verify Policies Were Created
```sql
SELECT COUNT(*) FROM pg_policies WHERE policyname LIKE '%Admin%';
```
Should return at least 10+ policies

## Why This Works

**Before**: RLS was enabled but admins had no permission to UPDATE → blocked ❌

**After**: Admins have explicit INSERT/UPDATE/DELETE policies → allowed ✅

The migration creates policies that check:
```sql
EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'Admin')
```

If you're an admin → you can write to the database.
If you're not an admin → you cannot write (security).

## Files

- **Migration**: `database/migrations/add_admin_rls_policies_safe.sql`
- **Detailed Guide**: `database/migrations/README_ADMIN_RLS_FIX.md`
- **Full Summary**: `ADMIN_CONCURRENT_ACCESS_FIX.md`

## Support

Still having issues? Check the detailed guide in `README_ADMIN_RLS_FIX.md`
