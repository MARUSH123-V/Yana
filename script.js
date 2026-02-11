let mouse = { x: null, y: null, radius: 40 };

window.addEventListener("mousemove", (e) => {
  mouse.x = e.x;
  mouse.y = e.y;
});

window.addEventListener("touchmove", (e) => {
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
}, { passive: true });

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

// ---------------- Этапы ----------------
let particles = [];
let textTargets = [];
let heartTargets = [];
let stage = 0;

// ---------------- Текст ----------------
function createTextPoints(text) {
  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d");

  off.width = canvas.width;
  off.height = canvas.height;

  let fontSize = isMobile ? canvas.width * 0.085 : 90;

  offCtx.font = `bold ${fontSize}px Arial`;
  offCtx.fillStyle = "white";
  offCtx.textAlign = "center";
  offCtx.textBaseline = "middle";

  // 🔥 НОРМАЛЬНОЕ позиционирование
  let textY = isMobile
    ? canvas.height * 0.22   // ниже чем было, но не у края
    : canvas.height / 3;

  offCtx.fillText(text, canvas.width / 2, textY);

  const data = offCtx.getImageData(0, 0, off.width, off.height).data;
  let points = [];

  for (let y = 0; y < off.height; y += 6) {
    for (let x = 0; x < off.width; x += 6) {
      const index = (y * off.width + x) * 4;
      if (data[index + 3] > 128) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

// ---------------- Сердце ----------------
function heartShape(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t)
          - 5 * Math.cos(2 * t)
          - 2 * Math.cos(3 * t)
          - Math.cos(4 * t);
  return { x, y };
}

textTargets = createTextPoints("ЯНА С ДНЕМ РОЖДЕНИЯ");

let heartCount = isMobile ? 2500 : 4000;

for (let i = 0; i < heartCount; i++) {
  const t = Math.random() * Math.PI * 2;
  const pos = heartShape(t);

  let scale = isMobile ? 8 : 12;

  // ❤️ Сердце под текстом
  let heartOffset = isMobile
    ? canvas.height * 0.58
    : canvas.height / 1.7;

  heartTargets.push({
    x: canvas.width / 2 + pos.x * scale,
    y: heartOffset - pos.y * scale
  });
}

// ---------------- Частицы ----------------
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
    size: 3
  });
}

// ---------------- Анимация ----------------
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p, i) => {

    if (stage === 0) {
      p.x += p.vx;
      p.y += p.vy;

      if (Math.abs(p.x - center.x) < 5 &&
          Math.abs(p.y - center.y) < 5) {
        stage = 1;
      }
    }

    else if (stage === 1) {
      p.vx = (Math.random() - 0.5) * 3;
      p.vy = (Math.random() - 0.5) * 3;
      stage = 2;
    }

    else if (stage === 2) {

      if (i < textTargets.length) {
        p.targetX = textTargets[i].x;
        p.targetY = textTargets[i].y;
      } else {
        const index = i - textTargets.length;
        if (heartTargets[index]) {
          p.targetX = heartTargets[index].x;
          p.targetY = heartTargets[index].y;
        }
      }

      if (p.targetX !== null) {
        let dx = p.targetX - p.x;
        let dy = p.targetY - p.y;
        p.x += dx * 0.02;
        p.y += dy * 0.02;
      }
    }

    // интерактив
    if (mouse.x !== null && mouse.y !== null) {
      let dx = p.x - mouse.x;
      let dy = p.y - mouse.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouse.radius) {
        let force = (mouse.radius - dist) / mouse.radius;
        p.x += dx * force * 0.2;
        p.y += dy * force * 0.2;
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
