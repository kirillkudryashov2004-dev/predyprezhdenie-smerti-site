const body = document.body;
const root = document.documentElement;
const hero = document.querySelector(".hero");
const topbar = document.querySelector(".topbar");
const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
const endgameSection = document.querySelector(".endgame-section");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const loadingStatus = document.querySelector("[data-loading-status]");
const loadingProgress = document.querySelector("[data-loading-progress]");
const loadingWarning = document.querySelector("[data-loading-warning]");

body.classList.add("is-loading");

const introStartedAt = performance.now();
const INTRO_MIN_MS = prefersReducedMotion.matches ? 260 : 1850;
const INTRO_FINISH_DELAY_MS = prefersReducedMotion.matches ? 90 : 420;
const loadingMessages = [
  "Сканирование сигнала...",
  "Декодирование предупреждения...",
  "Сборка тревожных фрагментов...",
  "Открытие узла памяти...",
];
const loadingWarnings = [
  "Сигнал нестабилен",
  "Источник не подтвержден",
  "Обнаружены следы помех",
  "Не отворачивайтесь",
];

let introValue = 0;
let introSettled = false;

const renderIntroProgress = () => {
  const roundedValue = Math.max(0, Math.min(100, Math.round(introValue)));

  root.style.setProperty("--intro-progress", `${roundedValue}%`);

  if (loadingProgress) {
    loadingProgress.textContent = `${roundedValue}%`;
  }

  if (loadingStatus) {
    const messageIndex = Math.min(
      loadingMessages.length - 1,
      Math.floor((roundedValue / 100) * loadingMessages.length)
    );

    loadingStatus.textContent = loadingMessages[messageIndex];
  }

  if (loadingWarning) {
    const warningIndex = Math.min(
      loadingWarnings.length - 1,
      Math.floor((roundedValue / 100) * loadingWarnings.length)
    );

    loadingWarning.textContent = loadingWarnings[warningIndex];
  }
};

renderIntroProgress();

const loadingTicker = window.setInterval(() => {
  if (introSettled) {
    return;
  }

  introValue = Math.min(94, introValue + 2.5 + Math.random() * 9.5);
  renderIntroProgress();
}, 95);

const heroRevealElements = Array.from(
  document.querySelectorAll(".hero .eyebrow, .hero h1, .hero-copy, .hero-stage, .hero-actions, .hero-facts li")
);

const registerReveal = (elements, direction = "up", step = 0) =>
  Array.from(elements).map((element, index) => {
    element.classList.add("reveal");

    if (direction !== "up") {
      element.dataset.reveal = direction;
    }

    if (step > 0) {
      const delay = (index % 4) * step;
      element.style.setProperty("--reveal-delay", `${delay}ms`);
    }

    return element;
  });

heroRevealElements.forEach((element, index) => {
  element.classList.add("reveal", "is-visible");
  element.style.setProperty("--reveal-delay", `${240 + index * 110}ms`);
});

const revealTargets = [
  ...registerReveal(document.querySelectorAll("main .section"), "up", 0),
  ...registerReveal(document.querySelectorAll(".section-heading"), "left", 0),
  ...registerReveal(document.querySelectorAll(".card"), "up", 90),
  ...registerReveal(document.querySelectorAll(".gallery-item"), "zoom", 100),
  ...registerReveal(document.querySelectorAll(".footer"), "up", 0),
];

const sectionLinks = navLinks
  .map((link) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (!target) {
      return null;
    }

    return { link, target };
  })
  .filter(Boolean);

const revealAll = () => {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
};

const initializeReveals = () => {
  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -12% 0px",
    }
  );

  revealTargets.forEach((element) => observer.observe(element));
};

const updateScrollState = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;

  root.style.setProperty("--scroll-progress", `${Math.max(progress, 0)}%`);

  if (topbar) {
    topbar.classList.toggle("is-condensed", window.scrollY > 36);
  }

  let activeId = "";

  sectionLinks.forEach(({ target }) => {
    if (window.scrollY + window.innerHeight * 0.34 >= target.offsetTop) {
      activeId = target.id;
    }
  });

  navLinks.forEach((link) => {
    const hash = link.getAttribute("href");
    link.classList.toggle("is-active", activeId !== "" && hash === `#${activeId}`);
  });

  if (endgameSection) {
    const rect = endgameSection.getBoundingClientRect();
    const inEndZone =
      rect.top < window.innerHeight * 0.78 && rect.bottom > window.innerHeight * 0.22;

    body.classList.toggle("is-at-end", inEndZone);
  }
};

let scrollTicking = false;

const requestScrollState = () => {
  if (scrollTicking) {
    return;
  }

  scrollTicking = true;

  window.requestAnimationFrame(() => {
    updateScrollState();
    scrollTicking = false;
  });
};

const resetHeroShift = () => {
  if (!hero) {
    return;
  }

  hero.style.setProperty("--hero-shift-x", "0px");
  hero.style.setProperty("--hero-shift-y", "0px");
};

if (hero && !prefersReducedMotion.matches) {
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

    hero.style.setProperty("--hero-shift-x", `${offsetX * 26}px`);
    hero.style.setProperty("--hero-shift-y", `${offsetY * 20}px`);
  });

  hero.addEventListener("pointerleave", resetHeroShift);
}

const tiltElements = Array.from(document.querySelectorAll("[data-tilt]"));

if (!prefersReducedMotion.matches) {
  tiltElements.forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

      element.style.setProperty("--tilt-x", `${offsetY * -7}deg`);
      element.style.setProperty("--tilt-y", `${offsetX * 9}deg`);
    });

    element.addEventListener("pointerleave", () => {
      element.style.setProperty("--tilt-x", "0deg");
      element.style.setProperty("--tilt-y", "0deg");
    });
  });
}

const lightbox = document.getElementById("gallery-lightbox");
const lightboxImage = lightbox?.querySelector(".lightbox-image");
const lightboxCaption = lightbox?.querySelector(".lightbox-caption");
const lightboxClose = lightbox?.querySelector(".lightbox-close");
const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
let lastTrigger = null;

const openLightbox = (item) => {
  if (!lightbox || !lightboxImage || !lightboxCaption) {
    return;
  }

  const image = item.querySelector("img");
  const caption = item.querySelector("figcaption");

  if (!image) {
    return;
  }

  lastTrigger = item;
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || "";
  lightboxCaption.textContent = caption?.textContent?.trim() || image.alt || "";
  lightbox.hidden = false;
  body.classList.add("lightbox-open");

  window.requestAnimationFrame(() => {
    lightbox.classList.add("is-open");
  });
};

const closeLightbox = () => {
  if (!lightbox || lightbox.hidden) {
    return;
  }

  lightbox.classList.remove("is-open");
  body.classList.remove("lightbox-open");

  window.setTimeout(() => {
    lightbox.hidden = true;
    if (lightboxImage) {
      lightboxImage.src = "";
    }

    if (lastTrigger instanceof HTMLElement) {
      lastTrigger.focus({ preventScroll: true });
    }
  }, 240);
};

galleryItems.forEach((item) => {
  item.tabIndex = 0;
  item.setAttribute("role", "button");

  const caption = item.querySelector("figcaption")?.textContent?.trim();
  item.setAttribute("aria-label", caption ? `Open image: ${caption}` : "Open image");

  item.addEventListener("click", () => openLightbox(item));
  item.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openLightbox(item);
  });
});

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

lightboxClose?.addEventListener("click", closeLightbox);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
  }
});

const showPage = () => {
  if (introSettled) {
    return;
  }

  introSettled = true;

  const elapsed = performance.now() - introStartedAt;
  const waitTime = Math.max(0, INTRO_MIN_MS - elapsed);

  window.setTimeout(() => {
    window.clearInterval(loadingTicker);
    introValue = 100;
    renderIntroProgress();

    if (loadingStatus) {
      loadingStatus.textContent = "Доступ разрешен";
    }

    if (loadingWarning) {
      loadingWarning.textContent = "Вход в архив открыт";
    }

    window.setTimeout(() => {
      body.classList.remove("is-loading");
      body.classList.add("is-ready");
      requestScrollState();
    }, INTRO_FINISH_DELAY_MS);
  }, waitTime);
};

if (document.readyState === "complete") {
  showPage();
} else {
  window.addEventListener("load", showPage, { once: true });
}

initializeReveals();
updateScrollState();
window.addEventListener("scroll", requestScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
