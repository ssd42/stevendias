// Header scroll effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Fade in animations on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in-up');
    }
  });
}, observerOptions);

document.querySelectorAll('.service-card, .carousel-slide').forEach(el => {
  observer.observe(el);
});

// Portfolio Carousel functionality
let currentSlide = 0;
let autoRotateInterval = null;
let isPaused = false;
const slides = document.querySelectorAll('.carousel-slide');
const totalSlides = slides.length;

// Update counter
document.getElementById('totalSlides').textContent = totalSlides;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.remove('active');
    if (i === index) {
      slide.classList.add('active');
    }
  });

  // Update indicators
  const indicators = document.querySelectorAll('.indicator-dot');
  indicators.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  // Update counter
  document.getElementById('currentSlide').textContent = index + 1;
  currentSlide = index;
}

function nextSlide() {
  const next = (currentSlide + 1) % totalSlides;
  showSlide(next);
}

function prevSlide() {
  const prev = (currentSlide - 1 + totalSlides) % totalSlides;
  showSlide(prev);
}

function stopAutoRotate() {
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval);
    autoRotateInterval = null;
  }
}

function startAutoRotate() {
  stopAutoRotate(); // Always clear first
  if (!isPaused) {
    autoRotateInterval = setInterval(nextSlide, 2000);
  }
}

// Add event listeners for carousel controls
document.querySelector('.carousel-btn.next')?.addEventListener('click', () => {
  nextSlide();
  startAutoRotate();
});

document.querySelector('.carousel-btn.prev')?.addEventListener('click', () => {
  prevSlide();
  startAutoRotate();
});

// Create and add indicators
const indicatorsContainer = document.querySelector('.carousel-indicators');
if (indicatorsContainer) {
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.classList.add('indicator-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      showSlide(i);
      startAutoRotate();
    });
    indicatorsContainer.appendChild(dot);
  }
}

// Initialize carousel
showSlide(0);
startAutoRotate();

// Pause auto-rotate on hover
const carousel = document.getElementById('portfolioCarousel');
if (carousel) {
  carousel.addEventListener('mouseenter', () => {
    isPaused = true;
    stopAutoRotate();
  });

  carousel.addEventListener('mouseleave', () => {
    isPaused = false;
    startAutoRotate();
  });
}

// Auto-update year in footer
document.addEventListener('DOMContentLoaded', () => {
  const currentYear = new Date().getFullYear();
  document.querySelectorAll('.footer-year').forEach(el => {
    el.textContent = currentYear;
  });

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
