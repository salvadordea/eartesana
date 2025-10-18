/**
 * MAYORISTAS AUTHENTICATION GUARD - ESTUDIO ARTESANA
 * =================================================
 * Centralized authentication system for mayoristas pages
 * Prevents infinite loops and provides secure access control for wholesale users
 */

class MayoristasAuthGuard {
    /**
     * Check if user is authenticated for mayoristas access
     * @returns {boolean} True if authenticated, false otherwise
     */
    static checkAuth() {
        try {
            console.log('🔐 MayoristasAuthGuard: Checking wholesale authentication...');

            // Check if logout is in progress
            const logoutInProgress = localStorage.getItem('mayoristasLogoutInProgress');
            if (logoutInProgress) {
                console.log('🔄 MayoristasAuthGuard: Logout in progress, denying access');
                localStorage.removeItem('mayoristasLogoutInProgress');
                return false;
            }

            // Check for infinite loop prevention
            const lastAuthCheck = localStorage.getItem('lastMayoristasAuthCheck');
            const now = Date.now();

            if (lastAuthCheck && (now - parseInt(lastAuthCheck)) < 1500) {
                console.warn('⚠️ MayoristasAuthGuard: Possible authentication loop detected');
                localStorage.removeItem('wholesaleSession');
                localStorage.removeItem('lastMayoristasAuthCheck');
                localStorage.setItem('mayoristasAuthLoopDetected', now.toString());
                return false;
            }

            // Check if we recently detected a loop
            const loopDetected = localStorage.getItem('mayoristasAuthLoopDetected');
            if (loopDetected && (now - parseInt(loopDetected)) < 5000) {
                console.warn('⚠️ MayoristasAuthGuard: Recently detected loop, waiting...');
                return false;
            }

            localStorage.setItem('lastMayoristasAuthCheck', now.toString());

            // Check for wholesale session
            const wholesaleSession = localStorage.getItem('wholesaleSession');
            if (!wholesaleSession) {
                console.log('🔒 MayoristasAuthGuard: No wholesale session found');
                return false;
            }

            // Validate session data
            let sessionData;
            try {
                sessionData = JSON.parse(wholesaleSession);
            } catch (error) {
                console.error('❌ MayoristasAuthGuard: Invalid wholesale session data format');
                localStorage.removeItem('wholesaleSession');
                return false;
            }

            // Check if user is logged in
            if (!sessionData.isLoggedIn) {
                console.log('🔒 MayoristasAuthGuard: Session exists but user not logged in');
                localStorage.removeItem('wholesaleSession');
                return false;
            }

            // Check session expiry
            if (sessionData.expires && now > sessionData.expires) {
                console.log('🔒 MayoristasAuthGuard: Wholesale session expired');
                localStorage.removeItem('wholesaleSession');
                return false;
            }

            // Check if account is active
            if (sessionData.status && sessionData.status !== 'active') {
                console.log('🔒 MayoristasAuthGuard: Wholesale account not active:', sessionData.status);
                localStorage.removeItem('wholesaleSession');
                return false;
            }

            // Session is valid
            console.log('✅ MayoristasAuthGuard: Authentication successful for:', sessionData.name);

            // Clean up loop detection flags after successful auth
            setTimeout(() => {
                localStorage.removeItem('lastMayoristasAuthCheck');
                localStorage.removeItem('mayoristasAuthLoopDetected');
            }, 3000);

            return true;

        } catch (error) {
            console.error('❌ MayoristasAuthGuard: Error during authentication check:', error);
            // Clean up on error
            localStorage.removeItem('wholesaleSession');
            localStorage.removeItem('lastMayoristasAuthCheck');
            localStorage.removeItem('mayoristasAuthLoopDetected');
            return false;
        }
    }

    /**
     * Redirect unauthorized users to the login page
     * Uses replace to prevent back button issues
     */
    static redirectToPublic() {
        try {
            console.log('🔑 MayoristasAuthGuard: Redirecting unauthorized user to login');

            // Log unauthorized access attempt (optional)
            this.logUnauthorizedAccess();

            // Use replace to prevent back button issues
            // Redirect to login page within mayoristas area
            window.location.replace('login.html');

        } catch (error) {
            console.error('❌ MayoristasAuthGuard: Error during redirect:', error);
            // Fallback redirect
            try {
                window.location.href = 'login.html';
            } catch (fallbackError) {
                console.error('❌ MayoristasAuthGuard: Fallback redirect failed:', fallbackError);
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
                referrer: document.referrer || 'direct',
                type: 'mayoristas_unauthorized'
            };

            console.warn('🚨 MayoristasAuthGuard: Unauthorized access attempt:', accessAttempt);

            // Optional: Store in localStorage for admin review
            // (In production, this should be sent to a logging service)
            const existingLogs = JSON.parse(localStorage.getItem('mayoristasAccessLogs') || '[]');
            existingLogs.push(accessAttempt);

            // Keep only last 50 attempts
            if (existingLogs.length > 50) {
                existingLogs.splice(0, existingLogs.length - 50);
            }

            localStorage.setItem('mayoristasAccessLogs', JSON.stringify(existingLogs));

        } catch (error) {
            console.error('❌ MayoristasAuthGuard: Error logging unauthorized access:', error);
        }
    }

    /**
     * Initialize auth guard on page load
     * Call this method when the DOM is ready
     */
    static initialize() {
        console.log('🚀 MayoristasAuthGuard: Initializing...');

        // Check authentication immediately
        if (!this.checkAuth()) {
            console.log('🚫 MayoristasAuthGuard: Authentication failed, redirecting...');
            this.redirectToPublic();
            return false;
        }

        console.log('✅ MayoristasAuthGuard: Initialization complete - Access granted');
        return true;
    }

    /**
     * Get current wholesale user information from session
     * @returns {object|null} User data or null if not authenticated
     */
    static getCurrentUser() {
        try {
            const wholesaleSession = localStorage.getItem('wholesaleSession');
            if (!wholesaleSession) return null;

            const sessionData = JSON.parse(wholesaleSession);
            return {
                id: sessionData.id,
                name: sessionData.name,
                email: sessionData.email,
                company: sessionData.company,
                phone: sessionData.phone,
                discount: sessionData.discount,
                status: sessionData.status,
                loginTime: sessionData.loginTime
            };
        } catch (error) {
            console.error('❌ MayoristasAuthGuard: Error getting current user:', error);
            return null;
        }
    }

    /**
     * Check if user has specific wholesale permissions (extensible for future use)
     * @param {string} permission - Permission to check
     * @returns {boolean} True if user has permission
     */
    static hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;

        // Basic permission checks
        switch (permission) {
            case 'view_wholesale_prices':
                return user.status === 'active';
            case 'place_orders':
                return user.status === 'active';
            case 'view_order_history':
                return user.status === 'active';
            default:
                // For now, all authenticated wholesale users have basic permissions
                return user.status === 'active';
        }
    }

    /**
     * Manually logout user and redirect to homepage
     */
    static logout() {
        try {
            console.log('🔓 MayoristasAuthGuard: Manual logout initiated');

            // Set logout in progress flag
            localStorage.setItem('mayoristasLogoutInProgress', 'true');

            // Clear all mayoristas-related data
            const keysToRemove = [
                'wholesaleSession',
                'wholesaleCart',
                'lastMayoristasAuthCheck',
                'mayoristasAuthLoopDetected'
            ];

            // Also clear any keys starting with 'wholesale'
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('wholesale')) {
                    keysToRemove.push(key);
                }
            }

            // Remove duplicates and clear
            [...new Set(keysToRemove)].forEach(key => {
                localStorage.removeItem(key);
            });

            // Redirect to homepage
            this.redirectToPublic();

        } catch (error) {
            console.error('❌ MayoristasAuthGuard: Error during logout:', error);
            // Force cleanup and redirect
            localStorage.setItem('mayoristasLogoutInProgress', 'true');
            localStorage.removeItem('wholesaleSession');
            localStorage.removeItem('wholesaleCart');
            this.redirectToPublic();
        }
    }

    /**
     * Get wholesale discount for current user
     * @returns {number} Discount percentage (0-100)
     */
    static getDiscount() {
        const user = this.getCurrentUser();
        return user ? (user.discount || 0) : 0;
    }

    /**
     * Check if current user is a premium wholesale customer
     * @returns {boolean} True if premium customer
     */
    static isPremiumCustomer() {
        const user = this.getCurrentUser();
        return user && user.discount >= 25; // 25% discount or higher = premium
    }

    /**
     * Redirect to mayoristas login (only for use by login page)
     * This method should only be used by the login page itself
     */
    static redirectToLogin() {
        console.log('🔑 MayoristasAuthGuard: Redirecting to mayoristas login');
        window.location.replace('login.html');
    }
}

// Make available globally but DO NOT auto-initialize
// Each page will call MayoristasAuthGuard.initialize() manually after loading navbar
window.MayoristasAuthGuard = MayoristasAuthGuard;

console.log('🛡️ MayoristasAuthGuard: Script loaded successfully (manual init required)');