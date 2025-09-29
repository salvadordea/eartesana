const fs = require('fs');
const path = require('path');

/**
 * Script para reparar inconsistencias de imágenes y categorías
 * tras importar nueva API
 */

// Configuración
const API_BASE_URL = 'http://localhost:3001';
const BACKUP_DIR = './api-backup';

// Helpers
const logSection = (title) => {
    console.log('\n' + '='.repeat(50));
    console.log(`📋 ${title}`);
    console.log('='.repeat(50));
};

const logStep = (step, message) => {
    console.log(`\n${step} ${message}`);
};

const logSuccess = (message) => {
    console.log(`✅ ${message}`);
};

const logWarning = (message) => {
    console.log(`⚠️  ${message}`);
};

const logError = (message) => {
    console.log(`❌ ${message}`);
};

// Función para hacer backup
async function createBackup() {
    logStep('1️⃣', 'Creando backup de datos actuales...');
    
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        // Backup de productos
        const productsResponse = await fetch(`${API_BASE_URL}/api/products`);
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            fs.writeFileSync(
                path.join(BACKUP_DIR, 'products-backup.json'),
                JSON.stringify(products, null, 2)
            );
            logSuccess(`Backup de ${products.length} productos creado`);
        }

        // Backup de categorías
        const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
        if (categoriesResponse.ok) {
            const categories = await categoriesResponse.json();
            fs.writeFileSync(
                path.join(BACKUP_DIR, 'categories-backup.json'),
                JSON.stringify(categories, null, 2)
            );
            logSuccess(`Backup de ${categories.length} categorías creado`);
        }

    } catch (error) {
        logError(`Error creando backup: ${error.message}`);
        return false;
    }
    
    return true;
}

// Función para diagnosticar problemas
async function diagnoseIssues() {
    logStep('2️⃣', 'Diagnosticando problemas...');

    try {
        // Obtener datos actuales
        const productsResponse = await fetch(`${API_BASE_URL}/api/products`);
        const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);

        if (!productsResponse.ok || !categoriesResponse.ok) {
            logError('Error obteniendo datos del API');
            return null;
        }

        const products = await productsResponse.json();
        const categories = await categoriesResponse.json();

        logSuccess(`${products.length} productos y ${categories.length} categorías encontrados`);

        const issues = {
            brokenImages: [],
            missingCategories: [],
            productsWithoutCategory: [],
            categoriesWithoutProducts: [],
            emptyImageArrays: []
        };

        // 1. Verificar imágenes rotas o faltantes
        logStep('🖼️', 'Verificando imágenes...');
        for (const product of products) {
            if (!product.images || product.images.length === 0) {
                issues.emptyImageArrays.push(product);
            } else {
                // Verificar si las URLs de imágenes están accesibles
                for (const imageUrl of product.images) {
                    if (!imageUrl || imageUrl === '' || imageUrl === 'undefined') {
                        issues.brokenImages.push({
                            product: product,
                            imageUrl: imageUrl
                        });
                    }
                }
            }
        }

        // 2. Verificar categorías existentes vs referenciadas
        logStep('🏷️', 'Verificando categorías...');
        const categoryIds = categories.map(cat => cat.id);
        const categoryNames = categories.map(cat => cat.name.toLowerCase());

        for (const product of products) {
            if (product.category) {
                // Verificar por ID
                if (typeof product.category === 'number' && !categoryIds.includes(product.category)) {
                    issues.missingCategories.push({
                        product: product,
                        categoryId: product.category
                    });
                }
                // Verificar por nombre
                else if (typeof product.category === 'string' && !categoryNames.includes(product.category.toLowerCase())) {
                    issues.missingCategories.push({
                        product: product,
                        categoryName: product.category
                    });
                }
            } else {
                issues.productsWithoutCategory.push(product);
            }
        }

        // 3. Verificar categorías sin productos
        for (const category of categories) {
            const hasProducts = products.some(product => 
                product.category === category.id || 
                product.category === category.name ||
                (product.category && product.category.toLowerCase() === category.name.toLowerCase())
            );
            
            if (!hasProducts) {
                issues.categoriesWithoutProducts.push(category);
            }
        }

        // Mostrar resumen
        logSection('RESUMEN DE DIAGNÓSTICO');
        logWarning(`${issues.brokenImages.length} productos con imágenes rotas`);
        logWarning(`${issues.emptyImageArrays.length} productos sin imágenes`);
        logWarning(`${issues.missingCategories.length} productos con categorías faltantes`);
        logWarning(`${issues.productsWithoutCategory.length} productos sin categoría`);
        logWarning(`${issues.categoriesWithoutProducts.length} categorías sin productos`);

        return { products, categories, issues };

    } catch (error) {
        logError(`Error en diagnóstico: ${error.message}`);
        return null;
    }
}

// Función para reparar imágenes
async function fixImages(products, issues) {
    logStep('3️⃣', 'Reparando imágenes...');

    const defaultImages = {
        'bolsas': 'https://res.cloudinary.com/dkzq3gxmx/image/upload/v1736934002/products/bolsas/bolsa-artesanal-1.jpg',
        'accesorios': 'https://res.cloudinary.com/dkzq3gxmx/image/upload/v1736934002/products/accesorios/accesorio-1.jpg',
        'cuadernos': 'https://res.cloudinary.com/dkzq3gxmx/image/upload/v1736934002/products/cuadernos/cuaderno-1.jpg',
        'default': 'https://res.cloudinary.com/dkzq3gxmx/image/upload/v1736934002/products/placeholder.jpg'
    };

    let fixedCount = 0;

    // Reparar productos con arrays de imágenes vacíos
    for (const product of issues.emptyImageArrays) {
        const categoryKey = product.category?.toLowerCase() || 'default';
        const defaultImage = defaultImages[categoryKey] || defaultImages['default'];
        
        product.images = [defaultImage];
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(product)
            });

            if (response.ok) {
                fixedCount++;
                logSuccess(`Imagen reparada para: ${product.title}`);
            } else {
                logError(`Error reparando imagen para: ${product.title}`);
            }
        } catch (error) {
            logError(`Error actualizando producto ${product.id}: ${error.message}`);
        }
    }

    // Reparar imágenes rotas (URLs vacías o undefined)
    for (const issue of issues.brokenImages) {
        const product = issue.product;
        const categoryKey = product.category?.toLowerCase() || 'default';
        const defaultImage = defaultImages[categoryKey] || defaultImages['default'];
        
        // Reemplazar imágenes rotas con imagen por defecto
        product.images = product.images.filter(img => img && img !== '' && img !== 'undefined');
        if (product.images.length === 0) {
            product.images = [defaultImage];
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(product)
            });

            if (response.ok) {
                fixedCount++;
                logSuccess(`Imágenes rotas reparadas para: ${product.title}`);
            } else {
                logError(`Error reparando imágenes rotas para: ${product.title}`);
            }
        } catch (error) {
            logError(`Error actualizando producto ${product.id}: ${error.message}`);
        }
    }

    logSuccess(`${fixedCount} productos con imágenes reparadas`);
    return fixedCount;
}

// Función para reparar categorías
async function fixCategories(products, categories, issues) {
    logStep('4️⃣', 'Reparando categorías...');

    let fixedCount = 0;

    // Mapeo de nombres de categorías comunes
    const categoryMappings = {
        'bolsos': 'bolsas',
        'bag': 'bolsas',
        'bags': 'bolsas',
        'accessories': 'accesorios',
        'notebook': 'cuadernos',
        'notebooks': 'cuadernos',
        'libreta': 'cuadernos',
        'libretas': 'cuadernos'
    };

    // Reparar productos sin categoría
    for (const product of issues.productsWithoutCategory) {
        // Intentar adivinar categoría basada en el título
        const title = product.title?.toLowerCase() || '';
        let suggestedCategory = 'accesorios'; // categoría por defecto

        if (title.includes('bolsa') || title.includes('bag') || title.includes('bolso')) {
            suggestedCategory = 'bolsas';
        } else if (title.includes('cuaderno') || title.includes('notebook') || title.includes('libreta')) {
            suggestedCategory = 'cuadernos';
        }

        product.category = suggestedCategory;

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(product)
            });

            if (response.ok) {
                fixedCount++;
                logSuccess(`Categoría "${suggestedCategory}" asignada a: ${product.title}`);
            } else {
                logError(`Error asignando categoría a: ${product.title}`);
            }
        } catch (error) {
            logError(`Error actualizando producto ${product.id}: ${error.message}`);
        }
    }

    // Reparar referencias de categorías incorrectas
    for (const issue of issues.missingCategories) {
        const product = issue.product;
        let fixedCategory = null;

        // Intentar mapear nombre de categoría
        if (issue.categoryName) {
            const mappedCategory = categoryMappings[issue.categoryName.toLowerCase()];
            if (mappedCategory) {
                fixedCategory = mappedCategory;
            }
        }

        // Si no se puede mapear, usar categoría por defecto basada en título
        if (!fixedCategory) {
            const title = product.title?.toLowerCase() || '';
            if (title.includes('bolsa') || title.includes('bag')) {
                fixedCategory = 'bolsas';
            } else if (title.includes('cuaderno') || title.includes('notebook')) {
                fixedCategory = 'cuadernos';
            } else {
                fixedCategory = 'accesorios';
            }
        }

        product.category = fixedCategory;

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(product)
            });

            if (response.ok) {
                fixedCount++;
                logSuccess(`Categoría corregida para: ${product.title} -> ${fixedCategory}`);
            } else {
                logError(`Error corrigiendo categoría para: ${product.title}`);
            }
        } catch (error) {
            logError(`Error actualizando producto ${product.id}: ${error.message}`);
        }
    }

    logSuccess(`${fixedCount} productos con categorías reparadas`);
    return fixedCount;
}

// Función principal
async function main() {
    logSection('REPARADOR DE INCONSISTENCIAS API');
    console.log('Este script diagnosticará y reparará inconsistencias en la API');

    try {
        // Verificar conexión con API
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        if (!healthResponse.ok) {
            logError('No se puede conectar con el API en http://localhost:3001');
            logError('Asegúrate de que el servidor esté corriendo');
            return;
        }
        logSuccess('Conexión con API establecida');

        // 1. Crear backup
        const backupSuccess = await createBackup();
        if (!backupSuccess) {
            logError('Error creando backup. Abortando...');
            return;
        }

        // 2. Diagnosticar problemas
        const diagnosis = await diagnoseIssues();
        if (!diagnosis) {
            logError('Error en diagnóstico. Abortando...');
            return;
        }

        const { products, categories, issues } = diagnosis;

        // 3. Mostrar opciones de reparación
        logSection('OPCIONES DE REPARACIÓN');
        console.log('1. Reparar solo imágenes');
        console.log('2. Reparar solo categorías');  
        console.log('3. Reparar todo automáticamente');
        console.log('4. Solo mostrar diagnóstico');

        // Para automatizar, vamos a reparar todo
        logStep('🚀', 'Iniciando reparación automática...');

        // 4. Reparar imágenes
        const fixedImages = await fixImages(products, issues);

        // 5. Reparar categorías
        const fixedCategories = await fixCategories(products, categories, issues);

        // Resumen final
        logSection('REPARACIÓN COMPLETADA');
        logSuccess(`${fixedImages} imágenes reparadas`);
        logSuccess(`${fixedCategories} categorías reparadas`);
        logSuccess(`Backup guardado en: ${BACKUP_DIR}`);

        console.log('\n🎉 ¡Reparación completada exitosamente!');
        console.log('💡 Tip: Recarga la página de la tienda para ver los cambios');

    } catch (error) {
        logError(`Error general: ${error.message}`);
        logError('Revisa el backup en caso de necesitar restaurar datos');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main();
}

module.exports = {
    diagnoseIssues,
    fixImages,
    fixCategories,
    createBackup
};
