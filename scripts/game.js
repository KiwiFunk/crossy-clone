import * as THREE from 'three';
import { calculateMeshDimensions } from './config.js';
import { CONFIG } from './config.js';
import Player from './player.js';
import { TerrainGenerator } from './terrain.js';
import Camera from './camera.js';
import ScoreManager from './scoring.js';
import InputHandler from './input.js';

class Game {
    constructor() {
        this.setupThreeJS();
        this.setupLighting();
        this.setupGameElements();
        this.setupEventListeners();
        this.animate();

        window.game = this; // Global access
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        document.body.appendChild(this.renderer.domElement);
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        const hemisphereLight = new THREE.HemisphereLight(0x8dc1de, 0x90ad56, 0.6);
        this.scene.add(hemisphereLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-10, 10, -8);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(2048, 2048);
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.26);
        fillLight.position.set(10, -10, 8);
        fillLight.castShadow = false;
        this.scene.add(fillLight);
    }

    setupGameElements() {
        this.threeCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

        this.player = new Player(this.scene);
        this.inputHandler = new InputHandler(this.player);

        this.terrainGenerator = new TerrainGenerator(this.scene);
        this.terrainGenerator.generateInitialTerrain();

        const firstRow = this.terrainGenerator.rows[0];
        if (firstRow) {
            this.player.mesh.position.set(0, this.player.targetPosition.y, firstRow.z);
            this.player.gridPosition.z = Math.round(firstRow.z / CONFIG.TILE_SIZE);
        }

        this.cameraController = new Camera(this.threeCamera, this.player);
        this.scoreManager = new ScoreManager();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.threeCamera.aspect = window.innerWidth / window.innerHeight;
        this.threeCamera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        this.inputHandler.update();
        this.player.update();

        this.terrainGenerator.update(this.player.gridPosition.z);

        const playerDied = this.cameraController.update();
        if (playerDied) {
            console.log("Player fell behind and died!");
            // Handle game over logic here
        }

        this.scoreManager.updateScore(this.cameraController.getZPosition());

        // Get nearby obstacles for collision checks
        const nearbyRows = this.terrainGenerator.rows.filter(row => {
            const distance = Math.abs(row.z - this.player.mesh.position.z);
            return distance <= CONFIG.TILE_SIZE * 2; // Check current row, one in front, one behind
        });
        const nearbyObstacles = nearbyRows.flatMap(row => row.obstacles);

        // Check for collisions with obstacles using AABB
        const collided = this.player.checkCollisions(nearbyObstacles);
        if (collided) {
            // Handle game over/game state change here
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.threeCamera);
    }
}

window.addEventListener('load', () => {
    const game = new Game();
});

const calculateMeshSizes = true;

if (calculateMeshSizes) {
    (async () => {
        await calculateMeshDimensions('./assets/log.glb');
        await calculateMeshDimensions('./assets/logend.glb');
        await calculateMeshDimensions('./assets/car.glb');
        await calculateMeshDimensions('./assets/train.glb');
        await calculateMeshDimensions('./assets/traincarriage.glb');
        await calculateMeshDimensions('./assets/truck.glb');
    })();
}