/**
 * Admin Notifications System
 * Sistema de notificaciones global para el panel de administración
 * Se ejecuta en todas las páginas del admin para mantener sincronización de pedidos pendientes
 */

(function() {
    'use strict';

    let supabaseClient = null;
    let realtimeChannel = null;
    let pendingOrdersCount = 0;
    let retryCount = 0;
    const MAX_RETRIES = 10; // Stop after 10 retries (20 seconds max)
    let isInitialized = false;

    // Initialize the notification system
    function init() {
        // Don't initialize twice
        if (isInitialized) {
            console.log('🔔 Notification system already initialized');
            return;
        }
        console.log('🔔 Inicializando sistema de notificaciones admin...');

        // Check if Supabase library is loaded
        if (!window.supabase) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.warn(`⚠️ Supabase library not loaded yet, retry ${retryCount}/${MAX_RETRIES}...`);
                setTimeout(init, 1000);
            } else {
                console.error('❌ Supabase library failed to load after max retries');
            }
            return;
        }

        // Try different methods to get Supabase client

        // Method 1: Check if there's a global supabase client instance (from pedidos.html, inventario.html, etc)
        if (window.supabase.from && typeof window.supabase.from === 'function') {
            supabaseClient = window.supabase;
            console.log('✅ Using existing global Supabase client');
        }
        // Method 2: Check for SUPABASE_CONFIG object (from config.js)
        else if (window.SUPABASE_CONFIG && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey || window.SUPABASE_CONFIG.serviceRoleKey
            );
            console.log('✅ Supabase client initialized from SUPABASE_CONFIG');
        }
        // Method 3: Check for hardcoded constants (like in inventario.html)
        else if (window.SUPABASE_URL && window.SUPABASE_KEY && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(
                window.SUPABASE_URL,
                window.SUPABASE_KEY
            );
            console.log('✅ Supabase client initialized from global constants');
        }
        else {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.warn(`⚠️ Supabase configuration not found, retry ${retryCount}/${MAX_RETRIES} in 2s...`);
                setTimeout(init, 2000);
            } else {
                console.error('❌ Supabase configuration not found after max retries. Notifications disabled.');
            }
            return;
        }

        // Verify client is working
        if (!supabaseClient || !supabaseClient.from) {
            console.error('❌ Supabase client initialization failed');
            return;
        }

        // Mark as initialized
        isInitialized = true;

        // Load initial pending count
        loadPendingCount();

        // Subscribe to realtime changes
        subscribeToOrderChanges();

        // Request notification permission
        requestNotificationPermission();

        // Refresh count every 60 seconds (backup)
        setInterval(loadPendingCount, 60000);
    }

    // Load pending orders count
    async function loadPendingCount() {
        if (!supabaseClient) return;

        try {
            const { data, error, count } = await supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            if (error) {
                console.error('Error loading pending count:', error);
                return;
            }

            pendingOrdersCount = count || 0;
            updateBadge();

        } catch (error) {
            console.error('Error in loadPendingCount:', error);
        }
    }

    // Update the badge in sidebar
    function updateBadge() {
        const badge = document.getElementById('pendingOrdersBadge');

        if (!badge) {
            console.log('Badge element not found on this page');
            return;
        }

        if (pendingOrdersCount > 0) {
            badge.textContent = pendingOrdersCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    // Subscribe to order changes
    function subscribeToOrderChanges() {
        if (!supabaseClient) return;

        console.log('🔔 Subscribing to order changes...');

        // Unsubscribe from previous channel if exists
        if (realtimeChannel) {
            supabaseClient.removeChannel(realtimeChannel);
        }

        // Subscribe to INSERT events
        realtimeChannel = supabaseClient
            .channel('admin_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    console.log('🆕 New order detected:', payload.new);
                    handleNewOrder(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    console.log('✏️ Order updated:', payload.new);
                    handleOrderUpdate(payload.new, payload.old);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to admin notifications');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error subscribing to notifications');
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ Notification subscription timed out');
                }
            });
    }

    // Handle new order
    function handleNewOrder(order) {
        // Update pending count
        if (order.status === 'pending') {
            pendingOrdersCount++;
            updateBadge();
        }

        // Show notification
        const orderNumber = order.order_number || `#${order.id}`;
        const customerName = order.customer_name || order.customer_email || 'Cliente';
        const orderType = order.order_type === 'wholesale' ? 'Mayorista' : 'Retail';
        const total = parseFloat(order.total || 0).toFixed(2);

        // Toast notification
        showToast(
            '🎉 Nuevo Pedido',
            `${orderNumber} - ${customerName} (${orderType}) - $${total}`,
            'success',
            8000
        );

        // Browser notification
        showBrowserNotification(
            '🎉 Nuevo Pedido - Estudio Artesana',
            `${orderNumber} - ${customerName}\n${orderType} - $${total}`
        );

        // Play sound
        playNotificationSound();
    }

    // Handle order update
    function handleOrderUpdate(newOrder, oldOrder) {
        const oldStatus = oldOrder?.status;
        const newStatus = newOrder?.status;

        // Update pending count if status changed
        if (oldStatus !== newStatus) {
            if (oldStatus === 'pending') {
                pendingOrdersCount = Math.max(0, pendingOrdersCount - 1);
            }
            if (newStatus === 'pending') {
                pendingOrdersCount++;
            }
            updateBadge();
        }
    }

    // Show toast notification
    function showToast(title, message, type = 'info', duration = 5000) {
        // Create toast container if it doesn't exist
        let container = document.getElementById('adminToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'adminToastContainer';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
            document.body.appendChild(container);
        }

        const icons = {
            success: 'fas fa-check-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle'
        };

        const colors = {
            success: '#28a745',
            info: '#17a2b8',
            warning: '#ffc107',
            error: '#dc3545'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${colors[type]};
        `;

        toast.innerHTML = `
            <i class="${icons[type]}" style="font-size: 1.5rem; color: ${colors[type]}; flex-shrink: 0;"></i>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 3px; color: #2c3e50;">${title}</div>
                <div style="font-size: 0.9rem; color: #666;">${message}</div>
            </div>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; color: #999; cursor: pointer; padding: 0; width: 20px; height: 20px;">&times;</button>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Show browser notification
    function showBrowserNotification(title, body) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '/assets/images/logo.webp',
                badge: '/assets/images/logo.webp',
                tag: 'order-notification',
                requireInteraction: false
            });

            notification.onclick = function() {
                window.focus();
                // Redirect to pedidos page
                if (!window.location.href.includes('pedidos.html')) {
                    window.location.href = 'pedidos.html';
                }
                this.close();
            };

            setTimeout(() => notification.close(), 10000);
        }
    }

    // Request notification permission
    async function requestNotificationPermission() {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    // Play notification sound
    function playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('No se pudo reproducir el sonido de notificación');
        }
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose functions globally
    window.AdminNotifications = {
        init,  // Allow manual initialization
        showToast,
        refresh: loadPendingCount,
        isInitialized: () => isInitialized
    };

})();
