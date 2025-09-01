export default class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.color = 'blue';
        this.isMoving = false;
    }

    move(direction, canvasWidth, canvasHeight) {
        if (this.isMoving) return; // Prevent rapid moves
        this.isMoving = true;
        
        // Grid-based movement (20px steps, no diagonals)
        switch (direction) {
            case 'up':
                this.y = Math.max(0, this.y - 20);
                break;
            case 'down':
                this.y = Math.min(canvasHeight - this.size, this.y + 20);
                break;
            case 'left':
                this.x = Math.max(0, this.x - 20);
                break;
            case 'right':
                this.x = Math.min(canvasWidth - this.size, this.x + 20);
                break;
        }
        
        // Simple animation: change color briefly
        this.color = 'green';
        setTimeout(() => {
            this.color = 'blue';
            this.isMoving = false;
        }, 100);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}