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
        if (!this.player?.mesh) return false;
        // Get player position
        const playerPos = this.player.mesh.position.clone();

        // Calculate camera position
        const targetPos = new THREE.Vector3(
            playerPos.x + this.posX,
            playerPos.y + this.posY,
            playerPos.z + this.posZ
        );

        // Smooth camera movement
        this.threeCamera.position.lerp(targetPos, this.followSpeed);

        // Set camera rotation
        this.threeCamera.rotation.set(
            -this.rotX,  // X rotation (looking down)
            -this.rotY,  // Y rotation (diagonal view)
            -this.rotZ   // Z rotation (roll)
        );

        const distanceBehind = playerPos.z - (this.threeCamera.position.z - this.posZ);
        return distanceBehind > this.maxBehindDistance;
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