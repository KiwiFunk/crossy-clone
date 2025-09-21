import * as THREE from 'three';
import { CONFIG } from './config.js';
// Import our obstacle subclasses
import Car from './obstacles/car.js';
import Truck from './obstacles/truck.js';
import Train from './obstacles/train.js';
import Log from './obstacles/log.js';
import Tree from './obstacles/tree.js';

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

            // Add terrain details (e.g., road markings, rails)
            this.addTerrainDetails();
        }
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
                this.addRoadMarkings();
                break;
                
            case 'rail':
                this.addRailroadTracks();
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
    
    addRailroadTracks() {
        // Create geometry with three for now. Use custom models later?
        const railGeometry = new THREE.BoxGeometry(10, 0.05, 0.1);
        const railMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            metalness: 0.8 
        });
        
        // Add two rails
        for (let offset of [-0.2, 0.2]) {
            const rail = new THREE.Mesh(railGeometry, railMaterial);
            rail.position.set(0, 0.15, this.z + offset);
            this.scene.add(rail);
            this.meshes.push(rail);
        }
    }   

    addObstacles() {
        // Add obstacles based on terrain type
        switch(this.type) {
            case 'road':
                // 70% chance to add vehicles on a road
                if (Math.random() > 0.3) {
                    this.addVehicles();
                }
                break;
                
            case 'rail':
                // 40% chance to add train on rails
                if (Math.random() > 0.6) {
                    this.addTrain();
                }
                break;

            case 'river':
                // Logs must always be present on rivers
                this.addLogs();
                break;
                
            case 'grass':
                this.addTrees();
                break;
        }
    }

    addVehicles() {
        // Choose vehicle type (car or truck)
        const VehicleType = Math.random() > 0.5 ? Car : Truck;
        const direction = Math.random() > 0.5 ? 'right' : 'left';

        // Start beyond the row boundaries
        const startX = direction === 'right' 
            ? -(CONFIG.ROW_WIDTH_IN_TILES * CONFIG.TILE_SIZE)/2 - 7 
            : (CONFIG.ROW_WIDTH_IN_TILES * CONFIG.TILE_SIZE)/2 + 7;
        
        const y = this.getTerrainHeight() + 0.01;

        const vehicle = new VehicleType(this.scene, startX, y, this.z);
        vehicle.direction = direction;
        
        // Add to obstacles array
        this.obstacles.push(vehicle);
    }
    
    addTrain() {
        const direction = Math.random() > 0.5 ? 'right' : 'left';
        const startX = direction === 'right' ? -10 : 10;
        
        const train = new Train(this.scene, startX, 0.2, this.z);
        train.direction = direction;
        
        this.obstacles.push(train);
    }

    // This needs to be reworked so totalWidth can be used to prevent log overlap
    addLogs() {
        // 1–3 logs this row
        const numLogs    = Math.floor(Math.random() * 3) + 1;

        // pick direction & magnitude once, per row
        const direction  = Math.random() > 0.5 ? 'right' : 'left';
        const speedValue = Math.random() * 0.03 + 0.02;
        const signedSpeed = direction === 'right' ?  speedValue : -speedValue;

        // Start beyond row boundaries
        const rowHalfWidth = (CONFIG.ROW_WIDTH_IN_TILES * CONFIG.TILE_SIZE) / 2;
        const baseX = direction === 'right' ? -rowHalfWidth - 5 : rowHalfWidth + 5;

        for (let i = 0; i < numLogs; i++) {
            // stagger each log’s spawn so they don’t overlap
            const randomOffset = (Math.random() - 0.5) * 10;
            const startX       = baseX + randomOffset;
            const y = this.getTerrainHeight() + 0.01;

            // create & configure
            const log          = new Log(this.scene, startX, y, this.z);
            log.direction      = direction;
            log.speed          = signedSpeed;

            // store for collision, lookup, etc.
            this.obstacles.push(log);
            if (log.logGroup) {
                log.logGroup.userData = {
                    type:     'obstacle',
                    obstacle: log
                };
            }
        }
    }

    addTrees() {
        const numTrees = Math.floor(Math.random() * 8) + 1;

        // Define placement constraints within the row
        const rowHalfWidth = (CONFIG.ROW_WIDTH_IN_TILES * CONFIG.TILE_SIZE) / 2;
        const minX = -rowHalfWidth + 2;  // 2m from edge
        const maxX = rowHalfWidth - 2;   // 2m from edge
        const centerZone = 3;            // Keep center 3m clear
        const minSpacing = 1.5;          // 1.5m between trees

        const placedX = [];

        let attempts = 0;
        let maxAttempts = numTrees * 10;

        while (placedX.length < numTrees && attempts < maxAttempts) {
            let treeX = minX + Math.random() * (maxX - minX);
            attempts++;

            // Reject if too close to center
            if (Math.abs(treeX) < centerZone) continue;

            // Reject if too close to any existing tree
            const tooClose = placedX.some(x => Math.abs(x - treeX) < minSpacing);
            if (tooClose) continue;

            placedX.push(treeX);
            const y = this.getTerrainHeight();

            const tree = new Tree(this.scene, treeX, y, this.z);
            console.log(`Tree ${placedX.length} placed at x=${treeX.toFixed(2)} on grass row z=${this.z}`);
        }

        if (placedX.length < numTrees) {
            console.warn(`Only placed ${placedX.length} trees out of ${numTrees} due to spacing constraints.`);
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