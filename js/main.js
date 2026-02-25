/**
 * Portfolio Website - Main JavaScript
 * Handles navigation, hero animations, and general interactivity
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initHero();
    initScrollAnimations();
});

/**
 * Navigation functionality
 * - Adds 'scrolled' class when page is scrolled
 * - Handles smooth transitions
 */
function initNavigation() {
    const nav = document.getElementById('nav');

    if (!nav) return;

    // Handle scroll state
    const handleScroll = () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
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
