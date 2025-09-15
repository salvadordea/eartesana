const supabaseUrl = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

async function fixCategoryImages() {
    console.log('ESTUDIO ARTESANA - ARREGLAR IMÁGENES DE CATEGORÍAS');
    console.log('=================================================\n');

    const headers = {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
    };

    // Mapeo de categorías a imágenes
    const categoryImageMapping = {
        'Accesorios': 'categories/joyeria.jpg',
        'Backpacks': 'categories/backpacks.jpg',
        'Bolsas Cruzadas': 'categories/bolsas-cruzadas.jpg',
        'Bolsas de mano': 'categories/bolsas-de-mano.jpg',
        'Bolsas de Textil y Piel': 'categories/bolsas-textil.jpg',
        'Bolsas Grandes': 'categories/bolsas-grandes.jpg',
        'Botelleras': 'categories/botelleras.jpg',
        'Hogar': 'categories/hogar.jpg',
        'Joyeria': 'categories/joyeria.jpg',
        'Portacel': 'categories/portacel.jpg',
        'Vestimenta': 'categories/vestimenta.jpg'
    };

    try {
        // 1. Obtener todas las categorías
        console.log('📂 Obteniendo categorías...');
        const response = await fetch(`${supabaseUrl}/rest/v1/categories`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Error obteniendo categorías: ${response.status}`);
        }

        const categories = await response.json();
        console.log(`✅ ${categories.length} categorías encontradas`);

        // 2. Actualizar cada categoría con su imagen
        for (const category of categories) {
            const imagePath = categoryImageMapping[category.name];
            
            if (imagePath) {
                const imageUrl = `https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/${imagePath}`;
                
                console.log(`📸 Actualizando ${category.name}...`);
                
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/categories?id=eq.${category.id}`, {
                    method: 'PATCH',
                    headers: headers,
                    body: JSON.stringify({
                        image_url: imageUrl
                    })
                });

                if (updateResponse.ok) {
                    console.log(`✅ ${category.name}: ${imageUrl}`);
                } else {
                    console.log(`❌ Error actualizando ${category.name}: ${updateResponse.status}`);
                }
            } else {
                console.log(`⚠️ ${category.name}: No se encontró imagen correspondiente`);
            }
        }

        console.log('\n✅ ¡Actualización de imágenes de categorías completada!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixCategoryImages();
