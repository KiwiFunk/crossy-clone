import * as THREE from 'three';
import { CONFIG } from './config.js';
import { SpawnManager } from './spawnhandler.js';

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
        this.lastZ = 0; // Sets the Z pos the generation starts at (Player dynamically set from this)
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

        // Create backstop behind player start
        // Directly call TerrainRow to avoid affecting procedural
        const backstopDepth = 10;
        for (let z = 1; z <= backstopDepth; z++) {

            let row = null;
            if (z >= (backstopDepth / 2)) row = new TerrainRow(this.scene, z, 'trees');
            else row = new TerrainRow(this.scene, z, 'grass');

            this.rows.push(row);
        }

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
        const startX = -totalWidth / 2; // Center the rows at x=0
        
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
            default: return CONFIG.COLORS.GRASS_B;
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
                // Create rail decorations using SpawnManager
                const railOptions = {
                    avoidCenter: false,     // Rails cover the entire row
                    isMoving: false,        // Rails don't move
                    heightOffset: 0.01,     // Slightly above terrain
                    minSpacing: 0,          // Modular asset, we dont want any spacing
                    variance: false         // No variance for rails
                };
                
                const railEntities = new SpawnManager(
                    this.scene,            // Scene reference 
                    Rail,                  // Rail class
                    CONFIG.ROW_WIDTH_IN_TILES, // Create one for each tile
                    1.0,                   // 100% chance to spawn
                    this.z,                // Z position
                    this.type,             // Terrain type
                    railOptions            // Options
                );
                
                const rails = railEntities.spawn();
                // Add rail entities to meshes array for cleanup
                if (Array.isArray(rails)) {
                    this.meshes.push(...rails);
                }
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
                const VehicleCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 vehicles
                
                const vehicleManager = new SpawnManager(
                    this.scene,
                    VehicleType,
                    VehicleCount,
                    0.7,            // 70% chance to spawn
                    this.z,
                    this.type,
                    { isMoving: true, heightOffset: 0.01 }
                );
                
                // Call spawn() to get the entities
                const vehicles = vehicleManager.spawn();
                this.obstacles.push(...vehicles);
                break;
                
            case 'rail':
                const trainManager = new SpawnManager(
                    this.scene,
                    Train,
                    1,              // Just one train per row
                    0.8,            // 80% chance to spawn
                    this.z,
                    this.type,
                    { isMoving: true, heightOffset: 0.01 }
                );
                
                const trains = trainManager.spawn();
                this.obstacles.push(...trains);
                break;

            case 'river':
                const numLogs = Math.floor(Math.random() * 3) + 1;
                
                const logManager = new SpawnManager(
                    this.scene,
                    Log,
                    numLogs,
                    1.0,            // Always spawn logs
                    this.z,
                    this.type,
                    { isMoving: true, heightOffset: 0, fallbackStrategy: 'destroy' } // destroy overlapping logs
                );
                
                const logs = logManager.spawn();
                this.obstacles.push(...logs);
                break;
                
            case 'grass':
                const numTrees = Math.floor(Math.random() * 6) + 4;
                
                const treeManager = new SpawnManager(
                    this.scene,
                    Tree,
                    numTrees,
                    0.8,            // 80% chance for trees
                    this.z,
                    this.type,
                    { 
                        isMoving: false,
                        avoidCenter: true,
                        centerClearance: 3,
                        heightOffset: 0        
                    }
                );
                
                const trees = treeManager.spawn();
                this.obstacles.push(...trees);
                break;

            case 'trees':
                const treeFillManager = new SpawnManager(
                    this.scene,
                    Tree,
                    CONFIG.ROW_WIDTH_IN_TILES,
                    1.0,            // Fill with Trees to block player
                    this.z,
                    this.type,
                    { 
                        isMoving: false,
                        avoidCenter: false,
                        centerClearance: 3,
                        heightOffset: 0,
                        minSpacing: 0,          // No Spacing
                    }
                );

                const treeFill = treeFillManager.spawn();
                this.obstacles.push(...treeFill);
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