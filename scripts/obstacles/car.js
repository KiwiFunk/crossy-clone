import Obstacle from '../obstacle.js';

class Car extends Obstacle {
    constructor(x, y) {
        super(x, y);
        this.sprite = 'car.png';
        this.sound = 'car_honk.mp3';
        this.speed = Obstacle.getRandomSpeed(3, 6);
    }

    move() {
        this.x += this.speed;
        // Update rendering here
    }
}

export default Car;