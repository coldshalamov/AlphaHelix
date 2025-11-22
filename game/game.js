const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const statusEl = document.getElementById("status");

const state = {
  width: 360,
  height: 640,
  score: 0,
  lives: 3,
  player: {
    x: 160,
    y: 560,
    w: 64,
    h: 64,
    speed: 220,
    cooldown: 0,
  },
  isa: {
    x: 80,
    y: 40,
    w: 76,
    h: 64,
    speed: 60,
    dir: 1,
    throwTimer: 0,
  },
  chanclas: [],
  bullets: [],
  pets: [],
  drops: [],
  floatingTexts: [],
  effect: {
    slowUntil: 0,
  },
  lastTimestamp: 0,
  running: true,
};

const keys = { left: false, right: false, shoot: false };
const mobileControls = document.querySelectorAll(".control");
mobileControls.forEach((btn) => {
  const dir = btn.dataset.dir;
  const action = btn.dataset.action;
  const start = () => {
    if (dir) keys[dir] = true;
    if (action === "shoot") keys.shoot = true;
  };
  const stop = () => {
    if (dir) keys[dir] = false;
    if (action === "shoot") keys.shoot = false;
  };
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    start();
  });
  btn.addEventListener("pointerup", stop);
  btn.addEventListener("pointerleave", stop);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === " " || e.key === "ArrowUp" || e.key === "w") keys.shoot = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  if (e.key === " " || e.key === "ArrowUp" || e.key === "w") keys.shoot = false;
});

canvas.addEventListener(
  "pointermove",
  (e) => {
    const rect = canvas.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * state.width;
    state.player.x = clamp(relativeX - state.player.w / 2, 12, state.width - 12 - state.player.w);
  },
  { passive: true }
);

canvas.addEventListener("pointerdown", () => {
  keys.shoot = true;
});
canvas.addEventListener("pointerup", () => {
  keys.shoot = false;
});

function resize() {
  const ratio = state.width / state.height;
  const targetWidth = canvas.clientWidth;
  canvas.width = targetWidth;
  canvas.height = targetWidth / ratio;
}
window.addEventListener("resize", resize);
resize();

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnChancla() {
  const size = rand(24, 40);
  state.chanclas.push({
    x: rand(0, state.width - size),
    y: -size,
    size,
    speed: rand(120, 180),
  });
}

function spawnPet() {
  const petTypes = [
    { emoji: "🐶", color: "#ffc857" },
    { emoji: "🐱", color: "#9ad5ff" },
  ];
  const variant = petTypes[Math.floor(Math.random() * petTypes.length)];
  state.pets.push({
    x: -40,
    y: rand(80, 150),
    w: 40,
    h: 32,
    speed: rand(50, 90),
    emoji: variant.emoji,
    color: variant.color,
    dropTimer: rand(0.8, 1.6),
  });
}

function spawnDrop(x, y) {
  const isHeart = Math.random() > 0.45;
  state.drops.push({
    x,
    y,
    size: 36,
    type: isHeart ? "heart" : "beer",
    vy: 35,
  });
}

function addText(message, x, y, color = "#fff") {
  state.floatingTexts.push({ message, x, y, alpha: 1, color });
}

function shoot() {
  if (state.player.cooldown > 0) return;
  state.bullets.push({
    x: state.player.x + state.player.w / 2 - 4,
    y: state.player.y - 6,
    w: 8,
    h: 16,
    speed: 360,
  });
  state.player.cooldown = 0.4;
}

function update(delta) {
  const player = state.player;
  if (!state.running) return;

  player.cooldown = Math.max(0, player.cooldown - delta);
  if (keys.left) player.x -= player.speed * delta;
  if (keys.right) player.x += player.speed * delta;
  player.x = clamp(player.x, 12, state.width - player.w - 12);
  if (keys.shoot) shoot();

  const isa = state.isa;
  isa.x += isa.speed * isa.dir * delta;
  if (isa.x < 12 || isa.x + isa.w > state.width - 12) {
    isa.dir *= -1;
    isa.x = clamp(isa.x, 12, state.width - 12 - isa.w);
  }
  isa.throwTimer -= delta;
  if (isa.throwTimer <= 0) {
    spawnChancla();
    isa.throwTimer = rand(0.55, 1.1);
  }

  state.chanclas.forEach((c) => {
    const slow = Date.now() < state.effect.slowUntil ? 0.55 : 1;
    c.y += c.speed * delta * slow;
  });
  state.chanclas = state.chanclas.filter((c) => c.y < state.height + 40);

  state.bullets.forEach((b) => {
    b.y -= b.speed * delta;
  });
  state.bullets = state.bullets.filter((b) => b.y + b.h > -10);

  state.pets.forEach((p) => {
    p.x += p.speed * delta;
    p.dropTimer -= delta;
    if (p.dropTimer <= 0) {
      spawnDrop(p.x + p.w / 2 - 10, p.y + p.h);
      p.dropTimer = 1000;
    }
  });
  state.pets = state.pets.filter((p) => p.x < state.width + 50);

  state.drops.forEach((d) => {
    d.vy += 60 * delta;
    d.y += d.vy * delta;
  });
  state.drops = state.drops.filter((d) => d.y < state.height + 30);

  handleCollisions();
  updateFloatingTexts(delta);

  // spawn timers
  state.spawnPetTimer = (state.spawnPetTimer || 0) - delta;
  if (state.spawnPetTimer <= 0) {
    spawnPet();
    state.spawnPetTimer = rand(6, 9);
  }
}

function handleCollisions() {
  // bullets vs chanclas
  state.bullets.forEach((b) => {
    state.chanclas = state.chanclas.filter((c) => {
      const hit = rectsOverlap(b, { x: c.x, y: c.y, w: c.size, h: c.size });
      if (hit) {
        state.score += 2;
        addText("Blocked!", c.x, c.y, "#9ad5ff");
      }
      return !hit;
    });
  });

  // chanclas vs player
  state.chanclas.forEach((c) => {
    if (rectsOverlap({ ...c, w: c.size, h: c.size }, state.player)) {
      c.y = state.height + 100;
      state.lives -= 1;
      addText("Ouch!", state.player.x + 10, state.player.y - 10, "#ff9ba8");
      if (state.lives <= 0) {
        state.running = false;
        statusEl.textContent = "Game over. Refresh to retry.";
      }
    }
  });

  // drops vs player
  state.drops = state.drops.filter((d) => {
    if (rectsOverlap({ ...d, w: d.size, h: d.size }, state.player)) {
      if (d.type === "heart") {
        state.lives = Math.min(state.lives + 1, 6);
        addText("I love you! ❤️", d.x, d.y, "#ff7ab6");
      } else {
        state.effect.slowUntil = Date.now() + 4500;
        addText("Beer break! 🧊", d.x, d.y, "#f8d04c");
      }
      return false;
    }
    return true;
  });
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + (a.w || 0) + (a.size || 0) > b.x && a.y < b.y + b.h && a.y + (a.h || 0) + (a.size || 0) > b.y;
}

function updateFloatingTexts(delta) {
  state.floatingTexts.forEach((t) => {
    t.y -= 20 * delta;
    t.alpha -= 0.6 * delta;
  });
  state.floatingTexts = state.floatingTexts.filter((t) => t.alpha > 0);
}

function drawBackground() {
  ctx.fillStyle = "#0a1323";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.fillStyle = "#0e1c32";
  ctx.fillRect(0, state.height - 120, state.width, 120);
  ctx.fillStyle = "#0f203b";
  for (let i = 0; i < state.width; i += 80) {
    ctx.fillRect(i, state.height - 90, 60, 90);
  }
  ctx.fillStyle = "#13304e";
  for (let i = 30; i < state.width; i += 120) {
    ctx.beginPath();
    ctx.moveTo(i, state.height - 40);
    ctx.lineTo(i + 28, state.height - 96);
    ctx.lineTo(i + 56, state.height - 40);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#ffdf70";
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(rand(0, state.width), rand(0, state.height * 0.6), 2, 2);
  }
}

function drawIsa() {
  const { x, y, w, h } = state.isa;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f29ab4";
  ctx.strokeStyle = "#eb7aa1";
  ctx.beginPath();
  ctx.moveTo(w * 0.16, 6);
  ctx.lineTo(w * 0.84, 6);
  ctx.lineTo(w * 0.9, h * 0.55);
  ctx.lineTo(w * 0.5, h - 2);
  ctx.lineTo(w * 0.1, h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // hair
  ctx.fillStyle = "#332424";
  roundRect(ctx, -6, -6, w + 12, 32, 16, true, false);
  ctx.fillStyle = "#f978a9";
  roundRect(ctx, 14, -14, 48, 18, 10, true, false);
  ctx.fillStyle = "#322", ctx.font = "bold 12px Fredoka";
  ctx.fillStyle = "#322";
  ctx.textAlign = "center";
  ctx.fillText("ISA", w / 2 + 0.5, -0.5);

  // lashes and eyes
  ctx.strokeStyle = "#2d1b1b";
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.arc(w * 0.32, h * 0.42, 8, Math.PI * 0.1, Math.PI * 0.9);
  ctx.arc(w * 0.68, h * 0.42, 8, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.fillStyle = "#2d1b1b";
  ctx.beginPath();
  ctx.ellipse(w * 0.32, h * 0.5, 3, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(w * 0.68, h * 0.5, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // blush & smile
  ctx.fillStyle = "#ff8fbf";
  ctx.beginPath();
  ctx.ellipse(w * 0.26, h * 0.62, 6, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(w * 0.74, h * 0.62, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2d1b1b";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.58, 14, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();

  ctx.restore();
}

function drawGringo() {
  const { x, y, w, h } = state.player;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#ffe0b5";
  roundRect(ctx, 0, 0, w, h, 16, true, false);

  // hair
  ctx.fillStyle = "#4b2c20";
  roundRect(ctx, -2, -6, w + 4, 20, 10, true, false);
  ctx.fillStyle = "#3a2219";
  roundRect(ctx, 6, -10, 24, 12, 6, true, false);

  // eyes
  ctx.fillStyle = "#2b1a14";
  ctx.beginPath();
  ctx.ellipse(w * 0.3, h * 0.45, 4, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(w * 0.7, h * 0.45, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // beard + smile
  ctx.fillStyle = "#c9976b";
  roundRect(ctx, 4, h * 0.54, w - 8, h * 0.42, 14, true, false);
  ctx.fillStyle = "#9e7654";
  ctx.beginPath();
  ctx.moveTo(w * 0.18, h * 0.62);
  ctx.lineTo(w * 0.82, h * 0.62);
  ctx.lineTo(w * 0.5, h * 0.94);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#47281d";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.64, 12, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.strokeStyle = "#2b1a14";
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.76, 14, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  ctx.fillStyle = "#2b1a14";
  ctx.beginPath();
  ctx.moveTo(w * 0.38, h * 0.6);
  ctx.quadraticCurveTo(w * 0.5, h * 0.56, w * 0.62, h * 0.6);
  ctx.quadraticCurveTo(w * 0.5, h * 0.64, w * 0.38, h * 0.6);
  ctx.fill();

  // eyebrows
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.32);
  ctx.lineTo(w * 0.36, h * 0.3);
  ctx.moveTo(w * 0.64, h * 0.3);
  ctx.lineTo(w * 0.8, h * 0.32);
  ctx.stroke();

  ctx.restore();
}

function drawChancla(c) {
  ctx.font = `${c.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🩴💨", c.x + c.size / 2, c.y + c.size / 2);
}

function drawBullet(b) {
  ctx.fillStyle = "#9ad5ff";
  roundRect(ctx, b.x, b.y, b.w, b.h, 4, true, false);
}

function drawPet(p) {
  ctx.font = `28px "Apple Color Emoji", "Segoe UI Emoji"`;
  ctx.textAlign = "left";
  ctx.fillText(p.emoji, p.x, p.y + p.h / 2);
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - 6, p.y + p.h / 2, p.w, 6);
}

function drawDrop(d) {
  if (d.type === "heart") {
    ctx.font = `30px "Apple Color Emoji", "Segoe UI Emoji"`;
    ctx.textAlign = "center";
    ctx.fillText("❤️", d.x + d.size / 2, d.y + d.size / 2);
    ctx.fillStyle = "#ff7ab6";
    ctx.font = "14px Fredoka";
    ctx.fillText("I love you!", d.x + d.size / 2, d.y + d.size + 12);
  } else {
    ctx.font = `30px "Apple Color Emoji", "Segoe UI Emoji"`;
    ctx.textAlign = "center";
    ctx.fillText("🍺", d.x + d.size / 2, d.y + d.size / 2);
    ctx.fillStyle = "#f8d04c";
    ctx.font = "14px Fredoka";
    ctx.fillText("Slow-mo", d.x + d.size / 2, d.y + d.size + 12);
  }
}

function drawFloatingTexts() {
  state.floatingTexts.forEach((t) => {
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.color;
    ctx.font = "16px Fredoka";
    ctx.fillText(t.message, t.x, t.y);
    ctx.globalAlpha = 1;
  });
}

function roundRect(ctx, x, y, w, h, r, fill = true, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawHUD() {
  scoreEl.textContent = `Score: ${state.score}`;
  livesEl.textContent = `Lives: ${"❤️".repeat(state.lives)}`;
  if (Date.now() < state.effect.slowUntil) {
    statusEl.textContent = "Beer chill active";
  } else if (state.running) {
    statusEl.textContent = "";
  }
}

function render() {
  ctx.clearRect(0, 0, state.width, state.height);
  drawBackground();
  drawIsa();
  drawGringo();
  state.chanclas.forEach(drawChancla);
  state.bullets.forEach(drawBullet);
  state.pets.forEach(drawPet);
  state.drops.forEach(drawDrop);
  drawFloatingTexts();
  drawHUD();
}

function loop(timestamp) {
  const delta = Math.min((timestamp - state.lastTimestamp) / 1000, 0.05);
  state.lastTimestamp = timestamp;
  update(delta);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
