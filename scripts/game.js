// Imports
import Obstacle from './obstacle.js';
import Car from './obstacles/car.js';
import Truck from './obstacles/truck.js';
import Train from './obstacles/train.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let obstacles = [];
let player = { x: 400, y: 550, width: 20, height: 20 }; // Simple player

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw obstacles
    obstacles.forEach(ob => {
        ob.move();
        ob.draw(ctx);
    });
    
    // Draw player
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Handle input (e.g., arrow keys for movement)
    // Add collision checks here
    
    requestAnimationFrame(gameLoop);
}

// Initialize
obstacles.push(new Train(0, 100));
gameLoop();