import Obstacle from '../obstacle.js';

class Truck extends Obstacle {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        this.modelPath = 'assets/truck.glb';
        this.modelScale = 0.25;
        this.type = 'truck';
        this.speed = Obstacle.getRandomSpeed(0.02, 0.04);

        this.loadModel();
    }

    move(canvasWidth) {
        // Use super to invoke the parent class's move method
        super.move(canvasWidth, this.speed);
    }
}

export default Truck;