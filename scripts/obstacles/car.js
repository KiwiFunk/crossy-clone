import Obstacle from '../obstacle.js';

class Car extends Obstacle {
    constructor(x, y) {
        super(x, y);
        this.sprite = 'car.png';
        this.sound = 'car_honk.mp3';
        this.speed = Obstacle.getRandomSpeed(3, 6);
    }

    move() {
        // Use super to invoke the parent class's move method
        super.move(canvasWidth)
    }
}

export default Car;