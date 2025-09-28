import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';

class Mesh {
    constructor(scene, x, y, z, direction = 'left') {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.z = z;

        // Movement properties
        this.speed = null;
        this.direction = direction; // 'left' or 'right'

        // Model properties
        this.mesh = null;
        this.isLoaded = false;
        this.modelPath = null;      // Set path in child class
        this.modelScale = 1.0;      // Scale should be handled in the mesh, not the subclass.
        this.totalWidth = CONFIG.TILE_SIZE; // Default width is one tile

        // Physics properties
        this.boundingBox = null;    // BBox calculated from loaded model
        this.static = false;        // If true, mesh does not move (e.g. rocks, trees)

        // Misc properties
        this.type = 'obstacle';     // Default type (Obstacle, Decor etc.)
        this.sound = null;          // Placeholder for sound effect (e.g Car horn)

        // BBox initialization
        this.boundingBox = new THREE.Box3();
        this.boundingBoxSet = false;
        
    }

    // Load 3D model from GLTF file
    loadModel() {
        if (!this.modelPath) {
            console.warn('No model path specified for asset');
            return;
        }
        
        const loader = new GLTFLoader();

        loader.load(this.modelPath, 
            // Success callback
            (gltf) => {
                // Remove placeholder if it exists
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

                // Set BBox for collision detection
                this.boundingBox.setFromObject(this.mesh);
                this.boundingBoxSet = true;

                this.scene.add(this.mesh);
                this.isLoaded = true;                
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
        if (this.static) return; // Static meshes do not move
        
        // Calculate movement
        const movement = this.direction === 'right' ? this.speed : -this.speed;
        this.x += movement;
        
        // Move mesh
        this.mesh.position.x = this.x;
        
        // Translate bounding box by the same amount
        if (this.boundingBoxSet) {
            this.boundingBox.translate(new THREE.Vector3(movement, 0, 0));
        }
        
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

export default Mesh;