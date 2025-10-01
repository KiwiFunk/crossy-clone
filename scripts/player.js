import Mesh from './mesh.js';
import * as THREE from 'three';
import { CONFIG } from './config.js';

export default class Player extends Mesh {
    constructor(scene) {
        const startY = CONFIG.PLAYER_SIZE / 2;
        super(scene, 0, startY, 0);

        this.size = CONFIG.PLAYER_SIZE;
        this.gridPosition = { x: 0, y: 0, z: 0 };
        this.targetPosition = new THREE.Vector3(0, startY, 0);

        // State Tracking
        this.isMoving = false;
        this.isJumping = false;
        this.verticalState = 'ON_GROUND';   // 'ON_GROUND'. 'ON_PLATFORM', 'JUMPING'
        this.currentSurface = null;
        this.lastPosition = { ...this.gridPosition };
        this.currentPlatform = null;        // Track current platform 

        // Create player mesh
        this.createMesh();
        this.updateBoundingBox();
    }

    createMesh() {
        const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        const material = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.PLAYER });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.targetPosition);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }

    move(direction) {
        if (this.isMoving) return;

        this.isMoving = true;
        this.isJumping = true;
        this.lastPosition = { ...this.gridPosition };

        switch (direction) {
            case 'forward': this.gridPosition.z -= 1; break;
            case 'backward': this.gridPosition.z += 1; break;
            case 'left': this.gridPosition.x -= 1; break;
            case 'right': this.gridPosition.x += 1; break;
        }

        this.targetPosition.set(
            this.gridPosition.x * CONFIG.TILE_SIZE,
            this.targetPosition.y,
            this.gridPosition.z * CONFIG.TILE_SIZE
        );

        this.jumpAnimation(() => {
            this.isMoving = false;
        });

        return {
            previousPosition: { ...this.lastPosition },
            newPosition: { ...this.gridPosition }
        };
    }

    jumpAnimation(callback) {
        const jumpHeight = this.size * CONFIG.PLAYER_JUMP_HEIGHT;
        const jumpDuration = CONFIG.PLAYER_MOVE_SPEED;
        const startTime = Date.now();
        const startY = this.mesh.position.y;
        const startPos = this.mesh.position.clone();
        const target = this.targetPosition.clone();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / jumpDuration, 1);

            this.mesh.position.x = startPos.x + (target.x - startPos.x) * progress;
            this.mesh.position.z = startPos.z + (target.z - startPos.z) * progress;

            this.mesh.position.y = progress <= 0.5
                ? startY + jumpHeight * (progress * 2)
                : startY + jumpHeight * (2 - progress * 2);

            this.mesh.rotation.y = Math.atan2(
                target.x - startPos.x,
                target.z - startPos.z
            );

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isJumping = false;
                if (callback) callback();
            }
        };

        animate();
    }

    update() {
        if (!this.isJumping) {
            this.mesh.position.y = this.targetPosition.y +
                Math.sin(Date.now() / 500) * 0.05;
        }

        this.updateBoundingBox();
    }

    /**
     * Check for collisions with obstacles using AABB.
     * If the obstacle is flagged as a platform, ride it, else return a boolean.
     * Called from the main game.js update loop
     * @param {*} obstacles 
     * @returns {boolean} True if collision detected, else false
     */
    checkCollisions(obstacles) {

        let platformThisFrame = null;

        for (const obstacle of obstacles) {
            if (!obstacle.isLoaded || !obstacle.boundingBox) continue;

            if (this.boundingBox.intersectsBox(obstacle.boundingBox)) {

                // If the intersecting obstacle has the isMovingPlatform flag, ride it
                if (obstacle.isMovingPlatform && typeof obstacle.getMovementDelta === 'function') {

                    // Set this platform as the current platform
                    platformThisFrame = obstacle;

                    // Ride the platform
                    const delta = obstacle.getMovementDelta();
                    this.mesh.position.add(delta);
                    this.updateBoundingBox();
                    this.gridPosition.x = Math.round(this.mesh.position.x / CONFIG.TILE_SIZE);
                } else {
                    // Trigger game over
                    console.log("Game Over: collided with obstacle");
                    return true;
                }
            }
        }

        // TRIGGER HOOKS
        if (platformThisFrame !== this.currentPlatform) {
            // The platform has changed!

            // If we were on a platform before, trigger its 'onPlayerExit' hook.
            if (this.currentPlatform && this.currentPlatform.triggerHook) {
                this.currentPlatform.triggerHook('onPlayerExit');
            }

            // If we are on a new platform now, trigger its 'onPlayerEnter' hook.
            if (platformThisFrame && platformThisFrame.triggerHook) {
                platformThisFrame.triggerHook('onPlayerEnter', this); // Pass the player as data
            }

            // Update the current platform for the next frame.
            this.currentPlatform = platformThisFrame;
        }

        // No collision, return false
        return false;
    }

    resetPlayerPosition() {
        this.gridPosition = { x: 0, y: 0, z: 0 };
        this.targetPosition.set(0, CONFIG.PLAYER_SIZE / 2, 0);
        this.mesh.position.copy(this.targetPosition);
        this.isMoving = false;
        this.isJumping = false;
    }

}