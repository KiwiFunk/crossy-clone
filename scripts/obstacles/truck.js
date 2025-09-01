import Obstacle from '../obstacle.js';

class Truck extends Obstacle {
    constructor(x, y) {
        super(x, y);
        this.sprite = 'truck.png';
        this.sound = 'truck_engine.mp3';
        this.speed = Obstacle.getRandomSpeed(2, 4);
    }

    move() {
        this.x += this.speed;
    }
}

export default Truck;