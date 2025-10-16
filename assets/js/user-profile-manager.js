/**
 * USER PROFILE MANAGER
 * Manages user profile information and authentication
 */

class UserProfileManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.userProfile = null;

        this.init();
    }

    async init() {
        // Initialize Supabase
        if (window.EstudioArtesanaConfig && window.EstudioArtesanaConfig.supabase) {
            const { url, anonKey } = window.EstudioArtesanaConfig.supabase;
            this.supabase = supabase.createClient(url, anonKey);
        } else {
            console.error('⚠️ Supabase config not found');
            return;
        }

        // Check authentication
        await this.checkAuth();

        // Setup event listeners
        this.setupEventListeners();
    }

    async checkAuth() {
        const { data: { user } } = await this.supabase.auth.getUser();

        if (!user) {
            // Redirect to login
            window.location.href = 'micuenta.html';
            return;
        }

        this.currentUser = user;
        await this.loadUserProfile();
    }

    async loadUserProfile() {
        try {
            // Get user profile
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) {
                console.error('Error loading profile:', error);

                // If profile doesn't exist, create it
                if (error.code === 'PGRST116') {
                    await this.createUserProfile();
                    return;
                }

                throw error;
            }

            this.userProfile = data;
            this.displayProfile();

        } catch (error) {
            console.error('Error in loadUserProfile:', error);
            this.showAlert('profileAlert', 'Error al cargar el perfil. Por favor, recarga la página.', 'error');
        }
    }

    async createUserProfile() {
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .insert([{
                    id: this.currentUser.id,
                    email: this.currentUser.email,
                    full_name: this.currentUser.user_metadata?.full_name || '',
                    role: 'Cliente',
                    is_active: true
                }])
                .select()
                .single();

            if (error) throw error;

            this.userProfile = data;
            this.displayProfile();

        } catch (error) {
            console.error('Error creating profile:', error);
            this.showAlert('profileAlert', 'Error al crear el perfil.', 'error');
        }
    }

    displayProfile() {
        // Display in sidebar
        document.getElementById('userEmail').textContent = this.userProfile.email || '';

        // Fill form
        document.getElementById('fullName').value = this.userProfile.full_name || '';
        document.getElementById('email').value = this.userProfile.email || '';
        document.getElementById('phone').value = this.userProfile.phone || '';
        document.getElementById('role').value = this.userProfile.role || 'Cliente';
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.saveProfile(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.logout(e));
        }

        // Section navigation
        const navItems = document.querySelectorAll('.nav-item[data-section]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => this.switchSection(e));
        });
    }

    async saveProfile(event) {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (!fullName) {
            this.showAlert('profileAlert', 'El nombre es requerido.', 'error');
            return;
        }

        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .update({
                    full_name: fullName,
                    phone: phone
                })
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;

            this.userProfile = data;
            this.showAlert('profileAlert', '✓ Perfil actualizado exitosamente.', 'success');

        } catch (error) {
            console.error('Error saving profile:', error);
            this.showAlert('profileAlert', 'Error al guardar los cambios.', 'error');
        }
    }

    async logout(event) {
        event.preventDefault();

        if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            return;
        }

        try {
            await this.supabase.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error logging out:', error);
            alert('Error al cerrar sesión. Por favor, intenta de nuevo.');
        }
    }

    switchSection(event) {
        event.preventDefault();

        const clickedItem = event.currentTarget;
        const sectionName = clickedItem.dataset.section;

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        clickedItem.classList.add('active');

        // Show corresponding section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const sectionMap = {
            'profile': 'profileSection',
            'addresses': 'addressesSection',
            'orders': 'ordersSection',
            'preferences': 'preferencesSection'
        };

        const targetSection = document.getElementById(sectionMap[sectionName]);
        if (targetSection) {
            targetSection.classList.add('active');

            // Load addresses when switching to addresses section
            if (sectionName === 'addresses' && window.userAddressesManager) {
                window.userAddressesManager.loadAddresses();
            }
        }
    }

    showAlert(containerId, message, type = 'info') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const iconMap = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'info': 'fa-info-circle'
        };

        container.innerHTML = `
            <div class="alert alert-${type}">
                <i class="fas ${iconMap[type]}"></i>
                <span>${message}</span>
            </div>
        `;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.userProfileManager = new UserProfileManager();
});
