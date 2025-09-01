import { GRID_SIZE } from './config.js';
// Import our obstacle subclasses
import Car from './obstacles/car.js';
import Truck from './obstacles/truck.js';
import Train from './obstacles/train.js';

export class TerrainGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.rows = [];
        this.lastY = 0;
        // Register terrain types with their weightings for procedural generation
        this.terrainTypes = {
            grass: 0.6,
            road: 0.3,
            tracks: 0.2,
            river: 0.1
        };
        // How far ahead to generate terrain
        this.maxDrawDistance = canvas.height * 1.5; 
    }
}