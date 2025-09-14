import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { GRID_SIZE } from './config.js';
// Import our obstacle subclasses
import Car from './obstacles/car.js';
import Truck from './obstacles/truck.js';
import Train from './obstacles/train.js';

export class TerrainGenerator {
    constructor(scene) {
        this.scene = scene;
        this.rows = [];
        this.lastZ = 10; // Init game with positive Z (further from camera)
        // Register terrain types with their weightings for procedural generation (Make sure to Normalize values so === 1.0)
        this.terrainTypes = [
            { type: 'grass', weight: 0.25 },
            { type: 'road', weight: 0.45 },
            { type: 'rail', weight: 0.15 },
            { type: 'river', weight: 0.15 }
        ];
        // How far ahead to generate terrain
        this.maxDrawDistance = 20; 
        this.safeZone = 4;
    }

    // Create the initial terrain on game start
    generateInitialTerrain() {

        // Use safe zone value to create initial grass rows
        for (let i = 0; i < this.safeZone; i++) {
            this.generateTerrainRow('grass');
        }

        // Generate the remainder of rows using draw distance
        for (let i = 0; i < this.maxDrawDistance; i++) {
            this.generateRandomTerrainRow();
        }
    }

    // Use the player postion to procedurally generate terrain as needed
    update(playerZ) {
        while (this.lastZ > playerZ - this.maxDrawDistance) {
            this.generateRandomTerrainRow();
        }
        
        // Cull rows that are far behind the player
        const removeIndex = this.rows.findIndex(row => 
            row.z < playerZ + 15); // Keep some rows behind player
            
        if (removeIndex > 0) {
            const rowsToRemove = this.rows.slice(0, removeIndex);
            rowsToRemove.forEach(row => row.destroy());
            this.rows.splice(0, removeIndex);
        }
        
        // Update existing terrain
        this.rows.forEach(row => row.update());
    }
    
    generateRandomTerrainRow() {
        // Use weighted random selection
        const rand = Math.random();
        let sum = 0;
        let chosenType = 'grass'; // Default
        
        for (const item of this.terrainTypes) {
            sum += item.weight;
            if (rand < sum) {
                chosenType = item.type;
                break;
            }
        }
        
        this.generateTerrainRow(chosenType);
    }
    
    generateTerrainRow(type) {
        // Create a new row and add it to our collection
        const row = new TerrainRow(this.scene, this.lastZ, type);
        this.rows.push(row);
        
        // Move to next row position (further away from camera)
        this.lastZ -= 1;
    }

    // Helper to get all obstacles for collision detection
    getAllObstacles() {
        return this.rows.flatMap(row => row.obstacles);
    }

}

export class TerrainRow {
    constructor(scene, z, type) {
        this.scene = scene;
        this.z = z;
        this.type = type;           // e.g 'grass', 'road', 'river'
        this.obstacles = [];        // Will store obstacle objects
        this.meshes = [];           // Track all meshes for cleanup
        
        // Create the 3D terrain tile
        this.createTerrain();
        
        // Add obstacles based on terrain type
        this.addObstacles();
    }
    
    createTerrain() {
        // Create a terrain tile (simple box geometry for now)
        const width = 10;  
        const height = 0.2; 
        const depth = 10;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: this.getTerrainColor(),
            roughness: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, this.z); // Position at proper Z
        mesh.receiveShadow = true;       // Can receive shadows
        
        // Add to scene and track for cleanup
        this.scene.add(mesh);
        this.meshes.push(mesh);
        
        // Add simple texturing based on terrain type
        this.addTerrainDetails();
    }

    getTerrainColor() {
        // Define colors for different terrain types. Replace with loading textures later
    }

    addTerrainDetails() {
        // Apply Alphas or other details/meshes based on terrain type
    }

    addObstacles() {
        // Handle adding obstacles based on terrain type
    }
}