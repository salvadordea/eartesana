const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listBucketContents(path = '', depth = 0) {
  try {
    const { data: files, error } = await supabase
      .storage
      .from('product-images')
      .list(path, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (error) {
      console.error(`❌ Error listando ${path}:`, error);
      return [];
    }

    const allFiles = [];
    const indent = '  '.repeat(depth);

    for (const file of files) {
      const fullPath = path ? `${path}/${file.name}` : file.name;
      const isFolder = file.name.endsWith('/') || !file.name.includes('.');
      
      if (isFolder) {
        console.log(`${indent}📁 ${file.name}`);
        // Recursivamente listar contenido de carpetas
        const subFiles = await listBucketContents(fullPath.replace(/\/$/, ''), depth + 1);
        allFiles.push(...subFiles);
      } else {
        console.log(`${indent}🖼️ ${file.name} (${Math.round(file.metadata?.size / 1024 || 0)}KB)`);
        allFiles.push({
          path: fullPath,
          name: file.name,
          size: file.metadata?.size || 0,
          parent: path
        });
      }
    }

    return allFiles;
  } catch (error) {
    console.error(`❌ Error general listando ${path}:`, error);
    return [];
  }
}

async function analyzeBucketStructure() {
  console.log('📂 ESTRUCTURA COMPLETA DEL BUCKET PRODUCT-IMAGES');
  console.log('================================================\n');

  const allFiles = await listBucketContents();

  console.log('\n📊 RESUMEN:');
  console.log(`📄 Total de archivos: ${allFiles.length}`);
  
  // Agrupar por carpeta padre
  const folderStats = {};
  allFiles.forEach(file => {
    const folder = file.parent || 'raíz';
    if (!folderStats[folder]) {
      folderStats[folder] = { count: 0, totalSize: 0 };
    }
    folderStats[folder].count++;
    folderStats[folder].totalSize += file.size;
  });

  console.log('\n📁 ESTADÍSTICAS POR CARPETA:');
  Object.entries(folderStats).forEach(([folder, stats]) => {
    console.log(`   ${folder}: ${stats.count} archivos (${Math.round(stats.totalSize / 1024)}KB total)`);
  });

  // Analizar tipos de archivo
  const extensions = {};
  allFiles.forEach(file => {
    const ext = file.name.split('.').pop().toLowerCase();
    extensions[ext] = (extensions[ext] || 0) + 1;
  });

  console.log('\n🎨 TIPOS DE ARCHIVO:');
  Object.entries(extensions).forEach(([ext, count]) => {
    console.log(`   .${ext}: ${count} archivos`);
  });

  // Mostrar algunos ejemplos de nombres de archivos
  console.log('\n📝 EJEMPLOS DE NOMBRES DE ARCHIVOS:');
  const examples = allFiles.slice(0, 20);
  examples.forEach(file => {
    console.log(`   ${file.parent ? file.parent + '/' : ''}${file.name}`);
  });

  return allFiles;
}

analyzeBucketStructure();
