/**
 * delete-bucket-folders.cjs
 * Elimina recursivamente rutas específicas dentro del bucket de Supabase Storage.
 * 
 * Uso (PowerShell):
 *   $env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE="YOUR_SERVICE_ROLE_KEY"
 *   node delete-bucket-folders.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const BUCKET = process.env.BUCKET_NAME || 'product-images';
const FOLDERS = (process.env.TARGET_FOLDERS || 'Joyeria,full,products')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY; // prefiera SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE (o SUPABASE_KEY).');
  console.error('Ejemplo PowerShell:\n  $env:SUPABASE_URL="https://xxxxx.supabase.co"\n  $env:SUPABASE_SERVICE_ROLE="eyJ..."');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listAllPathsRecursive(bucket, prefix) {
  // Normalizar prefijo sin slash inicial ni final
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '');
  const files = [];

  async function walk(path) {
    // path puede ser '' o 'Joyeria' o 'Joyeria/sub'
    const { data, error } = await supabase.storage.from(bucket).list(path || undefined, { limit: 1000 });
    if (error) {
      // Si la carpeta no existe, salimos silenciosamente
      if (error.message && /not found/i.test(error.message)) return;
      console.warn(`Advertencia al listar ${bucket}/${path || ''}:`, error.message || error);
      return;
    }

    for (const item of data || []) {
      const itemPath = [path, item.name].filter(Boolean).join('/');
      // Heurística: si tiene "metadata" y size > 0, es archivo
      const isFile = item.id || (item.metadata && typeof item.metadata.size === 'number');
      if (isFile) {
        files.push(itemPath);
      } else {
        // Es carpeta, recursar
        await walk(itemPath);
      }
    }
  }

  await walk(cleanPrefix);
  return files;
}

async function removeInBatches(bucket, paths, batchSize = 100) {
  let removed = 0;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { data, error } = await supabase.storage.from(bucket).remove(batch);
    if (error) {
      throw new Error(`Error al eliminar batch ${i / batchSize + 1}: ${error.message || error}`);
    }
    removed += batch.length;
    console.log(`   Eliminados ${removed}/${paths.length} ...`);
  }
  return removed;
}

async function main() {
  console.log('🗑️  Eliminación de carpetas en Supabase Storage');
  console.log('===============================================');
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Rutas objetivo: ${FOLDERS.join(', ')}`);

  // Validar bucket existe
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  if (bucketsErr) throw bucketsErr;
  const exists = (buckets || []).some((b) => b.name === BUCKET);
  if (!exists) throw new Error(`Bucket "${BUCKET}" no existe.`);
  console.log('✅ Bucket confirmado');

  let totalToDelete = 0;
  let totalDeleted = 0;

  for (const folder of FOLDERS) {
    console.log(`\n🔍 Listando ${folder}/ ...`);
    const files = await listAllPathsRecursive(BUCKET, folder);
    if (!files.length) {
      console.log(`   (No hay archivos bajo ${folder}/)`);
      continue;
    }
    console.log(`   Se encontraron ${files.length} archivos para eliminar en ${folder}/`);
    totalToDelete += files.length;

    const removed = await removeInBatches(BUCKET, files, 100);
    totalDeleted += removed;
    console.log(`   ✅ Eliminados ${removed} archivos en ${folder}/`);
  }

  console.log('\n📊 Resumen');
  console.log('-----------');
  console.log(`Total programado para eliminar: ${totalToDelete}`);
  console.log(`Total eliminado: ${totalDeleted}`);
  console.log('✔️  Completado');
}

main().catch((err) => {
  console.error('❌ Error:', err.message || err);
  process.exit(1);
});

