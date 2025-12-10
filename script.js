// ...existing code...
/*
  Enhanced script.js
  - Safe element checks
  - Click + keyboard "pop" for title(s)
  - Periodic gentle pop
  - Reveal-on-scroll (IO) with fallback
  - Button ripple effect
  - Smooth internal-scroll for anchor links
  - Subtle hero parallax (throttled)
  - Respects prefers-reduced-motion & touch devices
*/

(() => {
  'use strict';

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  // helpers
  const q = (sel, ctx = document) => ctx.querySelector(sel);
  const qAll = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const now = () => performance.now();

  // --- Pop / bounce title (click + keyboard + periodic) ---
  function bindPop(selector, opts = {}) {
    const elems = qAll(selector);
    if (!elems.length) return;
    const duration = opts.duration || 420;
    const interval = opts.interval || 1800;

    elems.forEach(el => {
      // click
      el.addEventListener('click', () => triggerPop(el, duration));
      // keyboard (Enter / Space)
      el.setAttribute('tabindex', el.getAttribute('tabindex') || '0');
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerPop(el, duration);
        }
      });
    });

    // periodic gentle pop if not reduced-motion
    if (!prefersReduced && interval > 0) {
      setInterval(() => {
        elems.forEach(el => el.classList.toggle('pop-active'));
        setTimeout(() => elems.forEach(el => el.classList.remove('pop-active')), duration);
      }, interval + duration);
    }
  }

  function triggerPop(el, duration = 420) {
    el.classList.add('pop-active');
    setTimeout(() => el.classList.remove('pop-active'), duration);
  }

  // --- Reveal on scroll ---
  function initReveal() {
    const targets = qAll('.kotak, .course, .benefit, .intro, .hero, .tentang, .keunggulan, .testimoni, .program-section');
    if (!targets.length) return;
    targets.forEach(t => t.classList.add('reveal'));

    if ('IntersectionObserver' in window && !prefersReduced) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            // optionally unobserve to improve perf
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.18 });
      targets.forEach(t => io.observe(t));
    } else {
      // fallback
      targets.forEach(t => t.classList.add('in'));
    }
  }

  // --- Button ripple effect ---
  function initRipples() {
    qAll('button, .btn-primary').forEach(btn => {
      // keep it lightweight
      if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        const r = document.createElement('span');
        const size = Math.max(rect.width, rect.height) * 1.6;
        r.style.position = 'absolute';
        r.style.width = r.style.height = `${size}px`;
        r.style.left = `${e.clientX - rect.left - size/2}px`;
        r.style.top = `${e.clientY - rect.top - size/2}px`;
        r.style.background = 'rgba(255,255,255,0.18)';
        r.style.borderRadius = '50%';
        r.style.transform = 'scale(0)';
        r.style.pointerEvents = 'none';
        r.style.transition = 'transform 520ms cubic-bezier(.2,.9,.25,1), opacity 520ms';
        btn.appendChild(r);
        requestAnimationFrame(() => r.style.transform = 'scale(1)');
        setTimeout(() => r.style.opacity = '0', 340);
        setTimeout(() => r.remove(), 700);
      }, { passive: true });
    });
  }

  // --- Smooth scroll for internal anchors ---
  function initSmoothScroll() {
    if (prefersReduced) return;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute('href');
      if (hash === '#' || hash.length === 0) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState && history.replaceState(null, '', hash);
    });
  }

  // --- Subtle hero parallax (throttled) ---
  function initHeroParallax() {
    if (prefersReduced || isTouch) return;
    const hero = q('.hero') || q('.intro');
    if (!hero) return;
    let last = 0;
    const throttle = 40; // ms
    hero.addEventListener('mousemove', (e) => {
      const t = now();
      if (t - last < throttle) return;
      last = t;
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1..1
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      hero.style.transform = `perspective(900px) rotateX(${(-y * 1.8).toFixed(2)}deg) rotateY(${(x * 1.8).toFixed(2)}deg)`;
    });
    hero.addEventListener('mouseleave', () => { hero.style.transform = ''; });
  }

  // --- Init all ---
  document.addEventListener('DOMContentLoaded', () => {
    // safe binds: try common title ids
    bindPop('#codlab-title, #judul, .logo span');

    initReveal();
    initRipples();
    initSmoothScroll();
    initHeroParallax();

    // inject year if element exists (keeps original behavior)
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });

})();

/* script.js
   Untuk: index.html, manfaat.html, kontak.html
   Fitur: mobile nav, smooth scroll, active nav, footer year, kontak form handling,
          testi carousel, lazy images, small UX helpers.
*/

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
     Helper kecil
  ----------------------------*/
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const safe = (fn) => { try { fn(); } catch (e) { /* ignore */ } };

  /* ---------------------------
     Mobile nav toggle (hamburger)
     - creates a simple toggle if nav ul exists and screen small
  ----------------------------*/
  safe(() => {
    const header = $('header.navbar');
    const nav = $('header.navbar nav');
    if (!header || !nav) return;

    // Create hamburger only if not present
    if (!$('#hamburger-btn')) {
      const btn = document.createElement('button');
      btn.id = 'hamburger-btn';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Buka menu');
      btn.className = 'hamburger-btn';
      btn.innerHTML = `<span class="hamb-line"></span><span class="hamb-line"></span><span class="hamb-line"></span>`;
      header.insertBefore(btn, header.querySelector('nav'));

      // styles (minimal inline so css file not required)
      const style = document.createElement('style');
      style.textContent = `
        .hamburger-btn{display:none;background:none;border:0;cursor:pointer;margin-left:12px}
        .hamb-line{display:block;width:22px;height:2px;background:#fff;margin:5px 0;border-radius:2px}
        @media (max-width:820px){ .hamburger-btn{display:block} header.navbar nav{display:none} header.navbar nav.open{display:block;position:absolute;left:0;right:0;top:64px;background:linear-gradient(90deg,#006bff,#ffdd00);padding:16px;border-bottom-left-radius:12px;border-bottom-right-radius:12px} }
      `;
      document.head.appendChild(style);

      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isOpen));
        nav.classList.toggle('open', !isOpen);
        btn.setAttribute('aria-label', isOpen ? 'Buka menu' : 'Tutup menu');
      });
    }
  });

  /* ---------------------------
     Update footer year (applies to any page)
  ----------------------------*/
  safe(() => {
    const yearEls = $$('[id="year"], .site-year');
    const y = new Date().getFullYear();
    yearEls.forEach(el => { el.textContent = y; });
  });

  /* ---------------------------
     Smooth scroll for internal anchor links
  ----------------------------*/
  safe(() => {
    const anchors = $$('a[href^="#"]');
    anchors.forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href === '#' || href === '') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // update focus for accessibility
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          window.history.replaceState(null, '', href);
        }
      });
    });
  });

  /* ---------------------------
     Highlight active nav link based on URL
  ----------------------------*/
  safe(() => {
    const navLinks = $$('header.navbar nav ul li a');
    if (!navLinks.length) return;
    const current = location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      // normalize
      const linkFile = href.split('/').pop();
      if (linkFile === current || (current === '' && (linkFile === 'index.html' || linkFile === './'))) {
        a.classList.add('active-link');
      } else {
        a.classList.remove('active-link');
      }
    });

    // minimal css for active link (if style.css doesn't have it)
    const style = document.createElement('style');
    style.textContent = `
      header.navbar nav ul li a.active-link{ background: rgba(255,255,255,0.18); color:#0033aa; box-shadow:0 6px 16px rgba(0,0,0,0.12); transform:translateY(-2px) }
    `;
    document.head.appendChild(style);
  });

  /* ---------------------------
     Lazy-load images (simple)
  ----------------------------*/
  safe(() => {
    const imgs = $$('img');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, observer) => {
        entries.forEach(ent => {
          if (ent.isIntersecting) {
            const img = ent.target;
            const src = img.getAttribute('data-src');
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });
      imgs.forEach(img => {
        if (img.dataset && img.dataset.src) {
          io.observe(img);
        }
      });
    } else {
      // fallback: set all data-src to src
      imgs.forEach(img => {
        if (img.dataset && img.dataset.src) img.src = img.dataset.src;
      });
    }
  });

  /* ---------------------------
     Contact form: validation + localStorage + mock send
     Expects form with class .contact-form and inputs in order:
     name, email, phone, instagram, message (like kontak.html)
  ----------------------------*/
  safe(() => {
    const forms = $$('.contact-form');
    forms.forEach(form => {
      // convert non-named inputs to named for easier referencing
      const inputs = $$('input, textarea', form);
      // Map inputs -> add names if missing
      const names = ['name','email','phone','instagram','message'];
      inputs.forEach((inp, i) => {
        if (!inp.name) inp.name = names[i] || `field${i}`;
      });

      // Create a simple toast / message area
      let toast = form.querySelector('.form-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'form-toast';
        toast.style.cssText = 'margin-top:12px;padding:10px;border-radius:8px;display:none';
        form.appendChild(toast);
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fdata = new FormData(form);
        const obj = {};
        for (const [k,v] of fdata.entries()) obj[k] = v.trim();

        // validation
        const errors = [];
        if (!obj.name) errors.push('Nama wajib diisi.');
        if (!obj.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email)) errors.push('Email tidak valid.');
        if (!obj.phone || obj.phone.length < 6) errors.push('Nomor telepon tampak terlalu pendek.');
        if (!obj.message || obj.message.length < 10) errors.push('Pesan minimal 10 karakter.');

        if (errors.length) {
          toast.style.display = 'block';
          toast.style.background = '#fff6f6';
          toast.style.color = '#8a1f1f';
          toast.textContent = 'Gagal kirim: ' + errors.join(' ');
          return;
        }

        // Save to localStorage as "codlab_contacts" (mock DB)
        try {
          const key = 'codlab_contacts_v1';
          const all = JSON.parse(localStorage.getItem(key) || '[]');
          const entry = Object.assign({ submittedAt: new Date().toISOString() }, obj);
          all.push(entry);
          localStorage.setItem(key, JSON.stringify(all));
        } catch (err) {
          // ignore storage errors
        }

        // show success
        toast.style.display = 'block';
        toast.style.background = '#f0fff4';
        toast.style.color = '#0b6b2f';
        toast.textContent = 'Terima kasih! Pesanmu telah tersimpan. Tim kami akan menghubungi segera.';

        // clear inputs (optional)
        form.reset();

        // small faux network delay & confetti-lite (no lib) -> a quick sparkle
        sparkles(form);
      });
    });

    // helper sparkles
    function sparkles(container) {
      const c = document.createElement('div');
      c.style.cssText = 'position:relative;pointer-events:none';
      container.appendChild(c);
      for (let i=0;i<8;i++) {
        const s = document.createElement('span');
        s.textContent = '✨';
        s.style.cssText = `position:absolute;left:${20+Math.random()*60}%;top:${10+Math.random()*60}%;font-size:${8+Math.random()*20}px;opacity:0;transform:translateY(0);transition:all 900ms ease`;
        c.appendChild(s);
        requestAnimationFrame(()=> {
          s.style.opacity = '1';
          s.style.transform = `translateY(-20px) scale(${1+Math.random()})`;
        });
        setTimeout(()=> s.remove(), 1000 + Math.random()*600);
      }
      setTimeout(()=> c.remove(), 1700);
    }

  });

  /* ---------------------------
     Testimoni carousel (for index/testimoni)
     - expects wrapper .testi-wrapper with children .testi-card
  ----------------------------*/
  safe(() => {
    const wrapper = $('.testi-wrapper');
    if (!wrapper) return;
    const cards = $$('.testi-card', wrapper);
    if (!cards.length) return;

    // Basic styles for sliding (in case CSS missing)
    const style = document.createElement('style');
    style.textContent = `
      .testi-wrapper{ position:relative; overflow:hidden }
      .testi-track{ display:flex; transition: transform 500ms ease; gap:18px; }
      .testi-card{ min-width:220px; flex:0 0 33%; }
      @media (max-width:768px){ .testi-card{ flex:0 0 90%; } }
    `;
    document.head.appendChild(style);

    // build track
    const track = document.createElement('div');
    track.className = 'testi-track';
    while (wrapper.firstChild) {
      const node = wrapper.firstChild;
      track.appendChild(node);
    }
    wrapper.appendChild(track);

    let idx = 0;
    const total = cards.length;
    function go(i) {
      idx = (i + total) % total;
      const card = cards[idx];
      const w = card.getBoundingClientRect().width;
      track.style.transform = `translateX(${ - (w + 18) * idx }px)`;
    }

    // auto-play
    let autoplay = setInterval(() => { go(idx+1); }, 3500);

    // pause on hover
    wrapper.addEventListener('mouseenter', () => clearInterval(autoplay));
    wrapper.addEventListener('mouseleave', () => { autoplay = setInterval(() => { go(idx+1); }, 3500); });

    // make clickable to next
    wrapper.addEventListener('click', () => go(idx+1));
  });

  /* ---------------------------
     Fallback handlers for anchor buttons that use JS navigation
  ----------------------------*/
  safe(() => {
    // ensure any .btn-intro or .goto-link elements that rely on JS will work
    $$('.btn-intro, .goto-link').forEach(btn => {
      if (!btn.dataset.href && btn.getAttribute('onclick')) return;
      btn.addEventListener('click', (e) => {
        const href = btn.dataset.href || btn.getAttribute('data-href');
        if (href) location.href = href;
      });
    });
  });

  /* ---------------------------
     Small accessibility improvements
  ----------------------------*/
  safe(() => {
    // ensure focus styles visible when tabbing
    const style = document.createElement('style');
    style.textContent = `
      :focus{ outline: 3px solid rgba(0,123,255,0.25); outline-offset:3px }
      a,button,input,textarea{ transition: box-shadow .15s, transform .12s }
    `;
    document.head.appendChild(style);
  });

  /* ---------------------------
     End DOMContentLoaded
  ----------------------------*/
}); // end DOMContentLoaded

    // simple year inject
    try { document.getElementById('year').textContent = new Date().getFullYear(); } catch(e){}