import Mesh from '../mesh.js';

class Car extends Mesh {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        this.modelPath = 'assets/car.glb';
        this.type = 'car';
        this.speed = Mesh.getRandomSpeed(0.03, 0.08);

        this.loadModel();
    }

    move(canvasWidth) {
        // Use super to invoke the parent class's move method
        super.move(canvasWidth, this.speed);
    }
}

export default Car;