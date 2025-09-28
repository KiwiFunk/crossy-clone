import Mesh from '../mesh.js';
import { CONFIG } from '../config.js';

class Truck extends Mesh {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        this.modelPath = 'assets/truck.glb';
        this.type = 'truck';
        this.totalWidth = CONFIG.MODEL_DIMENSIONS.TRUCK.WIDTH;

        this.loadModel();
    }

    move(canvasWidth) {
        // Use super to invoke the parent class's move method
        super.move(canvasWidth, this.speed);
    }
}

export default Truck;