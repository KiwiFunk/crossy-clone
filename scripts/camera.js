import { GRID_SIZE } from './config.js';

export default class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.deadZoneY = 250;   // Point where camera starts following player
        this.pushSpeed = 0.5;   // How fast camera pushes player forward
        this.followSpeed = 0.1; // How fast camera catches up to player
    }
    
    update(player, canvasHeight) {
        // Camera follows player with smooth motion when they move up
        if (player.y < this.y + this.deadZoneY) {
            this.y += (player.y - this.y - this.deadZoneY) * this.followSpeed;
        }
        
        // Camera slowly pushes player forward
        this.y += this.pushSpeed;
        
        // Kill player if they go off bottom of screen
        if (player.y > this.y + canvasHeight) {
            return true; // Player died
        }
        
        return false;
    }
    
    apply(ctx) {
        ctx.save();
        ctx.translate(0, -this.y);
    }
    
    restore(ctx) {
        ctx.restore();
    }
}