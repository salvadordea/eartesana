/**
 * LIMPIEZA DE CATEGORÍAS NO UTILIZADAS EN SUPABASE
 * ===============================================
 * Script para eliminar categorías que no tienen productos asignados
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// ==========================================
// CONFIGURACIÓN
// ==========================================

const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTg5MzUsImV4cCI6MjA3MzUzNDkzNX0.qEijwK3FlnqXP2qw0gl438Tt-Rd1vrfts1cXslUuteU';

const SUPABASE_HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
};

// ==========================================
// CATEGORÍAS SOSPECHOSAS A REVISAR
// ==========================================

const SUSPICIOUS_CATEGORIES = [
    'Aretes de Piel',
    'Brazaletes', 
    'Carteras',
    'Llaveros',
    'Monederos',
    'Ovaladas'
];

// ==========================================
// CLASE LIMPIADORA
// ==========================================

class CategoryCleaner {
    constructor() {
        this.stats = {
            categoriesAnalyzed: 0,
            categoriesWithProducts: 0,
            categoriesEmpty: 0,
            categoriesDeleted: 0,
            errors: 0
        };
    }

    async cleanUnusedCategories() {
        console.log('🧹 INICIANDO LIMPIEZA DE CATEGORÍAS NO UTILIZADAS');
        console.log('================================================\n');

        try {
            // 1. Obtener todas las categorías
            const categories = await this.getAllCategories();
            
            // 2. Analizar cada categoría sospechosa
            await this.analyzeSuspiciousCategories(categories);
            
            // 3. Mostrar estadísticas
            this.showStats();
            
            console.log('\n✅ LIMPIEZA COMPLETADA!');
            
        } catch (error) {
            console.error('❌ Error en la limpieza:', error);
        }
    }

    async getAllCategories() {
        console.log('📂 Obteniendo todas las categorías...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,name`, {
            method: 'GET',
            headers: SUPABASE_HEADERS
        });

        if (!response.ok) {
            throw new Error(`Error obteniendo categorías: ${response.status}`);
        }

        const categories = await response.json();
        console.log(`✅ ${categories.length} categorías encontradas\n`);
        
        return categories;
    }

    async analyzeSuspiciousCategories(categories) {
        console.log('🔍 Analizando categorías sospechosas...\n');
        
        for (const suspiciousName of SUSPICIOUS_CATEGORIES) {
            this.stats.categoriesAnalyzed++;
            
            // Buscar la categoría por nombre
            const category = categories.find(cat => cat.name === suspiciousName);
            
            if (!category) {
                console.log(`⚠️  Categoría "${suspiciousName}" no encontrada en la base de datos`);
                continue;
            }

            console.log(`📂 Analizando: "${category.name}" (ID: ${category.id})`);
            
            // Verificar si tiene productos asignados
            const hasProducts = await this.categoryHasProducts(category.id);
            
            if (hasProducts) {
                this.stats.categoriesWithProducts++;
                console.log(`  ✅ CONSERVAR - Tiene productos asignados\n`);
            } else {
                this.stats.categoriesEmpty++;
                console.log(`  🗑️  VACÍA - Sin productos asignados`);
                
                // Eliminar la categoría vacía
                const deleted = await this.deleteCategory(category.id, category.name);
                if (deleted) {
                    this.stats.categoriesDeleted++;
                    console.log(`  ✅ ELIMINADA exitosamente\n`);
                } else {
                    this.stats.errors++;
                    console.log(`  ❌ Error al eliminar\n`);
                }
            }
        }
    }

    async categoryHasProducts(categoryId) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/product_categories?category_id=eq.${categoryId}&limit=1`, {
                method: 'GET',
                headers: SUPABASE_HEADERS
            });

            if (!response.ok) {
                console.log(`    ⚠️ Error verificando productos para categoría ${categoryId}`);
                return true; // Por seguridad, asumimos que tiene productos si hay error
            }

            const relations = await response.json();
            return relations.length > 0;

        } catch (error) {
            console.log(`    ⚠️ Error verificando productos: ${error.message}`);
            return true; // Por seguridad
        }
    }

    async deleteCategory(categoryId, categoryName) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${categoryId}`, {
                method: 'DELETE',
                headers: SUPABASE_HEADERS
            });

            return response.ok;

        } catch (error) {
            console.log(`    ❌ Error eliminando "${categoryName}": ${error.message}`);
            return false;
        }
    }

    showStats() {
        console.log('📊 ESTADÍSTICAS DE LIMPIEZA:');
        console.log('============================');
        console.log(`🔍 Categorías analizadas: ${this.stats.categoriesAnalyzed}`);
        console.log(`📦 Con productos: ${this.stats.categoriesWithProducts}`);
        console.log(`📭 Vacías encontradas: ${this.stats.categoriesEmpty}`);
        console.log(`🗑️ Eliminadas: ${this.stats.categoriesDeleted}`);
        console.log(`❌ Errores: ${this.stats.errors}`);
    }
}

// ==========================================
// EJECUTAR LIMPIEZA
// ==========================================

async function main() {
    console.log('ESTUDIO ARTESANA - LIMPIEZA DE CATEGORÍAS');
    console.log('========================================\n');
    
    const cleaner = new CategoryCleaner();
    await cleaner.cleanUnusedCategories();
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CategoryCleaner };
