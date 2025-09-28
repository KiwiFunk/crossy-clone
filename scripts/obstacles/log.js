import Mesh from '../mesh.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG } from '../config.js';

class Log extends Mesh {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);

        // Core properties
        this.modelPath = 'assets/log.glb';
        this.endCapPath = 'assets/logend.glb';
        this.type = 'log';

        // Log dimensions
        const dims = CONFIG.MODEL_DIMENSIONS.LOG;
        this.endCapWidth = dims.END_CAP_WIDTH;
        this.segmentWidth = dims.SEGMENT_WIDTH;
        this.segmentCount = Math.floor(Math.random() * 3) + 1;
        this.totalWidth = this.calculateTotalWidth();

        // Animation
        this.originalY = y;
        this.sinkDepth = 0.15;
        this.animationSpeed = 0.01;
        this.isSinking = false;
        this.isRising = false;
        this.hasPlayerOnTop = false;

        // Composite mesh group
        this.logGroup = new THREE.Group();
        this.logGroup.position.set(this.x, this.y, this.z);
        this.mesh = this.logGroup;

        // Begin loading
        this.loadLog();
    }

    calculateTotalWidth() {
        return this.endCapWidth + (this.segmentCount * this.segmentWidth) + this.endCapWidth;
    }

    static calculateTotalWidth(segmentCount) {
        const dims = CONFIG.MODEL_DIMENSIONS.LOG;
        return dims.END_CAP_WIDTH + (segmentCount * dims.SEGMENT_WIDTH) + dims.END_CAP_WIDTH;
    }

    async loadLog() {
        const loadGltf = path =>
            new Promise((res, rej) =>
                new GLTFLoader().load(path, gltf => res(gltf), null, err => rej(err))
            );

        try {
            // Front cap
            const frontGltf = await loadGltf(this.endCapPath);
            const frontCap = this.preparePart(frontGltf.scene);
            frontCap.position.x = 0;
            this.logGroup.add(frontCap);

            // Segment template
            const segmentGltf = await loadGltf(this.modelPath);
            const segmentTemplate = this.preparePart(segmentGltf.scene);

            // Segments
            for (let i = 0; i < this.segmentCount; i++) {
                const seg = segmentTemplate.clone();
                seg.position.x = i * this.segmentWidth;
                this.logGroup.add(seg);
            }

            // Back cap
            const backGltf = await loadGltf(this.endCapPath);
            const backCap = this.preparePart(backGltf.scene);
            backCap.rotation.y = Math.PI;
            backCap.position.x = this.segmentCount * this.segmentWidth;
            this.logGroup.add(backCap);

            // Finalize
            this.isLoaded = true;
            this.scene.add(this.logGroup);
            this.updateBoundingBox();
        } catch (err) {
            console.error(`Failed to load log parts:`, err);
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

    update() {
        if (!this.isLoaded) return;

        // Movement
        this.x += this.direction === 'right' ? this.speed : -this.speed;
        this.logGroup.position.x = this.x;

        // Animation
        this.updateSinkAnimation();

        // Bounding box
        this.updateBoundingBox();

        // Looping
        const boundaryX = 15 + this.totalWidth / 2;
        if (this.x > boundaryX) this.x = -boundaryX;
        if (this.x < -boundaryX) this.x = boundaryX;
        this.logGroup.position.x = this.x;
    }

    updateSinkAnimation() {
        if (this.isSinking) {
            this.logGroup.position.y -= this.animationSpeed;
            if (this.logGroup.position.y <= this.originalY - this.sinkDepth) {
                this.logGroup.position.y = this.originalY - this.sinkDepth;
                this.isSinking = false;
            }
        }

        if (this.isRising) {
            this.logGroup.position.y += this.animationSpeed;
            if (this.logGroup.position.y >= this.originalY) {
                this.logGroup.position.y = this.originalY;
                this.isRising = false;
            }
        }
    }

    playerLanded() {
        if (!this.hasPlayerOnTop) {
            this.isSinking = true;
            this.isRising = false;
            this.hasPlayerOnTop = true;
            console.log("Player landed on log!");
        }
    }

    playerLeft() {
        if (this.hasPlayerOnTop) {
            this.isRising = true;
            this.isSinking = false;
            this.hasPlayerOnTop = false;
            console.log("Player left log!");
        }
    }

    carryPlayer(player) {
        if (!player || !player.body) return;
        const movement = this.direction === 'right' ? this.speed : -this.speed;
        player.body.position.x += movement;
        player.targetPosition.x = player.body.position.x;
    }

    updateBoundingBox() {
        if (this.logGroup) {
            this.boundingBox = new THREE.Box3().setFromObject(this.logGroup);
        }
    }

    destroy() {
        if (this.logGroup) {
            this.scene.remove(this.logGroup);
            this.logGroup.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        Array.isArray(child.material)
                            ? child.material.forEach(m => m.dispose())
                            : child.material.dispose();
                    }
                }
            });
        }
    }
}

export default Log;