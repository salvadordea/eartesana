/**
 * Universal Navbar Component for Mayoristas Portal
 * Provides consistent navigation across all mayorista pages
 */

// Navbar HTML Template
const MAYORISTA_NAVBAR_HTML = `
<style>
    /* Navbar Mayorista Profesional */
    .mayorista-navbar {
        background: #ffffff;
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
        position: sticky;
        top: 0;
        z-index: 1000;
        backdrop-filter: blur(10px);
    }

    .mayorista-navbar .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 20px;
    }

    .navbar-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 0;
        gap: 30px;
    }

    .navbar-logo {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .navbar-logo img {
        width: 210px;
        height: 72px;
        object-fit: contain;
        transition: transform 0.3s ease;
    }

    .navbar-logo:hover img {
        transform: scale(1.02);
    }

    .navbar-nav {
        display: flex;
        list-style: none;
        gap: 32px;
        align-items: center;
        margin: 0;
        padding: 0;
    }

    .navbar-nav-link {
        text-decoration: none;
        color: #333;
        font-weight: 500;
        font-size: 14px;
        letter-spacing: 0.6px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        padding: 8px 4px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .navbar-nav-link::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background: #C0C0C0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateX(-50%);
    }

    .navbar-nav-link:hover,
    .navbar-nav-link.active {
        color: #C0C0C0;
        transform: translateY(-1px);
    }

    .navbar-nav-link:hover::after,
    .navbar-nav-link.active::after {
        width: 100%;
    }

    .navbar-user {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .user-info-nav {
        text-align: right;
    }

    .user-name-nav {
        font-weight: 600;
        color: #2c2c2c;
        font-size: 14px;
        margin: 0;
    }

    .user-company-nav {
        font-size: 12px;
        color: #666;
        margin: 0;
    }

    .logout-button {
        background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
        color: #000;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        letter-spacing: 0.5px;
    }

    .logout-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
        background: linear-gradient(135deg, #D0D0D0, #B0B0B0);
    }

    /* Mobile Menu */
    .mobile-menu-toggle {
        display: none;
        flex-direction: column;
        gap: 4px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 10px;
    }

    .mobile-menu-toggle span {
        width: 25px;
        height: 3px;
        background-color: #2c2c2c;
        transition: all 0.3s ease;
    }

    .mobile-menu-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }

    .mobile-menu-toggle.active span:nth-child(2) {
        opacity: 0;
    }

    .mobile-menu-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }

    @media (max-width: 768px) {
        .mobile-menu-toggle {
            display: flex;
        }

        .navbar-content {
            position: relative;
        }

        .navbar-nav {
            position: fixed;
            top: 0;
            left: -100%;
            width: 80%;
            max-width: 300px;
            height: 100vh;
            background: #ffffff;
            box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
            padding: 80px 20px 20px;
            transition: left 0.3s ease;
            flex-direction: column;
            align-items: flex-start;
            gap: 0;
            overflow-y: auto;
        }

        .navbar-nav.mobile-active {
            left: 0;
        }

        .navbar-nav-link {
            width: 100%;
            padding: 15px 0;
            border-bottom: 1px solid #eee;
        }

        .navbar-user {
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
        }

        .user-info-nav {
            display: none;
        }

        .navbar-logo img {
            width: 150px;
            height: 55px;
        }
    }
</style>

<nav class="mayorista-navbar">
    <div class="container">
        <div class="navbar-content">
            <!-- Logo -->
            <a href="tienda.html" class="navbar-logo">
                <img src="../assets/images/logo.webp" alt="Estudio Artesana">
            </a>

            <!-- Mobile Menu Toggle -->
            <button class="mobile-menu-toggle" id="mobileMenuToggle">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <!-- Navigation Links -->
            <ul class="navbar-nav" id="navbarNav">
                <li>
                    <a href="tienda.html" class="navbar-nav-link" data-page="tienda">
                        <i class="fas fa-store"></i>
                        <span>Tienda</span>
                    </a>
                </li>
                <li>
                    <a href="mi-cuenta.html" class="navbar-nav-link" data-page="mi-cuenta">
                        <i class="fas fa-user"></i>
                        <span>Mi Cuenta</span>
                    </a>
                </li>
                <li>
                    <a href="pedidos.html" class="navbar-nav-link" data-page="pedidos">
                        <i class="fas fa-list-alt"></i>
                        <span>Mis Pedidos</span>
                    </a>
                </li>
            </ul>

            <!-- User Info & Logout -->
            <div class="navbar-user">
                <div class="user-info-nav">
                    <p class="user-name-nav" id="navUserName">Usuario</p>
                    <p class="user-company-nav" id="navUserCompany">Empresa</p>
                </div>
                <button id="logoutBtn" class="logout-button">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    </div>
</nav>
`;

// Initialize Universal Navbar
function initMayoristaNavbar(activePage) {
    console.log('🚀 Initializing Mayorista Navbar for page:', activePage);

    // Insert navbar HTML at the beginning of body
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = MAYORISTA_NAVBAR_HTML;

    // Insert all children (style tag and nav element)
    while (tempDiv.firstChild) {
        document.body.insertBefore(tempDiv.firstChild, document.body.firstChild);
    }

    console.log('✅ Navbar HTML injected into DOM');

    // Set active page
    if (activePage) {
        const activeLink = document.querySelector(`.navbar-nav-link[data-page="${activePage}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            console.log('✅ Active page set:', activePage);
        }
    }

    // Load user info
    loadNavbarUserInfo();

    // Setup mobile menu toggle
    setupMobileMenu();

    // Setup logout
    setupLogout();

    console.log('✅ Mayorista Navbar fully initialized');
}

// Load user information into navbar
function loadNavbarUserInfo() {
    const wholesaleSession = localStorage.getItem('wholesaleSession');
    if (!wholesaleSession) return;

    try {
        const sessionData = JSON.parse(wholesaleSession);
        const navUserName = document.getElementById('navUserName');
        const navUserCompany = document.getElementById('navUserCompany');

        if (navUserName) {
            navUserName.textContent = sessionData.name || 'Usuario';
        }
        if (navUserCompany) {
            navUserCompany.textContent = sessionData.company || 'Empresa';
        }

        // Load full profile from Supabase if available
        loadFullUserProfile(sessionData.id);
    } catch (error) {
        console.error('Error loading navbar user info:', error);
    }
}

// Load full user profile from Supabase
async function loadFullUserProfile(userId) {
    if (typeof window.supabase === 'undefined' || !window.SUPABASE_CONFIG) {
        return;
    }

    try {
        const supabase = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.anonKey
        );

        const { data, error } = await supabase
            .from('user_profiles')
            .select('full_name, company_name, wholesale_discount_percent')
            .eq('id', userId)
            .single();

        if (error) {
            console.warn('Could not load full user profile:', error);
            return;
        }

        if (data) {
            const navUserName = document.getElementById('navUserName');
            const navUserCompany = document.getElementById('navUserCompany');

            if (navUserName && data.full_name) {
                navUserName.textContent = data.full_name;
            }
            if (navUserCompany && data.company_name) {
                const discount = data.wholesale_discount_percent || 20;
                navUserCompany.textContent = `${data.company_name} • ${discount}% descuento`;
            }
        }
    } catch (error) {
        console.error('Error loading full user profile:', error);
    }
}

// Setup mobile menu toggle
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navbarNav = document.getElementById('navbarNav');

    if (mobileMenuToggle && navbarNav) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navbarNav.classList.toggle('mobile-active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.navbar-content')) {
                mobileMenuToggle.classList.remove('active');
                navbarNav.classList.remove('mobile-active');
            }
        });

        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.navbar-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                navbarNav.classList.remove('mobile-active');
            });
        });
    }
}

// Setup logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                localStorage.removeItem('wholesaleSession');
                localStorage.removeItem('wholesaleCart');
                window.location.href = 'login.html';
            }
        });
    }
}

// Helper function to auto-detect current page
function detectActivePage() {
    const currentPath = window.location.pathname;

    if (currentPath.includes('tienda.html')) {
        return 'tienda';
    } else if (currentPath.includes('mi-cuenta.html')) {
        return 'mi-cuenta';
    } else if (currentPath.includes('pedidos.html')) {
        return 'pedidos';
    }

    return null;
}

// Make functions available globally
window.initMayoristaNavbar = initMayoristaNavbar;
window.detectActivePage = detectActivePage;

console.log('📋 Mayoristas Navbar: Script loaded and ready (manual init required)');
