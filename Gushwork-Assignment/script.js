/**
 * Mangalam HDPE Pipes — interactive logic
 * Vanilla JS, no framework. Single DOMContentLoaded bootstrap calls
 * ten standalone init functions; each one returns early if its DOM
 * nodes are missing, so sections can be removed without breaking JS.
 */

(() => {
  'use strict';

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* Sticky header — compact pre-bar drops in above the navbar once
     past the first fold; both hide together on scroll-up. */
  function initStickyHeader() {
    const header        = document.getElementById('mainHeader');
    const stickyPrebar  = document.getElementById('stickyPrebar');
    const productSection = document.querySelector('.product-detail-section');
    if (!header || !stickyPrebar || !productSection) return;

    let lastY = window.scrollY;
    let ticking = false;

    const show = () => {
      header.classList.add('sticky');
      header.classList.remove('sticky-hidden');
      stickyPrebar.classList.add('is-visible');
      stickyPrebar.classList.remove('sticky-hidden');
      stickyPrebar.setAttribute('aria-hidden', 'false');
    };
    const hide = () => {
      header.classList.add('sticky-hidden');
      stickyPrebar.classList.add('sticky-hidden');
      stickyPrebar.setAttribute('aria-hidden', 'true');
    };
    const reset = () => {
      header.classList.remove('sticky', 'sticky-hidden');
      stickyPrebar.classList.remove('is-visible', 'sticky-hidden');
      stickyPrebar.setAttribute('aria-hidden', 'true');
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const goingDown = y > lastY + 2;   // dead-band against jitter
        const goingUp   = y < lastY - 2;
        lastY = y;
        ticking = false;

        const pastFirstFold = productSection.getBoundingClientRect().bottom <= 0;
        if (!pastFirstFold)      reset();
        else if (goingDown)      show();
        else if (goingUp)        hide();
      });
    }, { passive: true });
  }

  /* Hero thumbnail strip — click or arrow-key navigation, WAI-ARIA
     tab pattern. */
  function initGallery() {
    const mainImage   = document.querySelector('.main-product-image');
    const thumbnails  = Array.from(document.querySelectorAll('.thumbnail'));
    const leftArrow   = document.querySelector('.left-arrow');
    const rightArrow  = document.querySelector('.right-arrow');
    const zoomPreview = document.querySelector('.thumbnail-zoom-preview');
    if (!mainImage || thumbnails.length === 0) return;

    let currentIndex = 0;

    function updateImage(index, { focus = false } = {}) {
      thumbnails.forEach((t, i) => {
        const isActive = i === index;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      const src = thumbnails[index].src;
      mainImage.src = src;
      if (zoomPreview) zoomPreview.style.backgroundImage = `url(${src})`;
      currentIndex = index;
      if (focus) thumbnails[index].focus();
    }

    thumbnails.forEach((thumb, index) => {
      thumb.addEventListener('click', () => updateImage(index));
      thumb.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          updateImage((index + 1) % thumbnails.length, { focus: true });
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          updateImage((index - 1 + thumbnails.length) % thumbnails.length, { focus: true });
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          updateImage(index);
        }
      });
    });

    if (rightArrow) {
      rightArrow.addEventListener('click', () => {
        updateImage((currentIndex + 1) % thumbnails.length);
      });
    }
    if (leftArrow) {
      leftArrow.addEventListener('click', () => {
        updateImage((currentIndex - 1 + thumbnails.length) % thumbnails.length);
      });
    }
  }

  /* Hover-zoom — translucent lens on the main image + side preview
     pane at 2.5×. Gated on fine-pointer devices only. */
  function initHoverZoom() {
    const mainImageContainer = document.querySelector('.main-image-container');
    const mainImage          = document.querySelector('.main-product-image');
    const productCarousel    = document.querySelector('.product-image-carousel');
    const zoomLens           = document.querySelector('.zoom-lens');
    const zoomPreview        = document.querySelector('.thumbnail-zoom-preview');
    if (!mainImageContainer || !mainImage || !productCarousel) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    if (zoomPreview) zoomPreview.style.backgroundImage = `url(${mainImage.src})`;

    mainImageContainer.addEventListener('mouseenter', () => {
      mainImageContainer.classList.add('is-zooming');
      productCarousel.classList.add('is-zooming');
    });

    mainImageContainer.addEventListener('mousemove', (e) => {
      const rect = mainImageContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xPercent = (x / rect.width)  * 100;
      const yPercent = (y / rect.height) * 100;

      if (zoomPreview) {
        zoomPreview.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
      }
      if (zoomLens) {
        const lensW = zoomLens.offsetWidth;
        const lensH = zoomLens.offsetHeight;
        zoomLens.style.left = Math.max(0, Math.min(rect.width  - lensW, x - lensW / 2)) + 'px';
        zoomLens.style.top  = Math.max(0, Math.min(rect.height - lensH, y - lensH / 2)) + 'px';
      }
    });

    mainImageContainer.addEventListener('mouseleave', () => {
      mainImageContainer.classList.remove('is-zooming');
      productCarousel.classList.remove('is-zooming');
    });
  }

  /* FAQ accordion — single-open behaviour, aria-expanded reflects state. */
  function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    if (items.length === 0) return;

    items.forEach((item) => {
      const question = item.querySelector('.faq-question');
      if (!question) return;
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        items.forEach((other) => {
          other.classList.remove('active');
          const q = other.querySelector('.faq-question');
          if (q) q.setAttribute('aria-expanded', 'false');
        });
        if (!isActive) {
          item.classList.add('active');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* Catalogue email form — writes feedback to an aria-live region
     instead of blocking alert() popups. Submit is simulated. */
  function initCatalogueForm() {
    const form    = document.querySelector('.email-form');
    if (!form) return;
    const input   = form.querySelector('.email-input');
    const sendBtn = form.querySelector('.send-catalogue-btn');
    const status  = form.querySelector('.email-form__status');
    if (!input || !sendBtn) return;

    const setStatus = (msg, isError = false) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.toggle('email-form__status--error', isError);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = input.value.trim();

      if (!email) {
        setStatus('Please enter your email address.', true);
        input.focus();
        return;
      }
      if (!isValidEmail(email)) {
        setStatus("That doesn't look like a valid email address.", true);
        input.focus();
        return;
      }

      const originalText = sendBtn.textContent;
      sendBtn.textContent = 'Sending…';
      sendBtn.disabled = true;
      setStatus('');

      setTimeout(() => {
        sendBtn.textContent = 'Sent ✓';
        setStatus('Catalogue sent — check your inbox.');
        input.value = '';
        setTimeout(() => {
          sendBtn.textContent = originalText;
          sendBtn.disabled = false;
        }, 2000);
      }, 1500);
    });
  }

  /*
    Applications carousel — peek pattern (½ + full + full + ½) per
    Figma layout_5B8L0S. Initial translateX(-halfCard) cuts card #1
    on the left at the viewport edge; each scroll step shifts by one
    full card width.
  */
  function initApplicationsCarousel() {
    const track   = document.querySelector('.applications-carousel .carousel-track')
                 || document.querySelector('.carousel-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const cards   = Array.from(document.querySelectorAll('.application-card'));
    if (!track || cards.length === 0) return;

    const gap = 16;
    let currentIndex = 0;

    const cardW    = () => cards[0].offsetWidth;
    const slotW    = () => cardW() + gap;
    const halfCard = () => cardW() / 2;

    const maxIndex = () => {
      const containerW   = track.parentElement.offsetWidth;
      const visibleSlots = Math.ceil((containerW + halfCard()) / slotW());
      return Math.max(0, cards.length - visibleSlots);
    };

    function update() {
      const translateX = -halfCard() - currentIndex * slotW();
      track.style.transform = `translateX(${translateX}px)`;
      if (prevBtn) prevBtn.disabled = currentIndex === 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) { currentIndex--; update(); }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      if (currentIndex < maxIndex()) { currentIndex++; update(); }
    });

    window.addEventListener('resize', () => {
      const m = maxIndex();
      if (currentIndex > m) currentIndex = m;
      update();
    });

    update();
  }

  /* Manufacturing process — desktop tab buttons + intersection-fade. */
  function initManufacturingTabs() {
    const buttons  = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    if (buttons.length === 0) return;

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        buttons.forEach((b) => b.classList.remove('active'));
        contents.forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
        const tc = document.getElementById(target);
        if (tc) tc.classList.add('active');
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    contents.forEach((content) => {
      content.style.opacity = '0';
      content.style.transform = 'translateY(20px)';
      content.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(content);
    });
  }

  /* Manufacturing process — mobile slide carousel. Encapsulated in a
     class because it owns animation state across multiple methods. */
  class ManufacturingCarousel {
    constructor() {
      this.currentSlide = 0;
      this.totalSlides  = 8;
      this.isAnimating  = false;
      this.slides = [
        { title: 'Raw Material',     step: 1 },
        { title: 'Extrusion',        step: 2 },
        { title: 'Cooling',          step: 3 },
        { title: 'Sizing',           step: 4 },
        { title: 'Quality Control',  step: 5 },
        { title: 'Marking',          step: 6 },
        { title: 'Cutting',          step: 7 },
        { title: 'Packaging',        step: 8 },
      ];
      this._bind();
      this._updateUI();
      this._setupSwipe();
      this._setupKeyboard();
    }

    _bind() {
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      if (prevBtn) prevBtn.addEventListener('click', () => this.previous());
      if (nextBtn) nextBtn.addEventListener('click', () => this.next());
    }

    _setupSwipe() {
      const container = document.querySelector('.carousel-content');
      if (!container) return;
      let startX = 0, startY = 0, startTime = 0;
      container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      }, { passive: true });
      container.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        this._handleSwipe(startX, startY, endX, endY, Date.now() - startTime);
      }, { passive: true });
    }

    _handleSwipe(sx, sy, ex, ey, duration) {
      const dx = ex - sx;
      const dy = ey - sy;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && duration < 300) {
        if (dx > 0) this.previous();
        else        this.next();
      }
    }

    _setupKeyboard() {
      document.addEventListener('keydown', (e) => {
        // Only when the mobile carousel is the actually-visible one
        const card = document.querySelector('.carousel-card');
        if (!card || card.offsetParent === null) return;
        if (e.key === 'ArrowLeft')  { e.preventDefault(); this.previous(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
      });
    }

    next()     { if (!this.isAnimating && this.currentSlide < this.totalSlides - 1) this._goTo(this.currentSlide + 1, 'next'); }
    previous() { if (!this.isAnimating && this.currentSlide > 0)                    this._goTo(this.currentSlide - 1, 'prev'); }

    _goTo(index, direction = 'next') {
      if (this.isAnimating || index === this.currentSlide || index < 0 || index >= this.totalSlides) return;
      this.isAnimating = true;
      this._animate(this.currentSlide, index, direction);
      this.currentSlide = index;
      this._updateUI();
      setTimeout(() => { this.isAnimating = false; }, 400);
    }

    _animate(fromIndex, toIndex, direction) {
      const slides  = document.querySelectorAll('.slide');
      const current = slides[fromIndex];
      const next    = slides[toIndex];
      if (!current || !next) return;

      next.style.transform = direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)';
      next.style.opacity   = '0';
      next.style.position  = 'absolute';
      next.style.top       = '0';
      next.style.left      = '0';
      next.style.width     = '100%';

      // Force reflow so the animation plays
      // eslint-disable-next-line no-unused-expressions
      next.offsetHeight;

      requestAnimationFrame(() => {
        current.style.transform = direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)';
        current.style.opacity   = '0';
        next.style.transform = 'translateX(0)';
        next.style.opacity   = '1';

        setTimeout(() => {
          slides.forEach((slide, idx) => {
            slide.classList.remove('active');
            if (idx === toIndex) {
              slide.classList.add('active', 'fade-in');
              slide.style.position  = 'relative';
              slide.style.transform = '';
              slide.style.opacity   = '';
              setTimeout(() => slide.classList.remove('fade-in'), 400);
            } else {
              slide.style.position  = 'absolute';
              slide.style.transform = 'translateX(100%)';
              slide.style.opacity   = '0';
            }
          });
        }, 400);
      });
    }

    _updateUI() {
      const stepBadge = document.getElementById('stepBadge');
      const prevBtn   = document.getElementById('prevBtn');
      const nextBtn   = document.getElementById('nextBtn');
      const data      = this.slides[this.currentSlide];

      if (stepBadge) stepBadge.textContent = `Step ${data.step}/8: ${data.title}`;

      if (prevBtn) {
        prevBtn.disabled    = this.currentSlide === 0;
        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
      }
      if (nextBtn) {
        nextBtn.disabled    = this.currentSlide === this.totalSlides - 1;
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
      }
    }
  }

  function initManufacturingCarousel() {
    if (!document.querySelector('.carousel-card')) return;
    window.manufacturingCarousel = new ManufacturingCarousel();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && window.manufacturingCarousel) {
        window.manufacturingCarousel.isAnimating = false;
      }
    });
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.carousel-card')) e.preventDefault();
    });
  }

  /* Testimonials — same peek pattern as Applications but driven by
     native scrollLeft on the overflow-x:auto parent. Initial offset
     of halfCard puts card #1 half-cut at the left edge. */
  function initTestimonialsCarousel() {
    const carousel = document.querySelector('.testimonials-carousel');
    if (!carousel) return;
    const track = carousel.querySelector('.carousel-track');
    const cards = carousel.querySelectorAll('.testimonial-card');
    if (!track || cards.length === 0) return;

    requestAnimationFrame(() => {
      carousel.scrollLeft = cards[0].offsetWidth / 2;
    });

    let isDown = false;
    let startX = 0;
    let scrollOrigin = 0;

    const begin = (clientX) => {
      isDown = true;
      track.classList.add('active-drag');
      startX = clientX;
      scrollOrigin = carousel.scrollLeft;
    };
    const move = (clientX, preventDefault) => {
      if (!isDown) return;
      if (preventDefault) preventDefault();
      carousel.scrollLeft = scrollOrigin - (clientX - startX) * 1.5;
    };
    const end = () => {
      isDown = false;
      track.classList.remove('active-drag');
    };

    carousel.addEventListener('mousedown',  (e) => begin(e.pageX));
    carousel.addEventListener('mouseleave', end);
    carousel.addEventListener('mouseup',    end);
    carousel.addEventListener('mousemove',  (e) => move(e.pageX, () => e.preventDefault()));

    carousel.addEventListener('touchstart', (e) => begin(e.touches[0].pageX), { passive: true });
    carousel.addEventListener('touchend',   end);
    carousel.addEventListener('touchmove',  (e) => move(e.touches[0].pageX, null), { passive: true });
  }

  /* Modals — native <dialog> with ESC + focus-trap built in. */
  function initModals() {
    const dialogs = document.querySelectorAll('dialog.modal');
    if (!dialogs.length) return;

    document.querySelectorAll('[data-open-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-modal');
        const dlg = document.getElementById(id);
        if (!dlg || typeof dlg.showModal !== 'function') return;
        dlg.showModal();
        document.body.classList.add('modal-open');
        const first = dlg.querySelector('input, select, textarea, button');
        if (first) first.focus();
      });
    });

    dialogs.forEach((dlg) => {
      dlg.querySelectorAll('[data-close-modal]').forEach((btn) => {
        btn.addEventListener('click', () => dlg.close());
      });

      // Backdrop click — the dialog element itself, outside its inner card
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg) dlg.close();
      });

      dlg.addEventListener('close', () => {
        document.body.classList.remove('modal-open');
      });

      const form = dlg.querySelector('[data-modal-form]');
      if (!form) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        const submit = form.querySelector('.modal__submit');
        if (!submit) return;
        const original = submit.textContent;
        submit.textContent = 'Sending…';
        submit.disabled = true;

        setTimeout(() => {
          submit.textContent = 'Sent ✓';
          setTimeout(() => {
            dlg.close();
            form.reset();
            submit.textContent = original;
            submit.disabled = false;
          }, 900);
        }, 1200);
      });
    });
  }

  /* Learn-More buttons — no real destination in this assignment;
     logged for traceability rather than blocking with alert(). */
  function initStubs() {
    document.querySelectorAll('.learn-more-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card  = btn.closest('.portfolio-card');
        const title = card && card.querySelector('h3').textContent;
        if (title && window.console) console.info('Learn More:', title);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initStickyHeader();
    initGallery();
    initHoverZoom();
    initFAQ();
    initCatalogueForm();
    initApplicationsCarousel();
    initManufacturingTabs();
    initManufacturingCarousel();
    initTestimonialsCarousel();
    initModals();
    initStubs();
  });
})();
