// ---------- CONFIG ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ORB_RADIUS = 10;
const TRAIL_WIDTH = 4;
const NODE_RADIUS = 6;
const BASE_RADIUS = 40;
const ORB_SPEED = 3;
const NPC_COUNT = 3;
const NPC_SPEED = 1.2;

// ---------- GAME STATE ----------
const orb = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  dx: 0,
  dy: 0,
  energy: 0,
  trail: []
};

const camp = {
  x: canvas.width / 2,
  y: canvas.height - 80,
  radius: BASE_RADIUS,
  energy: Number(localStorage.getItem('campEnergy')) || 0,
  territory: []
};

const nodes = Array.from({ length: 20 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  collected: false
}));

const npcs = Array.from({ length: NPC_COUNT }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  dx: (Math.random() - 0.5) * NPC_SPEED,
  dy: (Math.random() - 0.5) * NPC_SPEED,
  trail: []
}));

// ---------- INPUT ----------
let usingTouch = false;
let touchPos = null;

document.addEventListener('keydown', e => {
  usingTouch = false;
  if (e.key === 'ArrowUp')    { orb.dx = 0; orb.dy = -ORB_SPEED; }
  if (e.key === 'ArrowDown')  { orb.dx = 0; orb.dy = ORB_SPEED; }
  if (e.key === 'ArrowLeft')  { orb.dx = -ORB_SPEED; orb.dy = 0; }
  if (e.key === 'ArrowRight') { orb.dx = ORB_SPEED; orb.dy = 0; }
});

canvas.addEventListener('touchstart', e => {
  usingTouch = true;
  const t = e.touches[0];
  touchPos = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener('touchmove', e => {
  const t = e.touches[0];
  touchPos = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener('touchend', () => {
  touchPos = null;
  orb.dx = 0;
  orb.dy = 0;
});

// ---------- HELPERS ----------
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function saveEnergy() {
  localStorage.setItem('campEnergy', camp.energy);
}

// ---------- UPDATE ----------
function updateOrb() {
  if (usingTouch && touchPos) {
    const dx = touchPos.x - orb.x;
    const dy = touchPos.y - orb.y;
    const mag = Math.hypot(dx, dy);
    if (mag > 1) {
      orb.x += (dx / mag) * ORB_SPEED;
      orb.y += (dy / mag) * ORB_SPEED;
    }
  } else {
    orb.x += orb.dx;
    orb.y += orb.dy;
  }
}

function updateTrail() {
  if (dist(orb, camp) > camp.radius) {
    orb.trail.push({ x: orb.x, y: orb.y });
    if (orb.trail.length > 300) orb.trail.shift();
  }
}

function checkNodes() {
  nodes.forEach(n => {
    if (!n.collected && dist(orb, n) < ORB_RADIUS + NODE_RADIUS) {
      n.collected = true;
      orb.energy++;
    }
  });
}

function checkLoopClosure() {
  if (orb.trail.length > 20 && dist(orb, camp) <= camp.radius) {
    camp.territory.push([...orb.trail]);
    camp.radius += 6;
    camp.energy += orb.energy;
    orb.energy = 0;
    orb.trail = [];
    saveEnergy();
  }
}

function moveNPCs() {
  npcs.forEach(npc => {
    npc.x += npc.dx;
    npc.y += npc.dy;

    if (npc.x < 0 || npc.x > canvas.width) npc.dx *= -1;
    if (npc.y < 0 || npc.y > canvas.height) npc.dy *= -1;

    npc.trail.push({ x: npc.x, y: npc.y });
    if (npc.trail.length > 120) npc.trail.shift();
  });
}

// ---------- MAIN UPDATE ----------
function update() {
  updateOrb();
  updateTrail();
  checkNodes();
  checkLoopClosure();
  moveNPCs();
}

// ---------- DRAW ----------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Territory
  ctx.fillStyle = 'rgba(0,200,200,0.15)';
  camp.territory.forEach(loop => {
    ctx.beginPath();
    loop.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
  });

  // Camp
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(camp.x, camp.y, camp.radius, 0, Math.PI * 2);
  ctx.fill();

  // Nodes
  nodes.forEach(n => {
    if (!n.collected) {
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Orb trail
  ctx.strokeStyle = 'cyan';
  ctx.lineWidth = TRAIL_WIDTH;
  ctx.beginPath();
  orb.trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.stroke();

  // NPCs
  npcs.forEach(npc => {
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    npc.trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(npc.x, npc.y, ORB_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  });

  // Orb
  ctx.fillStyle = 'cyan';
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, ORB_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '18px Arial';
  ctx.fillText(`Orb: ${orb.energy}`, 20, canvas.height - 30);
  ctx.fillText(`Camp: ${camp.energy}`, canvas.width - 140, canvas.height - 30);
}

// ---------- LOOP ----------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();