const supabaseUrl = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTg5MzUsImV4cCI6MjA3MzUzNDkzNX0.qEijwK3FlnqXP2qw0gl438Tt-Rd1vrfts1cXslUuteU';

async function diagnoseCompleteIssues() {
    console.log('ESTUDIO ARTESANA - DIAGNÓSTICO COMPLETO');
    console.log('======================================\n');

    const headers = {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
    };

    // 1. Probar acceso a categorías con detalles
    console.log('1️⃣ PROBANDO CATEGORÍAS...');
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/categories?limit=5`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const categories = await response.json();
            console.log(`✅ ${categories.length} categorías encontradas`);
            categories.forEach(cat => {
                console.log(`   - ${cat.name} (ID: ${cat.id})`);
                console.log(`     Imagen: ${cat.image_url || 'Sin imagen'}`);
                console.log(`     Activa: ${cat.is_active}`);
            });
        } else {
            console.log(`❌ Error categorías: ${response.status}`);
            console.log(await response.text());
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // 2. Probar acceso a productos
    console.log('\n2️⃣ PROBANDO PRODUCTOS...');
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/products?limit=3`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const products = await response.json();
            console.log(`✅ ${products.length} productos encontrados`);
            products.forEach(prod => {
                console.log(`   - ${prod.name} (ID: ${prod.id})`);
                console.log(`     Imagen: ${prod.main_image_url || 'Sin imagen'}`);
                console.log(`     Category IDs: ${JSON.stringify(prod.category_ids)}`);
            });
        } else {
            console.log(`❌ Error productos: ${response.status}`);
            console.log(await response.text());
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // 3. Probar acceso a product_categories
    console.log('\n3️⃣ PROBANDO TABLA PRODUCT_CATEGORIES...');
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/product_categories?limit=5`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const relations = await response.json();
            console.log(`✅ ${relations.length} relaciones product_categories encontradas`);
            relations.forEach(rel => {
                console.log(`   - Producto ${rel.product_id} -> Categoría ${rel.category_id}`);
            });
        } else {
            console.log(`❌ Error product_categories: ${response.status}`);
            console.log(await response.text());
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // 4. Probar URLs de imágenes
    console.log('\n4️⃣ PROBANDO URLs DE IMÁGENES...');
    
    const imagesToTest = [
        'https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/placeholder-product.jpg',
        'https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/categories/backpacks.jpg',
        'https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/categories/joyeria.jpg'
    ];

    for (const imageUrl of imagesToTest) {
        try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            console.log(`${response.ok ? '✅' : '❌'} ${imageUrl.split('/').pop()}: ${response.status}`);
        } catch (error) {
            console.log(`❌ ${imageUrl.split('/').pop()}: Error de conexión`);
        }
    }

    console.log('\n📋 RESUMEN DE PROBLEMAS IDENTIFICADOS:');
    console.log('- Si product_categories da error 401/403: Problema de RLS');
    console.log('- Si categorías no tienen image_url: Problema de datos');
    console.log('- Si imágenes dan 404: Problema de nombres de archivos');
}

diagnoseCompleteIssues();
