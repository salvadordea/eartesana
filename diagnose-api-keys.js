const supabaseUrl = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';

// Posibles anon keys para probar
const possibleAnonKeys = [
    // Key con espacios que está actualmente
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlybmhy ZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2NzE0OTYsImV4cCI6MjA0NjI0NzQ5Nn0.V6C6bWsRqjI52zSISTh1CgE6a5wJ3srtIHVVfq8q8-A',
    
    // Misma key pero sin espacios
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2NzE0OTYsImV4cCI6MjA0NjI0NzQ5Nn0.V6C6bWsRqjI52zSISTh1CgE6a5wJ3srtIHVVfq8q8-A'
];

async function testApiKey(apiKey, keyName) {
    console.log(`\n🔑 Probando ${keyName}...`);
    console.log(`Key: ${apiKey.substring(0, 20)}...`);
    
    const headers = {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
    };

    try {
        // Probar productos
        const response = await fetch(`${supabaseUrl}/rest/v1/products?limit=1`, {
            method: 'GET',
            headers: headers
        });

        console.log(`📡 Status productos: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ Error: ${errorText}`);
            return false;
        }

        // Probar categorías
        const categoryResponse = await fetch(`${supabaseUrl}/rest/v1/categories?limit=1`, {
            method: 'GET',
            headers: headers
        });

        console.log(`📡 Status categorías: ${categoryResponse.status}`);

        if (categoryResponse.ok) {
            console.log(`✅ ${keyName} FUNCIONA CORRECTAMENTE!`);
            return true;
        } else {
            const errorText = await categoryResponse.text();
            console.log(`❌ Error categorías: ${errorText}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error de conexión con ${keyName}:`, error.message);
        return false;
    }
}

async function diagnoseApiKeys() {
    console.log('ESTUDIO ARTESANA - DIAGNÓSTICO DE API KEYS');
    console.log('==========================================');

    for (let i = 0; i < possibleAnonKeys.length; i++) {
        const worked = await testApiKey(possibleAnonKeys[i], `Anon Key ${i + 1}`);
        if (worked) {
            console.log(`\n🎯 ¡CLAVE FUNCIONAL ENCONTRADA!`);
            console.log(`Usar esta clave en el frontend:`);
            console.log(possibleAnonKeys[i]);
            break;
        }
    }

    console.log('\n📋 Necesitamos la anon key correcta del panel de Supabase');
    console.log('Ve a: https://supabase.com/dashboard/project/yrmfrfpyqctvwyhrhivl/settings/api');
    console.log('Y copia la clave "anon public"');
}

diagnoseApiKeys();
