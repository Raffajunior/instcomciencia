// ===== SLIDER =====
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

function createDots() {
  const dotsContainer = document.querySelector('.slide-dots');
  dotsContainer.innerHTML = '';
  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'dot' + (index === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });
}

function updateSlide() {
  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index === currentSlide);
  });
  document.querySelectorAll('.dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  updateSlide();
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateSlide();
}

function goToSlide(index) {
  currentSlide = index;
  updateSlide();
}

document.addEventListener('DOMContentLoaded', () => {
  createDots();
  
  document.querySelector('.slide-next').addEventListener('click', nextSlide);
  document.querySelector('.slide-prev').addEventListener('click', prevSlide);
  
  // Auto-advance slider every 5 seconds
  setInterval(nextSlide, 5000);
});

// ===== NAV TOGGLE =====
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('active');
  });
}

// Close nav when link is clicked
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('active');
  });
});

// ===== DROPDOWN MENU =====
const dropdowns = document.querySelectorAll('.dropdown');

dropdowns.forEach(dropdown => {
  const toggle = dropdown.querySelector('a');
  const menu = dropdown.querySelector('.dropdown-menu');

  // Abrir/fechar dropdown ao clicar
  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Fechar outros dropdowns
      dropdowns.forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('open');
          const m = d.querySelector('.dropdown-menu');
          if (m) m.style.display = '';
        }
      });

      // Toggle dropdown atual
      dropdown.classList.toggle('open');
      menu.style.display = dropdown.classList.contains('open') ? 'flex' : '';
    });
  }

  // Fechar dropdown ao clicar em um link dentro dele
  if (menu) {
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        dropdown.classList.remove('open');
        menu.style.display = '';
      });
    });
  }
});

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('open');
      const menu = dropdown.querySelector('.dropdown-menu');
      if (menu) menu.style.display = '';
    });
  }
});

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Obrigado por entrar em contato! Responderemos em breve.');
    contactForm.reset();
  });
}
