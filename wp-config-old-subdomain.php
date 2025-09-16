<?php
/**
 * WordPress Configuration File para old.estudioartesana.com
 * 
 * INSTRUCCIONES:
 * 1. Copia tu wp-config.php original
 * 2. Actualiza los valores segun tus datos reales
 * 3. Sube este archivo como wp-config.php al directorio del subdominio
 */

// ========================================
// CONFIGURACION DE BASE DE DATOS
// ========================================

/** Nombre de la base de datos */
define( 'DB_NAME', 'TU_BASE_DE_DATOS_AQUI' );

/** Usuario de la base de datos */
define( 'DB_USER', 'TU_USUARIO_DB_AQUI' );

/** Contraseña de la base de datos */
define( 'DB_PASSWORD', 'TU_PASSWORD_DB_AQUI' );

/** Servidor de la base de datos */
define( 'DB_HOST', 'localhost' );

/** Codificacion de caracteres */
define( 'DB_CHARSET', 'utf8mb4' );

/** Cotejamiento */
define( 'DB_COLLATE', '' );

// ========================================
// CONFIGURACION DE URLs (IMPORTANTE)
// ========================================

/** URL del sitio - ACTUALIZAR PARA EL SUBDOMINIO */
define( 'WP_HOME', 'https://old.estudioartesana.com' );
define( 'WP_SITEURL', 'https://old.estudioartesana.com' );

// ========================================
// CLAVES DE SEGURIDAD
// ========================================

/**
 * IMPORTANTE: Copia las claves de tu wp-config.php original
 * O genera nuevas en: https://api.wordpress.org/secret-key/1.1/salt/
 */
define( 'AUTH_KEY',         'COPIA_TU_CLAVE_AQUI_O_GENERA_NUEVA' );
define( 'SECURE_AUTH_KEY',  'COPIA_TU_CLAVE_AQUI_O_GENERA_NUEVA' );
define( 'LOGGED_IN_KEY',    'COPIA_TU_CLAVE_AQUI_O_GENERA_NUEVA' );
define( 'NONCE_KEY',        'COPIA_TU_CLAVE_AQUI_O_GENERA_NUEVA' );
define( 'AUTH_SALT',        'COPIA_TU_CLAVE_AQUI_O_GENERA_NUEVA' );
define( 'SECURE_AUTH_SALT', 'COPIA_TU_CLAVE_AQUI_O_GENERA_NUEVA' );
define( 'LOGGED_IN_SALT',   'COPIA_TU_CLAVE_AQUI_O_GENERA_NUEVA' );
define( 'NONCE_SALT',       'COPIA_TU_CLAVE_AQUI_O_GENERA_NUEVA' );

// ========================================
// CONFIGURACIONES ESPECIALES PARA SUBDOMINIO
// ========================================

/** Prefijo de tablas */
$table_prefix = 'wp_'; // Cambia si tu sitio usa un prefijo diferente

/** Configuracion para desarrollo/staging */
define( 'WP_DEBUG', false );
define( 'WP_DEBUG_LOG', false );
define( 'WP_DEBUG_DISPLAY', false );

/** Evitar edicion de archivos desde el admin */
define( 'DISALLOW_FILE_EDIT', true );

/** Control de revisiones */
define( 'WP_POST_REVISIONS', 3 );

/** Configuracion de memoria (ajustar segun necesidades) */
define( 'WP_MEMORY_LIMIT', '256M' );

// ========================================
// CONFIGURACION AVANZADA (OPCIONAL)
// ========================================

/** 
 * Si quieres que el subdominio no sea indexado por buscadores,
 * descomenta la siguiente linea:
 */
// define( 'BLOG_PUBLIC', 0 );

/**
 * Si necesitas forzar SSL, descomenta:
 */
// define( 'FORCE_SSL_ADMIN', true );

/**
 * Para evitar actualizaciones automaticas en este subdominio:
 */
// define( 'AUTOMATIC_UPDATER_DISABLED', true );
// define( 'WP_AUTO_UPDATE_CORE', false );

// ========================================
// NO EDITES NADA DEBAJO DE ESTA LINEA
// ========================================

/** Ruta absoluta al directorio de WordPress. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Configurar las variables de WordPress y archivos incluidos. */
require_once ABSPATH . 'wp-settings.php';
