import * as THREE from 'three';
import { CONFIG } from './config.js';
import Player from './player.js';
import { TerrainGenerator } from './terrain.js';
import Camera from './camera.js';
import ScoreManager from './scoring.js'
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
        // Create three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Add renderer to DOM
        document.body.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Hemisphere light for ambient outdoor lighting (gives better shadow colors)
        const hemisphereLight = new THREE.HemisphereLight(
            0x8dc1de,   // Sky color (light blue)
            0x90ad56,   // Ground color (light green)
            0.6         // Intensity
        );
        this.scene.add(hemisphereLight);
        
        // Directional light (sun X changes west/east sun, Y changes shadow length, Z changes north/south tilt)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-10, 10, -8);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        // Add a fill light from the opposite side (no shadows)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.26);
        fillLight.position.set(10, -10, 8); // Opposite the main light
        fillLight.castShadow = false; // No shadows from fill light
        this.scene.add(fillLight);
    }

    setupGameElements() {
        // Create 3D camera using three.js
        this.threeCamera = new THREE.PerspectiveCamera(
            50, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            200
        );
        
        // Initialize the player first
        this.player = new Player(this.scene);

        // Setup input handler for player movement
        this.inputHandler = new InputHandler(this.player);

        // Then Init the terrain generation and create the initial terrain (Grass Start Area)
        this.terrainGenerator = new TerrainGenerator(this.scene);
        this.terrainGenerator.generateInitialTerrain();

        // Position the player on the first terrain row
        const firstRow = this.terrainGenerator.rows[0];
        if (firstRow) {
            // Position player at the center of the first row
            this.player.body.position.set(0, this.player.targetPosition.y, firstRow.z);
            this.player.gridPosition.z = Math.round(firstRow.z / (this.player.size * 2));
        }

        // Initialize other dependencies
        this.cameraController = new Camera(this.threeCamera, this.player);
        this.scoreManager = new ScoreManager();
    }

    // Create event listeners for window resize
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.threeCamera.aspect = window.innerWidth / window.innerHeight;
        this.threeCamera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // This is called every frame to update game state
    update() {
        
        // Update input handler in case of held keys
        this.inputHandler.update();

        // Update game objects
        this.player.update();
        this.terrainGenerator.update(this.player.getPosition().z);

        // Update camera and check if player has fallen behind camera (considered "dead")
        const playerDied = this.cameraController.update();
        if (playerDied) {
            console.log("Player fell behind and died!");
            // Handle game over
        }

        // Update score using the camera's Z position for tracking progress
        this.scoreManager.updateScore(this.cameraController.getZPosition());
        
        // Check collisions
        const obstacles = this.terrainGenerator.getAllObstacles();
        if (this.player.checkCollision(obstacles)) {
            //We'll handle lives and game over logic here later
            console.log("Collision detected!");
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.threeCamera); // Use threeJsCamera directly
    }
}

// Hook into the window load event to ensure DOM is ready
window.addEventListener('load', () => {
    const game = new Game();
});