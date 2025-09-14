import Obstacle from '../obstacle.js';

class Train extends Obstacle {
    constructor(scene, x, y, z) {
        // Using super to call parent class's constructor
        super(scene, x, y, z);

        // Global object properties
        this.modelPath = 'assets/train.glb';
        this.type = 'train';
        this.speed = 0.1; 

        // Train-specific properties
        this.parts = []; 
        this.carriageSpacing = 2;
        this.numCarriages = Math.floor(Math.random() * 3) + 2; // 2 to 4 carriages
        
        // We dont want to use parent class's loadModel method as is, because train is made of multiple parts and requires multiple meshes
        this.loadTrain();
    }

    // Subclass specific model loading to handle multiple parts
    loadTrain() {
        const loader = new GLTFLoader();
        let loadedParts = 0;
        const totalParts = this.numCarriages + 1; // Front + carriages
        
        // Function to check if all parts are loaded
        const checkAllLoaded = () => {
            loadedParts++;
            if (loadedParts === totalParts) {
                this.isLoaded = true;
                this.updateBoundingBox();
                console.log(`Train fully loaded with ${this.parts.length} parts`);
            }
        };
        
        // Load the front car (engine)
        loader.load(this.modelPath,
            (gltf) => {
                const frontCar = this.createTrainPart(gltf.scene, 0);
                this.parts.push(frontCar);
                this.scene.add(frontCar);
                checkAllLoaded();
            },
            null,
            (error) => {
                console.error('Error loading train front:', error);
                checkAllLoaded(); // Still count as loaded to avoid hanging
            }
        );
        
        // Load carriages
        for (let i = 0; i < this.numCarriages; i++) {
            loader.load(this.carriagePath,
                (gltf) => {
                    const carriage = this.createTrainPart(gltf.scene, -(i + 1) * this.carriageSpacing);
                    this.parts.push(carriage);
                    this.scene.add(carriage);
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

    // Helper to create and position a train part
    createTrainPart(gltfScene, offsetZ) {
        // Clone the scene to avoid sharing geometry
        const part = gltfScene.clone();
        
        // Position relative to train's starting position
        part.position.set(this.x, this.y, this.z + offsetZ);
        
        // Apply scale
        part.scale.set(this.modelScale, this.modelScale, this.modelScale);
        
        // Rotate if moving right
        if (this.direction === 'right') {
            part.rotation.y = Math.PI;
        }
        
        // Enable shadows
        part.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        return part;
    }

    // Override parent methods to handle multiple parts
    update() {
        if (!this.isLoaded || this.parts.length === 0) return;
        
        // Move based on direction
        if (this.direction === 'right') {
            this.x += this.speed;
        } else {
            this.x -= this.speed;
        }
        
        // Update position of all parts
        this.parts.forEach((part, index) => {
            // Each part maintains its relative position
            const baseOffset = index * this.carriageSpacing;
            part.position.x = this.x;
            part.position.z = this.z - baseOffset; // Carriages behind front
        });
        
        // Update bounding box for collision
        this.updateBoundingBox();
        
        // Loop back when off-screen (use larger boundary for longer trains)
        const boundaryX = 15;
        if (this.x > boundaryX) {
            this.x = -boundaryX;
            // Update all parts immediately
            this.parts.forEach((part, index) => {
                const baseOffset = index * this.carriageSpacing;
                part.position.x = this.x;
                part.position.z = this.z - baseOffset;
            });
        } else if (this.x < -boundaryX) {
            this.x = boundaryX;
            this.parts.forEach((part, index) => {
                const baseOffset = index * this.carriageSpacing;
                part.position.x = this.x;
                part.position.z = this.z - baseOffset;
            });
        }
    }

    updateBoundingBox() {
        if (this.parts.length === 0) return;
        
        // Create a group to get combined bounding box
        const group = new THREE.Group();
        this.parts.forEach(part => group.add(part.clone()));
        
        this.boundingBox = new THREE.Box3().setFromObject(group);
        
        // Clean up the temporary group
        while (group.children.length > 0) {
            group.remove(group.children[0]);
        }
    }

    destroy() {
        this.parts.forEach(part => {
            this.scene.remove(part);
            
            // Dispose of geometries and materials
            part.traverse((child) => {
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
        });
        
        this.parts = [];
    }
}

export default Train;