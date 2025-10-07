-- ================================================================
-- CLEAN START - Para datos de prueba (NO producción)
-- ================================================================
-- Usa este script SOLO si todos los datos en wholesalers son de prueba
-- Este script ELIMINA la tabla wholesalers completamente
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '⚠️  CLEAN START - Datos de Prueba';
  RAISE NOTICE '   Este script va a:';
  RAISE NOTICE '   1. Agregar campos a user_profiles';
  RAISE NOTICE '   2. ELIMINAR tabla wholesalers';
  RAISE NOTICE '   3. Empezar de cero con user_profiles';
  RAISE NOTICE '';
END $$;

-- ================================================================
-- PASO 1: Agregar campos necesarios a user_profiles
-- ================================================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS wholesale_discount_percent INTEGER DEFAULT 0
  CHECK (wholesale_discount_percent >= 0 AND wholesale_discount_percent <= 100),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Pago a 30 días',
ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT DEFAULT 'transferencia'
  CHECK (preferred_payment_method IN ('transferencia', 'efectivo_contra_entrega', 'tarjeta'));

DO $$
BEGIN
  RAISE NOTICE '✅ Campos agregados a user_profiles';
END $$;

-- ================================================================
-- PASO 2: Eliminar tabla wholesalers (datos de prueba)
-- ================================================================

DROP TABLE IF EXISTS wholesalers CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Tabla wholesalers eliminada';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ CLEAN START COMPLETO';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Próximos pasos:';
  RAISE NOTICE '   1. Admin Dashboard → Mayoristas → Crear nuevo';
  RAISE NOTICE '   2. Nuevos mayoristas se crean en user_profiles';
  RAISE NOTICE '   3. Login usa Supabase Auth automáticamente';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Sistema unificado listo!';
END $$;

-- ================================================================
-- VERIFICACIÓN
-- ================================================================

-- Verificar campos en user_profiles
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN (
    'wholesale_discount_percent',
    'admin_notes',
    'payment_terms',
    'preferred_payment_method'
  )
ORDER BY column_name;

-- Verificar que wholesalers no existe
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'wholesalers'
    )
    THEN '✅ wholesalers eliminada correctamente'
    ELSE '⚠️ wholesalers todavía existe'
  END AS status;
