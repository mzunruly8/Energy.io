// ---------- CONFIG ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const ORB_RADIUS = 10;
const TRAIL_WIDTH = 4;
const NODE_RADIUS = 6;
const CAMP_RADIUS = 40;
const ORB_SPEED = 2;

// ---------- GAME STATE ----------
let orb = {
    x: canvas.width/2,
    y: canvas.height/2,
    dx: 0,
    dy: 0,
    color: 'cyan',
    trail: [],
    energy: 0
};

let camp = {
    x: canvas.width/2,
    y: canvas.height - 50,
    radius: CAMP_RADIUS,
    energy: 0
};

let nodes = [];
for (let i = 0; i < 20; i++) {
    nodes.push({
        x: Math.random()*(canvas.width-20)+10,
        y: Math.random()*(canvas.height-20)+10,
        collected: false
    });
}

// ---------- INPUT ----------
document.addEventListener('keydown', e => {
    switch(e.key) {
        case 'ArrowUp': orb.dy = -ORB_SPEED; orb.dx = 0; break;
        case 'ArrowDown': orb.dy = ORB_SPEED; orb.dx = 0; break;
        case 'ArrowLeft': orb.dx = -ORB_SPEED; orb.dy = 0; break;
        case 'ArrowRight': orb.dx = ORB_SPEED; orb.dy = 0; break;
    }
});

// ---------- FUNCTIONS ----------
function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function respawnOrb() {
    orb.x = canvas.width/2;
    orb.y = canvas.height/2;
    orb.dx = 0;
    orb.dy = 0;
    orb.trail = [];
    orb.energy = 0;
}

function update() {
    // Move orb
    orb.x += orb.dx;
    orb.y += orb.dy;

    // Leave trail if outside camp
    if(distance(orb, camp) > CAMP_RADIUS){
        orb.trail.push({x: orb.x, y: orb.y});
        if(orb.trail.length > 200) orb.trail.shift(); // keep trail manageable
    }

    // Collect nodes
    nodes.forEach(n => {
        if(!n.collected && distance(orb, n) < ORB_RADIUS + NODE_RADIUS){
            n.collected = true;
            orb.energy += 1;
        }
    });

    // Deposit energy in camp
    if(distance(orb, camp) <= CAMP_RADIUS && orb.energy > 0){
        camp.energy += orb.energy;
        orb.energy = 0;
    }

    // TODO: Add trail collision detection here in next layer
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Draw camp
    ctx.fillStyle = 'gray';
    ctx.beginPath();
    ctx.arc(camp.x, camp.y, CAMP_RADIUS, 0, Math.PI*2);
    ctx.fill();

    // Draw nodes
    nodes.forEach(n => {
        if(!n.collected){
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI*2);
            ctx.fill();
        }
    });

    // Draw trail
    ctx.strokeStyle = orb.color;
    ctx.lineWidth = TRAIL_WIDTH;
    ctx.beginPath();
    for(let i=0;i<orb.trail.length;i++){
        let p = orb.trail[i];
        if(i===0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Draw orb
    ctx.fillStyle = orb.color;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, ORB_RADIUS, 0, Math.PI*2);
    ctx.fill();

    // Draw HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Orb Energy: ${orb.energy}`, 10, 20);
    ctx.fillText(`Camp Energy: ${camp.energy}`, 10, 40);
}

// ---------- GAME LOOP ----------
function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
let touchStart = null;
canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener('touchmove', e => {
    if (!touchStart) return;
    const t = e.touches[0];

    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;

    const mag = Math.hypot(dx, dy) || 1;
    orb.dx = (dx / mag) * ORB_SPEED;
    orb.dy = (dy / mag) * ORB_SPEED;
});

canvas.addEventListener('touchend', () => {
    orb.dx = 0;
    orb.dy = 0;
    touchStart = null;
});
