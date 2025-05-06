const sliderContent = document.getElementById("sliderContent");
const totalSlides = 7;
const slideImages = [
  "https://www.film.ru/sites/default/files/movies/posters/49637600-1384301.jpg",
  "https://www.film.ru/sites/default/files/movies/posters/50864551-4339510.jpg",
  "https://www.film.ru/sites/default/files/movies/posters/50874695-4516055.jpg",
  "https://www.film.ru/sites/default/files/movies/posters/50868131-5388334.jpg",
  "https://www.film.ru/sites/default/files/movies/posters/51000700-5303446.jpg",
  "https://www.film.ru/sites/default/files/movies/posters/50604737-4211487.jpg",
  "https://www.film.ru/sites/default/files/movies/posters/50801123-4602212.jpg",
];

const slideData = Array.from({ length: totalSlides }, (_, i) => ({
  number: i + 1,
  image: slideImages[i] || null,
}));

let isDragging = false;
let startX;
let scrollLeft;
let dragStartTime;
let lastX = 0;
let timestamp = 0;
let velocity = 0;
let momentumAnimation = null;

function getSVGTemplate(number) {
  return `
    <svg class="svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FDFC47" />
          <stop offset="100%" stop-color="#FCB69F" />
        </linearGradient>
        <linearGradient id="gradientFill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FDFC47" />
          <stop offset="100%" stop-color="#FCB69F" />
        </linearGradient>
      </defs>

      <text x="50" y="60" font-size="180" font-family="'Funnel Display', sans-serif"
            font-weight="800" stroke="url(#gradientStroke)" stroke-width="2" fill="none"
            text-anchor="middle" dominant-baseline="middle" transform="skewX(-5)">
        ${number}
      </text>

      <text x="50" y="60" font-size="180" font-family="'Funnel Display', sans-serif"
            font-weight="800" fill="url(#gradientFill)" opacity="0"
            text-anchor="middle" dominant-baseline="middle" transform="skewX(-5)"
            class="fill-text">
        ${number}
      </text>
    </svg>
  `;
}

function generateSlides() {
  slideData.forEach((data) => {
    const container = document.createElement("div");
    container.className = "container";

    container.innerHTML = getSVGTemplate(data.number);

    const imgContainer = document.createElement("div");
    imgContainer.className = "img-container";

    if (data.image) {
      const link = document.createElement("a");
      link.href = "#";
      const img = document.createElement("img");
      img.src = data.image;
      link.appendChild(img);
      imgContainer.appendChild(link);
    }

    container.appendChild(imgContainer);
    sliderContent.appendChild(container);

    const link = imgContainer.querySelector("a");

    if (link) {
      let startX, startY;

      link.addEventListener("mousedown", (e) => {
        startX = e.clientX;
        startY = e.clientY;
      });

      link.addEventListener("touchstart", (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
      });

      link.addEventListener("click", (e) => {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);

        if (isDragging || dx > 5 || dy > 5) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    }
  });
}

generateSlides();

const slider = document.querySelector(".slider");

function throttle(callback, delay) {
  let lastCall = 0;
  return function () {
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    callback.apply(this, arguments);
  };
}

function updateVelocity(clientX) {
  const now = Date.now();
  const delta = now - timestamp;
  if (delta > 0) {
    velocity = (clientX - lastX) / delta;
  }
  lastX = clientX;
  timestamp = now;
}

sliderContent.addEventListener("mousedown", (e) => {
  if (momentumAnimation) {
    cancelAnimationFrame(momentumAnimation);
    momentumAnimation = null;
  }
  dragStartTime = Date.now();
  isDragging = true;
  slider.classList.add("grabbing");
  startX = e.clientX;
  scrollLeft = slider.scrollLeft;
  lastX = startX;
  timestamp = Date.now();
  e.preventDefault();
});

document.addEventListener(
  "mousemove",
  throttle((e) => {
    if (!isDragging) return;
    e.preventDefault();
    updateVelocity(e.clientX);
    const x = e.clientX;
    slider.scrollLeft = scrollLeft - (x - startX);
    startX = x;
    scrollLeft = slider.scrollLeft;
  }, 16)
);

document.addEventListener("mouseup", (e) => {
  if (isDragging) {
    e.preventDefault();
    isDragging = false;
    slider.classList.remove("grabbing");
    animateMomentum();
  }
});

sliderContent.addEventListener(
  "touchstart",
  (e) => {
    if (e.target.closest("a")) return;
    if (momentumAnimation) {
      cancelAnimationFrame(momentumAnimation);
      momentumAnimation = null;
    }
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX;
    scrollLeft = slider.scrollLeft;
    dragStartTime = Date.now();
    lastX = startX;
    timestamp = Date.now();
    e.preventDefault();
  },
  { passive: false }
);

document.addEventListener(
  "touchmove",
  throttle((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.touches[0].clientX;
    updateVelocity(x);
    slider.scrollLeft = scrollLeft - (x - startX);
    startX = x;
    scrollLeft = slider.scrollLeft;
  }, 16),
  { passive: false }
);

document.addEventListener("touchend", (e) => {
  if (isDragging && Date.now() - dragStartTime < 100) {
    e.preventDefault();
  }
  isDragging = false;
  slider.classList.remove("grabbing");
  animateMomentum();
});

function animateMomentum() {
  if (!velocity) return;

  const decay = 0.95;
  velocity *= decay;

  if (Math.abs(velocity) < 0.1) {
    velocity = 0;
    return;
  }

  slider.scrollLeft -= velocity * 20;
  momentumAnimation = requestAnimationFrame(animateMomentum);
}
