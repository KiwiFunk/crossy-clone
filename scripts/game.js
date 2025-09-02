// Imports
import Obstacle from './obstacle.js';
import Car from './obstacles/car.js';
import Truck from './obstacles/truck.js';
import Train from './obstacles/train.js';
import Player from './player.js';
import { TerrainGenerator } from './terrain.js';
import Camera from './camera.js';
import ScoreManager from './scoring.js'
import { GRID_SIZE } from './config.js';

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Initialize dependencies
let terrainGenerator = new TerrainGenerator(canvas);
let camera = new Camera();
let scoreManager = new ScoreManager();

// Global game variables
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
    if (keys['ArrowUp'] || keys['W'] || keys['w']) player.move('up', canvas.width, canvas.height);
    if (keys['ArrowDown'] || keys['S'] || keys['s']) player.move('down', canvas.width, canvas.height);
    if (keys['ArrowLeft'] || keys['A'] || keys['a']) player.move('left', canvas.width, canvas.height);
    if (keys['ArrowRight'] || keys['D'] || keys['d']) player.move('right', canvas.width, canvas.height);

    // Reset keys to prevent continuous movement
    keys = {};

    // Update and draw terrain
    terrainRows.forEach(row => {
        row.update(canvas.width);
        row.draw(ctx, canvas.width);
    });

    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - 20, player.x));
    player.y = Math.max(0, Math.min(canvas.height - 20, player.y));

    // Update obstacles (from terrain)
    obstacles = terrainRows.flatMap(row => row.obstacles);

    // Check for collisions
    if (player.checkCollision(obstacles)) {
        console.log("Collision detected!");
        // Add game over logic here
    }

    // Draw player
    player.draw(ctx);

    // Spawn new obstacles periodically
    if (Math.random() < 0.01) {
        const types = [Car, Truck, Train];
        const Type = types[Math.floor(Math.random() * types.length)];
        const y = Math.floor(Math.random() * (canvas.height / GRID_SIZE)) * GRID_SIZE;
        const direction = Math.random() > 0.5 ? 'left' : 'right';
        const x = direction === 'left' ? canvas.width : -GRID_SIZE*2;
        obstacles.push(new Type(x, y, undefined, undefined, undefined, direction));
    }

    requestAnimationFrame(gameLoop);
}

// Initialize
gameLoop();