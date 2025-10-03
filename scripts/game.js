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
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.NoToneMapping;

        document.body.appendChild(this.renderer.domElement);
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        const hemisphereLight = new THREE.HemisphereLight(0x8dc1de, 0x90ad56, 0.8);
        this.scene.add(hemisphereLight);

        // Store the light on the Game instance so we can update it
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.directionalLight.position.set(-10, 10, -8);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.set(2048, 2048);

        // Set up shadow Cam properties
        const shadowCamSize = 15;
        this.directionalLight.shadow.camera.left = -shadowCamSize;
        this.directionalLight.shadow.camera.right = shadowCamSize;
        this.directionalLight.shadow.camera.top = shadowCamSize;
        this.directionalLight.shadow.camera.bottom = -shadowCamSize;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 30; // Adjust as needed

        this.scene.add(this.directionalLight);

        // Set Target so shadow cam can follow player
        this.directionalLight.target = new THREE.Object3D();
        this.scene.add(this.directionalLight.target);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
        fillLight.position.set(10, -10, 8);
        fillLight.castShadow = false;
        this.scene.add(fillLight);
    }

    setupGameElements() {
        this.threeCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

        this.terrainGenerator = new TerrainGenerator(this.scene);
        this.terrainGenerator.generateInitialTerrain();

        this.player = new Player(this.scene, this.terrainGenerator);
        this.inputHandler = new InputHandler(this.player);

        const firstRow = this.terrainGenerator.rows[0];
        if (firstRow) {
            this.player.mesh.position.set(this.player.targetPosition.x, this.player.targetPosition.y, firstRow.z);
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

    gameOver() {
        console.log("Game Over!");
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

        // Set Tracked Lighting to follow player
        if (this.player.mesh) {
            const playerPos = this.player.mesh.position;

            // The light's target should be the player's position.
            this.directionalLight.target.position.copy(playerPos);

            // The light's position should be offset from the player's position.
            this.directionalLight.position.set(
                playerPos.x - 10,
                playerPos.y + 10,
                playerPos.z - 8
            );
        }

        this.scoreManager.updateScore(this.player.gridPosition.z);

        // Get nearby obstacles for collision checks
        const nearbyRows = this.terrainGenerator.rows.filter(row => {
            const distance = Math.abs(row.z - this.player.mesh.position.z);
            return distance <= CONFIG.TILE_SIZE * 2; // Check current row, one in front, one behind
        });
        const nearbyObstacles = nearbyRows.flatMap(row => row.obstacles);

        // Check for collisions with obstacles using AABB
        const collided = this.player.checkCollisions(nearbyObstacles);
        if (collided) {
            this.gameOver();
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

const calculateMeshSizes = false;

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