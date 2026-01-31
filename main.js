// ---------- CONFIG ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// IMPORTANT: size canvas FIRST
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ORB_RADIUS = 10;
const TRAIL_WIDTH = 4;
const NODE_RADIUS = 6;
const CAMP_RADIUS = 40;
const ORB_SPEED = 2;

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
    energy: 0
};

let nodes = [];
for (let i = 0; i < 20; i++) {
    nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        collected: false
    });
}

// ---------- INPUT (KEYBOARD) ----------
document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp': orb.dy = -ORB_SPEED; orb.dx = 0; break;
        case 'ArrowDown': orb.dy = ORB_SPEED; orb.dx = 0; break;
        case 'ArrowLeft': orb.dx = -ORB_SPEED; orb.dy = 0; break;
        case 'ArrowRight': orb.dx = ORB_SPEED; orb.dy = 0; break;
    }
});

// ---------- TOUCH INPUT ----------
let touchStart = null;

function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    return {
        x: t.clientX - rect.left,
        y: t.clientY - rect.top
    };
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

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    orb.dx = 0;
    orb.dy = 0;
    touchStart = null;
});

// ---------- FUNCTIONS ----------
function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function respawnOrb() {
    orb.x = canvas.width / 2;
    orb.y = canvas.height / 2;
    orb.dx = 0;
    orb.dy = 0;
    orb.trail = [];
    orb.energy = 0;
}

function update() {
    orb.x += orb.dx;
    orb.y += orb.dy;

    // leave trail outside camp
    if (distance(orb, camp) > CAMP_RADIUS) {
        orb.trail.push({ x: orb.x, y: orb.y });
        if (orb.trail.length > 200) orb.trail.shift();
    }

    // collect nodes
    nodes.forEach(n => {
        if (!n.collected && distance(orb, n) < ORB_RADIUS + NODE_RADIUS) {
            n.collected = true;
            orb.energy += 1;
        }
    });

    // deposit energy
    if (distance(orb, camp) <= CAMP_RADIUS && orb.energy > 0) {
        camp.energy += orb.energy;
        orb.energy = 0;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // camp
    ctx.fillStyle = 'gray';
    ctx.beginPath();
    ctx.arc(camp.x, camp.y, CAMP_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // nodes
    nodes.forEach(n => {
        if (!n.collected) {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // trail
    ctx.strokeStyle = orb.color;
    ctx.lineWidth = TRAIL_WIDTH;
    ctx.beginPath();
    orb.trail.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // orb
    ctx.fillStyle = orb.color;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, ORB_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Orb Energy: ${orb.energy}`, 10, 20);
    ctx.fillText(`Camp Energy: ${camp.energy}`, 10, 40);
}

// ---------- LOOP ----------
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();


