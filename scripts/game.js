// Imports
import Obstacle from './obstacle.js';
import Car from './obstacles/car.js';
import Truck from './obstacles/truck.js';
import Train from './obstacles/train.js';
import Player from './player.js';
import { TerrainRow } from './terrain.js';
import { GRID_SIZE } from './config.js';

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let obstacles = [];
let terrainRows = [];
let player = new Player(400, 550);
let keys = {};

// Generate level (example: grass, road, river)
function initTerrain() {
    terrainRows = [
        new TerrainRow(0, 'grass'),
        new TerrainRow(GRID_SIZE, 'road', [new Car(0, GRID_SIZE, 40, GRID_SIZE, 2, 'right')]),
        new TerrainRow(GRID_SIZE * 2, 'river'),
        // Eventually procedurally generate more rows as the player moves up
    ];
}
initTerrain();

// Handle keyboard input
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Handle player movement
    if (keys['ArrowUp']) player.move('up', canvas.width, canvas.height);
    if (keys['ArrowDown']) player.move('down', canvas.width, canvas.height);
    if (keys['ArrowLeft']) player.move('left', canvas.width, canvas.height);
    if (keys['ArrowRight']) player.move('right', canvas.width, canvas.height);

    // Reset keys to prevent continuous movement
    keys = {};

    // Update and draw terrain
    terrainRows.forEach(row => {
        row.update(canvas.width);
        row.draw(ctx, canvas.width);
    });

    // Draw player using its method
    player.draw(ctx);

    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - 20, player.x));
    player.y = Math.max(0, Math.min(canvas.height - 20, player.y));

    // Update obstacles (from terrain)
    obstacles = terrainRows.flatMap(row => row.obstacles);

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