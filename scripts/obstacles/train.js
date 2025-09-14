import Obstacle from '../obstacle.js';

class Train extends Obstacle {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        this.modelPath = 'assets/train.glb';
        this.modelScale = 0.3;
        this.type = 'train';
        this.speed = 0.1; 
        
        this.loadModel();
    }

    move(canvasWidth) {
        // Use super to invoke the parent class's move method
        super.move(canvasWidth, this.speed);
    }
}

export default Train;