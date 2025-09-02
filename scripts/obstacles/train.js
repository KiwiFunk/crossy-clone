import Obstacle from '../obstacle.js';

class Train extends Obstacle {
    constructor(x, y) {
        super(x, y);
        this.sprite = 'train.png';
        this.sound = 'train_whistle.mp3';
        this.speed = 10;
    }

    move() {
        // Use super to invoke the parent class's move method
        super.move(canvasWidth)
    }
}

export default Train;