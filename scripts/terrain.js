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
        switch(this.type) {
            case 'road': return 0x555555;
            case 'rail': return 0x777777;
            case 'river': return 0x4444FF;
            case 'grass': default: return 0x55AA55;
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
            marking.position.set(x, 0.11, this.z); // Slightly above road
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
                
            // Need to add logs for traversing rivers, and trees/rocks for grass later
        }
    }

    addVehicles() {
        // Choose vehicle type (car or truck)
        const VehicleType = Math.random() > 0.5 ? Car : Truck;
    
        const direction = Math.random() > 0.5 ? 'right' : 'left';
        const startX = direction === 'right' ? -7 : 7;
        
        const vehicle = new VehicleType(this.scene, startX, 0.2, this.z);
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