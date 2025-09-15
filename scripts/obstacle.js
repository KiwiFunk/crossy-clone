import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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
        this.modelScale = 0.35;
        this.boundingBox = null;    // For collision detection
        this.type = 'obstacle';     // Default type
        this.sound = null;          // Placeholder for sound effect (e.g Car horn)
        this.static = false;        // If true, obstacle does not move (e.g. rocks, trees)
    }

    // Use static as the utility is not tied to instance. We want to call it before creating instances. (during the constructor)
    static getRandomSpeed(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Load 3D model from GLTF file
    loadModel() {
        if (!this.modelPath) {
            console.warn('No model path specified for obstacle');
            return;
        }
        
        const loader = new GLTFLoader();
        
        loader.load(this.modelPath, 
            // Success callback
            (gltf) => {
                // Remove placeholder
                if (this.mesh) {
                    this.scene.remove(this.mesh);
                    if (this.mesh.geometry) this.mesh.geometry.dispose();
                    if (this.mesh.material) {
                        if (Array.isArray(this.mesh.material)) {
                            this.mesh.material.forEach(m => m.dispose());
                        } else {
                            this.mesh.material.dispose();
                        }
                    }
                }
                
                // Add the loaded model
                this.mesh = gltf.scene;
                this.mesh.position.set(this.x, this.y, this.z);
                
                // Apply scale and rotation
                this.mesh.scale.set(
                    this.modelScale, 
                    this.modelScale, 
                    this.modelScale
                );
                
                if (this.direction === 'right') {
                    this.mesh.rotation.y = Math.PI; // 180 degrees
                }
                
                // Enable shadows
                this.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                this.scene.add(this.mesh);
                this.isLoaded = true;
                this.updateBoundingBox();
                
                console.log(`${this.type} model loaded`);
            },
            // Progress callback
            (xhr) => {
                console.log(`${this.type} ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
            },
            // Error callback
            (error) => {
                console.error(`Error loading ${this.type} model:`, error);
            }
        );
    }

    update() {
        if (!this.mesh) return;
        if (this.static) return; // Static obstacles do not move
        
        // Move based on direction
        if (this.direction === 'right') {
            this.x += this.speed;
        } else {
            this.x -= this.speed;
        }
        
        // Update position
        this.mesh.position.x = this.x;
        
        // Update bounding box if available
        this.updateBoundingBox();
        
        // Loop back when off-screen
        const boundaryX = 10; // Default boundary
        if (this.x > boundaryX) {
            this.x = -boundaryX;
            this.mesh.position.x = this.x;
        } else if (this.x < -boundaryX) {
            this.x = boundaryX;
            this.mesh.position.x = this.x;
        }
    }
    
    updateBoundingBox() {
        if (this.mesh) {
            this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
        }
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);

            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
        }
    }
}

export default Obstacle;