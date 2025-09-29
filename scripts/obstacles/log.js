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

        // Composite mesh group
        this.logGroup = new THREE.Group();
        this.logGroup.position.set(this.x, this.y, this.z);
        this.mesh = this.logGroup; // Informs parent class what to track

        // Movement tracking
        this.lastX = this.x; // Store previous X position
        this.movementDelta = new THREE.Vector3(0, 0, 0); // Store movement per frame
        this.isMovingPlatform = true; // Flag so player knows this is rideable

        //Hooks
        this.hooks = {
            onPlayerEnter: null,
            onPlayerExit: null
        };
        this.isPlayerOn = false;

        // States for animation
        this.sinkAmount = 0.2;
        this.baseY = y;

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
            // Step 1: Load each unique asset only once.
            const [endCapGltf, segmentGltf] = await Promise.all([
                loadGltf(this.endCapPath),
                loadGltf(this.modelPath)
            ]);

            // Step 2: CRITICAL CHECK - After loading is complete, check if we've been destroyed.
            if (this._isDestroyed) {
                console.log('Log models loaded, but entity was already destroyed. Disposing...');
                this.disposeMesh(endCapGltf.scene);
                this.disposeMesh(segmentGltf.scene);
                return; // Abort!
            }
            
            // Step 3: If not destroyed, proceed with assembling the log
            // Front cap
            const frontCap = this.preparePart(endCapGltf.scene);
            frontCap.position.x = 0;
            this.logGroup.add(frontCap);

            // Segment template
            const segmentTemplate = this.preparePart(segmentGltf.scene);

            // Segments
            for (let i = 0; i < this.segmentCount; i++) {
                const seg = segmentTemplate.clone();
                seg.position.x = i * this.segmentWidth;
                this.logGroup.add(seg);
            }

            // Back cap - Clone the already prepared front cap
            const backCap = frontCap.clone();
            backCap.rotation.y = Math.PI;
            backCap.position.x = this.segmentCount * this.segmentWidth;
            this.logGroup.add(backCap);

            // Finalize
            this.isLoaded = true;
            this.scene.add(this.logGroup);
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

        // Movement + bounding box handled by parent
        super.update();

        // Update movement delta
        const deltaX = this.x - this.lastX;
        this.movementDelta.set(deltaX, 0, 0);
        this.lastX = this.x;

        // Looping (override boundary logic for logs)
        const boundaryX = 15 + this.totalWidth / 2;
        if (this.x > boundaryX) this.x = -boundaryX;
        if (this.x < -boundaryX) this.x = boundaryX;
        this.logGroup.position.x = this.x;
    }

    // Return a copy of the movement delta to prevent modifying internal data for the entity
    getMovementDelta() {
        return this.movementDelta.clone(); 
    }

    destroy() {
        super.destroy(); // Handles mesh + bounding box cleanup
    }
}

export default Log;