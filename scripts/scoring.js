import { GRID_SIZE } from './config.js';

export default class ScoreManager {
    constructor() {
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.bestY = 0; // Tracks player's furthest progress
    }
    
    update(player) {
        // Update score when player moves to a new highest position
        if (player.y < this.bestY) {
            this.bestY = player.y;
            this.score = Math.floor(Math.abs(this.bestY) / GRID_SIZE);
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.saveHighScore();
            }
        }
    }
    
    draw(ctx, canvasWidth, canvasHeight, camera) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for UI
        
        ctx.font = '24px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        // Score
        ctx.fillText(`Score: ${this.score}`, canvasWidth / 2, 30);
        
        // High score
        ctx.font = '16px Arial';
        ctx.fillText(`High Score: ${this.highScore}`, canvasWidth / 2, 60);
        
        ctx.restore();
    }
    
    loadHighScore() {
        const storedHighScore = localStorage.getItem('crossyCloneHighScore');
        return storedHighScore ? parseInt(storedHighScore) : 0;
    }
    
    saveHighScore() {
        localStorage.setItem('crossyCloneHighScore', this.highScore.toString());
    }
}