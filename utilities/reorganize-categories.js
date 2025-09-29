/**
 * REORGANIZACIÓN DE CATEGORÍAS Y PRODUCTOS EN SUPABASE
 * ===================================================
 * Script para corregir las relaciones entre productos y categorías
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
// ESTRUCTURA CORRECTA DE CATEGORÍAS
// ==========================================

const CORRECT_STRUCTURE = {
    "Joyeria": [
        "Brazalete Piel Pelo",
        "Brazalete Liso",
        "Brazalete lineas Delgadas", // Nota: minúscula en "lineas" según los datos migrados
        "Brazalete Hombre",
        "Brazalete dos Lineas", // Nota: minúscula en "dos" según los datos migrados
        "Arete Piel Poligono Chico", // Nota: sin tilde en "Poligono" según los datos migrados
        "Arete Geometrico Gigante", // Nota: sin tilde en "Geometrico" según los datos migrados
        "Arete Piel Péndulo",
        "Arete Piel Gota",
        "Arete Piel Balancín Oval",
        "Arete polígono grande" // Nota: minúscula inicial según los datos migrados
    ],
    "Accesorios": [
        "Monedero Motita",
        "Monedero Clip",
        "Monedero Cierre",
        "Tarjetero Boton", // Nota: sin tilde en "Boton" según los datos migrados
        "Llavero Corto",
        "Portapasaportes",
        "Portacables Grande",
        "Cartera Liga",
        "Portacable Chico",
        "Cartera con Costura",
        "Llavero Largo", // Agregado según los datos migrados
        "Monedero Triángulo" // Agregado según los datos migrados
    ],
    "Bolsas de mano": [ // Nota: minúscula en "mano" según los datos migrados
        "Cartera tipo Sobre",
        "Bolsa Ovalada lisa" // Nota: minúscula en "lisa" según los datos migrados
    ],
    "Bolsas de Textil y Piel": [
        "Bolsa Cilindro Jareta",
        "Bolsa de Playa Gigante",
        "Bolsa de Playa mediana", // Nota: minúscula en "mediana" según los datos migrados
        "Bolsa Telar de pedal cruzada" // Nota: minúsculas según los datos migrados
    ],
    "Bolsas Cruzadas": [
        "Clutch Chica con Base",
        "Clutch Chica Plana",
        "Cangurera",
        "Bolsa Mediana con bolsillo piel al frente", // Nota: minúsculas según los datos migrados
        "Bolsa botón madera", // Nota: minúsculas según los datos migrados
        "Clutch Grande con strap" // Nota: minúscula en "strap" según los datos migrados
    ],
    "Portacel": [
        "Portacel Piel liso", // Nota: minúscula en "liso" según los datos migrados
        "Portacel Piel Textil",
        "Portacel Pelo",
        "Portacel grande" // Nota: minúscula en "grande" según los datos migrados
    ],
    "Bolsas Grandes": [
        "Bolsa Gigante horizontal", // Nota: minúscula en "horizontal" según los datos migrados
        "Bolsa Gigante Vertical",
        "Bolsa grande con Jareta", // Nota: minúscula en "grande" según los datos migrados
        "Bolsas Gigante Plana", // Nota: plural "Bolsas" según los datos migrados
        "Bolsa Gigante vertical Pelo y Miel" // Nota: minúscula en "vertical" según los datos migrados
    ],
    "Backpacks": [
        "Backpack Mini"
    ],
    "Botelleras": [
        "Botelleras" // Nota: nombre del producto según los datos migrados
    ],
    "Hogar": [
        "Portavasos"
    ],
    "Vestimenta": []
};

// ==========================================
// CLASE REORGANIZADORA
// ==========================================

class CategoryReorganizer {
    constructor() {
        this.categories = new Map();
        this.products = new Map();
        this.stats = {
            categoriesProcessed: 0,
            productsReorganized: 0,
            relationshipsDeleted: 0,
            relationshipsCreated: 0,
            errors: 0
        };
    }

    async reorganize() {
        console.log('🔄 INICIANDO REORGANIZACIÓN DE CATEGORÍAS');
        console.log('==========================================\n');

        try {
            // 1. Obtener categorías y productos actuales
            await this.loadCurrentData();
            
            // 2. Limpiar relaciones existentes
            await this.clearExistingRelations();
            
            // 3. Crear nuevas relaciones correctas
            await this.createCorrectRelations();
            
            // 4. Mostrar estadísticas
            this.showStats();
            
            console.log('\n✅ REORGANIZACIÓN COMPLETADA EXITOSAMENTE!');
            
        } catch (error) {
            console.error('❌ Error en la reorganización:', error);
        }
    }

    async loadCurrentData() {
        console.log('📂 Cargando datos actuales...');
        
        // Cargar categorías
        const categoriesResponse = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
            method: 'GET',
            headers: SUPABASE_HEADERS
        });
        
        if (!categoriesResponse.ok) {
            throw new Error(`Error cargando categorías: ${categoriesResponse.status}`);
        }
        
        const categories = await categoriesResponse.json();
        categories.forEach(cat => {
            this.categories.set(cat.name, cat.id);
        });
        
        // Cargar productos
        const productsResponse = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
            method: 'GET',
            headers: SUPABASE_HEADERS
        });
        
        if (!productsResponse.ok) {
            throw new Error(`Error cargando productos: ${productsResponse.status}`);
        }
        
        const products = await productsResponse.json();
        products.forEach(product => {
            this.products.set(product.name, product.id);
        });
        
        console.log(`✅ ${categories.length} categorías y ${products.length} productos cargados`);
    }

    async clearExistingRelations() {
        console.log('\n🧹 Limpiando relaciones existentes...');
        
        // Primero obtener todas las relaciones existentes
        const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/product_categories`, {
            method: 'GET',
            headers: SUPABASE_HEADERS
        });

        if (!getResponse.ok) {
            throw new Error(`Error obteniendo relaciones: ${getResponse.status}`);
        }

        const relations = await getResponse.json();
        console.log(`📊 Encontradas ${relations.length} relaciones existentes`);

        // Eliminar todas las relaciones una por una
        let deletedCount = 0;
        for (const relation of relations) {
            try {
                const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/product_categories?id=eq.${relation.id}`, {
                    method: 'DELETE',
                    headers: SUPABASE_HEADERS
                });

                if (deleteResponse.ok) {
                    deletedCount++;
                }
            } catch (error) {
                console.log(`⚠️  Error eliminando relación ${relation.id}: ${error.message}`);
            }
        }

        this.stats.relationshipsDeleted = deletedCount;
        console.log(`✅ ${deletedCount} relaciones eliminadas`);
    }

    async createCorrectRelations() {
        console.log('\n🔗 Creando relaciones correctas...');

        for (const [categoryName, productNames] of Object.entries(CORRECT_STRUCTURE)) {
            this.stats.categoriesProcessed++;
            
            const categoryId = this.categories.get(categoryName);
            if (!categoryId) {
                console.log(`⚠️  Categoría "${categoryName}" no encontrada`);
                this.stats.errors++;
                continue;
            }

            console.log(`\n📂 Procesando categoría: ${categoryName}`);

            for (const productName of productNames) {
                const productId = this.products.get(productName);
                
                if (!productId) {
                    console.log(`  ⚠️  Producto "${productName}" no encontrado`);
                    this.stats.errors++;
                    continue;
                }

                try {
                    // Crear relación producto-categoría
                    const relationResponse = await fetch(`${SUPABASE_URL}/rest/v1/product_categories`, {
                        method: 'POST',
                        headers: {
                            ...SUPABASE_HEADERS,
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            product_id: productId,
                            category_id: categoryId
                        })
                    });

                    if (!relationResponse.ok) {
                        const errorText = await relationResponse.text();
                        console.log(`  ❌ Error relacionando "${productName}": ${errorText}`);
                        this.stats.errors++;
                    } else {
                        console.log(`  ✅ "${productName}" → "${categoryName}"`);
                        this.stats.relationshipsCreated++;
                        this.stats.productsReorganized++;
                    }

                } catch (error) {
                    console.log(`  ❌ Error con "${productName}": ${error.message}`);
                    this.stats.errors++;
                }
            }
        }
    }

    showStats() {
        console.log('\n📊 ESTADÍSTICAS DE REORGANIZACIÓN:');
        console.log('==================================');
        console.log(`📂 Categorías procesadas: ${this.stats.categoriesProcessed}`);
        console.log(`📦 Productos reorganizados: ${this.stats.productsReorganized}`);
        console.log(`🗑️  Relaciones eliminadas: ${this.stats.relationshipsDeleted}`);
        console.log(`🔗 Relaciones creadas: ${this.stats.relationshipsCreated}`);
        console.log(`❌ Errores: ${this.stats.errors}`);
        
        const successRate = this.stats.relationshipsCreated > 0 
            ? ((this.stats.relationshipsCreated / (this.stats.relationshipsCreated + this.stats.errors)) * 100).toFixed(1)
            : '0';
        console.log(`📈 Tasa de éxito: ${successRate}%`);
    }
}

// ==========================================
// EJECUTAR REORGANIZACIÓN
// ==========================================

async function main() {
    console.log('ESTUDIO ARTESANA - REORGANIZACIÓN DE CATEGORÍAS');
    console.log('===============================================\n');
    
    const reorganizer = new CategoryReorganizer();
    await reorganizer.reorganize();
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CategoryReorganizer };
