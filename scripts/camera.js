import * as THREE from 'three';
import { CONFIG } from './config.js';

export default class Camera {
    constructor(threeCamera, player) {
        this.threeCamera = threeCamera;
        this.player = player;
        
        // Position offsets (relative to player)
        this.posY = CONFIG.CAMERA_POS_Y;         // Height above player
        this.posZ = CONFIG.CAMERA_POS_Z;         // Distance behind player
        this.posX = CONFIG.CAMERA_POS_X;         // Side offset from player
        
        // Rotation angles
        this.rotX = CONFIG.CAMERA_ROT_X;         // Look down angle
        this.rotY = CONFIG.CAMERA_ROT_Y;         // Y-axis rotation for isometric feel
        this.rotZ = CONFIG.CAMERA_ROT_Z;         // Z-axis rotation (roll)
        
        this.followSpeed = CONFIG.CAMERA_FOLLOW_SPEED;
        this.maxBehindDistance = CONFIG.DEATH_ZONE_DISTANCE;
    }
    
    update() {
        if (!this.player || !this.player.body) return false;
        
        // Get player position
        const playerPos = this.player.body.position.clone();
        
        // Calculate camera position
        const cameraX = playerPos.x + this.posX;
        const cameraY = playerPos.y + this.posY;
        const cameraZ = playerPos.z + this.posZ;
        
        // Smooth camera movement
        this.threeCamera.position.lerp(new THREE.Vector3(cameraX, cameraY, cameraZ), this.followSpeed);
        
        // Set camera rotation
        this.threeCamera.rotation.set(
            -this.rotX,  // X rotation (looking down)
            -this.rotY,  // Y rotation (diagonal view)
            -this.rotZ   // Z rotation (roll)
        );
        
        // Check if player has fallen too far behind
        const distanceBehind = playerPos.z - (this.threeCamera.position.z - this.posZ);
        if (distanceBehind > this.maxBehindDistance) {
            return true; // Player died
        }
        
        return false;
    }
    
    getTargetPosition() {
        return new THREE.Vector3(
            this.threeCamera.position.x - this.posX,
            this.threeCamera.position.y - this.posY,
            this.threeCamera.position.z - this.posZ
        );
    }
    
    getZPosition() {
        return this.threeCamera.position.z - this.posZ;
    }
}