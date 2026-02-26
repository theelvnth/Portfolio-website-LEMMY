/**
 * Portfolio Website - Main JavaScript
 * Handles navigation, hero animations, and general interactivity
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initHamburger();
    initHero();
    initScrollAnimations();
});

/**
 * Navigation functionality
 * - Adds 'scrolled' class when page is scrolled
 * - Hide on scroll down, show on scroll up (landing page desktop only)
 */
function initNavigation() {
    const nav = document.getElementById('nav');

    if (!nav) return;

    // Detect if we're on the landing page (has hero section)
    const isLandingPage = !!document.getElementById('hero');
    let lastScrollY = window.scrollY;
    const scrollThreshold = 10; // Minimum scroll distance to trigger hide/show

    // Handle scroll state
    const handleScroll = () => {
        const currentScrollY = window.scrollY;

        // Scrolled background
        if (currentScrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Hide/show nav on scroll direction (desktop only)
        if (window.innerWidth > 768) {
            const scrollDelta = currentScrollY - lastScrollY;

            if (scrollDelta > scrollThreshold && currentScrollY > 10) {
                // Scrolling DOWN — hide nav
                nav.classList.add('nav--hidden');
            } else if (scrollDelta < -scrollThreshold) {
                // Scrolling UP — show nav
                nav.classList.remove('nav--hidden');
            }
        }

        lastScrollY = currentScrollY;
    };

    // Throttle scroll events for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial check
    handleScroll();
}

/**
 * Hamburger menu for mobile navigation
 * - Toggles full-screen overlay menu
 * - Closes on link click, ESC key, or hamburger tap
 * - Locks body scroll when open
 */
function initHamburger() {
    const nav = document.getElementById('nav');
    const hamburger = document.getElementById('navHamburger');
    const navLinks = document.querySelectorAll('.nav__link');

    if (!hamburger || !nav) return;

    // Toggle menu
    hamburger.addEventListener('click', () => {
        nav.classList.toggle('nav--open');
        document.body.style.overflow = nav.classList.contains('nav--open') ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('nav--open');
            document.body.style.overflow = '';
        });
    });

    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
            nav.classList.remove('nav--open');
            document.body.style.overflow = '';
        }
    });
}

/**
 * Hero section functionality
 * - Image loading animation
 * - Parallax effect on scroll
 */
function initHero() {
    const hero = document.getElementById('hero');
    const heroImage = document.getElementById('heroImage');

    if (!hero || !heroImage) return;

    // Handle image load
    if (heroImage.complete) {
        hero.classList.add('loaded');
    } else {
        heroImage.addEventListener('load', () => {
            hero.classList.add('loaded');
        });
    }

    // Parallax effect on scroll
    let parallaxTicking = false;
    window.addEventListener('scroll', () => {
        if (!parallaxTicking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                const heroHeight = hero.offsetHeight;

                if (scrolled < heroHeight) {
                    // Move background slower than scroll (parallax)
                    const translateY = scrolled * 0.3;
                    heroImage.style.transform = `scale(1.05) translateY(${translateY}px)`;
                }

                parallaxTicking = false;
            });
            parallaxTicking = true;
        }
    });
}

/**
 * Scroll-triggered animations
 * - Fade in elements as they enter viewport
 */
function initScrollAnimations() {
    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) return;

    const animatedElements = document.querySelectorAll('.section__header, .statement-content');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(el);
    });
}

/**
 * Utility: Smooth scroll to element
 */
function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}
