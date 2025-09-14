import Obstacle from '../obstacle.js';

class Car extends Obstacle {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        this.modelPath = 'assets/car.glb';
        this.modelScale = 0.2;
        this.type = 'car';
        this.speed = Obstacle.getRandomSpeed(0.03, 0.06);

        this.loadModel();
    }

    move(canvasWidth) {
        // Use super to invoke the parent class's move method
        super.move(canvasWidth, this.speed);
    }
}

export default Car;