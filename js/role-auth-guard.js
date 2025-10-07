/**
 * ROLE-BASED AUTHENTICATION GUARD - ESTUDIO ARTESANA
 * ===================================================
 * Sistema centralizado de control de acceso basado en roles
 * Roles soportados: Admin, Mayorista, Usuario
 */

class RoleAuthGuard {
    /**
     * Roles disponibles en el sistema
     */
    static ROLES = {
        ADMIN: 'Admin',
        MAYORISTA: 'Mayorista',
        USUARIO: 'Usuario'
    };

    /**
     * Verifica autenticación y rol del usuario
     * @param {string|string[]} allowedRoles - Rol(es) permitido(s) para acceder
     * @param {string} sessionKey - Clave de localStorage para la sesión (default: depende del rol)
     * @returns {object|null} sessionData si está autenticado y autorizado, null si no
     */
    static checkAuth(allowedRoles, sessionKey = null) {
        try {
            console.log('🔐 RoleAuthGuard: Verificando autenticación...', { allowedRoles });

            // Normalizar allowedRoles a array
            const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Intentar obtener sesión de diferentes fuentes
            let sessionData = null;
            let foundSessionKey = null;

            // Si se especificó una clave de sesión, usarla
            if (sessionKey) {
                const session = localStorage.getItem(sessionKey);
                if (session) {
                    try {
                        sessionData = JSON.parse(session);
                        foundSessionKey = sessionKey;
                    } catch (e) {
                        console.error('❌ Error parseando sesión:', e);
                    }
                }
            } else {
                // Intentar con diferentes claves de sesión según los roles permitidos
                const sessionKeys = {
                    [this.ROLES.ADMIN]: 'adminSession',
                    [this.ROLES.MAYORISTA]: 'wholesaleSession',
                    [this.ROLES.USUARIO]: 'userSession'
                };

                for (const role of rolesArray) {
                    const key = sessionKeys[role];
                    if (key) {
                        const session = localStorage.getItem(key);
                        if (session) {
                            try {
                                sessionData = JSON.parse(session);
                                foundSessionKey = key;
                                break;
                            } catch (e) {
                                console.error(`❌ Error parseando sesión ${key}:`, e);
                            }
                        }
                    }
                }
            }

            // No hay sesión
            if (!sessionData) {
                console.log('🔒 RoleAuthGuard: No se encontró sesión');
                return null;
            }

            // Verificar que esté logueado
            if (!sessionData.isLoggedIn) {
                console.log('🔒 RoleAuthGuard: Usuario no está logueado');
                localStorage.removeItem(foundSessionKey);
                return null;
            }

            // Verificar expiración
            const now = Date.now();
            if (sessionData.expires && now > sessionData.expires) {
                console.log('🔒 RoleAuthGuard: Sesión expirada');
                localStorage.removeItem(foundSessionKey);
                return null;
            }

            // Verificar rol del usuario
            const userRole = sessionData.role;

            // Si no hay rol en la sesión, intentar inferirlo de la clave de sesión
            let effectiveRole = userRole;
            if (!effectiveRole) {
                if (foundSessionKey === 'adminSession') effectiveRole = this.ROLES.ADMIN;
                else if (foundSessionKey === 'wholesaleSession') effectiveRole = this.ROLES.MAYORISTA;
                else if (foundSessionKey === 'userSession') effectiveRole = this.ROLES.USUARIO;
            }

            // Verificar si el rol del usuario está permitido
            if (!rolesArray.includes(effectiveRole)) {
                console.warn(`⚠️ RoleAuthGuard: Acceso denegado. Rol de usuario: ${effectiveRole}, Roles permitidos:`, rolesArray);
                return null;
            }

            // Todo OK
            console.log(`✅ RoleAuthGuard: Autenticación exitosa. Rol: ${effectiveRole}`);
            return { ...sessionData, role: effectiveRole, sessionKey: foundSessionKey };

        } catch (error) {
            console.error('❌ RoleAuthGuard: Error durante verificación:', error);
            return null;
        }
    }

    /**
     * Protege una página requiriendo autenticación con rol(es) específico(s)
     * @param {string|string[]} allowedRoles - Rol(es) permitido(s)
     * @param {string} redirectUrl - URL de redirección si no autorizado
     * @returns {object|null} sessionData si autorizado
     */
    static requireAuth(allowedRoles, redirectUrl = '../index.html') {
        const sessionData = this.checkAuth(allowedRoles);

        if (!sessionData) {
            this.redirectUnauthorized(allowedRoles, redirectUrl);
            return null;
        }

        return sessionData;
    }

    /**
     * Redirige usuarios no autorizados
     * @param {string|string[]} allowedRoles - Roles que se esperaban
     * @param {string} redirectUrl - URL de redirección
     */
    static redirectUnauthorized(allowedRoles, redirectUrl) {
        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        const rolesText = rolesArray.join(' o ');

        console.log(`🚫 RoleAuthGuard: Redirigiendo usuario no autorizado`);

        // Mensaje personalizado según el rol requerido
        let message = '';
        if (rolesArray.includes(this.ROLES.ADMIN) && rolesArray.length === 1) {
            message = 'Acceso denegado: Esta sección es solo para administradores.';
        } else if (rolesArray.includes(this.ROLES.MAYORISTA) && rolesArray.length === 1) {
            message = 'Acceso denegado: Esta sección es solo para clientes mayoristas.';
        } else if (rolesArray.includes(this.ROLES.USUARIO) && rolesArray.length === 1) {
            message = 'Acceso denegado: Debes iniciar sesión como usuario.';
        } else {
            message = `Acceso denegado: Necesitas ser ${rolesText}.`;
        }

        alert(message + '\n\nSerás redirigido a la página principal.');

        // Redirigir
        setTimeout(() => {
            window.location.replace(redirectUrl);
        }, 100);
    }

    /**
     * Verifica si el usuario actual tiene un rol específico
     * @param {string} role - Rol a verificar
     * @returns {boolean}
     */
    static hasRole(role) {
        const sessionData = this.checkAuth([this.ROLES.ADMIN, this.ROLES.MAYORISTA, this.ROLES.USUARIO]);
        return sessionData && sessionData.role === role;
    }

    /**
     * Obtiene la sesión actual sin importar el rol
     * @returns {object|null}
     */
    static getCurrentSession() {
        return this.checkAuth([this.ROLES.ADMIN, this.ROLES.MAYORISTA, this.ROLES.USUARIO]);
    }

    /**
     * Cierra sesión del usuario actual
     * @param {string} redirectUrl - URL de redirección después del logout
     */
    static logout(redirectUrl = '../index.html') {
        try {
            console.log('🔓 RoleAuthGuard: Cerrando sesión...');

            // Limpiar todas las sesiones posibles
            const sessionKeys = ['adminSession', 'wholesaleSession', 'userSession', 'supabase_session'];
            sessionKeys.forEach(key => {
                localStorage.removeItem(key);
            });

            // Cerrar sesión de Supabase si está disponible
            if (window.supabase) {
                try {
                    window.supabase.auth.signOut();
                } catch (e) {
                    console.warn('⚠️ Error cerrando sesión de Supabase:', e);
                }
            }

            console.log('✅ RoleAuthGuard: Sesión cerrada exitosamente');

            // Redirigir
            window.location.replace(redirectUrl);

        } catch (error) {
            console.error('❌ RoleAuthGuard: Error durante logout:', error);
            // Forzar redirección de todas formas
            window.location.replace(redirectUrl);
        }
    }
}

// Hacer disponible globalmente
window.RoleAuthGuard = RoleAuthGuard;

console.log('🛡️ RoleAuthGuard: Script cargado exitosamente');
