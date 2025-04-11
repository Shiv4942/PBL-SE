// Enhanced Menu Toggle with Animation
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", function() {
    navLinks.classList.toggle("active");
    
    // Change icon based on menu state
    if (navLinks.classList.contains("active")) {
        menuToggle.classList.remove("fa-bars");
        menuToggle.classList.add("fa-times");
    } else {
        menuToggle.classList.remove("fa-times");
        menuToggle.classList.add("fa-bars");
    }
});

// Close menu when clicking outside
document.addEventListener("click", function(event) {
    const isClickInsideNav = navLinks.contains(event.target) || menuToggle.contains(event.target);
    
    if (!isClickInsideNav && navLinks.classList.contains("active")) {
        navLinks.classList.remove("active");
        menuToggle.classList.remove("fa-times");
        menuToggle.classList.add("fa-bars");
    }
});

// Form submission handling
const contactForm = document.getElementById("contactForm");

contactForm.addEventListener("submit", function(event) {
    event.preventDefault();
    
    // Here you would typically handle the form submission with AJAX
    // For demonstration, we'll just alert
    alert("Your message has been sent! We'll get back to you soon.");
    contactForm.reset();
});

// Ensure proper resizing of nav menu on window resize
window.addEventListener("resize", function() {
    if (window.innerWidth > 768 && navLinks.classList.contains("active")) {
        navLinks.classList.remove("active");
        menuToggle.classList.remove("fa-times");
        menuToggle.classList.add("fa-bars");
    }
});