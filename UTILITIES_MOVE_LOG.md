# Utilities Move Log - Estudio Artesana

**Date:** 2025-09-29
**Action:** Moved utility scripts to `utilities/` folder for better organization

## Files Moved

The following utility scripts were moved from the root directory to `utilities/`:

### Database & Migration Scripts
- `clean-unused-categories.js` → `utilities/clean-unused-categories.js`
- `migrate-to-supabase.js` → `utilities/migrate-to-supabase.js`
- `setup-supabase-storage.js` → `utilities/setup-supabase-storage.js`
- `test-supabase-connection.js` → `utilities/test-supabase-connection.js`

### Image & Media Processing
- `fix-category-images.js` → `utilities/fix-category-images.js`
- `update-image-urls.js` → `utilities/update-image-urls.js`
- `upload-images-to-storage.js` → `utilities/upload-images-to-storage.js`
- `convert-bucket-to-jpg.js` → `utilities/convert-bucket-to-jpg.js`

### Data Analysis & Fixes
- `get_products_with_variants.js` → `utilities/get_products_with_variants.js`
- `fix-api-inconsistencies.js` → `utilities/fix-api-inconsistencies.js`
- `reorganize-categories.js` → `utilities/reorganize-categories.js`

### Development & Demo
- `start-demo-simple.js` → `utilities/start-demo-simple.js`
- `start-full-demo.js` → `utilities/start-full-demo.js`

### Diagnostic Tools
- `diagnose-complete.js` → `utilities/diagnose-complete.js`
- `diagnose-api-keys.js` → `utilities/diagnose-api-keys.js`

## Files That Remained in Root

The following files remained in the root as they are active parts of the site:
- `config.js` - Main configuration file (active)
- All files in `assets/js/` - Website functionality
- All files in `admin/` - Admin panel functionality

## Usage After Move

To run any utility script after this move, use:
```bash
node utilities/script-name.js
```

For example:
```bash
node utilities/diagnose-complete.js
node utilities/test-supabase-connection.js
```

## Rollback Instructions (If Needed)

If any issues arise, you can move the files back to root with:
```bash
mv utilities/*.js .
rmdir utilities
```

## Git Status Before Move

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   assets/css/sobre-nosotros.css
	modified:   assets/js/translation-system.js
	modified:   pages/sobre-nosotros/index.html
	deleted:    server-local.bat
	deleted:    start-servers.bat

no changes added to commit (use "git add" and/or "git commit -a")
```

## Test & Debug Files Move

**Date:** 2025-09-29 (same session)
**Action:** Moved test and debug HTML files to `tests/` folder

### Test Files Moved to tests/
- `test-api.html` → `tests/test-api.html`
- `test-autocomplete.html` → `tests/test-autocomplete.html`
- `test-contact-data-system.html` → `tests/test-contact-data-system.html`
- `test-footer-universal.html` → `tests/test-footer-universal.html`
- `test-header-links.html` → `tests/test-header-links.html`
- `test-language-selector.html` → `tests/test-language-selector.html`
- `test-login.html` → `tests/test-login.html`
- `test-multi-format-support.html` → `tests/test-multi-format-support.html`

### Debug Files Moved to tests/
- `debug-full.html` → `tests/debug-full.html`
- `debug-header.html` → `tests/debug-header.html`
- `debug-woo.html` → `tests/debug-woo.html`
- `debug-woocommerce.html` → `tests/debug-woocommerce.html`
- `diagnostic.html` → `tests/diagnostic.html`
- `investigate_tables.html` → `tests/investigate_tables.html`

### Files That Remained in Root
Active site pages stayed in root:
- `index.html` - Main homepage
- `producto.html` - Product page template
- `checkout.html` - Checkout page
- `auth.html` - Authentication page
- `micuenta.html` / `mi-cuenta.html` - Account pages
- `monedero_motita_page.html` - Wallet page

## Usage After Move

To access test/debug files after this move:
```bash
# Open in browser
tests/test-api.html
tests/debug-woo.html
```

## SQL Files Move

**Date:** 2025-09-29 (same session)
**Action:** Moved SQL files from root to `sql/` directory for better organization

### SQL Files Moved to sql/
- `schema.sql` → `sql/schema.sql` (Main database schema)
- `supabase_schema.sql` → `sql/supabase_schema.sql` (Supabase-specific schema)
- `verificacion-esquema.sql` → `sql/verificacion-esquema.sql` (Schema verification queries)
- `usuarios-prueba.sql` → `sql/usuarios-prueba.sql` (Test user creation script)

### Existing Files in sql/
- `create_wholesalers_table.sql` - Wholesaler table creation
- `fix_wholesalers_rls.sql` - Row Level Security fixes
- `wholesale_database.sql` - Wholesale database setup

All database-related files are now consolidated in the `sql/` directory.

## Notes

- All utility scripts are one-time use or maintenance scripts
- All test/debug HTML files are development tools, not production pages
- All SQL files are now organized in the sql/ directory for easier database management
- This move improves project organization by separating development/testing files from active site code
- The active website functionality remains unchanged