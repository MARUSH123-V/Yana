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
  const dpr = window.devicePixelRatio || 1;

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener("resize", () => location.reload());

const isMobile = window.innerWidth < 600;

// ---------------- Data ----------------
let particles = [];
let textTargets = [];
let heartTargets = [];
let stage = 0;

// ---------------- Text ----------------
function drawTextWithSpacing(ctx, text, x, y, spacing) {
  let width = 0;
  for (let c of text) width += ctx.measureText(c).width + spacing;
  let startX = x - width / 2;

  for (let c of text) {
    ctx.fillText(c, startX, y);
    startX += ctx.measureText(c).width + spacing;
  }
}

function createTextPoints() {
  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d");

  off.width = canvas.width;
  off.height = canvas.height;

  offCtx.fillStyle = "#fff";
  offCtx.textBaseline = "middle";
  offCtx.textAlign = "left";

  const lines = isMobile
    ? ["ЯНА", "С ДНЁМ РОЖДЕНИЯ"]
    : ["ЯНА С ДНЁМ РОЖДЕНИЯ"];

  const fontSize = isMobile ? 76 : 86;
  const letterSpacing = isMobile ? 8 : 6;

  offCtx.font = `bold ${fontSize}px Courier New, monospace`;

  const startY = isMobile ? canvas.height * 0.22 : canvas.height / 3;
  const lineHeight = fontSize * 1.6;

  lines.forEach((line, i) => {
    drawTextWithSpacing(
      offCtx,
      line,
      canvas.width / 2,
      startY + i * lineHeight,
      letterSpacing
    );
  });

  const img = offCtx.getImageData(0, 0, off.width, off.height).data;
  const points = [];

  const step = isMobile ? 7 : 6;

  for (let y = 0; y < off.height; y += step) {
    for (let x = 0; x < off.width; x += step) {
      const i = (y * off.width + x) * 4;
      if (img[i + 3] > 180) {
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

textTargets = createTextPoints();

const heartCount = isMobile ? 2600 : 4200;
const heartScale = isMobile ? 8 : 12;
const heartOffsetY = isMobile ? canvas.height * 0.55 : canvas.height / 1.7;

for (let i = 0; i < heartCount; i++) {
  const t = Math.random() * Math.PI * 2;
  const p = heartShape(t);

  heartTargets.push({
    x: canvas.width / 2 + p.x * heartScale,
    y: heartOffsetY - p.y * heartScale,
  });
}

// ---------------- Particles ----------------
const leftStart = { x: 60, y: canvas.height - 80 };
const rightStart = { x: canvas.width - 60, y: canvas.height - 80 };
const center = { x: canvas.width / 2, y: canvas.height / 2 };

const total = textTargets.length + heartTargets.length;

for (let i = 0; i < total; i++) {
  const start = i % 2 === 0 ? leftStart : rightStart;

  particles.push({
    x: start.x,
    y: start.y,
    vx: (center.x - start.x) * 0.006,
    vy: (center.y - start.y) * 0.006,
    targetX: null,
    targetY: null,
    size: isMobile ? 2.6 : 3,
  });
}

// ---------------- Animation ----------------
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p, i) => {
    if (stage === 0) {
      p.x += p.vx;
      p.y += p.vy;
      if (Math.abs(p.x - center.x) < 6 && Math.abs(p.y - center.y) < 6) {
        stage = 1;
      }
    } else if (stage === 1) {
      p.vx = (Math.random() - 0.5) * 2;
      p.vy = (Math.random() - 0.5) * 2;
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

      p.x += (p.targetX - p.x) * 0.025;
      p.y += (p.targetY - p.y) * 0.025;
    }

    // ---- Touch wave (исправлено)
    if (mouse.x !== null) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        p.x += dx * force * 0.35;
        p.y += dy * force * 0.35;
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
