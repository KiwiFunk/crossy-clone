import Mesh from '../mesh.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG } from '../config.js';

class Train extends Mesh {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);

        // Global object properties
        this.modelPath = 'assets/train.glb';
        this.type = 'train';
        this.boundary = this.totalWidth

        // Train-specific properties
        this.carriagePath = 'assets/traincarriage.glb';
        this.trainGroup = new THREE.Group(); 
        this.partOffsets = [];              // Track each part's offset
        this.carriageSpacing = 2.8;
        this.numCarriages = Math.floor(Math.random() * 3) + 2; // 2 to 4 carriages

        // Handle model dimensions
        this.trainWidth = CONFIG.MODEL_DIMENSIONS.TRAIN.TRAIN_WIDTH;
        this.carriageWidth = CONFIG.MODEL_DIMENSIONS.TRAIN.CARRIAGE_WIDTH;
        this.totalWidth = this.calculateTotalWidth();
        
        // Position the group in the scene
        this.trainGroup.position.set(this.x, this.y, this.z);
        

        this.boundary = this.totalWidth + 10; // Add some buffer to boundary
        this.loadTrain();
    }

    calculateTotalWidth() {
        return this.trainWidth + ((this.numCarriages + this.carriageSpacing) * this.carriageWidth);
    }

    loadTrain() {
        const loader = new GLTFLoader();
        let loadedParts = 0;
        const totalParts = this.numCarriages + 1;
        
        const checkAllLoaded = () => {
            loadedParts++;
            if (loadedParts === totalParts) {
                this.isLoaded = true;

                this.mesh = this.trainGroup; // Inform parent class
                this.mesh.position.set(this.x, this.y, this.z);

                // Rotate the entire group based on direction
                if (this.direction === 'right') {
                    this.trainGroup.rotation.y = Math.PI;  
                }
                // Add the whole group to scene
                this.scene.add(this.mesh);  
                this.updateBoundingBox();
                console.log(`Train fully loaded with ${this.trainGroup.children.length} parts`);
            }
        };
        
        // Load the front car (engine) - no offset
        this.partOffsets.push(0);
        loader.load(this.modelPath,
            (gltf) => {
                const frontCar = this.createTrainPart(gltf.scene, 0);
                this.trainGroup.add(frontCar);  // Add to group instead of scene
                checkAllLoaded();
            },
            null,
            (error) => {
                console.error('Error loading train front:', error);
                checkAllLoaded();
            }
        );
        
        // Load carriages
        for (let i = 0; i < this.numCarriages; i++) {

            // Calculate offset based on carriage index and direction
            const directionMultiplier = this.direction === 'right' ? -1 : 1;
            const offsetX = (i + 1) * this.carriageSpacing * directionMultiplier;
            this.partOffsets.push(offsetX);

            loader.load(this.carriagePath,
                (gltf) => {
                    const carriage = this.createTrainPart(gltf.scene, offsetX);
                    this.trainGroup.add(carriage);
                    checkAllLoaded();
                },
                null,
                (error) => {
                    console.error(`Error loading train carriage ${i + 1}:`, error);
                    checkAllLoaded();
                }
            );
        }
    }

    createTrainPart(gltfScene, offsetX) {
        // Clone the scene to avoid modifying the original model
        const part = gltfScene.clone();
        
        part.position.set(offsetX, 0, 0);
        part.scale.set(this.modelScale, this.modelScale, this.modelScale);
        
        // Enable shadows for all meshes in the group
        part.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        return part;
    }

    destroy() {
        if (this.trainGroup) {
            this.scene.remove(this.trainGroup);
            
            // Dispose of all parts
            this.trainGroup.traverse((child) => {
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

export default Train;