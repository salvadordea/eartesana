-- Configuración de políticas para Supabase Storage
-- Bucket: product-images

-- Primero, eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow public read access on product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete product images" ON storage.objects;

-- 1. POLÍTICA DE LECTURA PÚBLICA
-- Permite que cualquier persona vea las imágenes de productos
CREATE POLICY "Allow public read access on product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- 2. POLÍTICA DE SUBIDA PARA USUARIOS AUTENTICADOS
-- Permite a usuarios autenticados subir imágenes a cualquier carpeta del bucket
CREATE POLICY "Allow authenticated upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- 3. POLÍTICA DE ACTUALIZACIÓN PARA USUARIOS AUTENTICADOS
-- Permite a usuarios autenticados actualizar metadatos de archivos
CREATE POLICY "Allow authenticated update product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- 4. POLÍTICA DE ELIMINACIÓN PARA USUARIOS AUTENTICADOS
-- Permite a usuarios autenticados eliminar imágenes
CREATE POLICY "Allow authenticated delete product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- OPCIONAL: Verificar que el bucket existe y está configurado como público
-- Si no existe, crearlo:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'product-images', 
--   'product-images', 
--   true, 
--   5242880, 
--   '{"image/jpeg","image/jpg","image/png","image/webp","image/gif"}'
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Verificar las políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
