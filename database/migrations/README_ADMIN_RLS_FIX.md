# Fix: Admin Panel Concurrent User Issue

## Problem Description

When two admin users are logged in simultaneously, one of them cannot modify inventory (update product variants, stock, etc.). This happens because:

1. **Missing RLS Policies**: The database has Row Level Security (RLS) enabled on all tables, but only has SELECT policies for public users
2. **No Write Permissions**: There are NO INSERT/UPDATE/DELETE policies for admin users
3. **Blocked Operations**: Supabase RLS blocks all write operations by default unless explicitly allowed by a policy

## Root Cause

In `sql/supabase_schema.sql`, the RLS policies only include:
- Public SELECT (read) policies for products, variants, categories, etc.
- User-specific policies for user_profiles, user_sessions, wholesale_applications
- **Missing**: Admin policies for INSERT/UPDATE/DELETE operations on products and variants

This means:
- ✅ Any admin can READ products/variants
- ❌ No admin can UPDATE/INSERT/DELETE products/variants (blocked by RLS)

## Solution

Execute the SQL migration `add_admin_rls_policies.sql` in your Supabase SQL Editor.

### Steps to Fix:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute Migration**
   - **IMPORTANT**: Use `add_admin_rls_policies_safe.sql` (the safe version)
   - Copy the contents of `add_admin_rls_policies_safe.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Success**
   - Check the NOTICES section - you'll see which policies were created
   - Tables that don't exist will be skipped with a message
   - At the end, you'll see a summary table
   - To manually verify policies were created, run:
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public'
   AND policyname LIKE '%Admin%'
   ORDER BY tablename, policyname;
   ```

5. **Test**
   - Log in with two different admin accounts
   - Both should now be able to modify inventory
   - Changes should save successfully without authentication errors

## What the Migration Does

The migration adds RLS policies for admins to:

### Core Tables:
- ✅ `products` - Create, update, delete products
- ✅ `product_variants` - Create, update, delete variants
- ✅ `categories` - Create, update, delete categories

### Supporting Tables:
- ✅ `product_translations` - Create, update, delete translations
- ✅ `product_images` - Create, update, delete images
- ✅ `product_categories` - Create, delete product-category relations
- ✅ `attributes` - Create, update, delete attributes
- ✅ `attribute_values` - Create, update, delete attribute values
- ✅ `variant_attributes` - Create, delete variant-attribute relations

### How It Works:

Each policy checks if the authenticated user is an admin:
```sql
EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'Admin'
)
```

This ensures:
- Only authenticated users with `role = 'Admin'` can perform write operations
- The check is done at the database level (secure)
- Multiple admins can work simultaneously without conflicts

## Additional Fixes

The logout fix in `admin-auth-guard.js` ensures:
- Proper session cleanup when logging out
- No session conflicts between different admin users
- Correct redirect to login page after logout

## Testing Checklist

After applying the migration:

- [ ] Log in as Admin User 1
- [ ] Log in as Admin User 2 (different browser/incognito)
- [ ] Both users can see inventory
- [ ] Admin User 1 can update variant stock
- [ ] Admin User 2 can update variant stock
- [ ] Both users can create new products
- [ ] Both users can delete products
- [ ] No authentication errors in console
- [ ] Changes persist after page refresh

## Troubleshooting

### If you still get authentication errors:

1. **Check user role in database:**
   ```sql
   SELECT id, email, role FROM user_profiles WHERE email = 'your-admin-email@example.com';
   ```
   Make sure `role` is exactly `'Admin'` (case-sensitive)

2. **Verify policies were created:**
   ```sql
   SELECT COUNT(*) FROM pg_policies WHERE policyname LIKE '%Admin%';
   ```
   Should return at least 30+ policies

3. **Check session is authenticated:**
   - Open browser console
   - Look for "✅ Authenticated session confirmed:" messages
   - If you see "⚠️ No authenticated session found", log out and log in again

4. **Clear browser data:**
   - Clear localStorage: `localStorage.clear()`
   - Clear cookies for your domain
   - Log out and log in again

## Prevention

To prevent similar issues in the future:

1. **Always define RLS policies** when enabling RLS on tables
2. **Test with multiple users** to catch concurrent access issues
3. **Check RLS policies** for each user role (Admin, Mayorista, Usuario)
4. **Monitor console logs** for authentication and RLS-related errors

## Related Files

- `database/migrations/add_admin_rls_policies.sql` - The migration to fix the issue
- `admin/admin-auth-guard.js` - Session management and logout fixes
- `sql/supabase_schema.sql` - Original schema (needs updating with these policies)
