/**
* Template Name: ZenBlog
* Template URL: https://bootstrapmade.com/zenblog-bootstrap-blog-template/
* Updated: Aug 08 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');
  const navmenu = document.querySelector('.navmenu');
  const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
  const body = document.querySelector('body');

  function mobileNavToogle() {
    body.classList.toggle('mobile-nav-active');
    navmenu.classList.toggle('active');
    mobileNavOverlay.classList.toggle('active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
    
    // Prevent body scroll when mobile nav is active
    if (body.classList.contains('mobile-nav-active')) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = '';
    }
  }

  mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  // Close mobile nav when clicking on overlay
  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener('click', () => {
      if (body.classList.contains('mobile-nav-active')) {
        mobileNavToogle();
      }
    });
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (body.classList.contains('mobile-nav-active')) {
        mobileNavToogle();
      }
    });
  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      const parent = this.parentNode;
      const dropdown = parent.querySelector('ul');
      
      // Close other open dropdowns
      document.querySelectorAll('.navmenu .dropdown.active').forEach(openDropdown => {
        if (openDropdown !== parent) {
          openDropdown.classList.remove('active');
          openDropdown.nextElementSibling.classList.remove('dropdown-active');
        }
      });
      
      // Toggle current dropdown
      parent.classList.toggle('active');
      dropdown.classList.toggle('dropdown-active');
      
      // Smooth height animation
      if (dropdown.classList.contains('dropdown-active')) {
        dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
      } else {
        dropdown.style.maxHeight = '0';
      }
      
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  // Navigation underline animation
  document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function updateActiveLink() {
      let currentSection = '';
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - sectionHeight/3)) {
          currentSection = section.getAttribute('id');
        }
      });
      
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === currentSection) {
          link.classList.add('active');
        }
      });
    }
    
    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink();
  });

  // Consultation form handler
  window.handleConsultationSubmit = async function(event) {
    event.preventDefault();
    const form = document.getElementById('consultationForm');
    const loading = form.querySelector('.loading');
    const errorMsg = form.querySelector('.error-message');
    const sentMsg = form.querySelector('.sent-message');

    // Hide messages
    loading.classList.remove('d-none');
    errorMsg.style.display = 'none';
    sentMsg.style.display = 'none';

    // Collect form data
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const consultationType = form.consultationType.value;
    const preferredDate = form.preferredDate ? form.preferredDate.value : '';
    const preferredTime = form.preferredTime ? form.preferredTime.value : '';
    const notes = form.notes.value.trim();

    // Prepare payload
    const payload = {
      name, email, phone, consultationType, preferredDate, preferredTime, notes
    };

    try {
      const response = await fetch('/api/consultation/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      loading.classList.add('d-none');
      if (data.success) {
        sentMsg.style.display = 'block';
        form.reset();
      } else {
        errorMsg.textContent = data.message || 'Submission failed. Please try again.';
        errorMsg.style.display = 'block';
      }
    } catch (err) {
      loading.classList.add('d-none');
      errorMsg.textContent = 'An error occurred. Please try again later.';
      errorMsg.style.display = 'block';
    }
  };

  // Trending News Fetch and Update
  async function updateTrendingNews() {
    const trendingList = document.querySelector('.trending-post');
    if (!trendingList) return;
    trendingList.innerHTML = '<li>Loading news...</li>';
    try {
      const res = await fetch('/api/trending-news');
      const news = await res.json();
      if (!Array.isArray(news) || news.length === 0) {
        trendingList.innerHTML = '<li>No trending news available at the moment.</li>';
        return;
      }
      trendingList.innerHTML = news.map((item, idx) => `
        <li>
          <a href="${item.url}" target="_blank" rel="noopener noreferrer">
            <div class="number">${idx + 1}</div>
            <div class="trending-content">
              <h3>${item.title}</h3>
              <div class="meta">
                <span class="author"><i class="bi bi-person"></i> ${item.source}</span>
                <span class="time"><i class="bi bi-clock"></i> ${new Date(item.date).toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'})}</span>
              </div>
            </div>
          </a>
        </li>
      `).join('');
    } catch (err) {
      trendingList.innerHTML = '<li>Failed to load trending news.</li>';
    }
  }
  window.updateTrendingNews = updateTrendingNews;
  document.addEventListener('DOMContentLoaded', updateTrendingNews);

})();