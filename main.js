// ---------- CONFIG ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ORB_RADIUS = 10;
const TRAIL_WIDTH = 4;
const NODE_RADIUS = 6;
const CAMP_RADIUS = 40;
const ORB_SPEED = 2;
const NPC_COUNT = 3;
const NPC_SPEED = 1.5;

// ---------- GAME STATE ----------
let orb = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  dx: 0,
  dy: 0,
  color: 'cyan',
  trail: [],
  energy: 0
};

let camp = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  radius: CAMP_RADIUS,
  energy: parseInt(localStorage.getItem('campEnergy')) || 0,
  territory: []
};

let nodes = Array.from({ length: 20 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  collected: false
}));

let npcs = Array.from({ length: NPC_COUNT }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  dx: (Math.random() - 0.5) * NPC_SPEED,
  dy: (Math.random() - 0.5) * NPC_SPEED,
  trail: [],
  color: 'red'
}));

// ---------- INPUT ----------
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp')    { orb.dy = -ORB_SPEED; orb.dx = 0; }
  if (e.key === 'ArrowDown')  { orb.dy =  ORB_SPEED; orb.dx = 0; }
  if (e.key === 'ArrowLeft')  { orb.dx = -ORB_SPEED; orb.dy = 0; }
  if (e.key === 'ArrowRight') { orb.dx =  ORB_SPEED; orb.dy = 0; }
});

let touchStart = null;

function getTouchPos(e) {
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  touchStart = getTouchPos(e);
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!touchStart) return;
  const pos = getTouchPos(e);
  const dx = pos.x - touchStart.x;
  const dy = pos.y - touchStart.y;
  const mag = Math.hypot(dx, dy) || 1;
  orb.dx = (dx / mag) * ORB_SPEED;
  orb.dy = (dy / mag) * ORB_SPEED;
});

canvas.addEventListener('touchend', () => {
  orb.dx = 0;
  orb.dy = 0;
  touchStart = null;
});

// ---------- FUNCTIONS ----------
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function closeLoopIfReturnedToCamp() {
  if (orb.trail.length > 10 && distance(orb, camp) <= CAMP_RADIUS) {
    camp.territory.push([...orb.trail]);
    orb.trail = [];
  }
}

function checkCollisions() {
  // Self collision
  for (let i = 0; i < orb.trail.length - 10; i++) {
    if (distance(orb, orb.trail[i]) < ORB_RADIUS) {
      orb.trail = [];
      orb.energy = 0;
      orb.x = canvas.width / 2;
      orb.y = canvas.height / 2;
      orb.dx = 0;
      orb.dy = 0;
      break;
    }
  }
  // NPC collision
  npcs.forEach(npc => {
    if (distance(orb, npc) < ORB_RADIUS * 2) {
      orb.energy = Math.max(0, orb.energy - 1);
    }
  });
}

function moveNPCs() {
  npcs.forEach(npc => {
    npc.x += npc.dx;
    npc.y += npc.dy;

    if (npc.x < 0 || npc.x > canvas.width) npc.dx *= -1;
    if (npc.y < 0 || npc.y > canvas.height) npc.dy *= -1;

    npc.trail.push({ x: npc.x, y: npc.y });
    if (npc.trail.length > 100) npc.trail.shift();
  });
}

function saveEnergy() {
  localStorage.setItem('campEnergy', camp.energy);
}

// ---------- UPDATE ----------
function update() {
  orb.x += orb.dx;
  orb.y += orb.dy;

  if (distance(orb, camp) > CAMP_RADIUS) {
    orb.trail.push({ x: orb.x, y: orb.y });
    if (orb.trail.length > 200) orb.trail.shift();
  }

  nodes.forEach(n => {
    if (!n.collected && distance(orb, n) < ORB_RADIUS + NODE_RADIUS) {
      n.collected = true;
      orb.energy++;
    }
  });

  if (distance(orb, camp) <= CAMP_RADIUS && orb.energy > 0) {
    camp.energy += orb.energy;
    orb.energy = 0;
    saveEnergy();
  }

  closeLoopIfReturnedToCamp();
  checkCollisions();
  moveNPCs();
}

// ---------- DRAW ----------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Camp territory
  ctx.fillStyle = 'rgba(0,200,200,0.1)';
  camp.territory.forEach(loop => {
    ctx.beginPath();
    loop.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
  });

  // Camp
  ctx.fillStyle = 'gray';
  ctx.beginPath();
  ctx.arc(camp.x, camp.y, CAMP_RADIUS, 0, Math.PI * 2);
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
  ctx.strokeStyle = orb.color;
  ctx.lineWidth = TRAIL_WIDTH;
  ctx.beginPath();
  orb.trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.stroke();

  // NPCs
  npcs.forEach(npc => {
    ctx.strokeStyle = npc.color;
    ctx.lineWidth = TRAIL_WIDTH;
    ctx.beginPath();
    npc.trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();

    ctx.fillStyle = npc.color;
    ctx.beginPath();
    ctx.arc(npc.x, npc.y, ORB_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  });

  // Orb
  ctx.fillStyle = orb.color;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, ORB_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // HUD
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial'; // readable size
  ctx.fillText(`Orb Energy: ${orb.energy}`, 10, canvas.height - 30);
  ctx.fillText(`Camp Energy: ${camp.energy}`, canvas.width - 150, canvas.height - 30);
}

// ---------- LOOP ----------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
