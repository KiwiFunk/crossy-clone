import { GRID_SIZE } from './config.js';

class Obstacle {
    constructor(x, y, width = GRID_SIZE, height = GRID_SIZE, direction = 'left') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = null;
        this.direction = direction; // 'left' or 'right'
        // Placeholder for image/audio
        this.sprite = null;
        this.sound = null;
    }

    // Use static as the utility is not tied to instance. We want to call it before creating instances. (during the constructor)
    static getRandomSpeed(min, max) {
        return Math.random() * (max - min) + min;
    }

    update(canvasWidth) {
        this.move(canvasWidth);
    }

    move(canvasWidth) {
        if (this.direction === 'right') {
            this.x += this.speed;
            if (this.x > canvasWidth) this.x = -this.width;
        } else {
            this.x -= this.speed;
            if (this.x < -this.width) this.x = canvasWidth;
        }
    }

    draw(ctx) {
        // Simple rectangle for now; override for sprites
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    destroy() {
        // Cleanup logic, e.g., remove from game when off screen
        console.log('Obstacle destroyed');
    }
}

export default Obstacle;