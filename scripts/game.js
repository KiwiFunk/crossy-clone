import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js';
import Player from './player.js';
import { TerrainGenerator } from './terrain.js';
import Camera from './camera.js';
import ScoreManager from './scoring.js'
import { GRID_SIZE } from './config.js';

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
        // Ambient light (overall illumination)
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);
        
        // Directional light (sun-like)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);
    }

    setupGameElements() {
        // Initialize dependencies
        this.player = new Player(this.scene);
        this.terrainGenerator = new TerrainGenerator(this.scene);
        this.cameraController = new Camera();
        this.scoreManager = new ScoreManager();

        // Generate the inital terrain
        this.terrainGenerator.generateInitialTerrain();
    }

    // Create event listeners for player input, then add to keys object. (Object allows for direct lookup instead of looping through array)
    setupEventListeners() {
        this.keys = {};
        document.addEventListener('keydown', (e) => this.keys[e.key] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // This is called every frame to update game state
    update() {
        // Handle player movement
        if (this.keys['ArrowUp'] || this.keys['W'] || this.keys['w']) this.player.move('forward');
        if (this.keys['ArrowDown'] || this.keys['S'] || this.keys['s']) this.player.move('backward');
        if (this.keys['ArrowLeft'] || this.keys['A'] || this.keys['a']) this.player.move('left');
        if (this.keys['ArrowRight'] || this.keys['D'] || this.keys['d']) this.player.move('right');

        // Reset keys to prevent continuous movement
        this.keys = {};

        // Update game objects
        this.player.update();
        this.terrainGenerator.update(this.player.getPosition().z);
        this.cameraController.update();
        this.scoreManager.update(this.player);
        
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
        this.renderer.render(this.scene, this.camera);
    }
}

// Hook into the window load event to ensure DOM is ready
window.addEventListener('load', () => {
    const game = new Game();
});