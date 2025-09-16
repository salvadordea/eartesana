-- =====================================================
-- VERIFICAR ESQUEMA ACTUAL DE LA BASE DE DATOS
-- =====================================================

-- Verificar qué tablas existen actualmente
SELECT 'TABLAS EXISTENTES:' as info;
SHOW TABLES;

-- Verificar estructura de la tabla principal de productos
SELECT 'ESTRUCTURA TABLA PRODUCTOS/PRODUCTS:' as info;
DESCRIBE productos;
-- Si falla, probar con:
-- DESCRIBE products;

-- Verificar si existe la tabla de variantes
SELECT 'ESTRUCTURA TABLA VARIANTES (si existe):' as info;
DESCRIBE product_variants;

-- Verificar datos existentes en productos
SELECT 'MUESTRA DE PRODUCTOS EXISTENTES:' as info;
SELECT id, nombre, categoria, precio, imagen 
FROM productos 
LIMIT 5;

-- Verificar columnas agregadas por el sistema de variantes
SELECT 'VERIFICAR NUEVAS COLUMNAS:' as info;
SELECT id, nombre, total_stock, has_variants, variant_type 
FROM productos 
LIMIT 3;
