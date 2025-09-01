import { GRID_SIZE } from './config.js';
// Import our obstacle subclasses
import Car from './obstacles/car.js';
import Truck from './obstacles/truck.js';
import Train from './obstacles/train.js';

export class TerrainGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.rows = [];
        this.lastY = 0; // Y position of the last generated row
        // Register terrain types with their weightings for procedural generation
        this.terrainTypes = {
            grass: 0.6,
            road: 0.3,
            rail: 0.2,
            river: 0.1
        };
        // How far ahead to generate terrain
        this.maxDrawDistance = canvas.height * 1.5; 
        this.safeZone = 3
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

    // Use the camera postion to procedurally generate terrain as needed
    update(camera) {
        while (this.lastY > camera.y - this.maxDrawDistance) {
            this.generateRandomTerrainRow();
        }
        
        // Cull rows that are far off screen (Make sure player death happens before the culled rows become visible again)
        const removeIndex = this.rows.findIndex(row => 
            row.y > camera.y + this.canvas.height * 1.5);
            
        if (removeIndex !== -1) {
            this.rows.splice(0, removeIndex + 1);
        }
        
        // Update existing terrain
        this.rows.forEach(row => row.update(this.canvas.width));
    }

    draw(ctx) {
        this.terrainRows.forEach(row => row.draw(ctx, this.canvas.width));
    }
    
    generateRandomTerrainRow() {
        // Use weighted random selection for terrain type
        const rand = Math.random();
        let sum = 0;
        let chosenType = this.terrainTypes[0];
        
        for (let i = 0; i < this.terrainTypes.length; i++) {
            sum += this.terrainWeights[i];
            if (rand < sum) {
                chosenType = this.terrainTypes[i];
                break;
            }
        }
        
        this.generateTerrainRow(chosenType);
    }
    
    generateTerrainRow(type) {
        let obstacles = [];
        
        // Create obstacles based on terrain type
        if (type === 'road') {
            obstacles = this.createRoadObstacles();
        } else if (type === 'rail') {
            obstacles = this.createRailObstacles();
        } else if (type === 'river') {
            obstacles = this.createRiverObstacles();
        } else {
            obstacles = this.createGrassObstacles();
        }
        
        // Create new terrain row and update the last Y position
        this.lastY -= GRID_SIZE;
        this.rows.push(new TerrainRow(this.lastY, type, obstacles));
    }

    createRoadObstacles() {
        const obstacles = [];
        const direction = Math.random() > 0.5 ? 'left' : 'right';
        const count = Math.floor(Math.random() * 3) + 1;
        
        // Choose vehicle type
        const VehicleType = Math.random() > 0.5 ? Car : Truck;
                          
        // Create vehicles at intervals
        for (let i = 0; i < count; i++) {
            const spacing = this.canvas.width / (count + 1);
            const x = i * spacing;
            
            const vehicle = new VehicleType(x, this.lastY);
            vehicle.direction = direction;
            
            obstacles.push(vehicle);
        }
        
        return obstacles;
    }

    createRailObstacles() {
        const obstacles = [];
        const direction = Math.random() > 0.5 ? 'left' : 'right';
        
        const train = new Train(0, this.lastY);
        train.direction = direction;

        obstacles.push(train);

        return obstacles;
    }
    
    createRiverObstacles() {
        // Add logs/lilly pads for player to jump on to cross river
        return [];
    }
    
    createGrassObstacles() {
        // Add trees/rocks for decoration
        return [];
    }

}