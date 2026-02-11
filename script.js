// ---------------- Mouse / Touch ----------------
let mouse = { x: null, y: null, radius: 40 };

window.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

window.addEventListener("touchmove", e => {
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
}, { passive: true });

window.addEventListener("touchend", () => {
  mouse.x = null;
  mouse.y = null;
});

window.addEventListener("mouseout", () => {
  mouse.x = null;
  mouse.y = null;
});

// ---------------- Canvas ----------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", () => location.reload());

const isMobile = window.innerWidth < 600;

// ---------------- Stages ----------------
let particles = [];
let textTargets = [];
let heartTargets = [];
let stage = 0;

// ---------------- Text ----------------
function createTextPoints() {
  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d");

  off.width = canvas.width;
  off.height = canvas.height;

  offCtx.fillStyle = "white";
  offCtx.textAlign = "center";
  offCtx.textBaseline = "middle";

  const lines = isMobile
    ? ["ЯНА", "С ДНЕМ РОЖДЕНИЯ"]
    : ["ЯНА С ДНЕМ РОЖДЕНИЯ"];

  const fontSize = isMobile ? 70 : 80;
  offCtx.font = `bold ${fontSize}px Arial`;

  const startY = isMobile
    ? canvas.height * 0.20
    : canvas.height / 3;

  const lineHeight = fontSize * 1.2;

  lines.forEach((line, i) => {
    offCtx.fillText(
      line,
      canvas.width / 2,
      startY + i * lineHeight
    );
  });

  const data = offCtx.getImageData(0, 0, off.width, off.height).data;
  const points = [];

  // 🔧 ПЛОТНОСТЬ ТЕКСТА (меняй ТОЛЬКО это)
  const step = isMobile ? 6 : 5;

  for (let y = 0; y < off.height; y += step) {
    for (let x = 0; x < off.width; x += step) {
      const i = (y * off.width + x) * 4;
      if (data[i + 3] > 128) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

// ---------------- Heart ----------------
function heartShape(t) {
  return {
    x: 16 * Math.pow(Math.sin(t), 3),
    y:
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t),
  };
}

// ---------------- Build targets ----------------
textTargets = createTextPoints();

const heartCount = isMobile ? 2500 : 4000;
const heartScale = isMobile ? 8 : 12;
const heartOffsetY = isMobile
  ? canvas.height * 0.48
  : canvas.height / 1.7;

for (let i = 0; i < heartCount; i++) {
  const t = Math.random() * Math.PI * 2;
  const p = heartShape(t);

  heartTargets.push({
    x: canvas.width / 2 + p.x * heartScale,
    y: heartOffsetY - p.y * heartScale,
  });
}

// ---------------- Particles ----------------
const leftStart = { x: 80, y: canvas.height - 100 };
const rightStart = { x: canvas.width - 80, y: canvas.height - 100 };
const center = { x: canvas.width / 2, y: canvas.height / 2 };

const totalParticles = textTargets.length + heartTargets.length;

for (let i = 0; i < totalParticles; i++) {
  const start = i % 2 === 0 ? leftStart : rightStart;

  particles.push({
    x: start.x,
    y: start.y,
    targetX: null,
    targetY: null,
    vx: (center.x - start.x) * 0.007,
    vy: (center.y - start.y) * 0.007,
    size: 3,
  });
}

// ---------------- Animation ----------------
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p, i) => {
    if (stage === 0) {
      p.x += p.vx;
      p.y += p.vy;

      if (
        Math.abs(p.x - center.x) < 5 &&
        Math.abs(p.y - center.y) < 5
      ) {
        stage = 1;
      }
    } else if (stage === 1) {
      p.vx = (Math.random() - 0.5) * 3;
      p.vy = (Math.random() - 0.5) * 3;
      stage = 2;
    } else {
      if (i < textTargets.length) {
        p.targetX = textTargets[i].x;
        p.targetY = textTargets[i].y;
      } else {
        const h = heartTargets[i - textTargets.length];
        if (h) {
          p.targetX = h.x;
          p.targetY = h.y;
        }
      }

      p.x += (p.targetX - p.x) * 0.02;
      p.y += (p.targetY - p.y) * 0.02;
    }

    // ---- Touch wave (стабильно)
    if (mouse.x !== null) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouse.radius) {
        const f = (mouse.radius - dist) / mouse.radius;
        p.x += dx * f * 0.2;
        p.y += dy * f * 0.2;
      }
    }

    ctx.fillStyle = "#ff4da6";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(animate);
}

animate();
