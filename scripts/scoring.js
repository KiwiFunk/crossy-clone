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
    
    updateScore(playerZ) {
        // Update score when player moves to a new furthest Z position
        if (playerZ < this.bestZ) {
            this.bestZ = playerZ;
            this.score = Math.abs(this.bestZ) * 10;
            
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