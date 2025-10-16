/**
 * USER ADDRESSES MANAGER
 * Manages user shipping addresses CRUD operations
 */

class UserAddressesManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.addresses = [];
        this.editingAddressId = null;

        this.init();
    }

    async init() {
        // Wait for Supabase to be initialized by profile manager
        await this.waitForSupabase();

        // Get current user
        const { data: { user } } = await this.supabase.auth.getUser();
        this.currentUser = user;

        // Setup event listeners
        this.setupEventListeners();

        // Load addresses initially
        await this.loadAddresses();
    }

    async waitForSupabase() {
        return new Promise((resolve) => {
            const checkSupabase = () => {
                if (window.userProfileManager && window.userProfileManager.supabase) {
                    this.supabase = window.userProfileManager.supabase;
                    resolve();
                } else {
                    setTimeout(checkSupabase, 100);
                }
            };
            checkSupabase();
        });
    }

    setupEventListeners() {
        // Address form submission
        const addressForm = document.getElementById('addressForm');
        if (addressForm) {
            addressForm.addEventListener('submit', (e) => this.saveAddress(e));
        }
    }

    async loadAddresses() {
        const grid = document.getElementById('addressesGrid');
        if (!grid) return;

        // Show loading
        grid.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner"></i>
                <p>Cargando direcciones...</p>
            </div>
        `;

        try {
            const { data, error } = await this.supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.addresses = data || [];
            this.renderAddresses();

        } catch (error) {
            console.error('Error loading addresses:', error);
            grid.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Error al cargar las direcciones.</span>
                </div>
            `;
        }
    }

    renderAddresses() {
        const grid = document.getElementById('addressesGrid');
        if (!grid) return;

        if (this.addresses.length === 0) {
            grid.innerHTML = `
                <div class="address-card add-address-card" onclick="openAddressModal()">
                    <i class="fas fa-plus-circle"></i>
                    <span>Agregar Primera Dirección</span>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.addresses.map(address => this.renderAddressCard(address)).join('') + `
            <div class="address-card add-address-card" onclick="openAddressModal()">
                <i class="fas fa-plus-circle"></i>
                <span>Agregar Nueva Dirección</span>
            </div>
        `;
    }

    renderAddressCard(address) {
        return `
            <div class="address-card ${address.is_default ? 'default' : ''}">
                ${address.is_default ? '<span class="default-badge">Predeterminada</span>' : ''}

                <div class="address-header">
                    <div class="address-name">${address.address_name || 'Sin nombre'}</div>
                    <div class="address-recipient">${address.recipient_name}</div>
                </div>

                <div class="address-body">
                    ${address.address_line1}<br>
                    ${address.address_line2 ? address.address_line2 + '<br>' : ''}
                    ${address.city}, ${address.state}<br>
                    C.P. ${address.postal_code}<br>
                    ${address.country}<br>
                    <strong>Tel:</strong> ${address.phone}
                </div>

                <div class="address-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editAddress('${address.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    ${!address.is_default ? `
                        <button class="btn btn-sm btn-secondary" onclick="setDefaultAddress('${address.id}')">
                            <i class="fas fa-star"></i> Predeterminar
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteAddress('${address.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    openModal(addressId = null) {
        const modal = document.getElementById('addressModal');
        const form = document.getElementById('addressForm');
        const title = document.getElementById('modalTitle');

        this.editingAddressId = addressId;

        if (addressId) {
            // Edit mode
            const address = this.addresses.find(a => a.id === addressId);
            if (!address) return;

            title.textContent = 'Editar Dirección';
            document.getElementById('addressId').value = address.id;
            document.getElementById('addressName').value = address.address_name || '';
            document.getElementById('recipientName').value = address.recipient_name || '';
            document.getElementById('addressPhone').value = address.phone || '';
            document.getElementById('addressLine1').value = address.address_line1 || '';
            document.getElementById('addressLine2').value = address.address_line2 || '';
            document.getElementById('city').value = address.city || '';
            document.getElementById('state').value = address.state || '';
            document.getElementById('postalCode').value = address.postal_code || '';
            document.getElementById('country').value = address.country || 'México';
            document.getElementById('isDefault').checked = address.is_default || false;
        } else {
            // New address mode
            title.textContent = 'Nueva Dirección';
            form.reset();
            document.getElementById('country').value = 'México';
            document.getElementById('isDefault').checked = this.addresses.length === 0; // Auto-check if first address
        }

        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('addressModal');
        modal.classList.remove('active');
        this.editingAddressId = null;
    }

    async saveAddress(event) {
        event.preventDefault();

        const addressData = {
            user_id: this.currentUser.id,
            address_name: document.getElementById('addressName').value.trim(),
            recipient_name: document.getElementById('recipientName').value.trim(),
            phone: document.getElementById('addressPhone').value.trim(),
            address_line1: document.getElementById('addressLine1').value.trim(),
            address_line2: document.getElementById('addressLine2').value.trim(),
            city: document.getElementById('city').value.trim(),
            state: document.getElementById('state').value.trim(),
            postal_code: document.getElementById('postalCode').value.trim(),
            country: document.getElementById('country').value.trim(),
            is_default: document.getElementById('isDefault').checked
        };

        try {
            // If setting as default, first unset all others
            if (addressData.is_default) {
                await this.supabase
                    .from('user_addresses')
                    .update({ is_default: false })
                    .eq('user_id', this.currentUser.id);
            }

            if (this.editingAddressId) {
                // Update existing address
                const { error } = await this.supabase
                    .from('user_addresses')
                    .update(addressData)
                    .eq('id', this.editingAddressId)
                    .eq('user_id', this.currentUser.id);

                if (error) throw error;

                this.showAlert('Dirección actualizada exitosamente.', 'success');
            } else {
                // Insert new address
                const { error } = await this.supabase
                    .from('user_addresses')
                    .insert([addressData]);

                if (error) throw error;

                this.showAlert('Dirección agregada exitosamente.', 'success');
            }

            this.closeModal();
            await this.loadAddresses();

        } catch (error) {
            console.error('Error saving address:', error);
            this.showAlert('Error al guardar la dirección.', 'error');
        }
    }

    async setDefault(addressId) {
        try {
            // Unset all defaults
            await this.supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', this.currentUser.id);

            // Set new default
            const { error } = await this.supabase
                .from('user_addresses')
                .update({ is_default: true })
                .eq('id', addressId)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            this.showAlert('Dirección predeterminada actualizada.', 'success');
            await this.loadAddresses();

        } catch (error) {
            console.error('Error setting default:', error);
            this.showAlert('Error al cambiar la dirección predeterminada.', 'error');
        }
    }

    async deleteAddress(addressId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('user_addresses')
                .delete()
                .eq('id', addressId)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            this.showAlert('Dirección eliminada exitosamente.', 'success');
            await this.loadAddresses();

        } catch (error) {
            console.error('Error deleting address:', error);
            this.showAlert('Error al eliminar la dirección.', 'error');
        }
    }

    showAlert(message, type = 'info') {
        const container = document.getElementById('addressesAlert');
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

// Global functions for onclick handlers
function openAddressModal() {
    if (window.userAddressesManager) {
        window.userAddressesManager.openModal();
    }
}

function closeAddressModal() {
    if (window.userAddressesManager) {
        window.userAddressesManager.closeModal();
    }
}

function editAddress(addressId) {
    if (window.userAddressesManager) {
        window.userAddressesManager.openModal(addressId);
    }
}

function setDefaultAddress(addressId) {
    if (window.userAddressesManager) {
        window.userAddressesManager.setDefault(addressId);
    }
}

function deleteAddress(addressId) {
    if (window.userAddressesManager) {
        window.userAddressesManager.deleteAddress(addressId);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.userAddressesManager = new UserAddressesManager();
});
