class MobileMenu {
    constructor() {
        this.hamburgerMenu = document.getElementById('hamburgerMenu');
        this.mobileNav = document.getElementById('mobileNav');
        this.mobileClose = document.getElementById('mobileClose');
        
        this.init();
    }
    
    init() {
        // Hamburger menu click
        this.hamburgerMenu.addEventListener('click', () => {
            this.openMobileMenu();
        });
        
        // Close button click
        this.mobileClose.addEventListener('click', () => {
            this.closeMobileMenu();
        });
        
        // Close menu when clicking on a link
        const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-admin-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.mobileNav.classList.contains('active') && 
                !this.mobileNav.contains(e.target) && 
                !this.hamburgerMenu.contains(e.target)) {
                this.closeMobileMenu();
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.mobileNav.classList.contains('active')) {
                this.closeMobileMenu();
            }
        });
    }
    
    openMobileMenu() {
        this.mobileNav.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.hamburgerMenu.style.display = 'none';
    }
    
    closeMobileMenu() {
        this.mobileNav.classList.remove('active');
        document.body.style.overflow = '';
        this.hamburgerMenu.style.display = 'flex';
    }
}

// Global function for mobile menu
function closeMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    
    if (mobileNav) {
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (hamburgerMenu) {
        hamburgerMenu.style.display = 'flex';
    }
}

// Initialize mobile menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MobileMenu();
});