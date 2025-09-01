import Obstacle from '../obstacle.js';

class Truck extends Obstacle {
    constructor(x, y) {
        super(x, y);
        this.sprite = 'truck.png';
        this.sound = 'truck_engine.mp3';
        this.speed = 3;
    }

    move() {
        this.x += this.speed;
    }
}