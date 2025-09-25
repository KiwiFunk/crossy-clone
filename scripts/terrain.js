import * as THREE from 'three';
import { CONFIG } from './config.js';
// Import our obstacle subclasses
import Car from './obstacles/car.js';
import Truck from './obstacles/truck.js';
import Train from './obstacles/train.js';
import Log from './obstacles/log.js';
import Tree from './obstacles/tree.js';
import Rail from './decor/rail.js';

export class TerrainGenerator {
    constructor(scene) {
        this.scene = scene;
        this.rows = [];
        this.lastZ = 5; // Init game with positive Z (further from camera)
        this.rowSpacing = CONFIG.ROW_SPACING;
        // Register terrain types with their weightings for procedural generation (Make sure to Normalize values so === 1.0)
        this.terrainTypes = [
            { type: 'grass', weight: 0.30 },
            { type: 'road', weight: 0.50 },
            { type: 'rail', weight: 0.10 },
            { type: 'river', weight: 0.10 }
        ];
        // How far ahead to generate terrain
        this.maxDrawDistance = CONFIG.MAX_DRAW_DISTANCE; 
        this.safeZone = CONFIG.SAFE_ZONE_ROWS;
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
        this.lastZ -= this.rowSpacing;
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
        this.createTerrainTiles();
        
        // Add obstacles based on terrain type
        this.addObstacles();
    }
    
    createTerrainTiles() {
        const tileWidth = CONFIG.TILE_SIZE;    // 1m
        const tileDepth = CONFIG.TILE_SIZE;    // 1m
        const terrainHeight = this.getTerrainHeight();
        
        // Calculate the total width and starting X position
        const totalWidth = CONFIG.ROW_WIDTH_IN_TILES * tileWidth; // 20m
        const startX = -totalWidth / 2; // Center the row at x=0
        
        // Create individual tiles
        for (let i = 0; i < CONFIG.ROW_WIDTH_IN_TILES; i++) {
            const geometry = new THREE.BoxGeometry(tileWidth, terrainHeight, tileDepth);
            const material = new THREE.MeshStandardMaterial({
                color: this.getTerrainColor(),
                roughness: 0.8
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position each tile
            const x = startX + (i * tileWidth) + (tileWidth / 2);
            mesh.position.set(x, terrainHeight/2, this.z);
            
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.meshes.push(mesh);

        }

        // Add terrain details to the completed row if applicable (e.g. road markings, rails)
        this.addTerrainDetails();
    }

    getTerrainHeight() {
        return CONFIG.TERRAIN_HEIGHTS[this.type.toUpperCase()] || 0.05;
    }

    getTerrainColor() {
        // Define colors for different terrain types. Replace with loading textures later
        switch(this.type) {
            case 'road': return CONFIG.COLORS.ROAD;
            case 'rail': return CONFIG.COLORS.RAIL;
            case 'river': return CONFIG.COLORS.RIVER;
            case 'grass': 
                return this.z % 2 === 0 ? CONFIG.COLORS.GRASS_A : CONFIG.COLORS.GRASS_B;
            default: return CONFIG.COLORS.GRASS_A;
        }
    }

    addTerrainDetails() {
        // Apply Alphas or other details/meshes based on terrain type
        switch(this.type) {
            case 'road':
                // THESE SHOULD USE THE SPAWNMANEGER TOO
                this.addRoadMarkings();
                break;
                
            case 'rail':
                this.SpawnManager(this.scene, Rail, CONFIG.ROW_WIDTH_IN_TILES, 1.0, this.z, this.type);
                break;

            // Implement other details like grass/river fx later
        }
    }

    addRoadMarkings() {
        // Simple road markings (white stripes) Replace with alpha textures once i know how. Unless this ends up looking spicy. geo might be great with camera angle.
        const markingGeometry = new THREE.BoxGeometry(0.5, 0.01, 0.1);
        const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        for (let x = -4; x <= 4; x += 2) {
            const marking = new THREE.Mesh(markingGeometry, markingMaterial);
            marking.position.set(x, 0.2, this.z); // Slightly above road
            this.scene.add(marking);
            this.meshes.push(marking);
        }
    }

    addObstacles() {
        // Add obstacles based on terrain type
        switch(this.type) {
            
            case 'road':
                const VehicleType = Math.random() > 0.5 ? Car : Truck;
                this.SpawnManager(this.scene, VehicleType, 1, 0.7, this.z);
                break;
                
            case 'rail':
                this.SpawnManager(this.scene, Train, 1, 1.0, this.z);
                break;

            case 'river':
                let numLogs = Math.floor(Math.random() * 3) + 1;
                this.SpawnManager(this.scene, Log, numLogs, 1.0, this.z);
                break;
                
            case 'grass':
                this.addTrees();
                break;
        }
    }

    update() {
        // Update all obstacles (e.g., move vehicles)
        this.obstacles.forEach(obstacle => {
            if (obstacle.update) {
                obstacle.update();
            }
        });
    }
    
    destroy() {
        // Remove all meshes from the scene
        this.meshes.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        
        // Cleanup obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.destroy) {
                obstacle.destroy();
            }
        });
    }
}