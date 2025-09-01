import { GRID_SIZE } from './config.js';

export class TerrainRow {
    constructor(y, type, obstacles = []) {
        this.y = y;
        this.type = type; // 'grass', 'road', 'river'
        this.obstacles = obstacles;
    }
    
    draw(ctx, canvasWidth) {
        ctx.fillStyle = this.type === 'road' ? 'gray' : this.type === 'river' ? 'blue' : 'green';
        ctx.fillRect(0, this.y, canvasWidth, GRID_SIZE);
        this.obstacles.forEach(ob => ob.draw(ctx));
    }
    
    update(canvasWidth) {
        this.obstacles.forEach(ob => ob.update(canvasWidth));
    }
}