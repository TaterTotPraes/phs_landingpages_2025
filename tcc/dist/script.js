/**
 * ===================================================================
 * PHS Landing Page Core JavaScript
 * - Pure, lightweight, dependency-free (Vanilla JS)
 * - Handles navigation, lazy loading, and basic form validation
 * ===================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Mobile Navigation Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            // Toggle the 'active' class on the menu for CSS visibility
            navMenu.classList.toggle('active');
            
            // Toggle ARIA attributes for accessibility
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
            menuToggle.setAttribute('aria-expanded', !isExpanded);
        });

        // Close menu when a link is clicked (for anchor links)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }


    // 2. Lazy Loading for Images and Map Embeds (Performance)
    if ('IntersectionObserver' in window) {
        const lazyLoadElements = document.querySelectorAll('.lazy-load');
        
        const lazyObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Handle Images (using data-src attribute)
                    if (element.tagName === 'IMG' && element.dataset.src) {
                        element.src = element.dataset.src;
                        element.removeAttribute('data-src');
                    } 
                    
                    // Handle Map Embeds (using data-html attribute)
                    else if (element.dataset.html) {
                        element.innerHTML = element.dataset.html;
                        element.removeAttribute('data-html');
                    }
                    
                    element.classList.remove('lazy-load');
                    observer.unobserve(element);
                }
            });
        }, {
            rootMargin: '0px 0px 200px 0px' // Start loading 200px before reaching viewport
        });

        lazyLoadElements.forEach(function(element) {
            lazyObserver.observe(element);
        });
    }


    // 3. Simple Form Validation (Client-side)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            const formInputs = contactForm.querySelectorAll('input[required], textarea[required]');
            let isValid = true;

            formInputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.border = '2px solid var(--color-accent-cta)'; // Highlight error
                } else {
                    input.style.border = '1px solid #ddd'; // Reset style
                }
            });

            if (!isValid) {
                e.preventDefault();
                alert('Please fill out all required fields.');
            }
            // If valid, form submission proceeds to the Formspree/server endpoint defined in HTML
        });
    }

    // 4. Update Copyright Year
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});