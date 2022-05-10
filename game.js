const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const playerPoints = document.querySelector('#player-points');
const hiScore = document.querySelector('#high-score');
const btn = document.querySelector('button');
const container = document.querySelector('#container');
const finalScore = document.querySelector('#final-score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const friction = 0.99;

class Particles {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

// Creates constants to pass into Player class to draw in the middle of the screen
const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 15, 'rgb(242, 242, 242)');
let projectiles = [];
let enemies = [];
let particles = [];

function init() {
    player = new Player(x, y, 15, 'rgb(242, 242, 242)');
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    playerPoints.innerHTML = score;
    finalScore.innerHTML = score;
}

function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (30 - 6) + 6;

        let x;
        let y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const color = `hsl(${Math.random() * 360}, 75%, 50%)`;

        const angle = Math.atan2(
            (canvas.height / 2) - y,
            (canvas.width / 2) - x
        );

        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };

        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000);
}

let animationId;
let score = 0;
let highScore = 0;

function animate() {
    animationId = requestAnimationFrame(animate);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();

    particles.forEach((particle, index) => {

        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        };

        particle.update();
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();

        // Removes extra projectiles from beyond edges of the window
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1)
            })
        }
    })

    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        // Ends game if enemy touches player
        if (distance - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            container.style.display = 'flex';
            finalScore.innerHTML = score;
            hiScore.innerHTML = score + highScore;
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // When projectile hits enemy
            if (distance - enemy.radius - projectile.radius < 1) {

                // Bursting particle effect whenever player hits enemy
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particles(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }));
                };

                // Clears projectile on enemy hit
                if (enemy.radius - 10 > 5) {
                    enemy.radius -= 10

                    // Increase player score on each hit
                    score += 100;
                    playerPoints.innerHTML = score;

                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                } else {

                    // Increase player score more on enemy elimination
                    score += 250;
                    playerPoints.innerHTML = score;

                    setTimeout(() => { //Eliminates enemy on hit
                        enemies.splice(enemyIndex, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }

            }
        })
    })
}

// Create player projectiles (laser beams), dependent on where user clicks
window.addEventListener('click', e => {

    // Dynamically calculates the angle from position of click relative to player position
    const angle = Math.atan2(
        e.clientY - canvas.height / 2,
        e.clientX - canvas.width / 2
    );

    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }

    projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, 'rgb(242, 242, 242)', velocity));
})

window.addEventListener('touchstart', e => {

    // Dynamically calculates the angle from position of click relative to player position
    const angle = Math.atan2(
        e.clientY - canvas.height / 2,
        e.clientX - canvas.width / 2
    );

    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }

    projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, 'rgb(242, 242, 242)', velocity));
})

btn.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();

    container.style.display = 'none';
});