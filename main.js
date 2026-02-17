// ===============================
// ENERGY.IO — CLEAN FOUNDATION
// ===============================

// ---------- SETUP ----------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const WORLD_WIDTH = canvas.width;
const WORLD_HEIGHT = canvas.height;

const ORB_RADIUS = 8;
const NODE_RADIUS = 5;
const BASE_RADIUS_START = 40;
const SPEED = 3;

// ---------- GAME STATE ----------
const orb = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  dx: 0,
  dy: 0,
  trail: [],
  energy: 0
};

const camp = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT - 80,
  radius: BASE_RADIUS_START,
  energy: Number(localStorage.getItem("campEnergy")) || 0,
  territory: []
};

const nodes = Array.from({ length: 20 }, () => ({
  x: Math.random() * WORLD_WIDTH,
  y: Math.random() * WORLD_HEIGHT,
  collected: false
}));

// ---------- INPUT ----------
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp")    { orb.dx = 0; orb.dy = -SPEED; }
  if (e.key === "ArrowDown")  { orb.dx = 0; orb.dy = SPEED; }
  if (e.key === "ArrowLeft")  { orb.dx = -SPEED; orb.dy = 0; }
  if (e.key === "ArrowRight") { orb.dx = SPEED; orb.dy = 0; }
});

// ---------- HELPERS ----------
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function clampOrbToWorld() {
  orb.x = Math.max(ORB_RADIUS, Math.min(WORLD_WIDTH - ORB_RADIUS, orb.x));
  orb.y = Math.max(ORB_RADIUS, Math.min(WORLD_HEIGHT - ORB_RADIUS, orb.y));
}

function saveEnergy() {
  localStorage.setItem("campEnergy", camp.energy);
}

// ---------- UPDATE ----------
function update() {

  // movement
  orb.x += orb.dx;
  orb.y += orb.dy;
  clampOrbToWorld();

  // leave trail only outside base
  if (dist(orb, camp) > camp.radius) {
    orb.trail.push({ x: orb.x, y: orb.y });
  }

  // collect nodes
  nodes.forEach(n => {
    if (!n.collected && dist(orb, n) < ORB_RADIUS + NODE_RADIUS) {
      n.collected = true;
      orb.energy++;
    }
  });

  // close loop when returning to base
  if (orb.trail.length > 15 && dist(orb, camp) <= camp.radius) {

    // add territory
    camp.territory.push([...orb.trail]);

    // expand base slightly
    camp.radius += 4;

    // deposit energy
    camp.energy += orb.energy;
    orb.energy = 0;
    saveEnergy();

    // clear trail
    orb.trail = [];
  }
}

// ---------- DRAW ----------
function draw() {
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // draw captured territory (solid fill)
  ctx.fillStyle = "rgba(0,200,200,0.2)";
  camp.territory.forEach(loop => {
    ctx.beginPath();
    loop.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
  });

  // draw base
  ctx.fillStyle = "#555";
  ctx.beginPath();
  ctx.arc(camp.x, camp.y, camp.radius, 0, Math.PI * 2);
  ctx.fill();

  // draw nodes
  nodes.forEach(n => {
    if (!n.collected) {
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // draw trail
  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 3;
  ctx.beginPath();
  orb.trail.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // draw orb
  ctx.fillStyle = "cyan";
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, ORB_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // HUD
  ctx.fillStyle = "#fff";
  ctx.font = "18px Arial";
  ctx.fillText(`Orb: ${orb.energy}`, 20, WORLD_HEIGHT - 30);
  ctx.fillText(`Camp: ${camp.energy}`, WORLD_WIDTH - 150, WORLD_HEIGHT - 30);
}

// ---------- LOOP ----------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
