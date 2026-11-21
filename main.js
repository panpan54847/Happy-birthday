import { animate } from "popmotion";

const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");
const loveCard = document.getElementById("love-card");

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

window.addEventListener("resize", () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

// 粒子数组与拖尾数组
let particles = [];
let trails = [];
let isDragging = false;
let lastSpawnTime = 0;
let cardShown = false;

// 浪漫色系（粉紫、香槟金、玫瑰红、冰蓝）
const colors = ["#ff4d6d", "#ff758f", "#ffb3c1", "#ffd166", "#a2d2ff", "#cdb4db", "#ff9e00"];

class Particle {
  constructor(x, y, vx, vy, color, size = 2.5, decay = 0.015) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.alpha = 1;
    this.decay = decay;
    this.gravity = 0.06; // 重力下坠感
    this.friction = 0.96; // 空气阻力
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(this.alpha, 0);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();
  }
}

// 1. 普通圆形烟花爆炸
function createFirework(x, y, count = 65) {
  const color = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.2;
    const speed = Math.random() * 6 + 2;
    particles.push(
      new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 2.5, 0.014)
    );
  }
}

// 2. 专属爱心形烟花爆炸（心形参数方程）
function createHeartFirework(cx, cy) {
  const count = 120;
  for (let i = 0; i < count; i++) {
    const t = (Math.PI * 2 * i) / count;
    // 经典心形数学公式
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const scale = 0.35 + Math.random() * 0.05;
    const color = i % 2 === 0 ? "#ff4d6d" : "#ffb3c1";

    particles.push(new Particle(cx, cy, hx * scale, hy * scale, color, 3.2, 0.009));
  }
}

// 3. 弹出表白文字（使用 Popmotion 物理弹簧动画）
function triggerLoveConfession() {
  createHeartFirework(width / 2, height * 0.38);

  if (!cardShown) {
    cardShown = true;
    animate({
      from: 0,
      to: 1,
      type: "spring",
      stiffness: 260,
      damping: 16,
      onUpdate: (v) => {
        loveCard.style.opacity = Math.min(v, 1);
        loveCard.style.transform = `translate(-50%, -50%) scale(${v})`;
      },
    });
  }
}

// --- 手势 / 鼠标交互监听 ---

// 单击/按下：直接燃放烟花
window.addEventListener("pointerdown", (e) => {
  isDragging = true;
  createFirework(e.clientX, e.clientY, 70);
});

// 按住滑动：指尖流星拖尾 + 小型烟花
window.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  trails.push({ x: e.clientX, y: e.clientY, alpha: 1 });

  const now = Date.now();
  if (now - lastSpawnTime > 120) {
    createFirework(e.clientX, e.clientY, 25);
    lastSpawnTime = now;
  }
});

window.addEventListener("pointerup", () => {
  isDragging = false;
});

// 双击屏幕：触发爱心烟花 + 弹簧表白弹窗
window.addEventListener("dblclick", (e) => {
  createHeartFirework(e.clientX, e.clientY);
  triggerLoveConfession();
});

// --- 动画主循环 ---
function loop() {
  // 半透明黑色覆盖，制造烟花下落的残影拖尾效果
  ctx.fillStyle = "rgba(2, 4, 10, 0.2)";
  ctx.fillRect(0, 0, width, height);

  // 绘制手势滑动的金色星光轨迹
  for (let i = trails.length - 1; i >= 0; i--) {
    const t = trails[i];
    ctx.beginPath();
    ctx.arc(t.x, t.y, 3 * t.alpha, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${t.alpha})`;
    ctx.fill();
    t.alpha -= 0.04;
    if (t.alpha <= 0) trails.splice(i, 1);
  }

  // 更新并绘制所有烟花粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.alpha <= 0) particles.splice(i, 1);
  }

  requestAnimationFrame(loop);
}

// 开场自动放两朵烟花迎接
setTimeout(() => createFirework(width * 0.35, height * 0.35), 400);
setTimeout(() => createFirework(width * 0.65, height * 0.3), 900);

loop();