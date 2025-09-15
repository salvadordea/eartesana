const supabaseUrl = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTg5MzUsImV4cCI6MjA3MzUzNDkzNX0.qEijwK3FlnqXP2qw0gl438Tt-Rd1vrfts1cXslUuteU';
console.log('🔑 Usando anon key para frontend');

async function testSupabaseConnection() {
    console.log('ESTUDIO ARTESANA - PRUEBA DE CONEXIÓN SUPABASE');
    console.log('===============================================\n');

    const headers = {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
    };

    try {
        console.log('🔌 Probando conexión básica...');
        const response = await fetch(`${supabaseUrl}/rest/v1/products?limit=1`, {
            method: 'GET',
            headers: headers
        });

        console.log(`📡 Status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            return;
        }

        const data = await response.json();
        console.log(`✅ Conexión exitosa! Encontrados ${data.length} productos`);
        
        if (data.length > 0) {
            console.log(`📦 Primer producto: "${data[0].name}"`);
        }

        // Probar categorías
        console.log('\n📂 Probando categorías...');
        const categoryResponse = await fetch(`${supabaseUrl}/rest/v1/categories?limit=3`, {
            method: 'GET',
            headers: headers
        });

        if (categoryResponse.ok) {
            const categories = await categoryResponse.json();
            console.log(`✅ ${categories.length} categorías encontradas`);
            categories.forEach(cat => {
                console.log(`   - ${cat.name} (ID: ${cat.id})`);
            });
        }

        console.log('\n🎯 ¡Conexión con Supabase completamente funcional!');
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

testSupabaseConnection();
