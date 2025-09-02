import Obstacle from '../obstacle.js';

class Truck extends Obstacle {
    constructor(x, y) {
        super(x, y);
        this.sprite = 'truck.png';
        this.sound = 'truck_engine.mp3';
        this.speed = Obstacle.getRandomSpeed(2, 4);
    }

    move() {
        // Use super to invoke the parent class's move method
        super.move(canvasWidth)
    }
}

export default Truck;