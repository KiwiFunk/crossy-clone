import Obstacle from '../obstacle.js';

class Car extends Obstacle {
    constructor(x, y) {
        super(x, y);
        this.sprite = 'car.png';
        this.sound = 'car_honk.mp3';
        this.speed = 5;
    }

    move() {
        this.x += this.speed;
        // Update rendering here
    }
}
