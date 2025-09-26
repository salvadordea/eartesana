/**
 * ADMIN AUTHENTICATION GUARD - ESTUDIO ARTESANA
 * ============================================
 * Centralized authentication system for admin pages
 * Prevents infinite loops and provides secure access control
 */

class AdminAuthGuard {
    /**
     * Check if user is authenticated for admin access
     * @returns {boolean} True if authenticated, false otherwise
     */
    static checkAuth() {
        try {
            console.log('🔐 AdminAuthGuard: Checking authentication...');

            // Check if logout is in progress
            const logoutInProgress = localStorage.getItem('adminLogoutInProgress');
            if (logoutInProgress) {
                console.log('🔄 AdminAuthGuard: Logout in progress, denying access');
                localStorage.removeItem('adminLogoutInProgress');
                return false;
            }

            // Check for infinite loop prevention
            const lastAuthCheck = localStorage.getItem('lastAuthCheck');
            const now = Date.now();

            if (lastAuthCheck && (now - parseInt(lastAuthCheck)) < 1500) {
                console.warn('⚠️ AdminAuthGuard: Possible authentication loop detected');
                localStorage.removeItem('adminSession');
                localStorage.removeItem('lastAuthCheck');
                localStorage.setItem('adminAuthLoopDetected', now.toString());
                return false;
            }

            // Check if we recently detected a loop
            const loopDetected = localStorage.getItem('adminAuthLoopDetected');
            if (loopDetected && (now - parseInt(loopDetected)) < 5000) {
                console.warn('⚠️ AdminAuthGuard: Recently detected loop, waiting...');
                return false;
            }

            localStorage.setItem('lastAuthCheck', now.toString());

            // Check for admin session
            const adminSession = localStorage.getItem('adminSession');
            if (!adminSession) {
                console.log('🔒 AdminAuthGuard: No admin session found');
                return false;
            }

            // Validate session data
            let sessionData;
            try {
                sessionData = JSON.parse(adminSession);
            } catch (error) {
                console.error('❌ AdminAuthGuard: Invalid session data format');
                localStorage.removeItem('adminSession');
                return false;
            }

            // Check if user is logged in
            if (!sessionData.isLoggedIn) {
                console.log('🔒 AdminAuthGuard: Session exists but user not logged in');
                localStorage.removeItem('adminSession');
                return false;
            }

            // Check session expiry
            if (sessionData.expires && now > sessionData.expires) {
                console.log('🔒 AdminAuthGuard: Admin session expired');
                localStorage.removeItem('adminSession');
                return false;
            }

            // Session is valid
            console.log('✅ AdminAuthGuard: Authentication successful');

            // Clean up loop detection flags after successful auth
            setTimeout(() => {
                localStorage.removeItem('lastAuthCheck');
                localStorage.removeItem('adminAuthLoopDetected');
            }, 3000);

            return true;

        } catch (error) {
            console.error('❌ AdminAuthGuard: Error during authentication check:', error);
            // Clean up on error
            localStorage.removeItem('adminSession');
            localStorage.removeItem('lastAuthCheck');
            localStorage.removeItem('adminAuthLoopDetected');
            return false;
        }
    }

    /**
     * Redirect unauthorized users to the public homepage
     * Uses absolute path to prevent loops and provides better UX
     */
    static redirectToPublic() {
        try {
            console.log('🏠 AdminAuthGuard: Redirecting unauthorized user to homepage');

            // Log unauthorized access attempt (optional)
            this.logUnauthorizedAccess();

            // Use replace to prevent back button issues
            // Redirect to homepage, not login page, to prevent loops
            window.location.replace('../index.html');

        } catch (error) {
            console.error('❌ AdminAuthGuard: Error during redirect:', error);
            // Fallback redirect
            try {
                window.location.href = '../index.html';
            } catch (fallbackError) {
                console.error('❌ AdminAuthGuard: Fallback redirect failed:', fallbackError);
            }
        }
    }

    /**
     * Log unauthorized access attempts for security monitoring
     * @private
     */
    static logUnauthorizedAccess() {
        try {
            const accessAttempt = {
                timestamp: new Date().toISOString(),
                page: window.location.pathname,
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'direct'
            };

            console.warn('🚨 AdminAuthGuard: Unauthorized access attempt:', accessAttempt);

            // Optional: Store in localStorage for admin review
            // (In production, this should be sent to a logging service)
            const existingLogs = JSON.parse(localStorage.getItem('adminAccessLogs') || '[]');
            existingLogs.push(accessAttempt);

            // Keep only last 50 attempts
            if (existingLogs.length > 50) {
                existingLogs.splice(0, existingLogs.length - 50);
            }

            localStorage.setItem('adminAccessLogs', JSON.stringify(existingLogs));

        } catch (error) {
            console.error('❌ AdminAuthGuard: Error logging unauthorized access:', error);
        }
    }

    /**
     * Initialize auth guard on page load
     * Call this method when the DOM is ready
     */
    static initialize() {
        console.log('🚀 AdminAuthGuard: Initializing...');

        // Check authentication immediately
        if (!this.checkAuth()) {
            console.log('🚫 AdminAuthGuard: Authentication failed, redirecting...');
            this.redirectToPublic();
            return false;
        }

        console.log('✅ AdminAuthGuard: Initialization complete - Access granted');
        return true;
    }

    /**
     * Get current user information from session
     * @returns {object|null} User data or null if not authenticated
     */
    static getCurrentUser() {
        try {
            const adminSession = localStorage.getItem('adminSession');
            if (!adminSession) return null;

            const sessionData = JSON.parse(adminSession);
            return {
                email: sessionData.email || sessionData.username,
                userId: sessionData.userId,
                loginTime: sessionData.loginTime,
                source: sessionData.source
            };
        } catch (error) {
            console.error('❌ AdminAuthGuard: Error getting current user:', error);
            return null;
        }
    }

    /**
     * Check if user has specific admin permissions (extensible for future use)
     * @param {string} permission - Permission to check
     * @returns {boolean} True if user has permission
     */
    static hasPermission(permission) {
        // For now, all authenticated admin users have all permissions
        // This can be extended in the future for role-based access
        return this.checkAuth();
    }

    /**
     * Manually logout user and redirect to homepage
     */
    static logout() {
        try {
            console.log('🔓 AdminAuthGuard: Manual logout initiated');

            // Set logout in progress flag
            localStorage.setItem('adminLogoutInProgress', 'true');

            // Clear all admin-related data
            const keysToRemove = [
                'adminSession',
                'lastAuthCheck',
                'lastLoginCheck',
                'adminAuthLoopDetected'
            ];

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // Close Supabase session if available
            if (window.supabase) {
                try {
                    window.supabase.auth.signOut();
                } catch (supabaseError) {
                    console.warn('⚠️ AdminAuthGuard: Error closing Supabase session:', supabaseError);
                }
            }

            // Redirect to homepage
            this.redirectToPublic();

        } catch (error) {
            console.error('❌ AdminAuthGuard: Error during logout:', error);
            // Force cleanup and redirect
            localStorage.setItem('adminLogoutInProgress', 'true');
            localStorage.removeItem('adminSession');
            this.redirectToPublic();
        }
    }
}

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AdminAuthGuard.initialize();
    });
} else {
    AdminAuthGuard.initialize();
}

// Make available globally
window.AdminAuthGuard = AdminAuthGuard;

console.log('🛡️ AdminAuthGuard: Script loaded successfully');