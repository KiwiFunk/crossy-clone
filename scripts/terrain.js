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
            tracks: 0.2,
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

    /* generateRandomTerrainRow() {
        This function generates a random terrain and then calls generateTerrainRow(type)
    } */

    /* generateTerrainRow(type) {
        This function takes a defined terrain type and generates a row of that type
    } */

}