import Obstacle from '../obstacle.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class Log extends Obstacle {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        
        // Class properties
        this.modelPath = 'assets/log.glb';
        this.type = 'log';
        this.speed = Obstacle.getRandomSpeed(0.02, 0.05); // Logs move slower than trains
        
        // Log-specific properties
        this.endCapPath = 'assets/logend.glb';
        this.logGroup = new THREE.Group();
        this.segmentCount = Math.floor(Math.random() * 3) + 1; // Random length (1-3 segments)
        this.totalWidth = 0; // Will be calculated after loading
        
        // Animation properties for sinking effect
        this.originalY = y;
        this.sinkDepth = 0.15;      // How far log sinks when player stands on it
        this.animationSpeed = 0.01;  // Speed of sink/rise animation
        this.isSinking = false;
        this.isRising = false;
        this.hasPlayerOnTop = false;
        
        // Position the group in the scene
        this.logGroup.position.set(this.x, this.y, this.z);
        
        this.loadLog();
    }

    // Use async/await to load multiple parts sequentially
    async loadLog() {

        const loadGltf = path => {
            return new Promise((res, rej) =>
            new GLTFLoader().load(path, gltf => res(gltf), null, err => rej(err))
            );
        };

        // 1. front cap
        const frontGltf = await loadGltf(this.endCapPath);
        const frontCap = this.preparePart(frontGltf.scene);
        const frontCapWidth = this.getMeshWidth(frontCap);
        frontCap.position.x = 0;
        this.logGroup.add(frontCap);

        // 2. segment template
        const segmentGltf = await loadGltf(this.modelPath);
        const segmentTemplate = this.preparePart(segmentGltf.scene);
        const segmentWidth = this.getMeshWidth(segmentTemplate);

        // place segments
        for (let i = 0; i < this.segmentCount; i++) {
            const seg = segmentTemplate.clone();
            seg.position.x =  i * segmentWidth;
            this.logGroup.add(seg);
        }

        // 3. back cap
        const backGltf = await loadGltf(this.endCapPath);
        const backCap = this.preparePart(backGltf.scene);
        backCap.rotation.y = Math.PI;
        backCap.position.x = this.segmentCount * segmentWidth;
        this.logGroup.add(backCap);

        // 4. compute total width
        this.totalWidth = frontCapWidth
                        + this.segmentCount * segmentWidth
                        + frontCapWidth;

        // 5. finalize
        this.isLoaded = true;
        this.scene.add(this.logGroup);
        this.updateBoundingBox();
    }

    createLogPart(gltfScene, offsetX) {
        const part = gltfScene.clone();
        
        // Position within the group
        part.position.set(offsetX, 0, 0);
        part.scale.set(this.modelScale, this.modelScale, this.modelScale);
        
        // Enable shadows
        part.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        return part;
    }

    update() {
        if (!this.isLoaded) return;
        
        // Move the entire log group
        if (this.direction === 'right') {
            this.x += this.speed;
        } else {
            this.x -= this.speed;
        }
        
        // Update group position
        this.logGroup.position.x = this.x;
        
        // Handle sinking and rising animation
        this.updateSinkAnimation();
        
        // Update bounding box for collision detection
        this.updateBoundingBox();
        
        // Loop back when off-screen (use larger boundary based on log size)
        const boundaryX = 15 + (this.totalWidth / 2);
        if (this.x > boundaryX) {
            this.x = -boundaryX;
            this.logGroup.position.x = this.x;
        } else if (this.x < -boundaryX) {
            this.x = boundaryX;
            this.logGroup.position.x = this.x;
        }
    }

    preparePart(gltfScene) {
        const part = gltfScene.clone();
        part.scale.set(this.modelScale, this.modelScale, this.modelScale);
        part.traverse(c => {
            if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
            }
        });
        return part;
    }

    getMeshWidth(obj) {
        const bbox = new THREE.Box3().setFromObject(obj);
        return bbox.getSize(new THREE.Vector3()).x;
    }
    
    updateSinkAnimation() {
        // Handle sinking when player is on the log
        if (this.isSinking) {
            this.logGroup.position.y -= this.animationSpeed;
            if (this.logGroup.position.y <= this.originalY - this.sinkDepth) {
                this.logGroup.position.y = this.originalY - this.sinkDepth;
                this.isSinking = false;
            }
        }
        
        // Handle rising when player jumps off
        if (this.isRising) {
            this.logGroup.position.y += this.animationSpeed;
            if (this.logGroup.position.y >= this.originalY) {
                this.logGroup.position.y = this.originalY;
                this.isRising = false;
            }
        }
    }
    
    // Called when player lands on the log
    playerLanded() {
        if (!this.hasPlayerOnTop) {
            this.isSinking = true;
            this.isRising = false;
            this.hasPlayerOnTop = true;
            console.log("Player landed on log!");
        }
    }
    
    // Called when player jumps off the log
    playerLeft() {
        if (this.hasPlayerOnTop) {
            this.isRising = true;
            this.isSinking = false;
            this.hasPlayerOnTop = false;
            console.log("Player left log!");
        }
    }
    
    // Move player along with the log
    carryPlayer(player) {
        if (!player || !player.body) return;
        
        // Apply log's movement to player
        if (this.direction === 'right') {
            player.body.position.x += this.speed;
        } else {
            player.body.position.x -= this.speed;
        }
    }
    
    updateBoundingBox() {
        if (!this.logGroup) return;
        this.boundingBox = new THREE.Box3().setFromObject(this.logGroup);
    }

    destroy() {
        if (this.logGroup) {
            this.scene.remove(this.logGroup);
            
            // Dispose of all parts to prevent memory leaks
            this.logGroup.traverse((child) => {
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

export default Log;