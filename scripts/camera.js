import * as THREE from 'three';
import { GRID_SIZE } from './config.js';

export default class Camera {
    constructor(threeCamera, player) {
        this.threeCamera = threeCamera;  // Store reference to the Three.js camera
        this.player = player;            // Store reference to player
        
        // Camera follow settings
        this.offset = new THREE.Vector3(8, 10, 8);  // Isometric offset from player
        this.target = new THREE.Vector3();          // Target to look at
        
        // Camera push settings
        this.pushSpeed = 0.02;           // How fast camera pushes forward
        this.followSpeed = 0.05;         // How smooth camera follows player
        
        // Death zone - how far the player can fall behind
        this.maxBehindDistance = 15;
    }
    
    update() {
        if (!this.player || !this.player.body) return false;
        
        // Get player position
        const playerPos = this.player.body.position.clone();
        
        // Update target position based on player (with some smoothing)
        this.target.lerp(playerPos, this.followSpeed);
        
        // Add a small forward push (decrease z)
        this.target.z -= this.pushSpeed;
        
        // Calculate camera position with offset
        const cameraPos = this.target.clone().add(this.offset);
        
        // Update camera position and orientation
        this.threeCamera.position.copy(cameraPos);
        this.threeCamera.lookAt(this.target);
        
        // Check if player has fallen too far behind (death condition)
        const distanceBehind = playerPos.z - this.target.z;
        if (distanceBehind > this.maxBehindDistance) {
            return true; // Player died (fell behind)
        }
        
        return false;
    }
    
    // Method to get the current target position (useful for debugging)
    getTargetPosition() {
        return this.target.clone();
    }
    
    // Method to get the current z value (useful for scoring)
    getZPosition() {
        return this.target.z;
    }
}