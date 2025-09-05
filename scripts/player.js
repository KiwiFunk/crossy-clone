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

    move(direction) {
        if (this.isMoving) return; // Prevent rapid moves
        this.isMoving = true;
        this.isJumping = true;

        // Store last position (using spread)
        this.lastPosition = { ...this.gridPosition };

        // Update grid position based on direction
        switch (direction) {
            case 'forward':
                this.gridPosition.z -= 1;
                break;
            case 'backward':
                this.gridPosition.z += 1;
                break;
            case 'left':
                this.gridPosition.x -= 1;
                break;
            case 'right':
                this.gridPosition.x += 1;
                break;
        }

        // Calculate new target position
        this.targetPosition = new THREE.Vector3(
            this.gridPosition.x * (this.size * 2), 
            this.targetPosition.y,
            this.gridPosition.z * (this.size * 2)
        );

        // Animate the jump (Pass function as callback to reset isMoving)
        this.jumpAnimation(() => {
            this.isMoving = false;
        });
        
        return {
            previousPosition,
            newPosition: { ...this.gridPosition }
        };
    }
    
    // Refactor to make callback mandatory?
    jumpAnimation(callback) {
        const jumpHeight = this.size * 1.5;
        const jumpDuration = 200; // ms
        const startTime = Date.now();
        const startY = this.body.position.y;
        const jumpTarget = this.targetPosition.clone();
        const startPosition = this.body.position.clone();
        
        const animateJump = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / jumpDuration, 1);
            
            // Interpolate position
            this.body.position.x = startPosition.x + (jumpTarget.x - startPosition.x) * progress;
            this.body.position.z = startPosition.z + (jumpTarget.z - startPosition.z) * progress;
            
            // Add jump arc
            if (progress <= 0.5) {
                this.body.position.y = startY + jumpHeight * (progress * 2);
            } else {
                this.body.position.y = startY + jumpHeight * (2 - progress * 2);
            }
            
            // Rotate based on direction
            this.body.rotation.y = Math.atan2(
                jumpTarget.x - startPosition.x,
                jumpTarget.z - startPosition.z
            );
            
            if (progress < 1) {
                requestAnimationFrame(animateJump);
            } else {
                this.isJumping = false;
                if (callback) callback();
            }
        };
        
        animateJump();
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