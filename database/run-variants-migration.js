/**
 * Script para ejecutar el esquema de variantes en Supabase
 * INSTRUCCIONES:
 * 1. Asegúrate de que tienes Node.js instalado
 * 2. Instala @supabase/supabase-js: npm install @supabase/supabase-js
 * 3. Ejecuta: node database/run-variants-migration.js
 */

// Importar configuración
const EstudioArtesanaConfig = require('../config.js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase desde config.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = EstudioArtesanaConfig.supabase.url;
const supabaseKey = EstudioArtesanaConfig.supabase.anonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVariantsMigration() {
    console.log('🚀 Iniciando migración del sistema de variantes...');
    
    try {
        // Leer el archivo SQL
        const sqlFile = path.join(__dirname, 'inventory_variants_schema.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        // Dividir el SQL en comandos individuales (separados por ';')
        const sqlCommands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        console.log(`📋 Ejecutando ${sqlCommands.length} comandos SQL...`);
        
        let successCount = 0;
        let errorCount = 0;
        
        // Ejecutar cada comando individualmente
        for (let i = 0; i < sqlCommands.length; i++) {
            const command = sqlCommands[i];
            console.log(`\n⏳ Ejecutando comando ${i + 1}/${sqlCommands.length}...`);
            console.log(`📄 Comando: ${command.substring(0, 80)}${command.length > 80 ? '...' : ''}`);
            
            try {
                const { data, error } = await supabase.rpc('execute_sql', {
                    query: command
                });
                
                if (error) {
                    console.error(`❌ Error en comando ${i + 1}:`, error);
                    errorCount++;
                    
                    // Si es un error de función no encontrada, intentar ejecución directa
                    if (error.message && error.message.includes('execute_sql')) {
                        console.log('⚠️  Intentando método alternativo...');
                        
                        // Para comandos específicos, usar métodos directos de Supabase
                        if (command.includes('ALTER TABLE products')) {
                            console.log('🔧 Ejecutando ALTER TABLE...');
                            // Los ALTER TABLE requieren ser ejecutados desde el panel de Supabase
                            console.log('⚠️  MANUAL: Ejecuta este comando en el SQL Editor de Supabase:');
                            console.log(`   ${command}`);
                        }
                    }
                } else {
                    console.log(`✅ Comando ${i + 1} ejecutado correctamente`);
                    successCount++;
                }
                
                // Pequeña pausa entre comandos
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (err) {
                console.error(`❌ Error inesperado en comando ${i + 1}:`, err);
                errorCount++;
            }
        }
        
        console.log('\n🎯 RESUMEN DE MIGRACIÓN:');
        console.log(`✅ Comandos exitosos: ${successCount}`);
        console.log(`❌ Comandos con errores: ${errorCount}`);
        console.log(`📊 Total comandos: ${sqlCommands.length}`);
        
        if (errorCount > 0) {
            console.log('\n⚠️  NOTA IMPORTANTE:');
            console.log('Algunos comandos fallaron. Esto es normal para:');
            console.log('- Comandos ALTER TABLE (requieren permisos de admin)');
            console.log('- Tablas que ya existen (IF NOT EXISTS)');
            console.log('- Políticas RLS que ya están configuradas');
            console.log('\n📋 PASOS MANUALES REQUERIDOS:');
            console.log('1. Ve al panel de Supabase (supabase.com)');
            console.log('2. Abre el SQL Editor');
            console.log('3. Ejecuta manualmente estos comandos:');
            console.log(`
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS total_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS variant_type VARCHAR(50) DEFAULT NULL;
            `);
        }
        
        console.log('\n🎉 Migración completada. Verifica tu base de datos en Supabase.');
        
    } catch (error) {
        console.error('💥 Error crítico durante la migración:', error);
        
        console.log('\n🛠️  SOLUCIÓN ALTERNATIVA:');
        console.log('1. Ve a supabase.com → Tu proyecto → SQL Editor');
        console.log('2. Copia y pega el contenido completo de database/inventory_variants_schema.sql');
        console.log('3. Ejecuta el script directamente en Supabase');
    }
}

// Verificar conexión a Supabase primero
async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('count', { count: 'exact' })
            .limit(1);
        
        if (error) {
            console.error('❌ Error de conexión a Supabase:', error);
            return false;
        }
        
        console.log('✅ Conexión a Supabase exitosa');
        return true;
    } catch (err) {
        console.error('💥 Error al conectar con Supabase:', err);
        return false;
    }
}

// Ejecutar migración
async function main() {
    console.log('🔍 Verificando conexión a Supabase...');
    
    const isConnected = await testConnection();
    if (!isConnected) {
        console.log('\n❌ No se pudo conectar a Supabase. Verificar:');
        console.log('1. URL y claves en config.js');
        console.log('2. Conexión a internet');
        console.log('3. Configuración de Supabase');
        process.exit(1);
    }
    
    await runVariantsMigration();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

module.exports = { runVariantsMigration };
