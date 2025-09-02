import { GRID_SIZE } from './config.js';
// Import our obstacle subclasses
import Car from './obstacles/car.js';
import Truck from './obstacles/truck.js';
import Train from './obstacles/train.js';

export class TerrainGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.rows = [];
        this.lastY = canvas.height - GRID_SIZE; // Y position of the last generated row
        // Register terrain types with their weightings for procedural generation (Make sure to Normalize values so === 1.0)
        this.terrainTypes = [
            { type: 'grass', weight: 0.25 },
            { type: 'road', weight: 0.45 },
            { type: 'rail', weight: 0.15 },
            { type: 'river', weight: 0.15 }
        ];
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
        this.rows.forEach(row => row.draw(ctx, this.canvas.width));
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

export class TerrainRow {
    constructor(y, type, obstacles = []) {
        this.y = y;                 // Y position of the row
        this.type = type;           // e.g 'grass', 'road', 'river'
        this.obstacles = obstacles; // Array of obstacle instances
    }
    
    draw(ctx, canvasWidth) {
        ctx.fillStyle = this.getTerrainColor();
        ctx.fillRect(0, this.y, canvasWidth, GRID_SIZE);
        
        // Add texture based on terrain type
        this.drawTerrainTexture(ctx, canvasWidth);
        
        // Draw obstacles
        this.obstacles.forEach(ob => ob.draw(ctx));
    }
    
    getTerrainColor() {
        switch(this.type) {
            case 'road': return '#555555';
            case 'rail': return '#777777';
            case 'river': return '#4444FF';
            case 'grass': default: return '#55AA55';
        }
    }
    
    drawTerrainTexture(ctx, canvasWidth) {
        // Simple texture patterns based on terrain type
        switch(this.type) {
            case 'road':
                // Draw lane markings
                ctx.fillStyle = '#FFFFFF';
                for (let x = 0; x < canvasWidth; x += GRID_SIZE * 3) {
                    ctx.fillRect(x, this.y + GRID_SIZE/2 - 2, GRID_SIZE, 4);
                }
                break;

            case 'rail':
                // Draw train tracks
                ctx.fillStyle = '#AAAAAA';
                for (let x = 0; x < canvasWidth; x += GRID_SIZE * 2) {
                    ctx.fillRect(x, this.y + GRID_SIZE/2 - 2, GRID_SIZE, 4);
                }
                break;

            case 'river':
                break;
                
            case 'grass':
                break;
        }
    }
    
    update(canvasWidth) {
        this.obstacles.forEach(ob => ob.update(canvasWidth));
    }
}