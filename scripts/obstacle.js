class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 1;
        // Placeholder for image/audio
        this.sprite = null;
        this.sound = null;
    }

    move() {
        // Base movement; override in subclasses
    }

    draw(ctx) {
    // Simple rectangle for now; override for sprites
    ctx.fillRect(this.x, this.y, 20, 20);
    }

    destroy() {
        // Cleanup logic, e.g., remove from game when off screen
        console.log('Obstacle destroyed');
    }
}