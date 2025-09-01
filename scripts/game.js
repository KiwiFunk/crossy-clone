// Imports
import Obstacle from './obstacle.js';
import Car from './obstacles/car.js';
import Truck from './obstacles/truck.js';
import Train from './obstacles/train.js';
import Player from './player.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let obstacles = [];
let player = new Player(400, 550);
let keys = {};

// Handle keyboard input
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Handle player movement (grid-based, e.g., 20px steps)
    if (keys['ArrowUp']) player.move('up', canvas.width, canvas.height);
    if (keys['ArrowDown']) player.move('down', canvas.width, canvas.height);
    if (keys['ArrowLeft']) player.move('left', canvas.width, canvas.height);
    if (keys['ArrowRight']) player.move('right', canvas.width, canvas.height);

    // Reset keys to prevent continuous movement
    keys = {};

    // Draw player using its method
    player.draw(ctx);

    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - 20, player.x));
    player.y = Math.max(0, Math.min(canvas.height - 20, player.y));

    // Update and draw obstacles
    obstacles.forEach((ob, index) => {
        ob.move();
        ob.draw(ctx);

        // Remove off-screen obstacles
        if (ob.x > canvas.width) {
            obstacles.splice(index, 1);
            ob.destroy();
        }

        // Collision detection (simple AABB)
        if (player.x < ob.x + 20 && player.x + 20 > ob.x &&
            player.y < ob.y + 20 && player.y + 20 > ob.y) {
            console.log('Collision! Game over.');
            // Add game over logic here
        }
    });

    // Draw player
    ctx.fillRect(player.x, player.y, 20, 20);

    // Spawn new obstacles periodically
    if (Math.random() < 0.01) {
        const types = [Car, Truck, Train];
        const Type = types[Math.floor(Math.random() * types.length)];
        obstacles.push(new Type(0, Math.random() * canvas.height));
    }

    requestAnimationFrame(gameLoop);
}

// Initialize
obstacles.push(new Train(0, 100));
gameLoop();