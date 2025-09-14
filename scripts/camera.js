import * as THREE from 'three';
import { CONFIG } from './config.js';

export default class Camera {
    constructor(threeCamera, player) {
        this.threeCamera = threeCamera;                 // Store reference to the Three.js camera
        this.player = player;                           // Store reference to player
        
        // Camera follow settings
        this.height = CONFIG.CAMERA_HEIGHT;
        this.distanceBehind = CONFIG.CAMERA_BACK;
        this.lookDownAngle = CONFIG.CAMERA_LOOK_DOWN_ANGLE;

        // Camera Y rotation
        this.sideOffset = CONFIG.CAMERA_OFFSET;
        this.yRotation = CONFIG.CAMERA_Y_ROTATION;
        

        this.followSpeed = CONFIG.CAMERA_FOLLOW_SPEED;   
        this.maxBehindDistance = CONFIG.DEATH_ZONE_DISTANCE;
    }
    
    update() {
        if (!this.player || !this.player.body) return false;
        
        // Get player position
        const playerPos = this.player.body.position.clone();
        
        // Calculate camera position using CONFIG values
        const cameraX = playerPos.x - this.sideOffset;
        const cameraY = playerPos.y + this.height;
        const cameraZ = playerPos.z + this.distanceBehind;
        
        // Smooth camera movement
        this.threeCamera.position.lerp(new THREE.Vector3(cameraX, cameraY, cameraZ), this.followSpeed);
        
        // Set camera rotation
        this.threeCamera.rotation.set(
            -this.lookDownAngle,  // Look down
            -this.yRotation,      // Rotate for northeast feel
            0
        );
        
        // Check if player has fallen too far behind
        const distanceBehind = playerPos.z - (this.threeCamera.position.z - this.distanceBehind);
        if (distanceBehind > this.maxBehindDistance) {
            return true; // Player died
        }
        
        return false;
    }
    
    getTargetPosition() {
        return new THREE.Vector3(
            this.threeCamera.position.x + CONFIG.CAMERA_OFFSET,
            this.threeCamera.position.y - this.height,
            this.threeCamera.position.z - this.distanceBehind
        );
    }
    
    getZPosition() {
        return this.threeCamera.position.z - this.distanceBehind;
    }
}