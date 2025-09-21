import * as THREE from 'three';
import { CONFIG } from './config.js';

export default class Player {
    constructor(scene) {
        this.scene = scene;
        this.gridPosition = { x: 0, y: 0, z: 0 };
        this.targetPosition = new THREE.Vector3(0, CONFIG.PLAYER_SIZE/2, 0);
        this.size = CONFIG.PLAYER_SIZE;
        this.isMoving = false;
        this.isJumping = false;
        this.createMesh();
    }

    // Simple cube as test - replace with model later
    createMesh() {
        const bodyGeometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.PLAYER });
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

        // Use consistent spacing from config
        this.targetPosition = new THREE.Vector3(
            this.gridPosition.x * CONFIG.TILE_SIZE,
            this.targetPosition.y,
            this.gridPosition.z * CONFIG.TILE_SIZE
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
        const jumpHeight = this.size * CONFIG.PLAYER_JUMP_HEIGHT;
        const jumpDuration = CONFIG.PLAYER_MOVE_SPEED;
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

    update() {
        // Check if player is on a log and move with it
        this.checkLogInteraction();

        // Add idle animation
        if (!this.isJumping) {
            this.body.position.y = this.targetPosition.y + 
                Math.sin(Date.now() / 500) * 0.05;
        }
    }
    
    getPosition() {
        return this.gridPosition;
    }
    
    checkCollision(obstacles) {
        if (!this.body) return false;
        
        // Create player bounding box
        const playerBox = new THREE.Box3().setFromObject(this.body);
        
        for (const obstacle of obstacles) {
            // Skip obstacles without a valid mesh
            if (!obstacle.mesh || !obstacle.mesh.parent) continue;
            
            try {
                // Attempt to create obstacle bounding box
                const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh);
                if (playerBox.intersectsBox(obstacleBox)) {
                    return true;
                }
            } catch (error) {
                console.warn('Collision check failed for obstacle:', obstacle);
                // Skip this obstacle if there was an error
                continue;
            }
        }
        
        return false;
    }

    checkLogInteraction() {
        let isOnAnyLog = false;
        let currentLog = null;
        
        // Get player's feet position
        const playerFeet = new THREE.Vector3(
            this.body.position.x,
            this.body.position.y - (this.size/2) - 0.1, // Slightly below player's bottom
            this.body.position.z
        );
        
        // Check all obstacles in the scene
        this.scene.children.forEach(child => {
            // Only check log objects that have bounding boxes
            if (child.userData && 
                child.userData.type === 'obstacle' &&
                child.userData.obstacle &&
                child.userData.obstacle.type === 'log' &&
                child.userData.obstacle.boundingBox) {
                
                const log = child.userData.obstacle;
                
                // Expand the box slightly upward to make detection easier
                const expandedBox = log.boundingBox.clone();
                expandedBox.max.y += 0.2;
                
                // Check if player is on this log
                if (expandedBox.containsPoint(playerFeet) && !this.isJumping) {
                    isOnAnyLog = true;
                    currentLog = log;
                    
                    // Tell log the player is on it (if not already)
                    if (this.currentLog !== log) {
                        if (this.currentLog) {
                            this.currentLog.playerLeft();
                        }
                        log.playerLanded();
                        this.currentLog = log;
                    }
                    
                    // Get carried by the log
                    log.carryPlayer(this);
                }
            }
        });
        
        // Player jumped off or moved off the log
        if (!isOnAnyLog && this.currentLog) {
            this.currentLog.playerLeft();
            this.currentLog = null;
        }
    }
}