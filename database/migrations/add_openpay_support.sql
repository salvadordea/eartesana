-- =====================================================
-- MIGRACIÓN: Soporte para Openpay (BBVA)
-- =====================================================
-- Autor: Estudio Artesana
-- Fecha: 2025-11-25
-- Descripción: Agrega soporte completo para pagos con Openpay
--              incluyendo tarjetas y pagos en tienda (OXXO, 7-Eleven)
-- =====================================================

-- =====================================================
-- 1. ACTUALIZAR CONSTRAINT DE PAYMENT_METHOD
-- =====================================================

-- Remover constraint antiguo si existe
ALTER TABLE payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_payment_method_check;

-- Agregar constraint actualizado con 'openpay'
ALTER TABLE payment_transactions
ADD CONSTRAINT payment_transactions_payment_method_check
CHECK (payment_method IN (
    'openpay',              -- NUEVO: Pagos con Openpay (tarjetas + tiendas)
    'mercadopago',          -- Mantener para historial
    'custom_arrangement',   -- Arreglos personalizados
    'bank_transfer',        -- Transferencias bancarias
    'cash'                  -- Efectivo
));

COMMENT ON CONSTRAINT payment_transactions_payment_method_check ON payment_transactions
IS 'Métodos de pago permitidos. openpay incluye tarjetas y pagos en tienda.';

-- =====================================================
-- 2. AGREGAR CAMPOS A TABLA ORDERS PARA PAGOS EN TIENDA
-- =====================================================

-- Campo para referencia de pago (OXXO, 7-Eleven)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

COMMENT ON COLUMN orders.payment_reference
IS 'Referencia de pago para tiendas (OXXO, 7-Eleven). Formato Openpay: 9 dígitos.';

-- Campo para URL del código de barras
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_barcode_url TEXT;

COMMENT ON COLUMN orders.payment_barcode_url
IS 'URL del código de barras generado por Openpay para impresión en tienda.';

-- Campo para fecha límite de pago
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMPTZ;

COMMENT ON COLUMN orders.payment_due_date
IS 'Fecha límite para pagar en tienda. Generalmente 3 días después de creación.';

-- =====================================================
-- 3. ACTUALIZAR DOCUMENTACIÓN DE CAMPOS EXISTENTES
-- =====================================================

-- Documentar uso de transaction_id para Openpay
COMMENT ON COLUMN payment_transactions.transaction_id
IS 'ID de transacción del gateway. Openpay: formato ch_xxxxx o tr_xxxxx. MercadoPago: payment_id.';

-- Documentar uso de gateway_response para datos de Openpay
COMMENT ON COLUMN payment_transactions.gateway_response
IS 'Respuesta completa del gateway en formato JSON. Openpay incluye: charge details, payment_method (reference, barcode_url para tiendas), customer info.';

-- Documentar estados posibles
COMMENT ON COLUMN payment_transactions.status
IS 'Estado de la transacción: pending (en proceso), paid (pagada), failed (fallida), cancelled (cancelada), refunded (reembolsada). Actualizado vía webhooks.';

-- =====================================================
-- 4. CREAR ÍNDICES PARA MEJORAR PERFORMANCE
-- =====================================================

-- Índice para búsquedas de transacciones Openpay
CREATE INDEX IF NOT EXISTS idx_payment_transactions_openpay
ON payment_transactions(payment_method, status)
WHERE payment_method = 'openpay';

COMMENT ON INDEX idx_payment_transactions_openpay
IS 'Optimiza queries de transacciones Openpay filtradas por estado.';

-- Índice para búsquedas por transaction_id (verificaciones de webhook)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id
ON payment_transactions(transaction_id);

COMMENT ON INDEX idx_payment_transactions_transaction_id
IS 'Optimiza búsqueda rápida de transacciones por ID de gateway (webhooks).';

-- Índice para órdenes con referencia de pago pendiente
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference
ON orders(payment_reference)
WHERE payment_reference IS NOT NULL;

COMMENT ON INDEX idx_orders_payment_reference
IS 'Optimiza búsqueda de órdenes por referencia de pago en tienda.';

-- Índice para órdenes con pagos pendientes por vencer
CREATE INDEX IF NOT EXISTS idx_orders_payment_due_date
ON orders(payment_due_date)
WHERE payment_due_date IS NOT NULL;

COMMENT ON INDEX idx_orders_payment_due_date
IS 'Optimiza búsqueda de órdenes con fecha límite de pago próxima (recordatorios).';

-- =====================================================
-- 5. AGREGAR CONSTRAINT PARA VALIDAR CONSISTENCIA
-- =====================================================

-- Asegurar que si hay referencia de pago, también hay fecha límite
ALTER TABLE orders
ADD CONSTRAINT orders_payment_reference_due_date_consistency
CHECK (
    (payment_reference IS NULL AND payment_due_date IS NULL) OR
    (payment_reference IS NOT NULL AND payment_due_date IS NOT NULL)
);

COMMENT ON CONSTRAINT orders_payment_reference_due_date_consistency ON orders
IS 'Asegura consistencia: si existe payment_reference, debe existir payment_due_date y viceversa.';

-- =====================================================
-- 6. CREAR VISTA PARA REPORTES DE PAGOS
-- =====================================================

-- Vista para facilitar reportes de estado de pagos
CREATE OR REPLACE VIEW payment_status_report AS
SELECT
    o.id as order_id,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.total_amount,
    o.payment_status,
    o.payment_reference,
    o.payment_due_date,
    pt.payment_method,
    pt.transaction_id,
    pt.status as transaction_status,
    pt.created_at as payment_created_at,
    pt.updated_at as payment_updated_at,
    o.created_at as order_created_at,
    CASE
        WHEN o.payment_due_date IS NOT NULL AND o.payment_due_date < NOW() THEN true
        ELSE false
    END as is_overdue
FROM orders o
LEFT JOIN payment_transactions pt ON o.id = pt.order_id
WHERE pt.payment_method IN ('openpay', 'mercadopago')
ORDER BY o.created_at DESC;

COMMENT ON VIEW payment_status_report
IS 'Vista para reportes de pagos. Incluye órdenes con pagos Openpay y MercadoPago, indicador de vencimiento.';

-- =====================================================
-- 7. FUNCIÓN PARA LIMPIAR PAGOS EXPIRADOS
-- =====================================================

-- Función para marcar órdenes con pago vencido como canceladas
CREATE OR REPLACE FUNCTION cancel_expired_store_payments()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Actualizar órdenes con pago en tienda vencido
    UPDATE orders
    SET
        payment_status = 'cancelled',
        updated_at = NOW()
    WHERE
        payment_reference IS NOT NULL
        AND payment_due_date < NOW()
        AND payment_status IN ('pending', 'pending_payment')
        AND id IN (
            SELECT order_id
            FROM payment_transactions
            WHERE payment_method = 'openpay'
            AND status = 'pending'
        );

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    -- Actualizar transacciones asociadas
    UPDATE payment_transactions
    SET
        status = 'cancelled',
        updated_at = NOW()
    WHERE
        payment_method = 'openpay'
        AND status = 'pending'
        AND order_id IN (
            SELECT id FROM orders
            WHERE payment_due_date < NOW()
            AND payment_reference IS NOT NULL
        );

    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancel_expired_store_payments()
IS 'Cancela órdenes con pago en tienda vencido. Retorna número de órdenes afectadas. Ejecutar diariamente vía cron job.';

-- =====================================================
-- 8. GRANTS DE PERMISOS (opcional, ajustar según necesidad)
-- =====================================================

-- Permitir que el servicio backend acceda a la vista
-- GRANT SELECT ON payment_status_report TO backend_service_role;

-- Permitir ejecución de la función de limpieza
-- GRANT EXECUTE ON FUNCTION cancel_expired_store_payments() TO backend_service_role;

-- =====================================================
-- 9. TRIGGER PARA LOGGING DE CAMBIOS (opcional)
-- =====================================================

-- Crear tabla de auditoría si no existe
CREATE TABLE IF NOT EXISTS payment_audit_log (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT,
    transaction_id VARCHAR(255),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(100) DEFAULT 'system',
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

COMMENT ON TABLE payment_audit_log
IS 'Log de auditoría para cambios en estado de pagos. Útil para debugging y compliance.';

-- Función trigger para logging
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO payment_audit_log (
            order_id,
            transaction_id,
            old_status,
            new_status,
            metadata
        ) VALUES (
            NEW.order_id,
            NEW.transaction_id,
            OLD.status,
            NEW.status,
            jsonb_build_object(
                'payment_method', NEW.payment_method,
                'amount', NEW.amount,
                'updated_at', NEW.updated_at
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en payment_transactions
DROP TRIGGER IF EXISTS trigger_log_payment_status_change ON payment_transactions;

CREATE TRIGGER trigger_log_payment_status_change
AFTER UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION log_payment_status_change();

COMMENT ON TRIGGER trigger_log_payment_status_change ON payment_transactions
IS 'Registra automáticamente cambios en estado de transacciones para auditoría.';

-- =====================================================
-- 10. DATOS DE PRUEBA (comentados, descomentar si necesario)
-- =====================================================

/*
-- Ejemplo de orden con pago en tienda
INSERT INTO orders (
    order_number,
    customer_name,
    customer_email,
    total_amount,
    payment_status,
    payment_reference,
    payment_barcode_url,
    payment_due_date
) VALUES (
    'TEST-001',
    'Juan Pérez',
    'juan@example.com',
    1500.00,
    'pending_payment',
    '123456789',
    'https://sandbox-api.openpay.mx/barcode/123456789',
    NOW() + INTERVAL '3 days'
);

-- Ejemplo de transacción Openpay
INSERT INTO payment_transactions (
    order_id,
    transaction_id,
    payment_method,
    amount,
    currency,
    status,
    gateway_response
) VALUES (
    (SELECT id FROM orders WHERE order_number = 'TEST-001'),
    'ch_test123456789',
    'openpay',
    1500.00,
    'MXN',
    'pending',
    '{"id": "ch_test123456789", "method": "store", "reference": "123456789"}'::jsonb
);
*/

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración add_openpay_support.sql completada exitosamente';
    RAISE NOTICE '📊 Tablas modificadas: orders, payment_transactions';
    RAISE NOTICE '🔍 Índices creados: 4';
    RAISE NOTICE '👁️  Vistas creadas: payment_status_report';
    RAISE NOTICE '⚙️  Funciones creadas: cancel_expired_store_payments()';
    RAISE NOTICE '📝 Tablas de auditoría: payment_audit_log';
    RAISE NOTICE '';
    RAISE NOTICE '📌 PRÓXIMOS PASOS:';
    RAISE NOTICE '   1. Verificar que la migración se aplicó correctamente';
    RAISE NOTICE '   2. Configurar cron job para ejecutar cancel_expired_store_payments() diariamente';
    RAISE NOTICE '   3. Actualizar políticas RLS si es necesario';
    RAISE NOTICE '   4. Testing con datos de sandbox Openpay';
END $$;
