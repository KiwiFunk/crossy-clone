
import Player from './player.js';
import { TerrainGenerator } from './terrain.js';
import Camera from './camera.js';
import ScoreManager from './scoring.js'


// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 1000;

// Initialize dependencies
let terrainGenerator = new TerrainGenerator(canvas);
let camera = new Camera();
let scoreManager = new ScoreManager();

// Global game variables
let player = new Player(300, 550);
let keys = {};

// Generate the inital terrain
terrainGenerator.generateInitialTerrain();

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

    // Update the camera (follow player)
    const playerDied = camera.update(player, canvas.height);
    if (playerDied) {
        // Handle player death (e.g., restart game, show game over screen)
        console.log("Player has died");
    }

    // Update the terrain (Procedural Gen)
    terrainGenerator.update(camera);

    // Update the score
    scoreManager.update(player);

    // Keep player in bounds (relative to camera)
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(camera.y, Math.min(camera.y + canvas.height - player.size, player.y));


    // Get obstacles from the generated terrain
    const obstacles = terrainGenerator.rows.flatMap(row => row.obstacles);

    // Check for collisions
    if (player.checkCollision(obstacles)) {
        console.log("Collision detected!");
        // Add game over logic here
    }

    // Apply camera transform and draw
    camera.apply(ctx);
    terrainGenerator.draw(ctx);
    player.draw(ctx);
    camera.restore(ctx);

    // Draw UI (score) without camera transform
    scoreManager.draw(ctx, canvas.width, canvas.height, camera);

    requestAnimationFrame(gameLoop);
}

// Initialize
gameLoop();