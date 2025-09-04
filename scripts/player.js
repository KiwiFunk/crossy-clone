import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { GRID_SIZE } from './config.js';

export default class Player {
    constructor(scene) {
        this.scene = scene;
        this.gridPosition = { x: 0, y: 0, z: 0 };
        this.targetPosition = new THREE.Vector3(0, GRID_SIZE/2, 0);
        this.size = GRID_SIZE;
        this.isMoving = false;
        this.isJumping = false;
        this.createMesh();
    }

    // Simple cube as test - replace with model later
    createMesh() {
        const bodyGeometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.copy(this.targetPosition);
        this.body.castShadow = true;
        this.scene.add(this.body);
    }

    move(direction, canvasWidth, canvasHeight) {
        if (this.isMoving) return; // Prevent rapid moves
        this.isMoving = true;
        
        // Grid-based movement
        switch (direction) {
            case 'up':
                this.y -= GRID_SIZE;
                break;
            case 'down':
                this.y = Math.min(canvasHeight - GRID_SIZE * 2, this.y + GRID_SIZE);
                break;
            case 'left':
                this.x = Math.max(0, this.x - GRID_SIZE);
                break;
            case 'right':
                this.x = Math.min(canvasWidth - this.size, this.x + GRID_SIZE);
                break;
        }
        
        // Simple animation: change color briefly
        this.color = 'green';
        setTimeout(() => {
            this.color = 'blue';
            this.isMoving = false;
        }, 100);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    // Use AABB for collision detection
    checkCollision(obstacles) {
        for (let obstacle of obstacles) {
            if (this.x < obstacle.x + obstacle.width &&
                this.x + this.size > obstacle.x &&
                this.y < obstacle.y + obstacle.height &&
                this.y + this.size > obstacle.y) {
                return true;
            }
        }
        return false;
    }
}