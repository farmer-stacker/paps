// ============================================
// ARENA0x01 — main.js
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile Menu Toggle ---
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav  = document.getElementById('mobileNav');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);

      // Animate hamburger → X
      const spans = menuToggle.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'translateY(6px) rotate(45deg)';
        spans[1].style.opacity   = '0';
        spans[2].style.transform = 'translateY(-6px) rotate(-45deg)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity   = '';
        spans[2].style.transform = '';
      }
    });

    // Close mobile nav when a link is clicked
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity   = '';
        spans[2].style.transform = '';
      });
    });
  }

  // --- Marquee duplicate for seamless loop ---
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    const original = marqueeTrack.querySelector('.marquee-text');
    if (original) {
      const clone = original.cloneNode(true);
      marqueeTrack.appendChild(clone);
    }
  }

  // --- Theme toggle (dark / light) ---
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel  = themeToggle?.querySelector('.theme-toggle-label');
  const bodyEl      = document.body;
  const themeStorageKey = 'paps-theme';

  const themeStorage = {
    get() {
      try {
        return window.localStorage.getItem(themeStorageKey);
      } catch (error) {
        console.warn('Theme preference unavailable', error);
        return null;
      }
    },
    set(value) {
      try {
        window.localStorage.setItem(themeStorageKey, value);
      } catch (error) {
        console.warn('Theme preference could not be saved', error);
      }
    }
  };

  const setThemeVisualState = (theme) => {
    if (!themeToggle || !themeLabel) return;
    const isLight = theme === 'light';
    themeLabel.textContent = isLight ? 'Day mode' : 'Night mode';
    themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    themeToggle.dataset.theme = theme;
  };

  const applyTheme = (theme) => {
    bodyEl.setAttribute('data-theme', theme);
    setThemeVisualState(theme);
  };

  const resolveInitialTheme = () => {
    const stored = themeStorage.get();
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  applyTheme(resolveInitialTheme());

  themeToggle?.addEventListener('click', () => {
    const current = bodyEl.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    themeStorage.set(next);
  });

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  if (prefersDark.addEventListener) {
    prefersDark.addEventListener('change', (event) => {
      const stored = themeStorage.get();
      if (stored === 'light' || stored === 'dark') return;
      applyTheme(event.matches ? 'dark' : 'light');
    });
  } else if (prefersDark.addListener) {
    prefersDark.addListener((event) => {
      const stored = themeStorage.get();
      if (stored === 'light' || stored === 'dark') return;
      applyTheme(event.matches ? 'dark' : 'light');
    });
  }

  // --- Hero title particle hover effect ---
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    const particleCanvas = document.createElement('canvas');
    particleCanvas.className = 'hero-particle-canvas';
    particleCanvas.setAttribute('aria-hidden', 'true');
    heroTitle.appendChild(particleCanvas);

    const context = particleCanvas.getContext('2d');
    if (context) {
      const particles = [];
      const maskCanvas = document.createElement('canvas');
      const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
      let rafId = null;
      let isHovering = false;
      let titleRect = heroTitle.getBoundingClientRect();
      let deviceRatio = Math.max(window.devicePixelRatio || 1, 1);
      let maskAlphaData = null;
      const padding = 14;

      const getNumericPixels = (value, fallback) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      const drawTextWithSpacing = (ctx, text, x, y, spacingPx) => {
        if (!spacingPx) {
          ctx.fillText(text, x, y);
          return;
        }

        let cursorX = x;
        for (const character of text) {
          ctx.fillText(character, cursorX, y);
          cursorX += ctx.measureText(character).width + spacingPx;
        }
      };

      const rebuildTitleMask = () => {
        if (!maskContext) return;

        const style = getComputedStyle(heroTitle);
        const width = Math.max(Math.round(titleRect.width), 1);
        const height = Math.max(Math.round(titleRect.height), 1);
        const fontSize = getNumericPixels(style.fontSize, 16);
        const lineHeight = getNumericPixels(style.lineHeight, fontSize * 1.1);
        const letterSpacing = getNumericPixels(style.letterSpacing, 0);
        const rawLines = heroTitle.innerText
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean);
        const lines = rawLines.length > 0 ? rawLines : [heroTitle.textContent?.trim() || ''];

        maskCanvas.width = Math.floor(width * deviceRatio);
        maskCanvas.height = Math.floor(height * deviceRatio);
        maskContext.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);
        maskContext.clearRect(0, 0, width, height);
        maskContext.fillStyle = '#ffffff';
        maskContext.textAlign = 'left';
        maskContext.textBaseline = 'top';
        maskContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

        lines.forEach((line, index) => {
          const y = index * lineHeight;
          drawTextWithSpacing(maskContext, line, 0, y, letterSpacing);
        });

        const imageData = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        maskAlphaData = imageData.data;
      };

      const resizeParticleLayer = () => {
        titleRect = heroTitle.getBoundingClientRect();
        deviceRatio = Math.max(window.devicePixelRatio || 1, 1);
        const width = Math.max(titleRect.width + padding * 2, 1);
        const height = Math.max(titleRect.height + padding * 2, 1);

        particleCanvas.width = Math.floor(width * deviceRatio);
        particleCanvas.height = Math.floor(height * deviceRatio);
        particleCanvas.style.width = `${width}px`;
        particleCanvas.style.height = `${height}px`;

        context.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);
        rebuildTitleMask();
      };

      const getParticleColor = () => getComputedStyle(heroTitle).color;

      const isOverGlyph = (x, y) => {
        if (!maskAlphaData || !maskCanvas.width || !maskCanvas.height) return false;
        if (x < 0 || y < 0 || x >= titleRect.width || y >= titleRect.height) return false;

        const pixelX = Math.floor(x * deviceRatio);
        const pixelY = Math.floor(y * deviceRatio);
        if (pixelX < 0 || pixelY < 0 || pixelX >= maskCanvas.width || pixelY >= maskCanvas.height) {
          return false;
        }

        const alphaIndex = (pixelY * maskCanvas.width + pixelX) * 4 + 3;
        return maskAlphaData[alphaIndex] > 15;
      };

      const spawnParticles = (pointerX, pointerY, amount = 16) => {
        const originX = pointerX + padding;
        const originY = pointerY + padding;
        const color = getParticleColor();

        for (let index = 0; index < amount; index += 1) {
          const spread = (Math.random() - 0.5) * 1.6;
          const speed = 0.9 + Math.random() * 2.8;
          const drift = pointerX >= titleRect.width * 0.5 ? 1 : -1;

          particles.push({
            x: originX,
            y: originY,
            vx: (Math.random() * 0.7 + 0.5) * speed * drift + spread,
            vy: (Math.random() - 0.5) * speed * 1.8,
            life: 22 + Math.random() * 20,
            size: 0.8 + Math.random() * 2.1,
            color
          });
        }
      };

      const renderParticles = () => {
        const width = particleCanvas.width / deviceRatio;
        const height = particleCanvas.height / deviceRatio;
        context.clearRect(0, 0, width, height);

        for (let index = particles.length - 1; index >= 0; index -= 1) {
          const particle = particles[index];
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vx *= 0.96;
          particle.vy *= 0.96;
          particle.life -= 1;

          if (particle.life <= 0) {
            particles.splice(index, 1);
            continue;
          }

          const alpha = Math.max(Math.min(particle.life / 32, 1), 0);
          context.globalAlpha = alpha;
          context.fillStyle = particle.color;
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
        }

        context.globalAlpha = 1;

        if (isHovering || particles.length > 0) {
          rafId = requestAnimationFrame(renderParticles);
        } else {
          rafId = null;
        }
      };

      const ensureAnimation = () => {
        if (!rafId) {
          rafId = requestAnimationFrame(renderParticles);
        }
      };

      heroTitle.addEventListener('mouseenter', () => {
        isHovering = true;
        resizeParticleLayer();
        ensureAnimation();
      });

      heroTitle.addEventListener('mousemove', (event) => {
        if (!isHovering) return;
        const localX = event.clientX - titleRect.left;
        const localY = event.clientY - titleRect.top;
        if (!isOverGlyph(localX, localY)) return;

        spawnParticles(localX, localY, 18);
        ensureAnimation();
      });

      heroTitle.addEventListener('mouseleave', () => {
        isHovering = false;
      });

      window.addEventListener('resize', resizeParticleLayer);
      resizeParticleLayer();
    }
  }

  // --- Smooth scroll offset for sticky header ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

});
