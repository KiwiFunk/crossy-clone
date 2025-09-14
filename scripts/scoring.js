import { GRID_SIZE } from './config.js';

export default class ScoreManager {
    constructor() {
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.bestZ = 0; // Track player's furthest Z progress (lower Z is further)
        
        // Get UI elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        
        // Update UI immediately
        this.updateUI();
    }
    
    updateScore(cameraZ) {
        // Update score when camera moves to a new furthest Z position
        // In Three.js, lower Z values = further forward
        if (cameraZ < this.bestZ) {
            this.bestZ = cameraZ;
            this.score = Math.floor(Math.abs(this.bestZ) / (GRID_SIZE/10)); // Adjust grid size
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.saveHighScore();
            }
            
            // Update UI
            this.updateUI();
        }
    }
    
    updateUI() {
        if (this.scoreElement) {
            this.scoreElement.textContent = `Score: ${this.score}`;
        }
        
        if (this.highScoreElement) {
            this.highScoreElement.textContent = `High Score: ${this.highScore}`;
        }
    }
    
    loadHighScore() {
        const storedHighScore = localStorage.getItem('crossyCloneHighScore');
        return storedHighScore ? parseInt(storedHighScore) : 0;
    }
    
    saveHighScore() {
        localStorage.setItem('crossyCloneHighScore', this.highScore.toString());
    }
}