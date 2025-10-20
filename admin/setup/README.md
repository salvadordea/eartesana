# Archivos de Configuración SQL - Estudio Artesana

⚠️ **IMPORTANTE:** Este directorio contiene archivos de configuración sensibles que NO deben subirse a GitHub.

## Archivos Incluidos

### Configuración de Pagos
- **`setup-payment-config.html`** - Configuración del sistema de códigos de referencia para transferencias bancarias y tabla de configuración bancaria

### Realtime y Notificaciones
- **`enable-realtime-orders.html`** - Habilita Supabase Realtime para la tabla de pedidos (necesario para notificaciones en tiempo real)

### Configuración de Mayoristas
- **`setup-mayoristas.html`** - Configuración inicial del sistema de mayoristas
- **`add-mayoristas-columns.html`** - Añade columnas necesarias para el sistema de mayoristas
- **`add-mayorista-columns-to-user-profiles.html`** - Añade campos de mayorista a los perfiles de usuario
- **`add-saved-addresses-table.html`** - Crea tabla para direcciones guardadas de mayoristas

### Almacenamiento
- **`setup-storage.html`** - Configuración de Supabase Storage para imágenes de productos

## Uso

1. **Una sola vez:** Abre cada archivo HTML relevante en tu navegador
2. Copia el SQL proporcionado
3. Ejecuta el SQL en Supabase Dashboard > SQL Editor
4. **NO** subas estos archivos a GitHub (están en `.gitignore`)

## Orden de Ejecución Recomendado

1. `setup-storage.html` - Primero, para configurar almacenamiento de imágenes
2. `setup-mayoristas.html` - Base del sistema de mayoristas
3. `add-mayoristas-columns.html` - Campos adicionales
4. `add-mayorista-columns-to-user-profiles.html` - Perfiles de usuario
5. `add-saved-addresses-table.html` - Sistema de direcciones
6. `setup-payment-config.html` - Sistema de pagos y referencias
7. `enable-realtime-orders.html` - Notificaciones en tiempo real

## Seguridad

- ✅ Estos archivos están excluidos del repositorio vía `.gitignore`
- ✅ Solo deben usarse en entorno de desarrollo local
- ✅ Elimina o mueve fuera del servidor en producción
- ⚠️ NO contienen credenciales, pero muestran estructura de base de datos

## Backups

Mantén estos archivos como respaldo en caso de necesitar recrear la base de datos o configurar un nuevo entorno.
