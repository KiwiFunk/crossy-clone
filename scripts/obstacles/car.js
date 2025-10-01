import Mesh from '../mesh.js';
import { CONFIG } from '../config.js';

class Car extends Mesh {

    static entityType = 'CAR';

    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        this.modelPath = 'assets/car.glb';
        this.totalWidth = CONFIG.MODEL_DIMENSIONS.CAR.WIDTH;

        this.loadModel();
    }

    move(canvasWidth) {
        // Use super to invoke the parent class's move method
        super.move(canvasWidth, this.speed);
    }
}

export default Car;