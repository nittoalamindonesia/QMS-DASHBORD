// menu-component.js
// Komponen Menu untuk semua halaman - UPDATE CUKUP DI SINI

// ==================== KONFIGURASI MENU ====================
const MENU_CONFIG = {
    admin: [
        { icon: "📊", name: "Main Dashboard", link: "maindashboard.html" },
        { icon: "📅", name: "Activity Schedule", link: "activityschedule.html" },
        { icon: "🏭", name: "Production", link: "production.html" },
        { icon: "🔍", name: "Audit Finding", link: "audit.html" },
        { icon: "📄", name: "RFQ Monitoring", link: "rfq.html" },
        { icon: "💰", name: "Sales Monitoring", link: "mountsales.html" }
    ],
    user: [
        { icon: "📊", name: "Main Dashboard", link: "maindashboard.html" },
        { icon: "📅", name: "Activity Schedule", link: "activityschedule.html" },
        { icon: "💰", name: "Sales Monitoring", link: "mountsales.html" }
    ]
};

// Fungsi untuk mendapatkan menu berdasarkan role
function getMenusByRole(role) {
    return role === 'admin' ? MENU_CONFIG.admin : MENU_CONFIG.user;
}

// Render menu ke sidebar
function renderMenu() {
    const userJson = sessionStorage.getItem('currentUser');
    if (!userJson) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userJson);
    const role = user.role || 'user';
    const menus = getMenusByRole(role);
    const currentPage = window.location.pathname.split('/').pop() || 'maindashboard.html';
    
    const menuContainer = document.getElementById('dynamic-menu-container');
    if (!menuContainer) return;
    
    let menuHtml = '';
    menus.forEach(menu => {
        const activeClass = menu.link === currentPage ? 'active' : '';
        menuHtml += `
            <div class="menu-item">
                <a href="${menu.link}" class="menu-button ${activeClass}">
                    <span class="menu-icon">${menu.icon}</span>
                    <span>${menu.name}</span>
                </a>
            </div>
        `;
    });
    
    menuHtml += `
        <div class="logout-btn" onclick="logout()">
            <span class="menu-icon">🚪</span>
            <span>Logout</span>
        </div>
    `;
    
    menuContainer.innerHTML = menuHtml;
}

// Fungsi logout
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Cek autentikasi
function checkAuth() {
    const userJson = sessionStorage.getItem('currentUser');
    if (!userJson) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(userJson);
}

// Toggle menu sidebar
function toggleMenu() {
    const sidebar = document.getElementById('popupSidebar');
    const overlay = document.getElementById('menuOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

// Inisialisasi menu saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    renderMenu();
    
    // Event listener untuk escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('popupSidebar');
            const overlay = document.getElementById('menuOverlay');
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        }
    });
});