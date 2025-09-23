/**
 * SCRIPT PARA MAPEAR VARIANTES DE PRODUCTOS CON COLORES/MATERIALES
 * ==============================================================
 * Mapea imágenes a variantes específicas usando el número de color al final del nombre
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapeo de números a variantes de color/material
const COLOR_VARIANTS = {
    1: "Gris",
    2: "Pelo Blanco y Café",
    3: "Negro",
    4: "Gris y Miel",
    5: "Negro/Camel/Oro Pálido",
    6: "Beige/Oro Pálido/Negro",
    7: "Gris y Azul Tupido",
    8: "Ladrillo",
    9: "Miel y Negro",
    10: "Dorado",
    11: "Miel",
    12: "Oro Plata",
    13: "Café Claro",
    14: "Café Chocolate",
    15: "Blanco y Gris Franjas",
    16: "Miel y Gris",
    17: "Gris Claro Negro Grueso",
    18: "Café y Beige",
    19: "Camel",
    20: "Tinta",
    21: "Café",
    22: "Perla",
    23: "Naranja y Café Oscuro",
    24: "Oro Pálido",
    25: "Cobre Rosado",
    26: "Blanco y Negro Franjas",
    27: "Rojo",
    28: "Azul",
    29: "Oro y Café Oscuro",
    30: "Oro Mate y Negro",
    31: "Miel y Tinto",
    32: "Marrón",
    33: "Azul y Miel",
    34: "Cobre",
    35: "Café y Oro",
    36: "Oro Pálido/Camel/Cobre",
    37: "Negro y Blanco",
    38: "Negro y Pelo",
    39: "Gris y Negro",
    40: "Blanco y Rosado",
    41: "Tonos Claros",
    42: "Ladrillo y Miel",
    43: "Blanco y Plateado",
    44: "Hueso",
    45: "Camel y Blanco Franjas",
    46: "Negro y Café Oscuro",
    47: "Negro y Blanco Grueso",
    48: "Café Oscuro",
    49: "Tinto y Miel",
    50: "Piel Ladrillo Textil Beige y Blanco",
    51: "Perla/Oro Pálido/Ladrillo",
    52: "Pelo Tonos Blancos",
    53: "Oro Mate",
    54: "Blanco y Negro",
    55: "Azul Marino y Blanco Grueso",
    56: "Tinto y Blanco",
    57: "Cobre y Oro",
    58: "Negro y Blanco Delgado",
    59: "Café y Miel",
    60: "Azul Denim",
    61: "Tinto Gamuza",
    62: "Oro Pálido/Perla/Ladrillo",
    63: "Estándar",
    64: "Beige",
    65: "Miel y Café",
    66: "Pelo Tonos Negros",
    67: "Tonos Oscuros",
    68: "Blanco",
    69: "Ladrillo y Camel",
    70: "Gris y Blanco Franjas",
    71: "Café Gamuza",
    72: "Pelo (Tono Puede Variar)",
    73: "Blanco y Azul Franjas Delgadas",
    74: "Piel Negra Textil Negro Franja Blanca",
    75: "Café Gamuza y Camel",
    76: "Negro y Gris",
    77: "Pelo Negro",
    78: "Gris Claro",
    79: "Gris y Azul Franjas",
    80: "Gris Oscuro",
    81: "Negro y Miel",
    82: "Marino y Blanco",
    83: "Blanco y Camel Franjas",
    84: "Piel Café Textil Beige y Blanco Lluvia",
    85: "Plata",
    86: "Azul Oscuro",
    87: "Verde",
    88: "Piel Negra, Textil Gris y Blanco",
    89: "Camel y Blanco Delgado",
    90: "Café Oscuro y Cobre",
    91: "Verde Gamuza",
    92: "Gris y Blanco",
    93: "Café Oscuro y Negro",
    94: "Negro y Cobre",
    95: "Gris Gamuza",
    96: "Camel y Blanco",
    97: "Piel Negra Líneas Negra sobre Gris",
    98: "Miel y Naranja",
    99: "Ladrillo/Camel/Perla",
    100: "Ladrillo y Perla",
    101: "Especial 101"
};

// Estructura de productos (misma que antes)
const CATEGORY_STRUCTURE = {
    'Joyeria': [
        'Aretes/arete-geometrico-gigante',
        'Aretes/arete-piel-balancin-oval',
        'Aretes/arete-piel-gota',
        'Aretes/arete-piel-pendulo',
        'Aretes/arete-piel-poligono-chico',
        'Aretes/arete-poligono-grande',
        'Brazaletes/brazalete-dos-lineas',
        'Brazaletes/brazalete-hombre',
        'Brazaletes/brazalete-linea-ancha',
        'Brazaletes/brazalete-lineas-delgadas',
        'Brazaletes/brazalete-liso',
        'Brazaletes/brazalete-piel-pelo'
    ],
    'Backpacks': [
        'backpack-mini'
    ],
    'Bolsas Cruzadas': [
        'bolsa-boton-madera',
        'bolsa-mediana-con-bolsillo-piel-al-frente',
        'cangurera',
        'clutch-chica-con-base',
        'clutch-chica-plana',
        'clutch-grande-con-strap'
    ],
    'Bolsas de Textil y Piel': [
        'bolsa-cilindro-jareta',
        'bolsa-de-playa-gigante',
        'bolsa-de-playa-mediana',
        'bolsa-telar-de-pedal-cruzada'
    ],
    'Bolsas Grandes': [
        'bolsa-gigante-horizontal',
        'bolsa-gigante-vertical',
        'bolsa-gigante-vertical-pelo-y-miel',
        'bolsa-grande-con-jareta',
        'bolsas-gigante-plana'
    ],
    'Bolsas de mano': [
        'bolsa-ovalada-lisa',
        'cartera-tipo-sobre'
    ],
    'Botelleras': [
        'botelleras'
    ],
    'Accesorios': [
        'Carteras/cartera-con-costura',
        'Carteras/cartera-liga',
        'Llavero/llavero-corto',
        'Llavero/llavero-largo',
        'Monederos/monedero-cierre',
        'Monederos/monedero-clip',
        'Monederos/monedero-motita',
        'Monederos/monedero-triangulo',
        'Portacables/portacable-chico',
        'Portacables/portacables-grande',
        'Portapasaportes',
        'Tarjeteros/tarjetero-boton'
    ],
    'Portacel': [
        'portacel-grande',
        'portacel-pelo',
        'portacel-piel-liso',
        'portacel-piel-textil'
    ],
    'Hogar': [
        'portavasos'
    ]
};

function normalizeProductName(name) {
    return name.toLowerCase()
        .replace(/_/g, '-')
        .replace(/\s+/g, '-')
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function extractVariantInfo(fileName) {
    // Quitar extensión
    const baseName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    
    // Buscar número al final (puede ser _123 o _123_1 para múltiples fotos del mismo color)
    const variantMatch = baseName.match(/_(\d+)(?:_\d+)?$/);
    
    if (variantMatch) {
        const variantNumber = parseInt(variantMatch[1]);
        const productBaseName = baseName.replace(/_\d+(?:_\d+)?$/, '');
        
        return {
            productBaseName: normalizeProductName(productBaseName),
            variantNumber,
            variantName: COLOR_VARIANTS[variantNumber] || `Variante ${variantNumber}`,
            hasVariant: true,
            originalName: baseName
        };
    }
    
    // Si no tiene número de variante, es imagen base del producto
    return {
        productBaseName: normalizeProductName(baseName),
        variantNumber: null,
        variantName: null,
        hasVariant: false,
        originalName: baseName
    };
}

function createVariantMigrationMap(productsImages) {
    const highConfidence = [];
    const mediumConfidence = [];
    const lowConfidence = [];
    const unmapped = [];

    // Crear índice de productos
    const flatProducts = [];
    for (const [category, products] of Object.entries(CATEGORY_STRUCTURE)) {
        products.forEach(productPath => {
            const productName = productPath.split('/').pop();
            const normalizedName = normalizeProductName(productName);
            
            flatProducts.push({
                category,
                productPath,
                productName,
                normalizedName,
                fullPath: `${category}/${productPath}`,
                variations: [
                    productName,
                    normalizedName,
                    productName.replace(/-/g, '_'),
                    normalizedName.replace(/-/g, '_')
                ]
            });
        });
    }

    console.log(`\n🎨 Analizando ${productsImages.length} imágenes para mapeo de variantes...`);

    productsImages.forEach((imagePath, index) => {
        const fileName = imagePath.split('/').pop();
        const variantInfo = extractVariantInfo(fileName);
        
        if (index % 20 === 0) {
            console.log(`   Procesando: ${Math.round((index/productsImages.length)*100)}%`);
        }

        // Buscar producto coincidente
        let bestMatch = null;
        let bestScore = 0;

        flatProducts.forEach(product => {
            let score = 0;

            // Coincidencia exacta con variaciones
            for (const prodVar of product.variations) {
                if (variantInfo.productBaseName === prodVar) {
                    score = 100;
                    break;
                }
                if (variantInfo.productBaseName.includes(prodVar) && prodVar.length > 3) {
                    score = Math.max(score, 90);
                }
                if (prodVar.includes(variantInfo.productBaseName) && variantInfo.productBaseName.length > 3) {
                    score = Math.max(score, 85);
                }
            }

            // Coincidencia por palabras clave
            if (score < 85) {
                const baseWords = variantInfo.productBaseName.split('-').filter(w => w.length > 2);
                const prodWords = product.normalizedName.split('-').filter(w => w.length > 2);
                
                const matchedWords = baseWords.filter(word => prodWords.includes(word));
                if (matchedWords.length >= 2) {
                    score = Math.max(score, 75);
                } else if (matchedWords.length === 1 && matchedWords[0].length > 4) {
                    score = Math.max(score, 60);
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = product;
            }
        });

        if (!bestMatch) {
            unmapped.push({
                source: imagePath,
                fileName,
                variantInfo,
                reason: 'No se encontró producto coincidente'
            });
            return;
        }

        // Determinar carpeta destino basada en si tiene variante
        const destinationFolder = variantInfo.hasVariant ? 'variants' : 'full';
        const destinationPath = `${bestMatch.fullPath}/${destinationFolder}/${fileName}`;

        const mappingResult = {
            source: imagePath,
            destination: destinationPath,
            category: bestMatch.category,
            product: bestMatch.productName,
            productPath: bestMatch.fullPath,
            fileName,
            variantInfo,
            score: bestScore,
            destinationFolder
        };

        // Clasificar por confianza
        if (bestScore >= 90) {
            highConfidence.push(mappingResult);
        } else if (bestScore >= 75) {
            mediumConfidence.push(mappingResult);
        } else if (bestScore >= 60) {
            lowConfidence.push(mappingResult);
        } else {
            unmapped.push({
                source: imagePath,
                fileName,
                variantInfo,
                bestMatch: bestMatch,
                score: bestScore,
                reason: 'Confianza muy baja'
            });
        }
    });

    console.log(`   ✅ Análisis completo`);

    return {
        highConfidence,
        mediumConfidence, 
        lowConfidence,
        unmapped
    };
}

async function generateReviewGUI(variantMap) {
    const fs = require('fs').promises;
    
    // Crear HTML para GUI de revisión
    const guiHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Revisión de Mapeo de Variantes - Estudio Artesana</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #1a1a1a, #333);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .stats {
            display: flex;
            justify-content: space-around;
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9rem;
            margin-top: 5px;
        }
        
        .high { color: #28a745; }
        .medium { color: #ffc107; }
        .low { color: #fd7e14; }
        .unmapped { color: #dc3545; }
        
        .tabs {
            display: flex;
            background: #e9ecef;
            border-bottom: 1px solid #dee2e6;
        }
        
        .tab {
            flex: 1;
            padding: 15px 20px;
            background: #e9ecef;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .tab.active {
            background: white;
            color: #333;
        }
        
        .tab:hover {
            background: #f8f9fa;
        }
        
        .tab-content {
            display: none;
            padding: 20px;
            max-height: 600px;
            overflow-y: auto;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .item-card {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .item-card:hover {
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .item-header {
            background: #f8f9fa;
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .item-body {
            padding: 15px;
        }
        
        .score-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        
        .score-high { background: #d4edda; color: #155724; }
        .score-medium { background: #fff3cd; color: #856404; }
        .score-low { background: #ffeaa7; color: #d63031; }
        
        .variant-info {
            background: #e3f2fd;
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
        }
        
        .file-path {
            font-family: 'Courier New', monospace;
            background: #f1f3f4;
            padding: 8px;
            border-radius: 4px;
            font-size: 13px;
            margin: 5px 0;
        }
        
        .actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .btn-approve { background: #28a745; color: white; }
        .btn-reject { background: #dc3545; color: white; }
        .btn-edit { background: #ffc107; color: #000; }
        
        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .summary {
            padding: 30px;
            background: #f8f9fa;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .export-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin: 10px;
        }
        
        .export-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-palette"></i> Revisión de Mapeo de Variantes</h1>
            <p>Revisa y aprueba el mapeo automático de imágenes a productos y variantes</p>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number high">${variantMap.highConfidence.length}</div>
                <div class="stat-label">Alta Confianza (≥90%)</div>
            </div>
            <div class="stat-item">
                <div class="stat-number medium">${variantMap.mediumConfidence.length}</div>
                <div class="stat-label">Media Confianza (75-89%)</div>
            </div>
            <div class="stat-item">
                <div class="stat-number low">${variantMap.lowConfidence.length}</div>
                <div class="stat-label">Baja Confianza (60-74%)</div>
            </div>
            <div class="stat-item">
                <div class="stat-number unmapped">${variantMap.unmapped.length}</div>
                <div class="stat-label">Sin Mapear</div>
            </div>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('high')">Alta Confianza</button>
            <button class="tab" onclick="showTab('medium')">Media Confianza</button>
            <button class="tab" onclick="showTab('low')">Baja Confianza</button>
            <button class="tab" onclick="showTab('unmapped')">Sin Mapear</button>
        </div>
        
        <div id="high" class="tab-content active">
            <h3 style="margin-bottom: 20px; color: #28a745;">✅ Alta Confianza (≥90%) - Listos para migrar</h3>
            ${generateItemCards(variantMap.highConfidence, 'high')}
        </div>
        
        <div id="medium" class="tab-content">
            <h3 style="margin-bottom: 20px; color: #ffc107;">⚠️ Media Confianza (75-89%) - Revisar antes de migrar</h3>
            ${generateItemCards(variantMap.mediumConfidence, 'medium')}
        </div>
        
        <div id="low" class="tab-content">
            <h3 style="margin-bottom: 20px; color: #fd7e14;">🔍 Baja Confianza (60-74%) - Requiere revisión manual</h3>
            ${generateItemCards(variantMap.lowConfidence, 'low')}
        </div>
        
        <div id="unmapped" class="tab-content">
            <h3 style="margin-bottom: 20px; color: #dc3545;">❌ Sin Mapear - No se pudo determinar destino</h3>
            ${generateUnmappedCards(variantMap.unmapped)}
        </div>
        
        <div class="summary">
            <h3>Acciones</h3>
            <button class="export-btn" onclick="exportApproved()">
                <i class="fas fa-download"></i> Exportar Aprobados
            </button>
            <button class="export-btn" onclick="exportAll()">
                <i class="fas fa-file-export"></i> Exportar Todo
            </button>
            <button class="export-btn" onclick="showMigrationScript()">
                <i class="fas fa-code"></i> Generar Script
            </button>
        </div>
    </div>
    
    <script>
        let approvedItems = new Set();
        let rejectedItems = new Set();
        
        function showTab(tabName) {
            // Ocultar todos los tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Mostrar tab seleccionado
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }
        
        function approveItem(itemId) {
            approvedItems.add(itemId);
            rejectedItems.delete(itemId);
            updateItemStatus(itemId, 'approved');
        }
        
        function rejectItem(itemId) {
            rejectedItems.add(itemId);
            approvedItems.delete(itemId);
            updateItemStatus(itemId, 'rejected');
        }
        
        function updateItemStatus(itemId, status) {
            const card = document.querySelector(\`[data-item-id="\${itemId}"]\`);
            if (card) {
                card.classList.remove('approved', 'rejected');
                if (status !== 'neutral') {
                    card.classList.add(status);
                }
            }
        }
        
        function exportApproved() {
            const approved = Array.from(approvedItems);
            const data = { approvedItems: approved, timestamp: new Date().toISOString() };
            downloadJSON(data, 'approved-variants.json');
        }
        
        function exportAll() {
            const data = {
                approved: Array.from(approvedItems),
                rejected: Array.from(rejectedItems),
                timestamp: new Date().toISOString()
            };
            downloadJSON(data, 'variant-review-results.json');
        }
        
        function downloadJSON(data, filename) {
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        function showMigrationScript() {
            alert('Esta funcionalidad generará un script Node.js para migrar los elementos aprobados.');
        }
        
        // Auto-aprobar elementos de alta confianza
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('[data-confidence="high"] [data-item-id]').forEach(card => {
                const itemId = card.getAttribute('data-item-id');
                approvedItems.add(itemId);
                card.classList.add('approved');
            });
        });
    </script>
    
    <style>
        .item-card.approved { border-left: 5px solid #28a745; background: #f8fff9; }
        .item-card.rejected { border-left: 5px solid #dc3545; background: #fff8f8; }
    </style>
</body>
</html>`;

    await fs.writeFile('variant-mapping-gui.html', guiHtml);
    return 'variant-mapping-gui.html';
}

function generateItemCards(items, confidence) {
    return items.map((item, index) => {
        const itemId = `${confidence}-${index}`;
        const variantText = item.variantInfo.hasVariant 
            ? `🎨 <strong>Variante:</strong> ${item.variantInfo.variantName} (#${item.variantInfo.variantNumber})`
            : '📸 <strong>Imagen principal del producto</strong>';
            
        return `
            <div class="item-card" data-item-id="${itemId}" data-confidence="${confidence}">
                <div class="item-header">
                    <strong>${item.fileName}</strong>
                    <span class="score-badge score-${confidence}">Score: ${item.score}</span>
                </div>
                <div class="item-body">
                    <div class="variant-info">
                        ${variantText}
                    </div>
                    <div><strong>📂 Producto:</strong> ${item.product}</div>
                    <div><strong>🏷️ Categoría:</strong> ${item.category}</div>
                    <div class="file-path">
                        <strong>🎯 Destino:</strong><br>
                        ${item.destination}
                    </div>
                    <div class="actions">
                        <button class="btn btn-approve" onclick="approveItem('${itemId}')">
                            ✅ Aprobar
                        </button>
                        <button class="btn btn-reject" onclick="rejectItem('${itemId}')">
                            ❌ Rechazar
                        </button>
                        <button class="btn btn-edit" onclick="editItem('${itemId}')">
                            ✏️ Editar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function generateUnmappedCards(items) {
    return items.map((item, index) => {
        const itemId = `unmapped-${index}`;
        const variantText = item.variantInfo.hasVariant 
            ? `🎨 <strong>Variante:</strong> ${item.variantInfo.variantName} (#${item.variantInfo.variantNumber})`
            : '📸 <strong>Imagen sin variante específica</strong>';
            
        return `
            <div class="item-card" data-item-id="${itemId}">
                <div class="item-header">
                    <strong>${item.fileName}</strong>
                    <span class="score-badge score-low">❌ Sin mapear</span>
                </div>
                <div class="item-body">
                    <div class="variant-info">
                        ${variantText}
                    </div>
                    <div><strong>🔍 Nombre base:</strong> ${item.variantInfo.productBaseName}</div>
                    <div><strong>❗ Razón:</strong> ${item.reason}</div>
                    ${item.bestMatch ? `
                        <div><strong>🎯 Mejor coincidencia:</strong> ${item.bestMatch.productName} (Score: ${item.score})</div>
                    ` : ''}
                    <div class="actions">
                        <button class="btn btn-edit" onclick="manualMap('${itemId}')">
                            🎯 Mapear Manualmente
                        </button>
                        <button class="btn btn-reject" onclick="rejectItem('${itemId}')">
                            🗑️ Descartar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function executeVariantMapping() {
    console.log('🎨 MAPEO INTELIGENTE DE VARIANTES DE PRODUCTOS');
    console.log('===============================================\n');

    try {
        // Verificar buckets
        const { data: buckets } = await supabase.storage.listBuckets();
        const productImagesBucket = buckets.find(bucket => bucket.name === 'product-images');

        if (!productImagesBucket) {
            throw new Error('Bucket "product-images" no encontrado');
        }

        console.log('✅ Bucket product-images encontrado');

        // Listar imágenes en carpeta 'full'
        console.log('\n📂 Buscando imágenes en carpetas full/...');
        const allImages = await listAllImagesFromFullFolders();
        console.log(`📸 ${allImages.length} imágenes encontradas`);

        if (allImages.length === 0) {
            console.log('⚠️  No se encontraron imágenes en las carpetas full/');
            return;
        }

        // Crear mapeo de variantes
        console.log('\n🧠 Analizando variantes con mapeo inteligente...');
        const variantMap = createVariantMigrationMap(allImages);

        // Mostrar resumen
        console.log(`\n📊 RESUMEN DEL ANÁLISIS DE VARIANTES:`);
        console.log(`=====================================`);
        console.log(`🟢 Alta confianza (≥90%): ${variantMap.highConfidence.length} imágenes`);
        console.log(`🟡 Media confianza (75-89%): ${variantMap.mediumConfidence.length} imágenes`);
        console.log(`🟠 Baja confianza (60-74%): ${variantMap.lowConfidence.length} imágenes`);
        console.log(`🔴 Sin mapear: ${variantMap.unmapped.length} imágenes`);

        // Analizar variantes encontradas
        const variantStats = analyzeVariants(variantMap);
        console.log(`\n🎨 ANÁLISIS DE VARIANTES:`);
        console.log(`=========================`);
        console.log(`📸 Imágenes principales: ${variantStats.mainImages}`);
        console.log(`🎨 Imágenes de variantes: ${variantStats.variantImages}`);
        console.log(`🌈 Colores/materiales únicos: ${variantStats.uniqueVariants}`);

        // Mostrar top variantes
        console.log(`\n🌈 TOP VARIANTES ENCONTRADAS:`);
        console.log(`=============================`);
        variantStats.topVariants.slice(0, 10).forEach((variant, index) => {
            console.log(`${index + 1}. ${variant.name}: ${variant.count} imágenes`);
        });

        // Generar GUI para revisión
        console.log(`\n🖥️  Generando GUI de revisión...`);
        const guiPath = await generateReviewGUI(variantMap);
        
        // Guardar reportes
        await saveVariantReports(variantMap, variantStats);

        console.log(`\n🎉 PROCESO COMPLETADO`);
        console.log(`====================`);
        console.log(`📄 GUI de revisión: ${guiPath}`);
        console.log(`📊 Reporte JSON: variant-analysis-report.json`);
        console.log(`📊 Reporte CSV: variant-mapping-results.csv`);
        console.log(`\n💡 Abre ${guiPath} en tu navegador para revisar y aprobar los mapeos.`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function listAllImagesFromFullFolders() {
    const allImages = [];
    
    // Recorrer todas las categorías y productos
    for (const [category, products] of Object.entries(CATEGORY_STRUCTURE)) {
        for (const productPath of products) {
            const fullPath = `${category}/${productPath}/full`;
            
            try {
                const { data: files, error } = await supabase.storage
                    .from('product-images')
                    .list(fullPath);
                
                if (!error && files && files.length > 0) {
                    const imageFiles = files.filter(file => {
                        const ext = file.name.toLowerCase();
                        return ext.includes('.jpg') || ext.includes('.jpeg') || 
                               ext.includes('.png') || ext.includes('.webp');
                    });
                    
                    imageFiles.forEach(file => {
                        allImages.push(`${fullPath}/${file.name}`);
                    });
                }
            } catch (error) {
                // Ignorar errores de carpetas que no existen
                continue;
            }
        }
    }
    
    return allImages;
}

function analyzeVariants(variantMap) {
    const allMapped = [...variantMap.highConfidence, ...variantMap.mediumConfidence, ...variantMap.lowConfidence];
    
    const mainImages = allMapped.filter(item => !item.variantInfo.hasVariant).length;
    const variantImages = allMapped.filter(item => item.variantInfo.hasVariant).length;
    
    const variantCounts = {};
    allMapped.forEach(item => {
        if (item.variantInfo.hasVariant && item.variantInfo.variantName) {
            variantCounts[item.variantInfo.variantName] = (variantCounts[item.variantInfo.variantName] || 0) + 1;
        }
    });
    
    const topVariants = Object.entries(variantCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    
    return {
        mainImages,
        variantImages,
        uniqueVariants: Object.keys(variantCounts).length,
        topVariants
    };
}

async function saveVariantReports(variantMap, variantStats) {
    const fs = require('fs').promises;
    
    try {
        // Reporte JSON completo
        const jsonReport = {
            timestamp: new Date().toISOString(),
            summary: {
                highConfidence: variantMap.highConfidence.length,
                mediumConfidence: variantMap.mediumConfidence.length,
                lowConfidence: variantMap.lowConfidence.length,
                unmapped: variantMap.unmapped.length,
                total: variantMap.highConfidence.length + variantMap.mediumConfidence.length + 
                       variantMap.lowConfidence.length + variantMap.unmapped.length
            },
            variantStats,
            mappings: variantMap
        };
        
        await fs.writeFile('variant-analysis-report.json', JSON.stringify(jsonReport, null, 2));
        
        // Reporte CSV
        let csvContent = 'Confianza,Archivo,Producto,Categoria,VarianteNumero,VarianteNombre,Carpeta,Destino,Score\n';
        
        ['highConfidence', 'mediumConfidence', 'lowConfidence'].forEach(confidence => {
            variantMap[confidence].forEach(item => {
                csvContent += `${confidence},"${item.fileName}","${item.product}","${item.category}",${item.variantInfo.variantNumber || ''},"${item.variantInfo.variantName || 'Principal'}","${item.destinationFolder}","${item.destination}",${item.score}\n`;
            });
        });
        
        variantMap.unmapped.forEach(item => {
            csvContent += `unmapped,"${item.fileName}","","","${item.variantInfo.variantNumber || ''}","${item.variantInfo.variantName || 'Principal'}","","","0"\n`;
        });
        
        await fs.writeFile('variant-mapping-results.csv', csvContent);
        
        console.log(`📄 Reportes guardados exitosamente`);
        
    } catch (error) {
        console.error('Error guardando reportes:', error);
    }
}

// Ejecutar
if (require.main === module) {
    executeVariantMapping().catch(console.error);
}

module.exports = { executeVariantMapping };
