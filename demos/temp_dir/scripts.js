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
    autoRotateInterval = setInterval(nextSlide, 4000);
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

// Add swipe hint for mobile - only when carousel is visible
function createSwipeHint() {
  const carousel = document.getElementById('portfolioCarousel');
  if (!carousel) return;

  let hintShown = false;

  const swipeHint = document.createElement('div');
  swipeHint.className = 'swipe-hint';
  swipeHint.textContent = 'Swipe';
  carousel.appendChild(swipeHint);

  // Use Intersection Observer to detect when carousel is visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hintShown) {
        hintShown = true;

        // Show hint 1 second after carousel becomes visible
        setTimeout(() => {
          swipeHint.style.display = 'flex';
        }, 1000);

        // Remove hint after animation completes
        setTimeout(() => {
          swipeHint.remove();
        }, 5000);

        // Stop observing after showing once
        observer.disconnect();
      }
    });
  }, {
    threshold: 0.3 // Show when 30% of carousel is visible
  });

  observer.observe(carousel);
}

// Lazy load carousel images for better performance
function lazyLoadCarouselImages() {
  const carouselImages = document.querySelectorAll('.carousel-image');

  // Only load the first 3 slides immediately
  carouselImages.forEach((img, index) => {
    if (index < 3) {
      // Preload first 3 images
      const bgImage = img.style.backgroundImage;
      if (bgImage) {
        const url = bgImage.slice(5, -2); // Extract URL from url('...')
        const preloadImg = new Image();
        preloadImg.src = url;
      }
    }
  });
}

// Initialize carousel
showSlide(0);
startAutoRotate();
createSwipeHint();
lazyLoadCarouselImages();

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

  // Add touch swipe support for mobile
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isSwiping = false;

  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = true;
    isPaused = true;
    stopAutoRotate();
  }, { passive: true });

  carousel.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    isSwiping = false;
    handleSwipe();
    isPaused = false;
    startAutoRotate();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Only process horizontal swipes (ignore vertical scrolling)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0) {
        // Swiped left - go to next
        nextSlide();
      } else {
        // Swiped right - go to previous
        prevSlide();
      }
    }

    // Reset coordinates
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
  }
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
