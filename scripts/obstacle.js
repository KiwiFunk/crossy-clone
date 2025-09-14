import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/loaders/GLTFLoader.js';

class Obstacle {
    constructor(scene, x, y, z, direction = 'left') {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.z = z;
        this.speed = null;
        this.direction = direction; // 'left' or 'right'
        this.mesh = null;
        this.isLoaded = false;
        this.modelPath = null;      // Set path in child class
        this.modelScale = 0.2;
        this.boundingBox = null;    // For collision detection
        this.type = 'obstacle';     // Default type
        this.sound = null;          // Placeholder for sound effect (e.g Car horn)
    }

    // Use static as the utility is not tied to instance. We want to call it before creating instances. (during the constructor)
    static getRandomSpeed(min, max) {
        return Math.random() * (max - min) + min;
    }

    update(canvasWidth) {
        this.move(canvasWidth);
    }

    move(canvasWidth, speed=this.speed) {
        if (this.direction === 'right') {
            this.x += speed;
            if (this.x > canvasWidth) this.x = -this.width;
        } else {
            this.x -= speed;
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