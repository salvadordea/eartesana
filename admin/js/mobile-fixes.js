/**
 * Mobile Fixes for Admin Panel
 * Ensures all buttons and interactions work correctly on mobile devices
 */

(function() {
    'use strict';

    // Detect if device is mobile/tablet
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    console.log('🔧 Mobile Fixes initialized', { isMobile, isTouch });

    /**
     * Fix touch events for all buttons
     * Prevents the 300ms delay on mobile clicks
     */
    function fixTouchEvents() {
        // Add touch event listeners to all buttons
        const buttons = document.querySelectorAll('button, .btn, .action-btn, .nav-item, [role="button"]');

        buttons.forEach(button => {
            if (button.hasAttribute('data-touch-fixed')) return;
            button.setAttribute('data-touch-fixed', 'true');

            // Prevent 300ms delay on mobile
            button.style.touchAction = 'manipulation';

            // Add visual feedback for touch
            button.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            }, { passive: true });

            button.addEventListener('touchend', function() {
                this.style.opacity = '1';
            }, { passive: true });

            button.addEventListener('touchcancel', function() {
                this.style.opacity = '1';
            }, { passive: true });
        });

        console.log(`✅ Fixed touch events for ${buttons.length} buttons`);
    }

    /**
     * Fix select dropdowns for mobile
     */
    function fixSelectDropdowns() {
        const selects = document.querySelectorAll('select, .status-dropdown');

        selects.forEach(select => {
            if (select.hasAttribute('data-touch-fixed')) return;
            select.setAttribute('data-touch-fixed', 'true');

            // Ensure selects work properly on touch devices
            select.style.touchAction = 'manipulation';

            // Add larger touch target
            if (isMobile) {
                select.style.minHeight = '44px'; // iOS recommended touch target
                select.style.fontSize = '16px'; // Prevents zoom on iOS
            }
        });

        console.log(`✅ Fixed ${selects.length} select dropdowns`);
    }

    /**
     * Fix input fields for mobile
     */
    function fixInputFields() {
        const inputs = document.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            if (input.hasAttribute('data-touch-fixed')) return;
            input.setAttribute('data-touch-fixed', 'true');

            // Prevent zoom on iOS when focusing inputs
            if (isMobile && parseFloat(getComputedStyle(input).fontSize) < 16) {
                input.style.fontSize = '16px';
            }

            // Add larger touch target
            if (isMobile && !input.style.minHeight) {
                input.style.minHeight = '44px';
            }
        });

        console.log(`✅ Fixed ${inputs.length} input fields`);
    }

    /**
     * Create and manage hamburger menu for mobile sidebar
     */
    function createHamburgerMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Check if hamburger already exists
        if (document.getElementById('hamburgerMenu')) return;

        // Create hamburger button
        const hamburger = document.createElement('button');
        hamburger.id = 'hamburgerMenu';
        hamburger.className = 'hamburger-menu';
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        hamburger.setAttribute('aria-label', 'Toggle menu');

        // Style hamburger button
        const style = document.createElement('style');
        style.textContent = `
            .hamburger-menu {
                display: none;
                position: fixed;
                top: 15px;
                left: 15px;
                z-index: 1001;
                background: linear-gradient(135deg, #2c3e50, #3498db);
                color: white;
                border: none;
                width: 50px;
                height: 50px;
                border-radius: 10px;
                font-size: 1.5rem;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                touch-action: manipulation;
                transition: all 0.3s ease;
            }

            .hamburger-menu:active {
                transform: scale(0.95);
                opacity: 0.8;
            }

            .sidebar-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 999;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .sidebar-overlay.active {
                display: block;
                opacity: 1;
            }

            @media (max-width: 768px) {
                .hamburger-menu {
                    display: block;
                }

                .sidebar {
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                }

                .sidebar.mobile-active {
                    transform: translateX(0);
                    box-shadow: 4px 0 12px rgba(0,0,0,0.3);
                }

                /* Ensure main content is not hidden on mobile */
                .main-content,
                .container {
                    margin-left: 0 !important;
                }

                /* Make top bar responsive */
                .top-bar,
                .panel-header {
                    margin-top: 70px;
                }

                /* Fix buttons to be touch-friendly */
                button,
                .btn,
                .action-btn {
                    min-height: 44px;
                    min-width: 44px;
                    touch-action: manipulation;
                }

                /* Fix table actions on mobile */
                .action-btns {
                    flex-wrap: wrap;
                }

                /* Improve modal on mobile */
                .modal-content {
                    width: 95% !important;
                    margin: 10px auto !important;
                    max-height: 95vh;
                }
            }
        `;
        document.head.appendChild(style);

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';

        // Add to body
        document.body.appendChild(hamburger);
        document.body.appendChild(overlay);

        // Toggle sidebar function
        function toggleSidebar(show) {
            if (show) {
                sidebar.classList.add('mobile-active');
                overlay.classList.add('active');
                hamburger.innerHTML = '<i class="fas fa-times"></i>';
                document.body.style.overflow = 'hidden';
            } else {
                sidebar.classList.remove('mobile-active');
                overlay.classList.remove('active');
                hamburger.innerHTML = '<i class="fas fa-bars"></i>';
                document.body.style.overflow = '';
            }
        }

        // Hamburger click
        hamburger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isActive = sidebar.classList.contains('mobile-active');
            toggleSidebar(!isActive);
        });

        // Overlay click - close sidebar
        overlay.addEventListener('click', function() {
            toggleSidebar(false);
        });

        // Close sidebar when clicking nav items on mobile
        const navItems = sidebar.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    setTimeout(() => toggleSidebar(false), 300);
                }
            });
        });

        // Close sidebar on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('mobile-active')) {
                toggleSidebar(false);
            }
        });

        console.log('✅ Hamburger menu created');
    }

    /**
     * Fix modal interactions on mobile
     */
    function fixModals() {
        const modals = document.querySelectorAll('.modal');

        modals.forEach(modal => {
            // Prevent body scroll when modal is open
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'style') {
                        const isVisible = modal.style.display === 'block';
                        if (isVisible && isMobile) {
                            document.body.style.overflow = 'hidden';
                        } else if (!isVisible) {
                            document.body.style.overflow = '';
                        }
                    }
                });
            });

            observer.observe(modal, { attributes: true });
        });

        console.log(`✅ Fixed ${modals.length} modals for mobile`);
    }

    /**
     * Improve table scrolling on mobile
     */
    function fixTableScrolling() {
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            if (table.parentElement.classList.contains('table-responsive')) return;

            // Wrap table in scrollable container
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            wrapper.style.overflowX = 'auto';
            wrapper.style.webkitOverflowScrolling = 'touch';
            wrapper.style.width = '100%';

            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });

        console.log(`✅ Made ${tables.length} tables scrollable on mobile`);
    }

    /**
     * Fix fast tap delay (300ms click delay on mobile)
     */
    function fixFastTap() {
        // Add viewport meta tag if not present
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
            document.head.appendChild(viewport);
        } else {
            // Ensure viewport allows user scaling (better UX)
            if (!viewport.content.includes('user-scalable')) {
                viewport.content += ', user-scalable=yes, maximum-scale=5.0';
            }
        }

        console.log('✅ Fixed fast tap delay');
    }

    /**
     * Add swipe gesture to close sidebar
     */
    function addSwipeGesture() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        let touchStartX = 0;
        let touchEndX = 0;

        sidebar.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        sidebar.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            // Swipe left to close
            if (touchEndX < touchStartX - 50) {
                if (sidebar.classList.contains('mobile-active')) {
                    sidebar.classList.remove('mobile-active');
                    document.querySelector('.sidebar-overlay')?.classList.remove('active');
                    document.getElementById('hamburgerMenu').innerHTML = '<i class="fas fa-bars"></i>';
                    document.body.style.overflow = '';
                }
            }
        }

        console.log('✅ Added swipe gesture to sidebar');
    }

    /**
     * Initialize all fixes
     */
    function init() {
        console.log('🚀 Initializing mobile fixes...');

        // Run immediately
        fixFastTap();
        createHamburgerMenu();
        fixTouchEvents();
        fixSelectDropdowns();
        fixInputFields();
        fixModals();
        fixTableScrolling();
        addSwipeGesture();

        // Re-run when DOM changes (for dynamically added elements)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    // Debounce to avoid too many calls
                    clearTimeout(window.mobileFixes_timeout);
                    window.mobileFixes_timeout = setTimeout(() => {
                        fixTouchEvents();
                        fixSelectDropdowns();
                        fixInputFields();
                    }, 100);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('✅ Mobile fixes initialized successfully');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-initialize on resize (orientation change)
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            console.log('📱 Screen resized, re-applying fixes...');
            fixTouchEvents();
            fixSelectDropdowns();
            fixInputFields();
        }, 250);
    }, { passive: true });

})();
