/**
 * MÓDULO DE AUTENTICACIÓN PARA ESTUDIO ARTESANA
 * =============================================
 * Maneja autenticación de usuarios con Supabase Auth
 * Soporta 3 tipos de usuario: Admin, Mayorista, Usuario
 */

class AuthManager {
    constructor() {
        // Configuración de Supabase
        this.baseUrl = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
        this.apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTg5MzUsImV4cCI6MjA3MzUzNDkzNX0.qEijwK3FlnqXP2qw0gl438Tt-Rd1vrfts1cXslUuteU';
        
        // Headers para todas las peticiones
        this.headers = {
            'Content-Type': 'application/json',
            'apikey': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`
        };
        
        // Estado de autenticación
        this.currentUser = null;
        this.currentSession = null;
        this.userProfile = null;
        
        // Eventos
        this.authCallbacks = [];
        
        console.log('🔐 AuthManager inicializado');
        
        // Verificar sesión existente al cargar
        this.initializeAuth();
    }

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    /**
     * Inicializar autenticación y verificar sesión existente
     */
    async initializeAuth() {
        try {
            // Verificar si hay un token almacenado
            const storedSession = localStorage.getItem('supabase_session');
            
            if (storedSession) {
                const session = JSON.parse(storedSession);
                
                // Verificar si la sesión no ha expirado
                if (session.expires_at && new Date(session.expires_at * 1000) > new Date()) {
                    await this.setSession(session);
                    console.log('✅ Sesión restaurada exitosamente');
                } else {
                    // Limpiar sesión expirada
                    this.clearSession();
                    console.log('⚠️ Sesión expirada, se ha limpiado');
                }
            }
            
        } catch (error) {
            console.error('❌ Error inicializando autenticación:', error);
            this.clearSession();
        }
    }

    // ==========================================
    // REGISTRO DE USUARIO
    // ==========================================

    /**
     * Registrar nuevo usuario
     */
    async signUp(email, password, userData = {}) {
        try {
            console.log(`👤 Registrando usuario: ${email}`);
            
            const response = await fetch(`${this.baseUrl}/auth/v1/signup`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    email,
                    password,
                    data: {
                        full_name: userData.fullName || '',
                        role: userData.role || 'Usuario',
                        phone: userData.phone || ''
                    }
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.msg || result.message || 'Error en el registro');
            }

            console.log('✅ Usuario registrado exitosamente');
            
            return {
                success: true,
                message: 'Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.',
                user: result.user,
                session: result.session
            };

        } catch (error) {
            console.error('❌ Error en registro:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    // ==========================================
    // LOGIN
    // ==========================================

    /**
     * Iniciar sesión con email y password
     */
    async signIn(email, password) {
        try {
            console.log(`🔐 Iniciando sesión para: ${email}`);
            
            const response = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.msg || result.message || 'Credenciales incorrectas');
            }

            // Establecer sesión
            await this.setSession(result);
            
            console.log('✅ Sesión iniciada exitosamente');
            
            return {
                success: true,
                message: 'Sesión iniciada exitosamente',
                user: result.user,
                session: result
            };

        } catch (error) {
            console.error('❌ Error en login:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    /**
     * Cerrar sesión
     */
    async signOut() {
        try {
            console.log('🚪 Cerrando sesión');
            
            if (this.currentSession?.access_token) {
                // Notificar a Supabase del logout
                await fetch(`${this.baseUrl}/auth/v1/logout`, {
                    method: 'POST',
                    headers: {
                        ...this.headers,
                        'Authorization': `Bearer ${this.currentSession.access_token}`
                    }
                });
            }
            
            // Limpiar sesión local
            this.clearSession();
            
            console.log('✅ Sesión cerrada exitosamente');
            
            return {
                success: true,
                message: 'Sesión cerrada exitosamente'
            };

        } catch (error) {
            console.error('❌ Error cerrando sesión:', error);
            // Aunque haya error, limpiar sesión local
            this.clearSession();
            
            return {
                success: true,
                message: 'Sesión cerrada'
            };
        }
    }

    // ==========================================
    // GESTIÓN DE SESIONES
    // ==========================================

    /**
     * Establecer sesión activa
     */
    async setSession(session) {
        try {
            this.currentSession = session;
            this.currentUser = session.user;
            
            // Guardar en localStorage
            localStorage.setItem('supabase_session', JSON.stringify(session));
            
            // Actualizar headers con token
            this.updateAuthHeaders(session.access_token);
            
            // Obtener perfil del usuario
            await this.fetchUserProfile();
            
            // Actualizar last_login
            if (this.userProfile?.id) {
                await this.updateLastLogin();
            }
            
            // Notificar callbacks
            this.notifyAuthChange(true);
            
        } catch (error) {
            console.error('❌ Error estableciendo sesión:', error);
            throw error;
        }
    }

    /**
     * Limpiar sesión
     */
    clearSession() {
        this.currentUser = null;
        this.currentSession = null;
        this.userProfile = null;
        
        // Limpiar localStorage
        localStorage.removeItem('supabase_session');
        
        // Restaurar headers originales
        this.headers.Authorization = `Bearer ${this.apiKey}`;
        
        // Notificar callbacks
        this.notifyAuthChange(false);
    }

    /**
     * Actualizar headers de autenticación
     */
    updateAuthHeaders(accessToken) {
        this.headers.Authorization = `Bearer ${accessToken}`;
    }

    // ==========================================
    // PERFIL DE USUARIO
    // ==========================================

    /**
     * Obtener perfil del usuario actual
     */
    async fetchUserProfile() {
        try {
            if (!this.currentUser?.id) return null;
            
            const response = await fetch(`${this.baseUrl}/rest/v1/user_profiles?id=eq.${this.currentUser.id}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error('No se pudo obtener el perfil del usuario');
            }

            const profiles = await response.json();
            
            if (profiles.length > 0) {
                this.userProfile = profiles[0];
                console.log(`👤 Perfil cargado: ${this.userProfile.full_name} (${this.userProfile.role})`);
                return this.userProfile;
            }
            
            return null;

        } catch (error) {
            console.error('❌ Error obteniendo perfil:', error);
            return null;
        }
    }

    /**
     * Actualizar perfil de usuario
     */
    async updateProfile(profileData) {
        try {
            if (!this.currentUser?.id) {
                throw new Error('Usuario no autenticado');
            }
            
            const response = await fetch(`${this.baseUrl}/rest/v1/user_profiles?id=eq.${this.currentUser.id}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error actualizando perfil');
            }

            // Actualizar perfil local
            await this.fetchUserProfile();
            
            console.log('✅ Perfil actualizado exitosamente');
            
            return {
                success: true,
                message: 'Perfil actualizado exitosamente',
                profile: this.userProfile
            };

        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Actualizar last_login del usuario
     */
    async updateLastLogin() {
        try {
            if (!this.currentUser?.id) return;
            
            await fetch(`${this.baseUrl}/rest/v1/rpc/update_user_last_login`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    user_id: this.currentUser.id
                })
            });
            
        } catch (error) {
            console.error('⚠️ Error actualizando last_login:', error);
            // No es crítico, continuar silenciosamente
        }
    }

    // ==========================================
    // APLICACIONES DE MAYORISTA
    // ==========================================

    /**
     * Solicitar ser mayorista
     */
    async applyForWholesale(applicationData) {
        try {
            if (!this.currentUser?.id) {
                throw new Error('Usuario no autenticado');
            }
            
            const response = await fetch(`${this.baseUrl}/rest/v1/wholesale_applications`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    user_id: this.currentUser.id,
                    ...applicationData
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error enviando solicitud');
            }

            // Actualizar fecha de aplicación en el perfil
            await this.updateProfile({
                wholesale_application_date: new Date().toISOString()
            });
            
            console.log('✅ Solicitud de mayorista enviada');
            
            return {
                success: true,
                message: 'Solicitud enviada exitosamente. Será revisada en 2-3 días hábiles.',
            };

        } catch (error) {
            console.error('❌ Error enviando solicitud de mayorista:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    // ==========================================
    // UTILIDADES Y GETTERS
    // ==========================================

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        return !!(this.currentUser && this.currentSession);
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Obtener perfil del usuario actual
     */
    getUserProfile() {
        return this.userProfile;
    }

    /**
     * Obtener rol del usuario
     */
    getUserRole() {
        return this.userProfile?.role || 'Usuario';
    }

    /**
     * Verificar si el usuario es admin
     */
    isAdmin() {
        return this.getUserRole() === 'Admin';
    }

    /**
     * Verificar si el usuario es mayorista
     */
    isWholesaler() {
        return this.getUserRole() === 'Mayorista' && this.userProfile?.wholesale_approved;
    }

    /**
     * Verificar si el usuario es mayorista pendiente
     */
    isWholesalePending() {
        return this.userProfile?.wholesale_application_date && !this.userProfile?.wholesale_approved;
    }

    /**
     * Obtener descuento de mayorista
     */
    getWholesaleDiscount() {
        return this.userProfile?.wholesale_discount_percent || 0;
    }

    // ==========================================
    // EVENTOS DE AUTENTICACIÓN
    // ==========================================

    /**
     * Suscribirse a cambios de autenticación
     */
    onAuthChange(callback) {
        this.authCallbacks.push(callback);
        
        // Llamar inmediatamente con el estado actual
        callback(this.isAuthenticated(), this.currentUser, this.userProfile);
        
        // Retornar función para cancelar suscripción
        return () => {
            const index = this.authCallbacks.indexOf(callback);
            if (index > -1) {
                this.authCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Notificar cambios de autenticación
     */
    notifyAuthChange(isAuthenticated) {
        this.authCallbacks.forEach(callback => {
            try {
                callback(isAuthenticated, this.currentUser, this.userProfile);
            } catch (error) {
                console.error('❌ Error en callback de autenticación:', error);
            }
        });
    }

    // ==========================================
    // RECUPERACIÓN DE CONTRASEÑA
    // ==========================================

    /**
     * Solicitar reseteo de contraseña
     */
    async resetPassword(email) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/v1/recover`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    email
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.msg || 'Error enviando email de recuperación');
            }

            console.log('✅ Email de recuperación enviado');
            
            return {
                success: true,
                message: 'Se ha enviado un enlace de recuperación a tu email'
            };

        } catch (error) {
            console.error('❌ Error en recuperación de contraseña:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global
window.authManager = new AuthManager();

console.log('🔐 AuthManager cargado y disponible como window.authManager');

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
