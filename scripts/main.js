const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fills the top hairline in proportion to how far the page is scrolled. */
function initProgressBar() {
  const bar = document.querySelector('.progress');
  if (!bar) return;

  const update = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    bar.style.width = scrollable > 0 ? `${(doc.scrollTop / scrollable) * 100}%` : '0%';
  };

  addEventListener('scroll', update, { passive: true });
  update();
}

/** Fades elements in as they enter the viewport, once each. */
function initReveals() {
  const targets = document.querySelectorAll('.reveal, .section__head');
  if (prefersReducedMotion) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  targets.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 3, 2) * 80}ms`;
    observer.observe(el);
  });
}

/** Counts each statistic up from zero the first time it is seen. */
function initCounters() {
  const values = document.querySelectorAll('.stat__value');
  if (!values.length || prefersReducedMotion) return;

  const DURATION = 1400;

  const animate = (el) => {
    const target = Number(el.dataset.countTo);
    const prefix = el.dataset.prefix ?? '';
    const suffix = el.dataset.suffix ?? '';
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min((now - start) / DURATION, 1);
      const eased = 1 - (1 - progress) ** 3;
      el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        animate(entry.target);
      }
    },
    { threshold: 0.4 }
  );

  values.forEach((el) => observer.observe(el));
}

/** Marks the one nav link matching the section under the reading line. */
function initScrollSpy() {
  const links = [...document.querySelectorAll('.nav__links a[href^="#"]')]
    .filter((a) => a.hash.length > 1);
  const sections = links.map((a) => document.querySelector(a.hash));
  if (!sections.some(Boolean)) return;

  let queued = false;

  const update = () => {
    queued = false;
    const readingLine = scrollY + innerHeight * 0.35;
    let current = -1;
    sections.forEach((section, i) => {
      if (section && section.offsetTop <= readingLine) current = i;
    });
    links.forEach((link, i) => link.classList.toggle('is-current', i === current));
  };

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  update();
}

/** Moves the specular highlight on the statistics band with the pointer. */
function initSpecular() {
  const band = document.querySelector('.band');
  if (!band || prefersReducedMotion) return;

  band.addEventListener('pointermove', (event) => {
    const rect = band.getBoundingClientRect();
    band.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
    band.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
  });
}

/**
 * Eases wheel scrolling toward a target position.
 * Drives the real scroll offset rather than transforming a wrapper, so the
 * sticky nav, the native scrollbar and find-in-page all keep working.
 * Touch is left alone — mobile already has momentum of its own.
 */
function initSmoothScroll() {
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  if (prefersReducedMotion || coarsePointer) return;

  const EASE = 0.115;
  const LINE_HEIGHT = 16;
  const SETTLE = 0.4;

  const root = document.documentElement;
  let target = scrollY;
  let animating = false;

  const maxScroll = () => root.scrollHeight - innerHeight;

  const step = () => {
    const distance = target - scrollY;
    if (Math.abs(distance) < SETTLE) {
      scrollTo(0, target);
      animating = false;
      return;
    }
    scrollTo(0, scrollY + distance * EASE);
    requestAnimationFrame(step);
  };

  const glideTo = (position) => {
    target = Math.max(0, Math.min(position, maxScroll()));
    if (animating) return;
    animating = true;
    requestAnimationFrame(step);
  };

  // Mouse wheels arrive in coarse whole-number steps and benefit from easing.
  // Trackpads already carry OS momentum, so easing them only adds lag.
  const isMouseWheel = (event) =>
    event.deltaMode === 1 || (Math.abs(event.deltaY) >= 50 && Number.isInteger(event.deltaY));

  addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey || !isMouseWheel(event)) return;
      event.preventDefault();
      const delta = event.deltaMode === 1 ? event.deltaY * LINE_HEIGHT : event.deltaY;
      glideTo(target + delta);
    },
    { passive: false }
  );

  // Anything that moves the page by other means owns the target again.
  const resync = () => { if (!animating) target = scrollY; };
  addEventListener('scroll', resync, { passive: true });
  addEventListener('resize', resync, { passive: true });
  addEventListener('keydown', resync);
  addEventListener('mousedown', resync);

  // Take over in-page links so they ease instead of jumping.
  root.style.scrollBehavior = 'auto';
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      const destination = id === '#top' ? document.body : document.querySelector(id);
      if (!destination) return;
      event.preventDefault();
      const offset = id === '#top' ? 0 : destination.getBoundingClientRect().top + scrollY - 90;
      glideTo(offset);
      history.replaceState(null, '', id);
    });
  });
}

initSmoothScroll();
initProgressBar();
initReveals();
initCounters();
initScrollSpy();
initSpecular();
