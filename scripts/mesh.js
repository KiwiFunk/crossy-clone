import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';

class Mesh {
    constructor(scene, x, y, z, direction = 'left') {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.z = z;

        // Movement
        this.speed = null;
        this.direction = direction;

        // Model
        this.mesh = null;
        this.isLoaded = false;
        this.modelPath = null;
        this.modelScale = 1.0;                  // Try to set within the model itself
        this.totalWidth = CONFIG.TILE_SIZE;

        // Physics
        this.boundingBox = new THREE.Box3();
        this.boundingBoxSet = false;
        this.boundingBoxPadding = CONFIG.BBOX_PADDING;

        // Debug
        this.debugBoundingBox = true;
        this.boundingBoxHelper = null;

        // Misc
        this.static = false;
        this.type = 'obstacle';
        this.sound = null;

        this._isDestroyed = false;

    }

    loadModel() {
        if (!this.modelPath) {
            console.warn('No model path specified for asset');
            return;
        }

        const loader = new GLTFLoader();

        loader.load(
            this.modelPath,
            (gltf) => {
                // If destroy was called during load, dispose of the asset and stop
                if (this._isDestroyed) {
                    console.log(`Model for ${this.type} loaded, but entity was already destroyed. Disposing...`);
                    this.disposeMesh(gltf.scene); // Clean up the geometry/materials
                    return; // Abort! Do not add to the scene.
                }

                // Clean up old mesh (e.g placeholder was used)
                if (this.mesh) {
                    this.scene.remove(this.mesh);
                    this.disposeMesh(this.mesh);
                }

                // Add new mesh
                this.mesh = gltf.scene;
                this.mesh.position.set(this.x, this.y, this.z);
                this.mesh.scale.set(this.modelScale, this.modelScale, this.modelScale);

                if (this.direction === 'right') {
                    this.mesh.rotation.y = Math.PI;
                }

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
            (xhr) => {
                console.log(`${this.type} ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
            },
            (error) => {
                console.error(`Error loading ${this.type} model:`, error);
            }
        );
    }

    update() {
        if (!this.mesh || this.static) return;

        // Movement
        const movement = this.direction === 'right' ? this.speed : -this.speed;
        this.x += movement;
        this.mesh.position.x = this.x;

        // Update bounding box
        this.updateBoundingBox();

        // Looping
        const boundaryX = 10;
        if (this.x > boundaryX) this.x = -boundaryX;
        if (this.x < -boundaryX) this.x = boundaryX;
        this.mesh.position.x = this.x;
    }

    updateBoundingBox() {
        if (!this.mesh) return;

        this.boundingBox.setFromObject(this.mesh);
        // Add padding
        this.boundingBox.expandByScalar(this.boundingBoxPadding);
        this.boundingBoxSet = true;

        if (this.debugBoundingBox) {
            if (!this.boundingBoxHelper) {
                this.boundingBoxHelper = new THREE.Box3Helper(this.boundingBox, new THREE.Color(0xff00ff));
                this.scene.add(this.boundingBoxHelper);
            } else {
                this.boundingBoxHelper.box.copy(this.boundingBox);
            }
        } else {
            if (this.boundingBoxHelper) {
                this.scene.remove(this.boundingBoxHelper);
                this.boundingBoxHelper = null;
            }
        }
    }

    disposeMesh(mesh) {
        mesh.traverse((child) => {
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

    destroy() {
        this._isDestroyed = true;

        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.disposeMesh(this.mesh);
        }

        if (this.boundingBoxHelper) {
            this.scene.remove(this.boundingBoxHelper);
            this.boundingBoxHelper = null;
        }
    }
}

export default Mesh;