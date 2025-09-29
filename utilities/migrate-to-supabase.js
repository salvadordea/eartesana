/**
 * MIGRACIÓN DE DATOS A SUPABASE
 * =============================
 * Script para migrar todos los productos desde tu API local a Supabase
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// ==========================================
// CONFIGURACIÓN
// ==========================================

// Tu API local
const LOCAL_API_URL = 'http://localhost:3001/api';

// Supabase - CREDENCIALES REALES
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTg5MzUsImV4cCI6MjA3MzUzNDkzNX0.qEijwK3FlnqXP2qw0gl438Tt-Rd1vrfts1cXslUuteU';

// Headers para Supabase
const SUPABASE_HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
};

// ==========================================
// FUNCIONES DE MIGRACIÓN
// ==========================================

class DataMigrator {
    constructor() {
        this.categoryMap = new Map(); // Mapeo de IDs viejos a nuevos
        this.stats = {
            categories: { processed: 0, created: 0, errors: 0 },
            products: { processed: 0, created: 0, errors: 0 },
            variants: { processed: 0, created: 0, errors: 0 },
            images: { processed: 0, created: 0, errors: 0 }
        };
    }

    async migrate() {
        console.log('🚀 Iniciando migración de datos...\n');
        
        try {
            // 1. Migrar categorías
            await this.migrateCategories();
            
            // 2. Migrar productos
            await this.migrateProducts();
            
            // 3. Mostrar estadísticas finales
            this.showStats();
            
            console.log('\n✅ Migración completada exitosamente!');
        } catch (error) {
            console.error('❌ Error en la migración:', error);
        }
    }

    async migrateCategories() {
        console.log('📂 Migrando categorías...');
        
        try {
            const response = await fetch(`${LOCAL_API_URL}/categorias`);
            const categories = await response.json();
            
            for (const category of categories) {
                this.stats.categories.processed++;
                
                try {
                    const supabaseCategory = {
                        name: category.name,
                        slug: category.slug || this.slugify(category.name),
                        description: category.description || '',
                        image_url: category.image || null,
                        display_order: category.display_order || 0,
                        is_active: true
                    };

                    const result = await this.insertToSupabase('categories', supabaseCategory);
                    
                    if (result && result.length > 0) {
                        // Mapear ID viejo -> ID nuevo
                        this.categoryMap.set(category.id, result[0].id);
                        this.stats.categories.created++;
                        console.log(`  ✅ Categoría "${category.name}" creada (ID: ${result[0].id})`);
                    }
                } catch (error) {
                    this.stats.categories.errors++;
                    console.log(`  ❌ Error con categoría "${category.name}": ${error.message}`);
                }
            }
            
            console.log(`📂 Categorías: ${this.stats.categories.created}/${this.stats.categories.processed} migradas\n`);
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
        }
    }

    async migrateProducts() {
        console.log('📦 Migrando productos...');
        
        try {
            const response = await fetch(`${LOCAL_API_URL}/productos`);
            const data = await response.json();
            const products = data.products || data;
            
            for (const product of products) {
                this.stats.products.processed++;
                
                try {
                    // 1. Crear el producto base
                    const supabaseProduct = {
                        name: product.name,
                        slug: product.slug || this.slugify(product.name),
                        description: product.description || '',
                        short_description: product.shortDescription || '',
                        price: parseFloat(product.price) || 0,
                        regular_price: parseFloat(product.regularPrice) || null,
                        sale_price: parseFloat(product.salePrice) || null,
                        on_sale: product.onSale || false,
                        type: product.type || 'variable',
                        status: product.status === 'active' ? 'active' : 'active',
                        featured: product.featured || false,
                        in_stock: product.inStock !== false,
                        total_sales: product.totalSales || 0,
                        average_rating: parseFloat(product.averageRating) || 4.8,
                        main_image_url: this.cleanImageUrl(product.mainImage),
                        permalink: product.permalink || ''
                    };

                    const productResult = await this.insertToSupabase('products', supabaseProduct);
                    
                    if (productResult && productResult.length > 0) {
                        const newProductId = productResult[0].id;
                        this.stats.products.created++;
                        console.log(`  ✅ Producto "${product.name}" creado (ID: ${newProductId})`);

                        // 2. Migrar categorías del producto
                        await this.migrateProductCategories(product, newProductId);
                        
                        // 3. Migrar imágenes
                        await this.migrateProductImages(product, newProductId);
                        
                        // 4. Migrar variantes
                        await this.migrateProductVariants(product, newProductId);
                    }
                } catch (error) {
                    this.stats.products.errors++;
                    console.log(`  ❌ Error con producto "${product.name}": ${error.message}`);
                }
            }
            
            console.log(`📦 Productos: ${this.stats.products.created}/${this.stats.products.processed} migrados\n`);
        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
        }
    }

    async migrateProductCategories(product, productId) {
        if (!product.categories || product.categories.length === 0) return;

        for (const oldCategoryId of product.categories) {
            const newCategoryId = this.categoryMap.get(oldCategoryId);
            if (newCategoryId) {
                try {
                    await this.insertToSupabase('product_categories', {
                        product_id: productId,
                        category_id: newCategoryId
                    });
                } catch (error) {
                    console.log(`    ❌ Error relacionando categoría: ${error.message}`);
                }
            }
        }
    }

    async migrateProductImages(product, productId) {
        if (!product.images || product.images.length === 0) return;

        for (let i = 0; i < product.images.length; i++) {
            this.stats.images.processed++;
            
            try {
                const image = product.images[i];
                let imageUrl = '';
                let altText = '';

                // Parsear imagen (puede ser string u objeto)
                if (typeof image === 'string') {
                    if (image.startsWith('@{')) {
                        // Parsear formato "@{id=659; src=https://...}"
                        const srcMatch = image.match(/src=([^;]+)/);
                        const altMatch = image.match(/alt=([^;]+)/);
                        imageUrl = srcMatch ? srcMatch[1] : '';
                        altText = altMatch ? altMatch[1] : product.name;
                    } else {
                        imageUrl = image;
                        altText = product.name;
                    }
                } else if (image && image.src) {
                    imageUrl = image.src;
                    altText = image.alt || product.name;
                }

                if (imageUrl) {
                    await this.insertToSupabase('product_images', {
                        product_id: productId,
                        image_url: this.cleanImageUrl(imageUrl),
                        alt_text: altText,
                        display_order: i
                    });
                    this.stats.images.created++;
                }
            } catch (error) {
                this.stats.images.errors++;
                console.log(`    ❌ Error con imagen: ${error.message}`);
            }
        }
    }

    async migrateProductVariants(product, productId) {
        if (!product.variations || product.variations.length === 0) return;

        for (const variation of product.variations) {
            this.stats.variants.processed++;
            
            try {
                let variantData = {};
                
                // Parsear variación (puede ser string u objeto)
                if (typeof variation === 'string' && variation.startsWith('@{')) {
                    // Parsear formato "@{id=660-0; name=Blanco; price=430; stock=7; image=}"
                    const idMatch = variation.match(/id=([^;]+)/);
                    const nameMatch = variation.match(/name=([^;]+)/);
                    const priceMatch = variation.match(/price=([^;]+)/);
                    const stockMatch = variation.match(/stock=([^;}]+)/);
                    
                    variantData = {
                        id: idMatch ? idMatch[1] : `${productId}-${Math.random()}`,
                        name: nameMatch ? nameMatch[1] : 'Estándar',
                        price: priceMatch ? parseFloat(priceMatch[1]) : product.price,
                        stock: stockMatch ? parseInt(stockMatch[1]) : 0
                    };
                } else if (typeof variation === 'object') {
                    variantData = variation;
                }

                if (variantData.id) {
                    await this.insertToSupabase('product_variants', {
                        id: variantData.id,
                        product_id: productId,
                        name: variantData.name || 'Estándar',
                        price: parseFloat(variantData.price) || product.price,
                        stock: parseInt(variantData.stock) || 0,
                        image_url: variantData.image || null,
                        is_active: true
                    });
                    this.stats.variants.created++;
                }
            } catch (error) {
                this.stats.variants.errors++;
                console.log(`    ❌ Error con variante: ${error.message}`);
            }
        }
    }

    async insertToSupabase(table, data) {
        const url = `${SUPABASE_URL}/rest/v1/${table}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...SUPABASE_HEADERS,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${response.status}: ${errorText}`);
        }

        return await response.json();
    }

    // Utilidades
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-z0-9 -]/g, '') // Remover caracteres especiales
            .replace(/\s+/g, '-') // Espacios a guiones
            .replace(/-+/g, '-') // Múltiples guiones a uno
            .trim('-');
    }

    cleanImageUrl(url) {
        if (!url) return null;
        
        // Limpiar URLs duplicadas como "/images/images/"
        return url.replace('/images/images/', '/images/');
    }

    showStats() {
        console.log('\n📊 ESTADÍSTICAS DE MIGRACIÓN:');
        console.log('================================');
        
        Object.entries(this.stats).forEach(([table, stats]) => {
            const successRate = stats.processed > 0 
                ? ((stats.created / stats.processed) * 100).toFixed(1) 
                : '0';
            
            console.log(`${table.toUpperCase()}:`);
            console.log(`  📝 Procesados: ${stats.processed}`);
            console.log(`  ✅ Creados: ${stats.created}`);
            console.log(`  ❌ Errores: ${stats.errors}`);
            console.log(`  📈 Éxito: ${successRate}%`);
            console.log('');
        });
    }
}

// ==========================================
// EJECUTAR MIGRACIÓN
// ==========================================

async function main() {
    console.log('ESTUDIO ARTESANA - MIGRACIÓN A SUPABASE');
    console.log('========================================\n');
    
    // Validar configuración
    if (SUPABASE_URL.includes('tu-proyecto')) {
        console.error('❌ ERROR: Debes configurar SUPABASE_URL y SUPABASE_ANON_KEY');
        console.error('   Edita este archivo y reemplaza con tus credenciales reales.');
        process.exit(1);
    }
    
    const migrator = new DataMigrator();
    await migrator.migrate();
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { DataMigrator };
